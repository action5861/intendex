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

  // 이미 진행 중인 세션 확인 (TTL 내)
  const ttlCutoff = new Date(Date.now() - TOKEN_TTL_MINUTES * 60 * 1000);
  const activeSession = await prisma.dwellSession.findFirst({
    where: {
      userId,
      completedAt: null,
      issuedAt: { gte: ttlCutoff },
    },
  });

  if (activeSession) {
    return NextResponse.json(
      { error: "이미 진행 중인 체류 세션이 있습니다." },
      { status: 409 }
    );
  }

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
    },
  });

  return NextResponse.json({ token, maxPoints: serverMaxPoints });
}
