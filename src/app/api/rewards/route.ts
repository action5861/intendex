import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RewardService } from "@/services/reward.service";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") || undefined;
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");

  const [balance, history] = await Promise.all([
    RewardService.getUserBalance(session.user.id),
    RewardService.getTransactionHistory(session.user.id, { type, page }),
  ]);

  return NextResponse.json({ balance, ...history });
}

const withdrawSchema = z.object({
  amount: z.number().min(10000),
  bank: z.string().min(1),
  accountNumber: z.string().min(1),
  holder: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = withdrawSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "올바른 정보를 입력해 주세요" },
      { status: 400 }
    );
  }

  try {
    const result = await RewardService.requestWithdrawal(
      session.user.id,
      parsed.data.amount,
      {
        bank: parsed.data.bank,
        accountNumber: parsed.data.accountNumber,
        holder: parsed.data.holder,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "출금 처리 중 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
