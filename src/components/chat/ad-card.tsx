"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, CheckCircle } from "lucide-react";
import type { RecommendedSite } from "@/types";

interface AdCardProps {
  site: RecommendedSite;
  visited: boolean;
  onVisit: (site: RecommendedSite) => void;
}

export function AdCard({ site, visited, onVisit }: AdCardProps) {
  return (
    <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {site.name}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            {site.reason}
          </p>
          {!visited && (
            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 mt-0.5">
              60초 체류 후 사이트를 닫고 복귀하면 포인트 지급
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant={visited ? "outline" : "default"}
          disabled={visited}
          className={
            visited
              ? "shrink-0"
              : "shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
          }
          onClick={() => onVisit(site)}
        >
          {visited ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              완료
            </>
          ) : (
            <>
              <ExternalLink className="mr-1 h-3 w-3" />
              기본소득받기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
