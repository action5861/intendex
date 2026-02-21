"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, Wallet, Clock, ArrowDownRight, ArrowUpRight, Banknote, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface WithdrawalTransaction {
  id: string;
  userId: string;
  amount: number;
  balance: number;
  metadata: {
    bank: string;
    accountNumber: string;
    holder: string;
    status: string;
  };
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export function WithdrawalsContent() {
  const [tab, setTab] = useState("pending");
  const [transactions, setTransactions] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals?status=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions || []);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [tab, fetchData]);

  const handleAction = async (id: string, status: "completed" | "rejected") => {
    setProcessingId(id);
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      toast.success(status === "completed" ? "송금이 성공적으로 완료되었습니다." : "출금 요청이 반려되었습니다.");
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || "처리 중 오류가 발생했습니다.");
    }
    setProcessingId(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-[#0f172a] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-2 tracking-tight">
            <Wallet className="w-6 h-6 text-emerald-500" />
            출금 요청 관리
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">
            사용자들의 포인트 출금 요청 내역을 확인하고 계좌 송금을 처리합니다.
          </p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-[24px] shadow-xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 p-6 md:p-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 inline-flex w-full sm:w-auto overflow-x-auto custom-scrollbar">
            <TabsTrigger value="pending" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> 처리 대기중
              </div>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> 송금 완료
              </div>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" /> 반려됨
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-2 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 h-full">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">출금 요청 데이터를 불러오는 중...</p>
              </div>
            ) : transactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 h-full"
              >
                <div className="bg-white dark:bg-slate-800 shadow-sm rounded-full p-6 mb-5 inline-flex ring-1 ring-slate-100 dark:ring-slate-700">
                  <Banknote className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {tab === "pending" ? "대기중인 출금 요청이 없습니다" : tab === "completed" ? "송금 완료된 내역이 없습니다" : "반려된 내역이 없습니다"}
                </h3>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium">새로운 내역이 발생하면 이곳에 표시됩니다.</p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4"
              >
                <AnimatePresence>
                  {transactions.map((tx) => (
                    <motion.div variants={itemVariants} key={tx.id} layoutId={tx.id}>
                      <Card className={`overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-800/80 transition-all duration-300 hover:shadow-md ${tab === 'completed' ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : tab === 'rejected' ? 'bg-rose-50/30 dark:bg-rose-900/5' : 'bg-white dark:bg-slate-900/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/80'}`}>
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row md:items-center">
                            {/* User & Amount Section */}
                            <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-inner ${tab === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : tab === 'rejected' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                  {tab === "completed" ? <ArrowUpRight className="h-6 w-6" /> : tab === "rejected" ? <XCircle className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-[15px] truncate">
                                      {tx.user.name ?? "이름 미설정"}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                    <UserIcon className="w-3.5 h-3.5" />
                                    {tx.user.email}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-xl font-black tracking-tight ${tab === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : tab === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                  {tx.amount.toLocaleString()} <span className="text-sm font-bold text-slate-400">P</span>
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                  출금 금액
                                </p>
                              </div>
                            </div>

                            {/* Bank Details Section */}
                            <div className="flex-[1.2] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${tab === 'completed' ? 'bg-emerald-200/50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : tab === 'rejected' ? 'bg-rose-200/50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {tx.metadata.bank}
                                  </div>
                                  <span className="font-mono text-[14px] font-medium text-slate-700 dark:text-slate-300">
                                    {tx.metadata.accountNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                  <span>예금주: <strong className="text-slate-700 dark:text-slate-300 ml-0.5">{tx.metadata.holder}</strong></span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                  <span>요청일: {new Date(tx.createdAt).toLocaleDateString("ko-KR", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {tab === "pending" ? (
                                <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAction(tx.id, "completed")}
                                    disabled={processingId === tx.id}
                                    className="flex-1 sm:flex-none h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-500/20"
                                  >
                                    {processingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                                    송금 완료
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(tx.id, "rejected")}
                                    disabled={processingId === tx.id}
                                    className="flex-1 sm:flex-none h-9 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-900/20 font-bold"
                                  >
                                    {processingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                                    반려
                                  </Button>
                                </div>
                              ) : (
                                <div className="shrink-0 text-right mt-2 sm:mt-0">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${tab === "completed"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-500/30"
                                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-200/50 dark:ring-rose-500/30"
                                      }`}
                                  >
                                    {tab === "completed" ? (
                                      <><CheckCircle className="w-4 h-4" /> 송금 처리됨</>
                                    ) : (
                                      <><XCircle className="w-4 h-4" /> 반려됨</>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
