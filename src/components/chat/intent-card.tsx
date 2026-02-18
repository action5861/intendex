"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Coins } from "lucide-react";
import type { ExtractedIntent } from "@/types";

export function IntentCard({ intent }: { intent: ExtractedIntent }) {
  const confidencePercent = Math.round(intent.confidence * 100);
  const isCommercial = intent.isCommercial !== false;
  const pointValue = intent.pointValue ?? 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3 py-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {intent.category}
            </Badge>
            {intent.subcategory && (
              <Badge variant="outline" className="text-xs">
                {intent.subcategory}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              신뢰도 {confidencePercent}%
            </span>
            {isCommercial && pointValue > 0 ? (
              <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs">
                <Coins className="mr-1 h-3 w-3" />
                체류 시 +{pointValue}P
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                0P
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm font-medium">{intent.keyword}</p>
          <p className="text-xs text-muted-foreground">{intent.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
