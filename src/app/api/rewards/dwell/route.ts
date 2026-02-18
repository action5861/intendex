import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DAILY_MAX_POINTS = 1000;
const DUPLICATE_WINDOW_HOURS = 24;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { url: string; siteName: string; pointValue?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { url, siteName, pointValue } = body;
  if (!url || !siteName) {
    return NextResponse.json(
      { error: "url and siteName are required" },
      { status: 400 }
    );
  }

  // Validate and clamp pointValue
  const requestedPoints = Math.min(Math.max(Math.floor(pointValue ?? 0), 0), 1000);
  if (requestedPoints <= 0) {
    return NextResponse.json(
      { error: "포인트 지급 대상이 아닙니다." },
      { status: 400 }
    );
  }

  const now = new Date();
  const windowStart = new Date(
    now.getTime() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
  );

  // Check duplicate URL visit within 24h (across both dwell and intent_reward)
  const recentTxns = await prisma.transaction.findMany({
    where: {
      userId,
      type: "earn",
      createdAt: { gte: windowStart },
      OR: [
        { metadata: { path: ["source"], equals: "intent_reward" } },
        { metadata: { path: ["source"], equals: "dwell" } },
      ],
    },
    select: { metadata: true },
  });

  const alreadyVisited = recentTxns.some((txn) => {
    const meta = txn.metadata as { url?: string } | null;
    return meta?.url === url;
  });

  if (alreadyVisited) {
    return NextResponse.json(
      { error: "이미 24시간 내에 방문한 사이트입니다." },
      { status: 409 }
    );
  }

  // Check daily points limit (intent_reward source only)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayTxns = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "earn",
      createdAt: { gte: todayStart },
      metadata: {
        path: ["source"],
        equals: "intent_reward",
      },
    },
    _sum: { amount: true },
  });

  const todayPoints = todayTxns._sum.amount ?? 0;
  if (todayPoints >= DAILY_MAX_POINTS) {
    return NextResponse.json(
      { error: "일일 기본소득 한도(1,000P)에 도달했습니다." },
      { status: 429 }
    );
  }

  // Clamp to remaining daily cap
  const remaining = DAILY_MAX_POINTS - todayPoints;
  const awardPoints = Math.min(requestedPoints, remaining);

  // Award points in a transaction
  const [user, transaction] = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: awardPoints } },
    });

    const newTransaction = await tx.transaction.create({
      data: {
        userId,
        type: "earn",
        amount: awardPoints,
        balance: updatedUser.points,
        metadata: {
          source: "intent_reward",
          url,
          siteName,
        },
      },
    });

    return [updatedUser, newTransaction] as const;
  });

  return NextResponse.json({
    success: true,
    points: awardPoints,
    totalPoints: user.points,
    transactionId: transaction.id,
  });
}
