import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/common/header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, intentCount, matchCount, recentTransactions, categoryStats] =
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
      }),
      prisma.intent.groupBy({
        by: ["category"],
        where: { userId: session.user.id },
        _count: { category: true },
      }),
    ]);

  const stats = {
    totalPoints: user?.points ?? 0,
    totalIntents: intentCount,
    totalMatches: matchCount,
    categoryDistribution: categoryStats.map((s) => ({
      category: s.category,
      count: s._count.category,
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type as "earn" | "withdraw" | "convert",
      amount: t.amount,
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
