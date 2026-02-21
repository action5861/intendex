"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, ArrowDownToLine, Loader2, Sparkles, MoveRight, History } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function RewardsContent() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);

    const res = await fetch(`/api/rewards?${params}`);
    const data = await res.json();
    setBalance(data.balance);
    setTransactions(data.transactions || []);
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-[#0f172a] min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-2 tracking-tight">
            <Coins className="w-6 h-6 text-amber-500" />
            나의 자산 및 출금
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">
            AI 모듈이 제공하는 데이터 기본소득을 시각적으로 확인하고 관리하세요.
          </p>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr_2fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="space-y-6"
        >
          {/* Balance Card */}
          <Card className="border-0 shadow-2xl relative overflow-hidden bg-slate-900 text-white rounded-[2rem]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/30 blur-[60px] rounded-full pointer-events-none" />
            <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between min-h-[220px]">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 inline-flex shadow-inner border border-white/5">
                  <Sparkles className="h-6 w-6 text-indigo-300" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-400 mb-1">총 보유 포인트</p>
                  <p className="text-xs text-indigo-300 backdrop-blur-xl bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20 inline-block font-medium">1P = 1원</p>
                </div>
              </div>

              <div>
                <p className="text-5xl lg:text-6xl font-black tracking-tight flex items-baseline gap-1 mt-auto">
                  {balance.toLocaleString()}
                  <span className="text-2xl font-bold text-slate-400">P</span>
                </p>
                <p className="text-lg font-medium text-slate-300 mt-2 flex items-center gap-2">
                  <MoveRight className="h-4 w-4 text-slate-500" />
                  약 {balance.toLocaleString()}원 상당 가치
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full h-16 rounded-2xl text-[17px] font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={balance < 10000}
                size="lg"
              >
                <ArrowDownToLine className="h-5 w-5 mr-2" />
                현금으로 출금 신청하기
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl">
              <DialogTitle className="sr-only">출금 폼 열기</DialogTitle>
              <WithdrawForm
                balance={balance}
                onSuccess={() => {
                  setWithdrawOpen(false);
                  fetchData();
                }}
              />
            </DialogContent>
          </Dialog>

          {balance < 10000 && (
            <p className="text-[13px] text-center text-slate-500 dark:text-slate-400 px-4">
              출금은 최소 <strong className="text-slate-700 dark:text-slate-300">10,000P</strong> 부터 가능합니다.
            </p>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] h-full ring-1 ring-slate-200/50 dark:ring-slate-700/50">
            <CardHeader className="p-6 md:p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl">
                  <History className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <CardTitle className="text-[19px] font-bold mb-1 tracking-tight text-slate-800 dark:text-slate-100">거래 내역 상세보기</CardTitle>
                  <CardDescription className="text-sm">포인트 적립 및 사용 기록을 투명하게 확인하세요.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 md:px-8 pb-8">
              <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                <TabsList className="mb-6 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <TabsTrigger value="all" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">전체</TabsTrigger>
                  <TabsTrigger value="earn" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">적립</TabsTrigger>
                  <TabsTrigger value="withdraw" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">출금</TabsTrigger>
                </TabsList>
              </Tabs>

              {loading ? (
                <div className="flex justify-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Coins className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-[15px] text-slate-500 font-medium">
                    아직 거래 내역이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pr-2 custom-scrollbar max-h-[500px] overflow-y-auto">
                  <AnimatePresence>
                    {transactions.map((tx, index) => {
                      const isSignupBonus =
                        tx.type === "earn" &&
                        tx.metadata &&
                        typeof tx.metadata === "object" &&
                        (tx.metadata as Record<string, unknown>).source === "signup_bonus";
                      const withdrawStatus =
                        tx.type === "withdraw" && tx.metadata && typeof tx.metadata === "object"
                          ? ((tx.metadata as Record<string, unknown>).status as string)
                          : null;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={tx.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl shrink-0 ${tx.type === "earn" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                              {tx.type === "earn" ? <Sparkles className="h-5 w-5" /> : <ArrowDownToLine className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                                  {isSignupBonus
                                    ? "가입 축하금"
                                    : tx.type === "earn"
                                      ? "포인트 적립"
                                      : tx.type === "withdraw"
                                        ? "출금 신청"
                                        : "포인트 전환"}
                                </p>
                                {withdrawStatus && (
                                  <span
                                    className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${withdrawStatus === "pending"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                      : withdrawStatus === "completed"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                        : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                                      }`}
                                  >
                                    {withdrawStatus === "pending"
                                      ? "처리 중"
                                      : withdrawStatus === "completed"
                                        ? "송금 완료"
                                        : "반려됨"}
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                                {new Date(tx.createdAt).toLocaleString("ko-KR", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {tx.metadata &&
                                typeof tx.metadata === "object" &&
                                "campaignTitle" in tx.metadata && (
                                  <p className="text-[12px] text-indigo-500 dark:text-indigo-400 mt-1 font-semibold truncate max-w-[200px] md:max-w-[300px] bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md inline-block">
                                    {tx.metadata.campaignTitle as string}
                                  </p>
                                )}
                            </div>
                          </div>
                          <div className="text-right pl-4">
                            <p
                              className={`text-[17px] font-black ${tx.type === "earn"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                                }`}
                            >
                              {tx.type === "earn" ? "+" : "-"}
                              {tx.amount.toLocaleString()}
                              <span className="text-sm font-bold opacity-80 ml-0.5">P</span>
                            </p>
                            <p className="text-[12px] font-medium text-slate-400 mt-1">
                              잔여 {tx.balance.toLocaleString()} P
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function WithdrawForm({
  balance,
  onSuccess,
}: {
  balance: number;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 10000) {
      toast.error("최소 출금 금액은 10,000P입니다");
      return;
    }
    if (numAmount > balance) {
      toast.error("잔액이 부족합니다");
      return;
    }
    if (!bank || !accountNumber || !holder) {
      toast.error("모든 항목을 입력해 주세요");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: numAmount,
        bank,
        accountNumber,
        holder,
      }),
    });

    if (res.ok) {
      toast.success("출금 신청이 완료되었습니다 🎉");
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error || "출금 처리 중 오류가 발생했습니다");
    }
    setSubmitting(false);
  };

  return (
    <>
      <DialogHeader className="mb-2">
        <DialogTitle className="text-2xl font-bold">출금 신청하기</DialogTitle>
        <DialogDescription className="text-[15px] pt-1">
          현재 귀하의 현금성 자산은 <strong className="text-slate-900 dark:text-white">{balance.toLocaleString()}P</strong> 입니다.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-5 py-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">신청 금액</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="최소 10,000부터 입력"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl px-4 font-semibold text-lg"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">P</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">입금 받을 은행</label>
          <Input
            placeholder="예: 카카오뱅크, 토스뱅크"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">계좌번호</label>
          <Input
            placeholder="'-' 기호 없이 숫자만 입력"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl px-4 tracking-wider text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 ml-1">예금주명</label>
          <Input
            placeholder="계좌 실명 입력"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            className="h-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm"
          />
        </div>
      </div>
      <DialogFooter className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 text-[15px]">
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : <ArrowDownToLine className="h-4 w-4 mr-2" />}
          신청 완료하기
        </Button>
      </DialogFooter>
    </>
  );
}
