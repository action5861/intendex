"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INTENT_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : prev.length < 5
          ? [...prev, category]
          : prev
    );
  };

  const handleComplete = () => {
    router.push("/chat");
  };

  return (
    <Card className="w-full max-w-lg mx-4">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">관심 분야를 선택하세요</CardTitle>
        <CardDescription>
          최대 5개까지 선택할 수 있어요. AI가 더 나은 대화를 제공합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center">
          {INTENT_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <Badge
                key={category}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-sm px-4 py-2 transition-all",
                  isSelected && "ring-2 ring-primary/20"
                )}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {selectedCategories.length}/5 선택됨
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => router.push("/chat")}
          >
            건너뛰기
          </Button>
          <Button
            className="flex-1"
            disabled={selectedCategories.length === 0}
            onClick={handleComplete}
          >
            시작하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
