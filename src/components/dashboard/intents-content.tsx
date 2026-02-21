"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Target,
  Sparkles,
} from "lucide-react";
import { INTENT_CATEGORIES } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface IntentData {
  id: string;
  category: string;
  subcategory: string | null;
  keyword: string;
  description: string;
  confidence: number;
  status: string;
  createdAt: string;
}

export function IntentsContent() {
  const [intents, setIntents] = useState<IntentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");

  const fetchIntents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (activeStatus !== "all") params.set("status", activeStatus);

    const res = await fetch(`/api/intents?${params}`);
    const data = await res.json();
    setIntents(data.intents || []);
    setLoading(false);
  }, [activeCategory, activeStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeStatus]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-[#0f172a] min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-2 tracking-tight">
            <Target className="w-6 h-6 text-indigo-500" />
            나의 의도
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">
            AI 모듈이 분석한 관심사와 의도를 통해 데이터 가치를 창출합니다.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
        <Tabs value={activeStatus} onValueChange={setActiveStatus} className="w-full lg:w-auto">
          <TabsList className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-5">전체</TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-5">활성</TabsTrigger>
            <TabsTrigger value="matched" className="rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-5">매칭됨</TabsTrigger>
            <TabsTrigger value="expired" className="rounded-lg data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all px-5">만료</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2 items-center bg-white/60 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 backdrop-blur-md">
          <Badge
            variant={activeCategory === "all" ? "default" : "secondary"}
            className={`cursor-pointer px-4 py-1.5 rounded-xl transition-all text-sm font-medium ${activeCategory === "all" ? "bg-slate-800 text-white dark:bg-indigo-500" : "bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
            onClick={() => setActiveCategory("all")}
          >
            전체
          </Badge>
          {INTENT_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "secondary"}
              className={`cursor-pointer px-4 py-1.5 rounded-xl transition-all text-sm font-medium ${activeCategory === cat ? "bg-slate-800 text-white dark:bg-indigo-500 shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        </div>
      ) : intents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-sm shadow-sm"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lightbulb className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">수집된 의도가 없습니다</h3>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            AI 어시스턴트와 대화를 시작하면 숨겨진 의도를 자동으로 파악하고 수집합니다.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence>
            {intents.map((intent) => (
              <motion.div key={intent.id} variants={itemVariants} layoutId={intent.id}>
                <Card className="h-full border-0 bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-200/50 dark:ring-white/10 overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardHeader className="pb-4 pt-6 px-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 border-0 pointer-events-none px-2.5 py-1 rounded-lg">
                          {intent.category}
                        </Badge>
                        {intent.subcategory && (
                          <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium px-2 py-1 rounded-lg">
                            {intent.subcategory}
                          </Badge>
                        )}
                      </div>
                      <StatusIcon status={intent.status} />
                    </div>
                    <CardTitle className="text-[17px] font-bold leading-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {intent.keyword}
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 text-sm leading-relaxed">
                      {intent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 px-6 pb-6">
                    <div className="flex items-center justify-between text-[13px] font-medium mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>신뢰도 {Math.round(intent.confidence * 100)}%</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500">
                        {new Date(intent.createdAt).toLocaleDateString("ko-KR", { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold">활성</span>
        </div>
      );
    case "matched":
      return (
        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold">매칭성공</span>
        </div>
      );
    case "expired":
      return (
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          <XCircle className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold">만료됨</span>
        </div>
      );
    default:
      return null;
  }
}
