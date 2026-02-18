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
import { Loader2, Search, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

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
      toast.success(`역할이 ${newRole}(으)로 변경되었습니다`);
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "역할 변경에 실패했습니다");
    }
    setProcessing(false);
  };

  const handlePointsAdjust = async () => {
    if (!selectedUser || !pointsInput) return;
    const amount = parseInt(pointsInput);
    if (isNaN(amount) || amount === 0) {
      toast.error("유효한 포인트 값을 입력해주세요");
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
      toast.success("포인트가 조정되었습니다");
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "포인트 조정에 실패했습니다");
    }
    setProcessing(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          사용자 정보를 조회하고 관리합니다.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 이메일로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            사용자가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => openDetail(user.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                      {user.role === "admin" ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {user.name ?? "이름 없음"}
                        </p>
                        <Badge
                          variant={user.role === "admin" ? "default" : "secondary"}
                          className="shrink-0"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-medium">
                      {user.points.toLocaleString()}P
                    </p>
                    <p className="text-xs text-muted-foreground">
                      의도 {user._count.intents}건
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>사용자 상세</DialogTitle>
            <DialogDescription>
              사용자 정보를 확인하고 관리합니다.
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !selectedUser ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">이름</span>
                  <span className="font-medium">
                    {selectedUser.name ?? "이름 없음"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">이메일</span>
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">역할</span>
                  <Badge
                    variant={
                      selectedUser.role === "admin" ? "default" : "secondary"
                    }
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">포인트</span>
                  <span className="font-bold">
                    {selectedUser.points.toLocaleString()}P
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">의도 수</span>
                  <span>{selectedUser._count.intents}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">거래 수</span>
                  <span>{selectedUser._count.transactions}건</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">역할 변경</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRoleChange}
                    disabled={processing}
                  >
                    {processing && (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    )}
                    {selectedUser.role === "admin"
                      ? "일반 사용자로 변경"
                      : "관리자로 변경"}
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">포인트 조정</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="예: 100 또는 -50"
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handlePointsAdjust}
                      disabled={processing || !pointsInput}
                    >
                      {processing && (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      )}
                      적용
                    </Button>
                  </div>
                </div>
              </div>

              {selectedUser.intents.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">최근 의도</p>
                  <div className="space-y-1.5">
                    {selectedUser.intents.slice(0, 5).map((intent) => (
                      <div
                        key={intent.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate">
                          <Badge variant="outline" className="mr-1.5">
                            {intent.category}
                          </Badge>
                          {intent.keyword}
                        </span>
                        <Badge
                          variant={
                            intent.status === "active" ? "default" : "secondary"
                          }
                        >
                          {intent.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.transactions.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">최근 거래</p>
                  <div className="space-y-1.5">
                    {selectedUser.transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {tx.type === "earn"
                            ? "적립"
                            : tx.type === "withdraw"
                              ? "출금"
                              : "전환"}
                        </span>
                        <span
                          className={
                            tx.amount > 0
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toLocaleString()}P
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
