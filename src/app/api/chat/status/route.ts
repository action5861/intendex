import { auth } from "@/lib/auth";
import { RewardService } from "@/services/reward.service";
import { NextResponse } from "next/server";

const DAILY_INTENT_POINT_CAP = 1000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dailyStats, balance] = await Promise.all([
    RewardService.getDailyIntentStats(session.user.id),
    RewardService.getUserBalance(session.user.id),
  ]);

  return NextResponse.json({
    remainingPoints: Math.max(0, DAILY_INTENT_POINT_CAP - dailyStats.totalPoints),
    maxPoints: DAILY_INTENT_POINT_CAP,
    usedPoints: dailyStats.totalPoints,
    balance,
  });
}
