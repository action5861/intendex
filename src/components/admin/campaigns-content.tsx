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
  Sparkles,
  Megaphone,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { INTENT_CATEGORIES } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

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
  const [analyzing, setAnalyzing] = useState(false);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleAnalyzeURL = async () => {
    if (!form.url) {
      toast.error("URL을 먼저 입력하세요");
      return;
    }
    setAnalyzing(true);
    const res = await fetch("/api/admin/campaigns/analyze-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.url }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm((f) => ({
        ...f,
        siteName: data.siteName,
        title: data.title,
        description: data.description,
        category: data.category,
        keywords: data.keywords.join(", "),
      }));
      toast.success("자동 분석 완료! 내용을 확인하고 필요 시 수정하세요.");
    } else {
      toast.error("분석 실패. URL을 확인하거나 직접 입력해주세요.");
    }
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category || !form.keywords || !form.budget || !form.costPerMatch || !form.startDate || !form.endDate) {
      toast.error("필수 항목을 모두 입력해주세요.");
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
      const data = await res.json();
      if (data._warning) {
        toast.warning(data._warning);
      } else {
        toast.success(editingId ? "캠페인이 정상적으로 수정되었습니다." : "새로운 캠페인이 성공적으로 등록되었습니다.");
      }
      setFormOpen(false);
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "처리 중 오류가 발생했습니다.");
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
        newStatus === "active" ? "캠페인이 다시 활성화되었습니다." : "캠페인이 일시정지되었습니다."
      );
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = async (campaign: CampaignItem) => {
    if (!confirm("정말 이 캠페인을 삭제하시겠습니까? 관련 데이터가 모두 삭제되며 복구할 수 없습니다.")) return;

    const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("캠페인이 성공적으로 삭제되었습니다.");
      fetchCampaigns();
    } else {
      const data = await res.json();
      toast.error(data.error || "삭제를 진행할 수 없습니다.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-[#0f172a] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-2 tracking-tight">
            <Megaphone className="w-6 h-6 text-fuchsia-500" />
            광고 캠페인 관리
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">
            사용자 의도와 매칭할 광고 캠페인을 생성하고 효율을 모니터링합니다.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white shadow-lg shadow-fuchsia-500/25 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5 mr-1.5" />
          새 캠페인 등록
        </Button>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-[24px] shadow-xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800 p-6 md:p-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 inline-flex w-full sm:w-auto overflow-x-auto custom-scrollbar">
            <TabsTrigger value="active" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> 운영 중
              </div>
            </TabsTrigger>
            <TabsTrigger value="paused" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-amber-500" /> 일시 정지
              </div>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 종료됨
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-2 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 h-full">
                <Loader2 className="h-10 w-10 animate-spin text-fuchsia-500 mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">캠페인 목록을 불러오는 중...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 h-full"
              >
                <div className="bg-white dark:bg-slate-800 shadow-sm rounded-full p-6 mb-5 inline-flex ring-1 ring-slate-100 dark:ring-slate-700">
                  <Megaphone className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {tab === "active" ? "운영 중인 캠페인이 없습니다" : tab === "paused" ? "일시정지된 캠페인이 없습니다" : "종료된 캠페인이 없습니다"}
                </h3>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-6 font-medium">새로운 광고 캠페인을 등록하여 사용자들과 매칭을 시작하세요.</p>
                {tab === "active" && (
                  <Button onClick={openCreateDialog} variant="outline" className="rounded-xl border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-50 dark:border-fuchsia-900 dark:text-fuchsia-400 dark:hover:bg-fuchsia-900/20">
                    첫 캠페인 만들기
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6 grid-cols-1 xl:grid-cols-2"
              >
                <AnimatePresence>
                  {campaigns.map((campaign) => {
                    const progressRate = (campaign.spent / campaign.budget) * 100;
                    return (
                      <motion.div variants={itemVariants} key={campaign.id} layoutId={campaign.id}>
                        <Card className={`h-full border-0 bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-800 hover:shadow-lg transition-all duration-300 overflow-hidden relative group ${campaign.status === 'completed' ? 'opacity-70 dark:opacity-60 grayscale-[0.2]' : ''}`}>
                          {campaign.status === 'active' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500" />}
                          {campaign.status === 'paused' && <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />}
                          {campaign.status === 'completed' && <div className="absolute top-0 left-0 w-full h-1 bg-slate-300 dark:bg-slate-700" />}

                          <CardContent className="p-6 md:p-7 flex flex-col h-full">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 cursor-pointer group/title" onClick={() => openEditDialog(campaign)}>
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white truncate group-hover/title:text-fuchsia-600 transition-colors">
                                    {campaign.title}
                                  </h3>
                                  <Badge variant="outline" className="shrink-0 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium">
                                    {campaign.category}
                                  </Badge>
                                </div>
                                {campaign.siteName && (
                                  <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    <a href={campaign.url || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      {campaign.siteName}
                                    </a>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1.5 shrink-0 ml-2">
                                {campaign.status !== "completed" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`w-9 h-9 rounded-lg shadow-sm border ${campaign.status === 'active' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                                    onClick={(e) => { e.stopPropagation(); handleStatusToggle(campaign); }}
                                    title={campaign.status === "active" ? "일시정지" : "활성 전환"}
                                  >
                                    {campaign.status === "active" ? <Pause className="h-4 w-4 fill-amber-600" /> : <Play className="h-4 w-4 fill-emerald-600" />}
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                  onClick={(e) => { e.stopPropagation(); openEditDialog(campaign); }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-sm dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(campaign); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-5">
                              {campaign.keywords.map((kw) => (
                                <span
                                  key={kw}
                                  className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>

                            <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">매칭 단가</p>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{campaign.costPerMatch.toLocaleString()} P</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">총 매칭 횟수</p>
                                  <p className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                    {campaign._count.matches.toLocaleString()} <span className="text-xs text-indigo-400/80 font-medium">건</span>
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">예산 소진율</p>
                                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">{Math.min(progressRate, 100).toFixed(1)}%</p>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${progressRate >= 90 ? 'bg-rose-500' : progressRate >= 75 ? 'bg-amber-500' : 'bg-fuchsia-500'}`}
                                    style={{ width: `${Math.min(progressRate, 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                  <span>{campaign.spent.toLocaleString()} P 사용</span>
                                  <span>총 {campaign.budget.toLocaleString()} P</span>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                <span>시작: {new Date(campaign.startDate).toLocaleDateString("ko-KR", { year: '2-digit', month: '2-digit', day: '2-digit' })}</span>
                                <span>종료: {new Date(campaign.endDate).toLocaleDateString("ko-KR", { year: '2-digit', month: '2-digit', day: '2-digit' })}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl rounded-[28px] overflow-hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl p-0">
          <div className="h-2 w-full bg-gradient-to-r from-fuchsia-500 to-indigo-500" />

          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar max-h-[85vh]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                {editingId ? "캠페인 정보 수정" : "새 캠페인 등록하기"}
              </DialogTitle>
              <DialogDescription className="text-[15px] font-medium pt-1">
                {editingId
                  ? "운영 중인 캠페인의 상세 조건과 예산을 변경합니다."
                  : "새로운 광고주 캠페인을 설정하고 자동 매칭을 시작합니다."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-100 dark:border-fuchsia-500/20 rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-[13px] font-bold text-fuchsia-800 dark:text-fuchsia-300 px-1">URL 자동 분석 (추천)</label>
                    <div className="flex gap-2">
                      <Input
                        value={form.url}
                        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                        placeholder="https://example.com"
                        className="bg-white/80 dark:bg-slate-800/80 border-fuchsia-200 dark:border-fuchsia-500/30 h-11 transition-all focus:border-fuchsia-500 focus:ring-fuchsia-500"
                      />
                      {!editingId && (
                        <Button
                          type="button"
                          onClick={handleAnalyzeURL}
                          disabled={analyzing || !form.url}
                          className="shrink-0 h-11 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold px-5"
                        >
                          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                          {analyzing ? "분석 중..." : "AI 분석"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">캠페인 제목 <span className="text-rose-500">*</span></label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="최대 50자 이내의 명확한 캠페인명"
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">의도 카테고리 <span className="text-rose-500">*</span></label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 font-medium text-[15px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 appearance-none"
                  >
                    <option value="" disabled>카테고리 선택</option>
                    {INTENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">광고주 사이트명</label>
                  <Input
                    value={form.siteName}
                    onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
                    placeholder="예: 쿠팡, 아고다"
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">광고/제품 설명 <span className="text-rose-500">*</span></label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="유저의 의도와 자연스럽게 연결될 수 있도록 특징과 혜택을 상세히 적어주세요."
                    rows={4}
                    className="resize-none bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl text-[15px] leading-relaxed"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">매칭 키워드 <span className="text-rose-500">*</span></label>
                  <Input
                    value={form.keywords}
                    onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                    placeholder="쉼표 단위 구분 (예: 신발, 런닝화, 세일)"
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl"
                  />
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 md:col-span-2 grid grid-cols-2 gap-5 mt-2">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">총 예산 <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.budget}
                        onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                        placeholder="1,000,000"
                        className="h-11 pr-8 bg-white dark:bg-slate-800 font-bold text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">P</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">매칭 단가 <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.costPerMatch}
                        onChange={(e) => setForm((f) => ({ ...f, costPerMatch: e.target.value }))}
                        placeholder="150"
                        className="h-11 pr-8 bg-white dark:bg-slate-800 font-bold text-right text-indigo-600 dark:text-indigo-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">P</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">시작일 <span className="text-rose-500">*</span></label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 px-1">종료일 <span className="text-rose-500">*</span></label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[15px]"
                onClick={() => setFormOpen(false)}
                disabled={processing}
              >
                닫기
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-[15px]"
              >
                {processing && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                {editingId ? "변경 저장하기" : "캠페인 등록완료"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
