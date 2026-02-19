"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Coins, HandshakeIcon, TrendingUp, CalendarClock } from "lucide-react";

interface DashboardStats {
  totalPoints: number;
  totalIntents: number;
  totalMatches: number;
  todayPoints: number;
  dailyCap: number;
  categoryDistribution: { category: string; count: number }[];
  recentTransactions: {
    id: string;
    type: "earn" | "withdraw" | "convert";
    amount: number;
    createdAt: Date;
  }[];
}

export function DashboardContent({ stats }: { stats: DashboardStats }) {
  const todayProgress = Math.min((stats.todayPoints / stats.dailyCap) * 100, 100);
  const isCapReached = stats.todayPoints >= stats.dailyCap;
  const remaining = Math.max(0, stats.dailyCap - stats.todayPoints);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 오늘 기본소득 현황 카드 */}
      <Card className={isCapReached ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className={`h-5 w-5 ${isCapReached ? "text-amber-500" : "text-emerald-500"}`} />
            <CardTitle className="text-base">오늘 기본소득 현황</CardTitle>
          </div>
          <Badge variant={isCapReached ? "outline" : "secondary"} className={isCapReached ? "border-amber-400 text-amber-700 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"}>
            {isCapReached ? "한도 도달" : `${remaining.toLocaleString()}P 남음`}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">
              {stats.todayPoints.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">P</span>
            </span>
            <span className="text-sm text-muted-foreground">
              한도 {stats.dailyCap.toLocaleString()}P
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${isCapReached ? "bg-amber-400" : "bg-emerald-500"}`}
              style={{ width: `${todayProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isCapReached
              ? "오늘 기본소득 한도를 모두 사용했어요. 내일 자정 이후 다시 적립할 수 있습니다."
              : `오늘 ${stats.todayPoints.toLocaleString()}P 적립 완료 · 추가로 ${remaining.toLocaleString()}P 더 받을 수 있어요.`}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="보유 포인트"
          value={stats.totalPoints.toLocaleString()}
          suffix="P"
          icon={<Coins className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          title="수집된 의도"
          value={stats.totalIntents.toString()}
          suffix="개"
          icon={<Lightbulb className="h-4 w-4 text-blue-500" />}
        />
        <StatCard
          title="캠페인 매칭"
          value={stats.totalMatches.toString()}
          suffix="건"
          icon={<HandshakeIcon className="h-4 w-4 text-teal-500" />}
        />
        <StatCard
          title="누적 수익"
          value={stats.recentTransactions
            .filter((t) => t.type === "earn")
            .reduce((sum, t) => sum + t.amount, 0)
            .toLocaleString()}
          suffix="P"
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">의도 카테고리 분포</CardTitle>
            <CardDescription>수집된 의도의 카테고리별 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.categoryDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 수집된 의도가 없습니다. AI와 대화를 시작해보세요!
              </p>
            ) : (
              <div className="space-y-3">
                {stats.categoryDistribution
                  .sort((a, b) => b.count - a.count)
                  .map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-blue-600 rounded-full h-2 transition-all"
                            style={{
                              width: `${Math.min(100, (item.count / Math.max(...stats.categoryDistribution.map((c) => c.count))) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">최근 거래 내역</CardTitle>
            <CardDescription>포인트 적립 및 사용 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 거래 내역이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === "earn"
                          ? "포인트 적립"
                          : tx.type === "withdraw"
                            ? "출금"
                            : "전환"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${tx.type === "earn" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.type === "earn" ? "+" : "-"}
                      {tx.amount.toLocaleString()}P
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  suffix,
  icon,
}: {
  title: string;
  value: string;
  suffix: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {suffix}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
