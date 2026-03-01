import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const TOKEN_TTL_MINUTES = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { url: string; siteName: string; maxPoints: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { url, siteName, maxPoints } = body;
  if (!url || !siteName) {
    return NextResponse.json(
      { error: "url and siteName are required" },
      { status: 400 }
    );
  }

  // 클라이언트가 보낸 maxPoints를 서버에서 검증 후 저장
  // (이 값이 DB에 기록되므로 이후 complete에서 클라이언트가 변조 불가)
  const serverMaxPoints = Math.min(Math.max(Math.floor(maxPoints ?? 0), 0), 1000);
  if (serverMaxPoints <= 0) {
    return NextResponse.json(
      { error: "포인트 지급 대상이 아닙니다." },
      { status: 400 }
    );
  }

  // 미완료 zombie session 자동 정리 (취소/페이지이탈로 completedAt 없이 남은 세션)
  const ttlCutoff = new Date(Date.now() - TOKEN_TTL_MINUTES * 60 * 1000);
  await prisma.dwellSession.updateMany({
    where: {
      userId,
      completedAt: null,
      issuedAt: { gte: ttlCutoff },
    },
    data: { completedAt: new Date(), awarded: 0 },
  });

  // 제공된 URL이 활성 캠페인의 URL과 일치하는지 조회 (예산 미소진 캠페인만)
  const matchedCampaign = await prisma.campaign.findFirst({
    where: {
      url,
      status: "active",
      endDate: { gte: new Date() },
    },
    select: { id: true, spent: true, budget: true },
  });
  const campaignId =
    matchedCampaign && matchedCampaign.spent < matchedCampaign.budget
      ? matchedCampaign.id
      : null;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.dwellSession.create({
    data: {
      token,
      userId,
      url,
      siteName,
      maxPoints: serverMaxPoints,
      expiresAt,
      campaignId,
    },
  });

  return NextResponse.json({ token, maxPoints: serverMaxPoints });
}
