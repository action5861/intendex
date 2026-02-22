"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, CheckCircle, Sparkles } from "lucide-react";
import type { RecommendedSite } from "@/types";

interface AdCardProps {
  site: RecommendedSite;
  visited: boolean;
  onVisit: (site: RecommendedSite) => void;
}

export function AdCard({ site, visited, onVisit }: AdCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 ${visited
        ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800"
        : "bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-200/60 dark:border-amber-800/50 shadow-lg shadow-amber-500/5 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5"
        }`}
    >
      {!visited && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 dark:bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
      )}

      <div className="relative z-10 p-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ${visited
            ? "bg-slate-100 dark:bg-slate-800/80 text-slate-400"
            : "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30"
            }`}>
            {visited ? <CheckCircle className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`text-sm font-bold truncate ${visited ? "text-slate-500 dark:text-slate-400" : "text-amber-950 dark:text-amber-50"}`}>
                {site.name}
              </p>
              {!visited && <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />}
            </div>
            <p className={`text-xs mt-0.5 line-clamp-1 ${visited ? "text-slate-400 dark:text-slate-500" : "text-amber-700/80 dark:text-amber-300/80 font-medium"}`}>
              {site.reason}
            </p>
            {!visited && (
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1.5 bg-amber-100/50 dark:bg-amber-900/30 inline-block px-1.5 py-0.5 rounded-md">
                20초 이상 체류하면 비례 포인트 지급
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant={visited ? "outline" : "default"}
            disabled={visited}
            className={`shrink-0 h-9 px-4 rounded-xl font-bold transition-all ${visited
              ? "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-transparent"
              : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95"
              }`}
            onClick={() => onVisit(site)}
          >
            {visited ? (
              <>완료</>
            ) : (
              <>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                기본소득 받기
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
