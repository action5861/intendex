"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Plus, Coins, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { IntentCard } from "./intent-card";
import { AdCard } from "./ad-card";
import { DwellTimer } from "./dwell-timer";
import type { ExtractedIntent, RecommendedSite } from "@/types";

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
  const match = content.match(/```intents\n([\s\S]*?)\n```/);
  if (!match) return { cleanContent: content, intents: [] };

  try {
    const parsed = JSON.parse(match[1]);
    const cleanContent = content.replace(/```intents\n[\s\S]*?\n```/, "").trim();
    return { cleanContent, intents: parsed.intents || [] };
  } catch {
    return { cleanContent: content, intents: [] };
  }
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
  timerStateRef.current = timerState;
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);

  const { messages, sendMessage, setMessages, status } = useChat({
    messages: [INITIAL_MESSAGE],
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-sm font-medium">AI 채팅</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          disabled={messages.length <= 1}
        >
          <Plus className="mr-1 h-4 w-4" />
          새 대화
        </Button>
      </div>
      {dailyStatus && (
        <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            <span>잔액: <span className="font-medium text-foreground">{dailyStatus.balance.toLocaleString()}P</span></span>
          </div>
          <div className="h-3 w-px bg-border" />
          <span>오늘 적립: <span className="font-medium text-foreground">{dailyStatus.usedPoints.toLocaleString()}P / {dailyStatus.maxPoints.toLocaleString()}P</span></span>
        </div>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((message) => {
            const text = getMessageText(message);
            const { cleanContent, intents } =
              message.role === "assistant"
                ? parseIntentsFromText(text)
                : { cleanContent: text, intents: [] };

            return (
              <div key={message.id}>
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback>
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{cleanContent}</p>
                    </div>
                    {intents.length > 0 && (
                      <div className="space-y-2 ml-0">
                        {intents.map((intent, i) => (
                          <div key={i} className="space-y-2">
                            <IntentCard intent={intent} />
                            {intent.isCommercial !== false && intent.recommendedSites?.map((site, j) => (
                              <AdCard
                                key={j}
                                site={site}
                                visited={visitedSites.has(site.url)}
                                onVisit={(s) => handleVisitSite(s, intent.pointValue ?? 0)}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {message.id === "welcome" && messages.length === 1 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {[
                      "요즘 해외여행 가고 싶어",
                      "건강 관리 방법 알려줘",
                      "새 노트북 추천해줘",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput("");
                          sendMessage({ text: suggestion });
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="mx-auto max-w-2xl">
          {dailyStatus && dailyStatus.remainingPoints <= 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40">
              <CalendarClock className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  오늘 기본소득 한도({dailyStatus.maxPoints.toLocaleString()}P)를 모두 사용하셨어요!
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  내일 자정 이후에 다시 채팅하시면 기본소득을 적립하실 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                placeholder="메시지를 입력하세요..."
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!input.trim() || isLoading}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
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
          windowRef={windowRef.current}
          onComplete={handleTimerComplete}
          onCancel={handleTimerCancel}
        />
      )}
    </div>
  );
}
