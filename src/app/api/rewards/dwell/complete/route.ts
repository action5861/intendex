import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateCache, CacheKeys } from "@/lib/cache";
import { NextResponse } from "next/server";

const DWELL_DURATION = 60;
const PARTIAL_DWELL_MIN = 20;
const DAILY_MAX_POINTS = 1000;
const DUPLICATE_WINDOW_HOURS = 24;
// 네트워크 지연 + Visibility API 특성상 약간의 오차 허용
const TIMING_BUFFER_SECONDS = 10;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { token: string; elapsedSeconds: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { token, elapsedSeconds } = body;
  if (!token || typeof elapsedSeconds !== "number") {
    return NextResponse.json(
      { error: "token and elapsedSeconds are required" },
      { status: 400 }
    );
  }

  // 토큰으로 세션 조회 (campaignId 포함)
  const dwellSession = await prisma.dwellSession.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      url: true,
      siteName: true,
      maxPoints: true,
      issuedAt: true,
      expiresAt: true,
      completedAt: true,
      campaignId: true,
    },
  });

  if (!dwellSession) {
    return NextResponse.json(
      { error: "유효하지 않은 세션입니다." },
      { status: 404 }
    );
  }

  // 본인 세션인지 확인
  if (dwellSession.userId !== userId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 이미 완료된 세션(토큰 재사용 방지) — 빠른 실패용 사전 체크 (트랜잭션 내에서도 재검증)
  if (dwellSession.completedAt !== null) {
    return NextResponse.json(
      { error: "이미 완료된 세션입니다." },
      { status: 409 }
    );
  }

  // 만료된 세션
  if (dwellSession.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "세션이 만료되었습니다." },
      { status: 410 }
    );
  }

  // 타이밍 검증: 클라이언트 주장 경과시간 <= 서버 벽시계 + 버퍼
  const wallClockSeconds =
    (Date.now() - dwellSession.issuedAt.getTime()) / 1000;
  const clampedElapsed = Math.min(
    Math.max(Math.floor(elapsedSeconds), 0),
    DWELL_DURATION
  );

  if (clampedElapsed > wallClockSeconds + TIMING_BUFFER_SECONDS) {
    return NextResponse.json(
      { error: "유효하지 않은 체류 시간입니다." },
      { status: 400 }
    );
  }

  // 최소 체류 시간 미달 → 세션만 소모하고 포인트 미지급 (포인트 없으므로 레이스 위험 없음)
  if (clampedElapsed < PARTIAL_DWELL_MIN) {
    await prisma.dwellSession.update({
      where: { token },
      data: { completedAt: new Date(), awarded: 0 },
    });
    return NextResponse.json(
      { error: `최소 ${PARTIAL_DWELL_MIN}초 이상 체류해야 합니다.` },
      { status: 400 }
    );
  }

  // 포인트 계산 — maxPoints는 서버 DB에 저장된 값, 클라이언트 변조 불가
  const awardPoints = Math.floor(
    (dwellSession.maxPoints * clampedElapsed) / DWELL_DURATION
  );

  const now = new Date();
  const windowStart = new Date(
    now.getTime() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
  );
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // 포인트 지급 + 세션 완료 처리 (원자적 트랜잭션)
  // URL 중복 체크와 일일 한도 체크를 트랜잭션 안에서 수행하여
  // 동시 요청(레이스 컨디션)으로 인한 한도 우회를 방지한다.
  // User 행에 FOR UPDATE 락을 걸어 같은 사용자의 동시 체류 완료 요청을 직렬화한다.
  let txResult: { points: number; totalPoints: number; transactionId: string };
  try {
    txResult = await prisma.$transaction(async (tx) => {
      // User 행 락 — 같은 userId의 동시 트랜잭션을 직렬화
      await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${userId} FOR UPDATE`;

      // 세션 원자적 클레임: completedAt IS NULL 조건으로 중복 완료 방지
      const sessionClaim = await tx.dwellSession.updateMany({
        where: { token, completedAt: null },
        data: { completedAt: now },
      });
      if (sessionClaim.count === 0) {
        throw new Error("SESSION_ALREADY_COMPLETED");
      }

      // 24시간 내 중복 URL 방문 확인 (트랜잭션 내 재검증)
      const recentTxns = await tx.transaction.findMany({
        where: {
          userId,
          type: "earn",
          createdAt: { gte: windowStart },
          source: { in: ["intent_reward", "dwell"] },
        },
        select: { metadata: true },
      });

      const alreadyVisited = recentTxns.some((txn) => {
        const meta = txn.metadata as { url?: string } | null;
        return meta?.url === dwellSession.url;
      });

      if (alreadyVisited) {
        await tx.dwellSession.update({ where: { token }, data: { awarded: 0 } });
        throw new Error("URL_ALREADY_VISITED");
      }

      // 일일 체류 포인트 한도 확인 (트랜잭션 내 재검증 — FOR UPDATE 락으로 원자성 보장)
      const todayAggregate = await tx.transaction.aggregate({
        where: {
          userId,
          type: "earn",
          source: "dwell",
          createdAt: { gte: todayStart },
        },
        _sum: { amount: true },
      });

      const todayPoints = todayAggregate._sum.amount ?? 0;
      if (todayPoints >= DAILY_MAX_POINTS) {
        await tx.dwellSession.update({ where: { token }, data: { awarded: 0 } });
        throw new Error("DAILY_CAP_REACHED");
      }

      // 남은 일일 한도에 맞게 지급 포인트 조정
      const actualAward = Math.min(awardPoints, DAILY_MAX_POINTS - todayPoints);

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: actualAward } },
      });

      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          type: "earn",
          amount: actualAward,
          balance: updatedUser.points,
          source: "dwell",
          metadata: {
            source: "dwell",
            url: dwellSession.url,
            siteName: dwellSession.siteName,
            elapsedSeconds: clampedElapsed,
            maxPoints: dwellSession.maxPoints,
            campaignId: dwellSession.campaignId ?? undefined,
          },
        },
      });

      // 연결된 캠페인이 있으면 예산 차감
      if (dwellSession.campaignId) {
        const freshCampaign = await tx.campaign.findUnique({
          where: { id: dwellSession.campaignId },
          select: { spent: true, budget: true },
        });
        if (freshCampaign) {
          const newSpent = freshCampaign.spent + actualAward;
          await tx.campaign.update({
            where: { id: dwellSession.campaignId },
            data: {
              spent: { increment: actualAward },
              ...(newSpent >= freshCampaign.budget ? { status: "completed" } : {}),
            },
          });
        }
      }

      await tx.dwellSession.update({
        where: { token },
        data: { awarded: actualAward },
      });

      return {
        points: actualAward,
        totalPoints: updatedUser.points,
        transactionId: newTransaction.id,
      };
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "SESSION_ALREADY_COMPLETED") {
        return NextResponse.json(
          { error: "이미 완료된 세션입니다." },
          { status: 409 }
        );
      }
      if (e.message === "URL_ALREADY_VISITED") {
        return NextResponse.json(
          { error: "이미 24시간 내에 방문한 사이트입니다." },
          { status: 409 }
        );
      }
      if (e.message === "DAILY_CAP_REACHED") {
        return NextResponse.json(
          { error: "일일 체류 포인트 한도(1,000P)에 도달했습니다." },
          { status: 429 }
        );
      }
    }
    throw e;
  }

  await invalidateCache(CacheKeys.balance(userId), CacheKeys.dailyStats(userId));

  return NextResponse.json({
    success: true,
    points: txResult.points,
    totalPoints: txResult.totalPoints,
    transactionId: txResult.transactionId,
    elapsedSeconds: clampedElapsed,
  });
}
