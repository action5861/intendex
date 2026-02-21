"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Plus, Coins, CalendarClock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { IntentCard } from "./intent-card";
import { AdCard } from "./ad-card";
import { DwellTimer } from "./dwell-timer";
import type { ExtractedIntent, RecommendedSite } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface DailyStatus {
  remainingPoints: number;
  maxPoints: number;
  usedPoints: number;
  balance: number;
}

function getMessageText(message: { parts: { type: string; text?: string }[] }): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function parseIntentsFromText(content: string): {
  cleanContent: string;
  intents: ExtractedIntent[];
} {
  const completeMatch = content.match(/```intents\n([\s\S]*?)\n```/);
  if (completeMatch) {
    try {
      const parsed = JSON.parse(completeMatch[1]);
      const cleanContent = content.replace(/```intents\n[\s\S]*?\n```/, "").trim();
      return { cleanContent, intents: parsed.intents || [] };
    } catch {
      const cleanContent = content.replace(/```intents\n[\s\S]*?\n```/, "").trim();
      return { cleanContent, intents: [] };
    }
  }

  const partialIdx = content.indexOf("```intents");
  if (partialIdx !== -1) {
    return { cleanContent: content.slice(0, partialIdx).trim(), intents: [] };
  }

  return { cleanContent: content, intents: [] };
}

const INITIAL_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "안녕하세요! 인텐덱스 AI입니다 😊\n오늘 어떤 것에 관심이 있으신가요? 여행, 쇼핑, 건강, 테크 등 무엇이든 편하게 이야기해 주세요!",
    },
  ],
};

interface TimerState {
  active: boolean;
  siteName: string;
  siteUrl: string;
  pointValue: number;
}

