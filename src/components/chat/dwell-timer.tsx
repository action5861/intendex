"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const DWELL_DURATION = 60;
const PARTIAL_DWELL_MIN = 20;

interface DwellTimerProps {
  siteName: string;
  siteUrl: string;
  pointValue: number;
  windowRef: Window | null;
  onComplete: (elapsedSeconds: number) => void;
  onCancel: () => void;
}

type TimerPhase =
  | "dwelling"          // 사이트에서 체류 중 (60초 카운트)
  | "early_close"       // 20초 미만 탭 닫음 → 실패
  | "partial_complete"  // 20~59초 탭 닫음 → 부분 포인트 지급
  | "ready"             // 60초 달성, 사이트 닫으면 포인트 지급 대기
  | "completed";        // 사이트 닫고 복귀 → 전체 포인트 지급

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
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [closedAtSeconds, setClosedAtSeconds] = useState(0);
  const completedRef = useRef(false);
  const elapsedRef = useRef(0);

  const remaining = Math.max(0, DWELL_DURATION - elapsed);
  const progress = Math.min(elapsed / DWELL_DURATION, 1);

  // Intendex가 보이면(active) 정지, 숨겨지면(광고 탭에 있으면) 진행
  // 지연 초기화로 마운트 시 document.hidden 을 읽어 초기값 설정 (useEffect 내 동기 setState 제거)
  const [isPaused, setIsPaused] = useState(() => !document.hidden);

  // 화면 이탈 감지 (Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 매 초마다 탭 상태 확인 + 타이머 증가
  useEffect(() => {
    if (phase !== "dwelling" && phase !== "ready") return;

    const interval = setInterval(() => {
      const isClosed = windowRef?.closed ?? false;

      if (phase === "dwelling") {
        if (isClosed) {
          clearInterval(interval);
          const cur = elapsedRef.current;
          if (cur >= PARTIAL_DWELL_MIN) {
            // 20~59초 → 부분 포인트 지급
            const partial = Math.floor(pointValue * cur / DWELL_DURATION);
            setClosedAtSeconds(cur);
            setEarnedPoints(partial);
            setPhase("partial_complete");
          } else {
            // 20초 미만 → 실패
            setPhase("early_close");
          }
          return;
        }

        // 화면 이탈 시(다른 탭, 브라우저 최소화 등) 타이머 일시정지
        if (isPaused) {
          return;
        }

        setElapsed((prev) => {
          const next = prev + 1;
          elapsedRef.current = next;
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
  }, [phase, windowRef, isPaused]);

  // completed / partial_complete 되면 서버에 경과시간 전달 (포인트는 서버가 계산)
  useEffect(() => {
    if (phase === "completed" && !completedRef.current) {
      completedRef.current = true;
      onComplete(DWELL_DURATION);
    } else if (phase === "partial_complete" && !completedRef.current) {
      completedRef.current = true;
      onComplete(closedAtSeconds);
    }
  }, [phase, onComplete, closedAtSeconds]);

  // SVG circular progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // 20초 미만에 탭 닫음 → 실패
  if (phase === "early_close") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-72 overflow-hidden rounded-2xl border border-red-200/50 bg-gradient-to-br from-red-50/90 to-amber-50/80 dark:border-red-900/30 dark:from-red-950/80 dark:to-orange-950/40 backdrop-blur-xl shadow-lg shadow-red-500/10"
        >
          <div className="absolute top-0 right-0 p-24 bg-red-400/10 dark:bg-red-500/10 blur-[40px] rounded-full pointer-events-none -mr-12 -mt-12" />
          <div className="relative z-10 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-orange-500 text-white shadow-inner shadow-red-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-red-950 dark:text-red-100 mb-1">
                  체류 시간 부족
                </p>
                <p className="text-[13px] font-medium text-red-800/80 dark:text-red-300/80 leading-relaxed">
                  최소 20초 이상 체류해야 부분 포인트가 지급됩니다. (20초 미만은 포인트가 지급되지 않습니다)
                </p>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    onClick={onCancel}
                  >
                    확인
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 20~59초 체류 후 탭 닫음 → 부분 포인트 지급
  if (phase === "partial_complete") {
    const percentage = Math.round((earnedPoints / pointValue) * 100);
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-72 overflow-hidden rounded-2xl border border-sky-200/50 bg-gradient-to-br from-sky-50/90 to-blue-50/80 dark:border-sky-900/30 dark:from-sky-950/80 dark:to-blue-950/40 backdrop-blur-xl shadow-lg shadow-sky-500/10"
        >
          <div className="absolute top-0 right-0 p-24 bg-sky-400/10 dark:bg-sky-500/10 blur-[40px] rounded-full pointer-events-none -mr-12 -mt-12" />
          <div className="relative z-10 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-inner shadow-sky-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-sky-950 dark:text-sky-100 mb-1">
                  부분 포인트 획득!
                </p>
                <p className="text-[13px] font-medium text-sky-800/80 dark:text-sky-300/80 leading-relaxed">
                  {closedAtSeconds}초 체류로{" "}
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {earnedPoints.toLocaleString()}P
                  </span>{" "}
                  획득 ({percentage}%)
                </p>
                <p className="text-[11px] text-sky-600/60 dark:text-sky-400/60 mt-1">
                  60초 체류 시 {pointValue.toLocaleString()}P 전액 지급
                </p>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
                    onClick={onCancel}
                  >
                    확인
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 60초 달성, 탭 닫기 대기
  if (phase === "ready") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-72 overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:border-amber-800/30 dark:from-amber-950/80 dark:to-orange-950/40 backdrop-blur-xl shadow-lg shadow-amber-500/10"
        >
          <div className="absolute top-0 right-0 p-24 bg-amber-400/10 dark:bg-amber-500/10 blur-[40px] rounded-full pointer-events-none -mr-12 -mt-12" />
          <div className="relative z-10 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-inner shadow-amber-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-amber-950 dark:text-amber-100 mb-1">
                  60초 체류 완료!
                </p>
                <p className="text-[13px] font-medium text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  이제 이전 광고 탭을 닫으시면 <span className="font-bold text-amber-600 dark:text-amber-400">{pointValue.toLocaleString()}P</span>가 즉시 지급됩니다.
                </p>
                <button
                  onClick={onCancel}
                  className="mt-3 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
                >
                  포인트 포기하기
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 체류 중 (카운트다운)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-56 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 dark:border-slate-800/50 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-slate-900/5"
      >
        <div className="relative z-10 p-4 flex flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
              {siteName}
            </p>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <svg width="88" height="88" className="-rotate-90 filter drop-shadow-md">
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={!isPaused ? "#cbd5e1" : "#fbbf24"} />
                  <stop offset="100%" stopColor={!isPaused ? "#94a3b8" : "#f59e0b"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-[22px] font-black tabular-nums tracking-tighter ${!isPaused ? "text-slate-400" : "text-amber-500"}`}>
                {remaining}
              </span>
              <span className="text-[10px] font-bold text-slate-400 -mt-1 uppercase">sec</span>
            </div>
          </div>

          <div className="text-center space-y-1 mt-1 w-full bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
            {!isPaused ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                </span>
                광고 탭으로 이동하세요
              </p>
            ) : (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                광고 탭 체류 중...
              </p>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-[1.3] mt-1.5">
              {isPaused
                ? "광고 탭에 머물러야\n시간이 쌓입니다."
                : `20초 이상 체류 시 비례 포인트\n60초 완료 시 ${pointValue.toLocaleString()}P 전액 지급`}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
