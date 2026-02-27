"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Suggestion {
  id: string;
  text: string;
  category: string;
  keyword: string;
  pointValue: number;
  siteUrl: string | null;
  siteName: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const CATEGORIES = [
  "여행", "쇼핑", "건강", "교육", "금융", "음식",
  "패션", "테크", "부동산", "자동차", "취미", "기타",
];

const EMPTY_FORM = {
  text: "",
  category: "여행",
  keyword: "",
  pointValue: 500,
  siteUrl: "",
  siteName: "",
  order: 0,
  isActive: true,
};

type FormData = typeof EMPTY_FORM;

export function SuggestionsContent() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Suggestion | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/suggestions");
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Suggestion) => {
    setEditTarget(s);
    setForm({
      text: s.text,
      category: s.category,
      keyword: s.keyword,
      pointValue: s.pointValue,
      siteUrl: s.siteUrl ?? "",
      siteName: s.siteName ?? "",
      order: s.order,
      isActive: s.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.text.trim() || !form.keyword.trim()) {
      toast.error("안내문 텍스트와 키워드를 입력해주세요.");
      return;
    }

    setSaving(true);
    const url = editTarget
      ? `/api/admin/suggestions/${editTarget.id}`
      : "/api/admin/suggestions";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editTarget ? "안내문이 수정되었습니다." : "안내문이 생성되었습니다.");
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || "저장 중 오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 안내문을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/suggestions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("삭제되었습니다.");
      fetchData();
    } else {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
    setDeletingId(null);
  };

  const handleToggle = async (s: Suggestion) => {
    setTogglingId(s.id);
    const res = await fetch(`/api/admin/suggestions/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    if (res.ok) {
      fetchData();
    } else {
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
    setTogglingId(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl">
            <MessageSquarePlus className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">안내문 관리</h1>
            <p className="text-sm text-slate-400">채팅 화면 초기 Fast Track 버튼을 관리합니다.</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl gap-2">
          <Plus className="h-4 w-4" />
          안내문 추가
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-20 text-slate-500">등록된 안내문이 없습니다.</div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {suggestions.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Card className={`bg-slate-800/50 border-slate-700/50 transition-opacity ${s.isActive ? "" : "opacity-50"}`}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 leading-snug">{s.text}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={() => handleToggle(s)}
                        disabled={togglingId === s.id}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="bg-slate-700/60 rounded-full px-2.5 py-1 font-medium">{s.category}</span>
                      <span className="bg-slate-700/60 rounded-full px-2.5 py-1">키워드: {s.keyword}</span>
                      <span className="bg-slate-700/60 rounded-full px-2.5 py-1">{s.pointValue.toLocaleString()}P</span>
                      <span className="bg-slate-700/60 rounded-full px-2.5 py-1">순서: {s.order}</span>
                      {s.siteUrl ? (
                        <a
                          href={s.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-cyan-900/40 text-cyan-400 rounded-full px-2.5 py-1 hover:bg-cyan-900/60 transition-colors"
                        >
                          🔗 {s.siteName || s.siteUrl}
                        </a>
                      ) : (
                        <span className="bg-slate-700/40 text-slate-500 rounded-full px-2.5 py-1 italic">광고주 미지정</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "안내문 수정" : "안내문 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">안내문 텍스트</label>
              <Input
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="예: ✈️ 일본 여행 일주일 예산은?"
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">카테고리</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-slate-100">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">키워드</label>
                <Input
                  value={form.keyword}
                  onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                  placeholder="예: 일본 여행"
                  className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">광고주 사이트 URL</label>
              <Input
                value={form.siteUrl}
                onChange={(e) => setForm((f) => ({ ...f, siteUrl: e.target.value }))}
                placeholder="https://www.example.com"
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">광고주 사이트 표시명</label>
              <Input
                value={form.siteName}
                onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
                placeholder="예: 하나투어"
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">포인트 값</label>
                <Input
                  type="number"
                  value={form.pointValue}
                  onChange={(e) => setForm((f) => ({ ...f, pointValue: Number(e.target.value) }))}
                  min={0}
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">순서 (낮을수록 먼저)</label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  min={0}
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">활성화</label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editTarget ? "저장" : "추가")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
