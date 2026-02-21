import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit } from "@/lib/cache";

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요"),
  email: z.string().email("올바른 이메일을 입력해 주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  // IP rate limit: 시간당 5회 (봇 대량 계정 생성 방어)
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`reg:${ip}`, 3600, 5);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "잠시 후 다시 시도해 주세요. (시간당 5회 제한)" },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, points: 5000 },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "earn",
          amount: 5000,
          balance: 5000,
          source: "signup_bonus",
          metadata: { source: "signup_bonus" },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    const message =
      error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
