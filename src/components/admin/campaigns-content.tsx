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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { INTENT_CATEGORIES } from "@/types";

interface CampaignItem {
  id: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  budget: number;
  spent: number;
  costPerMatch: number;
  url: string | null;
  siteName: string | null;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  _count: { matches: number };
}

type CampaignForm = {
  title: string;
  description: string;
  category: string;
  keywords: string;
  budget: string;
  costPerMatch: string;
  startDate: string;
  endDate: string;
  url: string;
  siteName: string;
};

const emptyForm: CampaignForm = {
  title: "",
  description: "",
  category: "",
  keywords: "",
  budget: "",
  costPerMatch: "",
  startDate: "",
  endDate: "",
  url: "",
  siteName: "",
};

export function CampaignsContent() {
  const [tab, setTab] = useState("active");
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/campaigns?status=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditDialog = (campaign: CampaignItem) => {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      keywords: campaign.keywords.join(", "),
      budget: String(campaign.budget),
      costPerMatch: String(campaign.costPerMatch),
      startDate: campaign.startDate.slice(0, 10),
      endDate: campaign.endDate.slice(0, 10),
      url: campaign.url || "",
      siteName: campaign.siteName || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category || !form.keywords || !form.budget || !form.costPerMatch || !form.startDate || !form.endDate) {
      toast.error("모든 항목을 입력해주세요");
      return;
    }

    setProcessing(true);
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      budget: Number(form.budget),
      costPerMatch: Number(form.costPerMatch),
      startDate: form.startDate,
      endDate: form.endDate,
      url: form.url || null,
      siteName: form.siteName || null,
    };

    const url = editingId
      ? `/api/admin/campaigns/${editingId}`
      : "/api/admin/campaigns";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editingId ? "캠페인이 수정되었습니다" : "캠페인이 등록되었습니다");
      setFormOpen(false);
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "처리 중 오류가 발생했습니다");
    }
    setProcessing(false);
  };

  const handleStatusToggle = async (campaign: CampaignItem) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success(
        newStatus === "active" ? "캠페인이 활성화되었습니다" : "캠페인이 일시정지되었습니다"
      );
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "상태 변경에 실패했습니다");
    }
  };

  const handleDelete = async (campaign: CampaignItem) => {
    if (!confirm("정말 이 캠페인을 삭제하시겠습니까?")) return;

    const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("캠페인이 삭제되었습니다");
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "삭제에 실패했습니다");
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "활성";
      case "paused":
        return "일시정지";
      case "completed":
        return "완료";
      default:
        return status;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">광고주 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            캠페인을 등록하고 관리합니다.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1" />
          캠페인 등록
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">활성</TabsTrigger>
          <TabsTrigger value="paused">일시정지</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {statusLabel(tab)} 상태인 캠페인이 없습니다.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{campaign.title}</p>
                          <Badge variant="outline">{campaign.category}</Badge>
                          <Badge
                            variant={
                              campaign.status === "active"
                                ? "default"
                                : campaign.status === "paused"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {statusLabel(campaign.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {campaign.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {campaign.siteName && (
                            <span>
                              사이트: {campaign.url ? (
                                <a href={campaign.url} target="_blank" rel="noopener noreferrer" className="underline">
                                  {campaign.siteName}
                                </a>
                              ) : campaign.siteName}
                            </span>
                          )}
                          <span>
                            예산: {campaign.spent.toLocaleString()} /{" "}
                            {campaign.budget.toLocaleString()}P
                          </span>
                          <span>
                            매칭단가: {campaign.costPerMatch.toLocaleString()}P
                          </span>
                          <span>매칭: {campaign._count.matches}건</span>
                          <span>
                            {new Date(campaign.startDate).toLocaleDateString("ko-KR")}
                            {" ~ "}
                            {new Date(campaign.endDate).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(campaign)}
                          title="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {campaign.status !== "completed" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStatusToggle(campaign)}
                            title={
                              campaign.status === "active"
                                ? "일시정지"
                                : "활성화"
                            }
                          >
                            {campaign.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(campaign)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "캠페인 수정" : "캠페인 등록"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "캠페인 정보를 수정합니다."
                : "새로운 캠페인을 등록합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="캠페인 제목"
              />
            </div>

            <div>
              <label className="text-sm font-medium">설명</label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="캠페인 설명"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">카테고리</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">선택하세요</option>
                {INTENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">키워드</label>
              <Input
                value={form.keywords}
                onChange={(e) =>
                  setForm((f) => ({ ...f, keywords: e.target.value }))
                }
                placeholder="쉼표로 구분 (예: 여행, 호텔, 리조트)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">광고주 사이트명</label>
                <Input
                  value={form.siteName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteName: e.target.value }))
                  }
                  placeholder="예: 쿠팡"
                />
              </div>
              <div>
                <label className="text-sm font-medium">광고주 사이트 URL</label>
                <Input
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">예산 (P)</label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budget: e.target.value }))
                  }
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">매칭단가 (P)</label>
                <Input
                  type="number"
                  value={form.costPerMatch}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, costPerMatch: e.target.value }))
                  }
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">시작일</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">종료일</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={processing}
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={processing}>
              {processing && (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              )}
              {editingId ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
