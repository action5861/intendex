"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";

export function StayBonus() {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [granted, setGranted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const calledRef = useRef(false);

  const claimBonus = async () => {
    try {
      const res = await fetch("/api/rewards/stay-bonus", { method: "POST" });
      const data = await res.json();
      if (data.granted) {
        setGranted(true);
        toast.success("설정 체류 보너스 1,000P가 지급되었습니다!");
      } else if (data.already) {
        setHidden(true);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (granted || calledRef.current) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!calledRef.current) {
            calledRef.current = true;
            claimBonus();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [granted]);

  if (hidden) return null;

  if (granted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <Gift className="h-4 w-4" />
        체류 보너스 1,000P가 지급되었습니다!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Gift className="h-4 w-4" />
      이 페이지에 {secondsLeft}초 더 머무르면 1,000P를 받을 수 있어요!
    </div>
  );
}