export function ChatInterface({ userId }: { userId: string }) {
  const [input, setInput] = useState("");
  const [composing, setComposing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<Window | null>(null);
  const [visitedSites, setVisitedSites] = useState<Set<string>>(new Set());
  const [timerState, setTimerState] = useState<TimerState>({
    active: false,
    siteName: "",
    siteUrl: "",
    pointValue: 0,
  });
  const timerStateRef = useRef(timerState);
  // eslint-disable-next-line react-hooks/refs
  timerStateRef.current = timerState;
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);

  const { messages, sendMessage, setMessages, status } = useChat({
    messages: [INITIAL_MESSAGE],
    onError: (error) => {
      if (error.message.includes("rate_limit_exceeded") || error.message.includes("429")) {
        toast.error("잠시 후 다시 시도해 주세요. (분당 10회 제한)");
      } else {
        toast.error("오류가 발생했습니다. 다시 시도해 주세요.");
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const fetchDailyStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/status");
      if (res.ok) {
        const data = await res.json();
        setDailyStatus(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchDailyStatus();
  }, [fetchDailyStatus]);

  useEffect(() => {
    if (status === "ready" && messages.length > 1) {
      fetchDailyStatus();
    }
  }, [status, messages.length, fetchDailyStatus]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleVisitSite = useCallback((site: RecommendedSite, pointValue: number) => {
    if (timerState.active) {
      toast.error("이미 다른 사이트 체류 중입니다.");
      return;
    }

    const opened = window.open(site.url, "_blank");
    if (!opened) {
      toast.error("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    windowRef.current = opened;
    setTimerState({
      active: true,
      siteName: site.name,
      siteUrl: site.url,
      pointValue,
    });
  }, [timerState.active]);

  const handleTimerComplete = useCallback(async () => {
    const { siteUrl, siteName, pointValue } = timerStateRef.current;
    setTimerState({ active: false, siteName: "", siteUrl: "", pointValue: 0 });

    try {
      const res = await fetch("/api/rewards/dwell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl, siteName, pointValue }),
      });

      const data = await res.json();

      if (res.ok) {
        setVisitedSites((prev) => new Set(prev).add(siteUrl));
        toast.success(`${data.points?.toLocaleString()}P 적립 완료! (총 ${data.totalPoints?.toLocaleString()}P)`);
        fetchDailyStatus();
      } else {
        toast.error(data.error || "포인트 적립에 실패했습니다.");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    }
  }, [fetchDailyStatus]);

  const handleTimerCancel = useCallback(() => {
    setTimerState({ active: false, siteName: "", siteUrl: "", pointValue: 0 });
    windowRef.current = null;
    toast.info("사이트 체류가 취소되었습니다.");
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setVisitedSites(new Set());
    setTimerState({ active: false, siteName: "", siteUrl: "", pointValue: 0 });
    windowRef.current = null;
  }, [setMessages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !composing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col relative bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 bg-white/60 dark:bg-[#0f172a]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI 어시스턴트</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          disabled={messages.length <= 1}
          className="rounded-full shadow-sm border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold h-9 px-4"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          새 대화
        </Button>
      </div>

      {dailyStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-6 border-b border-indigo-100/50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/80 via-blue-50/80 to-indigo-50/80 dark:from-indigo-950/30 dark:via-blue-900/20 dark:to-indigo-950/30 px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 backdrop-blur-sm"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <Coins className="h-3.5 w-3.5 text-indigo-500" />
            <span>나의 자산: <span className="font-bold text-slate-900 dark:text-white">{dailyStatus.balance.toLocaleString()} P</span></span>
          </div>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>오늘 적립 현황: <span className="font-bold text-slate-900 dark:text-white">{dailyStatus.usedPoints.toLocaleString()}</span> / {dailyStatus.maxPoints.toLocaleString()} P</span>
          </div>
        </motion.div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-8 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const text = getMessageText(message);
              const { cleanContent, intents } =
                message.role === "assistant"
                  ? parseIntentsFromText(text)
                  : { cleanContent: text, intents: [] };

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 250, damping: 25 }}
                >
                  <div className={`flex gap-4 max-w-[85%] ${message.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                    <Avatar className={`h-9 w-9 shrink-0 shadow-sm border-2 ${message.role === "user" ? "border-slate-200 dark:border-slate-700" : "border-blue-100 dark:border-blue-900/50"}`}>
                      <AvatarFallback className={message.role === "user" ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"}>
                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex-1 space-y-3 ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
                      <div
                        className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${message.role === "user"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-2xl rounded-tr-sm"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/50"
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{cleanContent}</p>
                      </div>

                      {intents.length > 0 && (
                        <div className="space-y-3 w-full max-w-sm">
                          {intents.map((intent, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + (i * 0.1) }}
                              className="space-y-3"
                            >
                              <div className="ring-1 ring-slate-200 dark:ring-slate-700/50 rounded-2xl overflow-hidden shadow-md">
                                <IntentCard intent={intent} />
                              </div>
                              {intent.isCommercial !== false && intent.recommendedSites?.map((site, j) => (
                                <div key={j} className="ring-1 ring-emerald-200/50 dark:ring-emerald-900/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                  <AdCard
                                    site={site}
                                    visited={visitedSites.has(site.url)}
                                    onVisit={(s) => handleVisitSite(s, intent.pointValue ?? 0)}
                                  />
                                </div>
                              ))}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {message.id === "welcome" && messages.length === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-8 flex flex-wrap gap-2.5 justify-center max-w-xl mx-auto"
                    >
                      {[
                        "✈️ 요즘 일본 여행 가고 싶은데 일주일 예산 얼마나 들까?",
                        "💪🏻 바쁜 직장인을 위한 하루 10분 건강 관리템 추천해줘",
                        "💻 100만원대 가성비 영상편집용 노트북 찾아줘",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          onClick={() => {
                            setInput("");
                            sendMessage({ text: suggestion });
                          }}
                          className="rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-medium py-5 px-5 h-auto whitespace-normal text-left"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 max-w-[85%]"
              >
                <Avatar className="h-9 w-9 shrink-0 shadow-sm border-2 border-blue-100 dark:border-blue-900/50">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 px-5 py-4 shadow-sm flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm font-medium">의도를 분석하고 답변을 작성 중입니다...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        <div className="mx-auto max-w-3xl">
          {dailyStatus && dailyStatus.remainingPoints <= 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/40 shadow-sm"
            >
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
                <CalendarClock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-amber-900 dark:text-amber-100">
                  오늘 기본소득 한도({dailyStatus.maxPoints.toLocaleString()}P)를 모두 사용하셨습니다! 🎉
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 font-medium">
                  내일 자정 이후 대화를 통해 다시 가치를 창출하실 수 있습니다.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="relative group flex items-end gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-2 shadow-inner focus-within:bg-white dark:focus-within:bg-slate-800 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                placeholder="어떤 것이든 편하게 말씀해 주시면, 소중한 데이터 자산이 됩니다..."
                className="min-h-[52px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 px-4 py-3.5 text-[15px] font-medium placeholder:text-slate-400"
                rows={1}
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!input.trim() || isLoading}
                className={`shrink-0 h-11 w-11 rounded-2xl transition-all duration-300 ${!input.trim() || isLoading ? "bg-slate-200 dark:bg-slate-800 text-slate-400" : "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 active:scale-95"}`}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {timerState.active && (
        <DwellTimer
          siteName={timerState.siteName}
          siteUrl={timerState.siteUrl}
          pointValue={timerState.pointValue}
          // @ts-ignore
          // eslint-disable-next-line react-hooks/refs
          windowRef={windowRef.current}
          onComplete={handleTimerComplete}
          onCancel={handleTimerCancel}
        />
      )}
    </div>
  );
}
