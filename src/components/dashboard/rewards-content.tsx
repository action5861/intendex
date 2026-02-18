"use client";

import { useEffect, useState } from "react";
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
import { Coins, ArrowDownToLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);

    const res = await fetch(`/api/rewards?${params}`);
    const data = await res.json();
    setBalance(data.balance);
    setTransactions(data.transactions || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Balance Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm opacity-80">보유 포인트</p>
            <p className="text-4xl font-bold mt-1">
              {balance.toLocaleString()}
              <span className="text-lg font-normal ml-1">P</span>
            </p>
            <p className="text-sm opacity-70 mt-1">
              ≈ {balance.toLocaleString()}원
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Coins className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={balance < 10000}>
              <ArrowDownToLine className="h-4 w-4" />
              출금 신청
            </Button>
          </DialogTrigger>
          <DialogContent>
            <WithdrawForm
              balance={balance}
              onSuccess={() => {
                setWithdrawOpen(false);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">거래 내역</CardTitle>
          <CardDescription>포인트 적립 및 사용 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="earn">적립</TabsTrigger>
              <TabsTrigger value="withdraw">출금</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              거래 내역이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
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
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
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
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              withdrawStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : withdrawStatus === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
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
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString("ko-KR")}
                      </p>
                      {tx.metadata &&
                        typeof tx.metadata === "object" &&
                        "campaignTitle" in tx.metadata && (
                          <p className="text-xs text-muted-foreground">
                            {tx.metadata.campaignTitle as string}
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          tx.type === "earn"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "earn" ? "+" : "-"}
                        {tx.amount.toLocaleString()}P
                      </p>
                      <p className="text-xs text-muted-foreground">
                        잔액 {tx.balance.toLocaleString()}P
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
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
      toast.success("출금 신청이 완료되었습니다");
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error || "출금 처리 중 오류가 발생했습니다");
    }
    setSubmitting(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>출금 신청</DialogTitle>
        <DialogDescription>
          보유 포인트: {balance.toLocaleString()}P (최소 10,000P부터)
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <label className="text-sm font-medium">출금 금액</label>
          <Input
            type="number"
            placeholder="최소 10,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">은행</label>
          <Input
            placeholder="예: 카카오뱅크"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">계좌번호</label>
          <Input
            placeholder="'-' 없이 입력"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">예금주</label>
          <Input
            placeholder="예금주명"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          출금 신청
        </Button>
      </DialogFooter>
    </>
  );
}
