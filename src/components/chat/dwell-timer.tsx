"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const DWELL_DURATION = 60;

interface DwellTimerProps {
  siteName: string;
  siteUrl: string;
  pointValue: number;
  windowRef: Window | null;
  onComplete: () => void;
  onCancel: () => void;
}

type TimerPhase =
  | "dwelling"       // 사이트에서 체류 중 (60초 카운트)
  | "early_close"    // 60초 전에 탭 닫음 → 실패
  | "ready"          // 60초 달성, 사이트 닫으면 포인트 지급 대기
  | "completed";     // 사이트 닫고 복귀 → 포인트 지급

export function DwellTimer({
  siteName,
  siteUrl,
  pointValue,
  windowRef,
  onComplete,
  onCancel,
}: DwellTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>("dwelling");
  const completedRef = useRef(false);

  const remaining = Math.max(0, DWELL_DURATION - elapsed);
  const progress = Math.min(elapsed / DWELL_DURATION, 1);

  // 매 초마다 탭 상태 확인 + 타이머 증가
  useEffect(() => {
    if (phase !== "dwelling" && phase !== "ready") return;

    const interval = setInterval(() => {
      const isClosed = windowRef?.closed ?? false;

      if (phase === "dwelling") {
        if (isClosed) {
          // 60초 전에 탭 닫음 → 실패
          clearInterval(interval);
          setPhase("early_close");
          return;
        }

        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= DWELL_DURATION) {
            // 60초 달성 → ready 상태로 전환
            setPhase("ready");
            return DWELL_DURATION;
          }
          return next;
        });
      }

      if (phase === "ready" && isClosed) {
        // 60초 달성 후 탭 닫음 → 포인트 지급
        clearInterval(interval);
        setPhase("completed");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, windowRef]);

  // completed 되면 포인트 지급
  useEffect(() => {
    if (phase === "completed" && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [phase, onComplete]);

  // SVG circular progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // 60초 전에 탭 닫음 → 실패
  if (phase === "early_close") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-72 border-red-200 bg-red-50 shadow-lg dark:border-red-800 dark:bg-red-950/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  체류 시간 부족
                </p>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                  {remaining}초 더 머물러야 했어요. 사이트에서 60초 이상 체류한 후 닫아야 포인트가 지급됩니다.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs"
                  onClick={onCancel}
                >
                  확인
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 60초 달성, 탭 닫기 대기
  if (phase === "ready") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-72 border-emerald-200 bg-emerald-50 shadow-lg dark:border-emerald-800 dark:bg-emerald-950/80">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  60초 체류 완료!
                </p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                  이제 사이트 탭을 닫고 돌아오시면 <span className="font-bold">{pointValue.toLocaleString()}P</span>가 지급됩니다.
                </p>
                <button
                  onClick={onCancel}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                >
                  포인트 포기하기
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 체류 중 (카운트다운)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-56 border-emerald-200 bg-white shadow-lg dark:border-emerald-800 dark:bg-gray-900">
        <CardContent className="flex flex-col items-center gap-3 p-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground truncate max-w-[140px]">
              {siteName}
            </p>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <svg width="88" height="88" className="-rotate-90">
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/20"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-emerald-500 transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-lg font-bold tabular-nums">
              {remaining}s
            </span>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              사이트에 체류 중...
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              60초 체류 후 사이트를 닫으면 {pointValue.toLocaleString()}P 지급
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
