"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

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

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/withdrawals?status=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleAction = async (id: string, status: "completed" | "rejected") => {
    setProcessingId(id);
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      toast.success(status === "completed" ? "송금 완료 처리되었습니다" : "반려 처리되었습니다");
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || "처리 중 오류가 발생했습니다");
    }
    setProcessingId(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">출금 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          사용자 출금 요청을 확인하고 처리합니다.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">대기중</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
          <TabsTrigger value="rejected">반려</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {tab === "pending" ? "대기중인 출금 요청이 없습니다." : tab === "completed" ? "완료된 출금 내역이 없습니다." : "반려된 출금 내역이 없습니다."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {tx.user.name ?? "이름 없음"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {tx.user.email}
                          </span>
                        </div>
                        <p className="text-lg font-bold">
                          {tx.amount.toLocaleString()}P
                        </p>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>
                            {tx.metadata.bank} {tx.metadata.accountNumber}
                          </p>
                          <p>예금주: {tx.metadata.holder}</p>
                          <p>
                            {new Date(tx.createdAt).toLocaleString("ko-KR")}
                          </p>
                        </div>
                      </div>

                      {tab === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleAction(tx.id, "completed")}
                            disabled={processingId === tx.id}
                          >
                            {processingId === tx.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            송금 완료
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(tx.id, "rejected")}
                            disabled={processingId === tx.id}
                          >
                            {processingId === tx.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            반려
                          </Button>
                        </div>
                      )}

                      {tab !== "pending" && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            tab === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tab === "completed" ? "송금 완료" : "반려됨"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
