"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Coins, Target } from "lucide-react";
import type { ExtractedIntent } from "@/types";

export function IntentCard({ intent }: { intent: ExtractedIntent }) {
  const confidencePercent = Math.round(intent.confidence * 100);
  const isCommercial = intent.isCommercial !== false;
  const pointValue = intent.pointValue ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 to-white/50 dark:border-indigo-500/20 dark:from-indigo-950/20 dark:to-slate-900/40 backdrop-blur-xl shadow-sm"
    >
      <div className="absolute top-0 right-0 p-24 bg-indigo-400/10 dark:bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none -mr-12 -mt-12" />

      <div className="relative z-10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-inner shadow-indigo-500/20">
            <Target className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 border-0">
                {intent.category}
              </Badge>
              {intent.subcategory && (
                <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-400">
                  {intent.subcategory}
                </Badge>
              )}
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                신뢰도 {confidencePercent}%
              </span>

              {isCommercial && pointValue > 0 ? (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 border-0 text-xs ml-auto">
                  <Coins className="mr-1 h-3 w-3" />
                  체류 시 +{pointValue}P
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-slate-400 dark:text-slate-500 dark:border-slate-700 ml-auto">
                  0P
                </Badge>
              )}
            </div>

            <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mt-1 mb-0.5">
              {intent.keyword}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {intent.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
