"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Coins, HandshakeIcon, TrendingUp, CalendarClock, ArrowRightLeft, Sparkles, MessageSquare } from "lucide-react";
import { motion, Variants } from "framer-motion";

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
    source: string;
    createdAt: Date;
  }[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function DashboardContent({ stats }: { stats: DashboardStats }) {
  const todayProgress = Math.min((stats.todayPoints / stats.dailyCap) * 100, 100);
  const isCapReached = stats.todayPoints >= stats.dailyCap;
  const remaining = Math.max(0, stats.dailyCap - stats.todayPoints);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Header Area */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">대시보드</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">오늘의 데이터 자산 현황을 확인하세요.</p>
        </div>
      </motion.div>

      {/* 오늘 기본소득 현황 카드 */}
      <motion.div initial="hidden" animate="visible" variants={itemVariants}>
        <Card className={`overflow-hidden border-0 shadow-xl relative ${isCapReached ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-900/20 shadow-amber-900/5" : "bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 dark:from-indigo-900/80 dark:via-blue-800/80 dark:to-blue-900/80 shadow-blue-900/20 text-white"}`}>
          {/* Decorative Background */}
          {!isCapReached && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            </>
          )}

          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isCapReached ? "bg-amber-100 dark:bg-amber-900/50" : "bg-white/20 backdrop-blur-md border border-white/20"}`}>
                <CalendarClock className={`h-5 w-5 ${isCapReached ? "text-amber-600 dark:text-amber-400" : "text-white"}`} />
              </div>
              <CardTitle className={`text-lg font-bold ${isCapReached ? "text-amber-900 dark:text-amber-100" : "text-white"}`}>오늘 기본소득 현황</CardTitle>
            </div>
            <Badge variant="outline" className={`px-3 py-1 text-sm font-bold rounded-lg border-2 ${isCapReached ? "border-amber-400 text-amber-700 dark:border-amber-500/50 dark:text-amber-300" : "border-white/30 bg-white/10 text-white backdrop-blur-md"}`}>
              {isCapReached ? "한도 도달 완료" : `${remaining.toLocaleString()}P 추가 적립 가능`}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5 relative z-10 pt-4">
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-2">
                <span className={`text-5xl md:text-6xl font-black tracking-tight ${isCapReached ? "text-amber-900 dark:text-amber-50" : "text-white"}`}>
                  {stats.todayPoints.toLocaleString()}
                </span>
                <span className={`text-xl font-semibold mb-1.5 ${isCapReached ? "text-amber-700 dark:text-amber-300" : "text-blue-100"}`}>P</span>
              </div>
              <span className={`text-sm font-medium ${isCapReached ? "text-amber-700/80 dark:text-amber-300/80" : "text-blue-100/80"}`}>
                일일 한도 {stats.dailyCap.toLocaleString()}P
              </span>
            </div>
            <div className={`w-full rounded-full h-3 md:h-4 overflow-hidden shadow-inner ${isCapReached ? "bg-amber-200/50 dark:bg-amber-900/30" : "bg-black/20"}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todayProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className={`h-full rounded-full ${isCapReached ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-blue-300 to-white"}`}
              />
            </div>
            <p className={`text-sm font-medium flex items-center gap-2 ${isCapReached ? "text-amber-800 dark:text-amber-200" : "text-blue-50"}`}>
              {isCapReached
                ? <> <Sparkles size={16} className="text-amber-500" /> 오늘 기본소득 한도를 모두 달성했습니다. 내일 다시 만나요! </>
                : `현재까지 ${stats.todayPoints.toLocaleString()}P 적립을 완료했습니다.`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial="hidden" animate="visible" variants={itemVariants}
        className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="총 보유 자산"
          value={stats.totalPoints.toLocaleString()}
          suffix="P"
          icon={<div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl"><Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>}
          color="emerald"
        />
        <StatCard
          title="수집된 내 의도"
          value={stats.totalIntents.toString()}
          suffix="개"
          icon={<div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl"><Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>}
          color="blue"
        />
        <StatCard
          title="캠페인 매칭 건수"
          value={stats.totalMatches.toString()}
          suffix="건"
          icon={<div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl"><HandshakeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>}
          color="indigo"
        />
        <StatCard
          title="누적 창출 수익"
          value={stats.recentTransactions
            .filter((t) => t.type === "earn")
            .reduce((sum, t) => sum + t.amount, 0)
            .toLocaleString()}
          suffix="P"
          icon={<div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 rounded-xl"><TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" /></div>}
          color="violet"
        />
      </motion.div>

      <motion.div
        initial="hidden" animate="visible" variants={itemVariants}
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Category Distribution */}
        <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/60 dark:border dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 pb-5">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              의도 인덱스 분포
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">나의 대화가 어떤 가치로 분류되었는지 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            {stats.categoryDistribution.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-center leading-relaxed">
                  아직 수집된 의도가 없습니다.<br />AI와 대화를 시작하여 데이터를 쌓아보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {stats.categoryDistribution
                  .sort((a, b) => b.count - a.count)
                  .map((item, i) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 font-semibold">
                        <span className="w-5 text-sm font-black text-slate-300 dark:text-slate-600">{i + 1}.</span>
                        <span className="text-slate-700 dark:text-slate-200 text-[15px]">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-4 w-7/12 justify-end">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (item.count / Math.max(...stats.categoryDistribution.map((c) => c.count))) * 100)}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full h-full"
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-10 text-right bg-slate-100 dark:bg-slate-800 py-1.5 px-2 rounded-lg">
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
        <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/60 dark:border dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                  최근 거래 내역
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">가장 최근의 수익 창출 및 사용 내역입니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-0 flex-1">
            {stats.recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                  <Coins className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">아직 거래 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {stats.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-row items-center justify-between px-6 py-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${tx.type === "earn" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        tx.type === "withdraw" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                        {tx.type === "earn" ? <TrendingUp size={20} /> :
                          tx.type === "withdraw" ? <Coins size={20} /> :
                            <ArrowRightLeft size={20} />}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                          {tx.type === "withdraw" ? "포인트 출금"
                            : tx.type === "convert" ? "포인트 전환"
                            : tx.source === "dwell" ? "사이트 체류 보상"
                            : "의도 데이터 보상"}
                        </p>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(tx.createdAt).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-lg font-black tracking-tight ${tx.type === "earn" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                      >
                        {tx.type === "earn" ? "+" : "-"}
                        {tx.amount.toLocaleString()} <span className="text-sm font-semibold ml-0.5">P</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
}: {
  title: string;
  value: string;
  suffix: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500"
  };

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/40 dark:shadow-none dark:bg-slate-900/60 dark:border dark:border-slate-800 rounded-3xl overflow-hidden group hover:-translate-y-1.5 transition-transform duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
        <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className="transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2">
        <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {value}
          <span className="text-sm font-bold text-slate-400 ml-1.5">
            {suffix}
          </span>
        </div>
      </CardContent>
      {/* Decorative colored bar at bottom */}
      <div className={`h-1.5 w-full ${colorMap[color]} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} />
    </Card>
  );
}
