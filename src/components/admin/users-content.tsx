"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ShieldCheck, User as UserIcon, MoreHorizontal, Database, ArrowUpDown, CreditCard, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  points: number;
  createdAt: string;
  _count: { intents: number; transactions: number };
}

interface UserDetail extends UserItem {
  intents: {
    id: string;
    category: string;
    keyword: string;
    status: string;
    createdAt: string;
  }[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    createdAt: string;
  }[];
}

export function UsersContent() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pointsInput, setPointsInput] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    setPointsInput("");

    const res = await fetch(`/api/admin/users/${userId}`);
    if (res.ok) {
      setSelectedUser(await res.json());
    } else {
      toast.error("사용자 정보를 불러올 수 없습니다");
      setDetailOpen(false);
    }
    setDetailLoading(false);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setProcessing(true);

    const newRole = selectedUser.role === "admin" ? "user" : "admin";
    const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      const updated = await res.json();
      setSelectedUser((prev) => (prev ? { ...prev, role: updated.role } : null));
      toast.success(`마스터 권한이 ${newRole}(으)로 성공적으로 변경되었습니다.`);
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "권한 변경에 실패했습니다");
    }
    setProcessing(false);
  };

  const handlePointsAdjust = async () => {
    if (!selectedUser || !pointsInput) return;
    const amount = parseInt(pointsInput);
    if (isNaN(amount) || amount === 0) {
      toast.error("유효한 포인트 숫자 값을 입력해야 합니다.");
      return;
    }

    setProcessing(true);
    const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointsAdjustment: amount }),
    });

    if (res.ok) {
      const updated = await res.json();
      setSelectedUser((prev) =>
        prev ? { ...prev, points: updated.points } : null
      );
      setPointsInput("");
      toast.success("포인트가 정상적으로 조정되었습니다.");
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "포인트 조정에 실패했습니다");
    }
    setProcessing(false);
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
            <UserIcon className="w-6 h-6 text-indigo-500" />
            사용자 관리
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">
            플랫폼에 가입한 모든 사용자를 조회하고 권한 및 포인트를 관리합니다.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto relative z-10">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="사용자 이름 또는 이메일 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm focus-visible:ring-indigo-500 backdrop-blur-sm transition-all"
            />
          </div>
          <Button type="submit" className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 font-medium">
            검색
          </Button>
        </form>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-[24px] shadow-xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">사용자 데이터를 불러오는 중...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-6 mb-4">
              <UserIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">검색 결과가 없습니다</h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400">다른 키워드로 검색을 시도해보세요.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">사용자</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">권한</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">보유 포인트</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">활동 레벨</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">가입일</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">상세관리</th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-slate-100 dark:divide-slate-800/60"
                >
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.tr
                        variants={itemVariants}
                        key={user.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-inner ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {user.role === "admin" ? <ShieldCheck className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">
                                {user.name ?? "이름 미설정"}
                              </p>
                              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className={`border-0 px-2.5 py-1 ${user.role === "admin" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"}`}
                          >
                            {user.role === "admin" ? "최고 관리자" : "일반 회원"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            {user.points.toLocaleString()} <span className="text-slate-400 dark:text-slate-500 font-medium text-xs">P</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                              의도 <span className="font-bold text-indigo-600 dark:text-indigo-400">{user._count.intents}</span>건
                            </p>
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 font-medium">
                              거래 <span className="font-bold text-emerald-600 dark:text-emerald-400">{user._count.transactions}</span>건
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                          {new Date(user.createdAt).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-indigo-600 dark:text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity"
                            onClick={() => openDetail(user.id)}
                          >
                            관리
                            <MoreHorizontal className="ml-1 h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                  총 {totalPages}페이지 중 <strong className="text-slate-900 dark:text-white">{page}</strong>페이지
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-lg border-slate-200 dark:border-slate-700 disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl border-0 shadow-2xl bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">사용자 상세 정보</DialogTitle>
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500" />

          <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {detailLoading || !selectedUser ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-sm text-slate-500 font-medium">상세 정보를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* User Header */}
                <div className="flex items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div className={`p-4 rounded-2xl shadow-inner shrink-0 ${selectedUser.role === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {selectedUser.role === "admin" ? <ShieldCheck className="h-10 w-10" /> : <UserIcon className="h-10 w-10" />}
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                          {selectedUser.name ?? "이름 미설정"}
                        </h2>
                        <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {selectedUser.email}
                        </p>
                      </div>
                      <Badge variant="outline" className={`border-0 px-3 py-1.5 ml-2 shrink-0 ${selectedUser.role === "admin" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                        {selectedUser.role === "admin" ? "최고 관리자" : "일반 회원"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Action Blocks */}
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">포인트 직접 조정</h3>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[28px] font-black text-slate-900 dark:text-white leading-none">
                          {selectedUser.points.toLocaleString()} <span className="text-lg font-bold text-slate-400">P</span>
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="+100 또는 -50"
                            value={pointsInput}
                            onChange={(e) => setPointsInput(e.target.value)}
                            className="bg-white dark:bg-slate-800 font-semibold"
                          />
                          <Button
                            onClick={handlePointsAdjust}
                            disabled={processing || !pointsInput}
                            className="shrink-0 font-bold shadow-sm"
                          >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "적용"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">계정 권한 관리</h3>
                      </div>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        관리자 권한을 부여하면 모든 관리자 페이지에 접근할 수 있게 됩니다.
                      </p>
                      <Button
                        variant={selectedUser.role === "admin" ? "destructive" : "default"}
                        onClick={handleRoleChange}
                        disabled={processing}
                        className="w-full font-bold"
                      >
                        {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {selectedUser.role === "admin" ? "일반 사용자로 강등하기" : "관리자 권한 승격하기"}
                      </Button>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4 text-slate-400" />
                      최근 시스템 활동 요약
                    </h3>

                    {selectedUser.intents.length > 0 ? (
                      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                          최근 수집 의도 ({selectedUser._count.intents}건 중)
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedUser.intents.slice(0, 3).map((intent) => (
                            <div key={intent.id} className="p-3 text-[13px] flex items-center justify-between">
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-4">
                                [{intent.category}] {intent.keyword}
                              </span>
                              {intent.status === "active" ? (
                                <span className="flex items-center w-max gap-1 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md text-[11px]">
                                  활성
                                </span>
                              ) : (
                                <span className="flex items-center w-max gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                                  만료
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        수집된 의도가 없습니다.
                      </div>
                    )}

                    {selectedUser.transactions.length > 0 ? (
                      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm mt-4">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                          최근 거래 내역 ({selectedUser._count.transactions}건 중)
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedUser.transactions.slice(0, 3).map((tx) => (
                            <div key={tx.id} className="p-3 text-[13px] flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {tx.type === "earn" ? "적립됨" : tx.type === "withdraw" ? "출금됨" : "전환 내역"}
                              </span>
                              <span className={`font-black tracking-tight ${tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} P
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        거래 내역이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 text-right">
            <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-xl font-bold px-6 border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
