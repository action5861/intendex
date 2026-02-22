import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/common/header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const DAILY_CAP = 1000;

  const [user, intentCount, matchCount, recentTransactions, categoryStats, todayAggregate] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true },
      }),
      prisma.intent.count({ where: { userId: session.user.id } }),
      prisma.match.count({
        where: { intent: { userId: session.user.id } },
      }),
      prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          source: true,
          createdAt: true,
        },
      }),
      prisma.intent.groupBy({
        by: ["category"],
        where: { userId: session.user.id },
        _count: { category: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: "earn",
          createdAt: { gte: todayStart },
          source: { in: ["intent_reward", "dwell"] },
        },
        _sum: { amount: true },
      }),
    ]);

  const todayPoints = todayAggregate._sum.amount ?? 0;

  const stats = {
    totalPoints: user?.points ?? 0,
    totalIntents: intentCount,
    totalMatches: matchCount,
    todayPoints,
    dailyCap: DAILY_CAP,
    categoryDistribution: categoryStats.map((s) => ({
      category: s.category,
      count: s._count.category,
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type as "earn" | "withdraw" | "convert",
      amount: t.amount,
      source: t.source ?? "",
      createdAt: t.createdAt,
    })),
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="대시보드" />
      <DashboardContent stats={stats} />
    </div>
  );
}
