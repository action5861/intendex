"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { INTENT_CATEGORIES } from "@/types";

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

  const fetchIntents = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (activeStatus !== "all") params.set("status", activeStatus);

    const res = await fetch(`/api/intents?${params}`);
    const data = await res.json();
    setIntents(data.intents || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntents();
  }, [activeCategory, activeStatus]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Tabs value={activeStatus} onValueChange={setActiveStatus}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="active">활성</TabsTrigger>
            <TabsTrigger value="matched">매칭됨</TabsTrigger>
            <TabsTrigger value="expired">만료</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory("all")}
        >
          전체
        </Badge>
        {INTENT_CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Intent List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : intents.length === 0 ? (
        <div className="text-center py-20">
          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium">수집된 의도가 없습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">
            AI와 대화를 시작하면 의도가 자동으로 수집됩니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {intents.map((intent) => (
            <Card key={intent.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{intent.category}</Badge>
                    {intent.subcategory && (
                      <Badge variant="outline" className="text-xs">
                        {intent.subcategory}
                      </Badge>
                    )}
                  </div>
                  <StatusIcon status={intent.status} />
                </div>
                <CardTitle className="text-base mt-2">
                  {intent.keyword}
                </CardTitle>
                <CardDescription>{intent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    신뢰도 {Math.round(intent.confidence * 100)}%
                  </span>
                  <span>
                    {new Date(intent.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "matched":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "expired":
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}
