import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { INTENT_CATEGORIES } from "@/types";

const analyzeSchema = z.object({
  siteName: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(INTENT_CATEGORIES as unknown as [string, ...string[]]),
  keywords: z.array(z.string()).min(3).max(10),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL을 입력해주세요" }, { status: 400 });
  }

  // Fetch site content with 5s timeout
  let siteText = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Intendex-Bot/1.0)" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      // Strip HTML tags and truncate to 3000 chars
      siteText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);
    }
  } catch {
    // Fallback: analyze from URL only
    siteText = "";
  }

  const prompt = siteText
    ? `다음은 "${url}" 사이트의 텍스트 내용입니다:\n\n${siteText}\n\n이 사이트를 분석하여 광고 캠페인 정보를 생성해주세요.`
    : `"${url}" URL만을 보고 이 사이트가 어떤 서비스인지 추론하여 광고 캠페인 정보를 생성해주세요.`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: analyzeSchema,
      prompt: `${prompt}

요구사항:
- siteName: 한국어 또는 공식 브랜드명 (예: "비핸스", "쿠팡", "네이버")
- title: 간결한 캠페인 제목 (예: "비핸스 - 크리에이티브 포트폴리오")
- description: 사이트를 한 문장으로 설명 (60자 이내)
- category: 반드시 다음 중 하나 선택 — 여행/쇼핑/건강/교육/금융/음식/패션/테크/부동산/자동차/취미/지역정보/비영리/기타
- keywords: 한국 사용자가 채팅에서 입력할 법한 한국어 검색어 3~10개 (공백 포함 구문 가능, 예: ["그래픽 디자인", "포트폴리오", "일러스트", "UI 디자인"])`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[analyze-url] generateObject 실패:", err);
    return NextResponse.json({ error: "AI 분석 중 오류가 발생했습니다" }, { status: 500 });
  }
}
