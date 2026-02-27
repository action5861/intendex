import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IntentService } from "@/services/intent.service";
import { MatchingService } from "@/services/matching.service";
import { RewardService } from "@/services/reward.service";
import { checkRateLimit } from "@/lib/cache";

const DAILY_INTENT_POINT_CAP = 1000;

// 카테고리별 기본 추천 사이트 (DB 캠페인 매칭이 부족할 때 보완)
const CATEGORY_DEFAULT_SITES: Record<string, Array<{ url: string; name: string; reason: string }>> = {
  여행: [
    { url: "https://flights.google.com", name: "Google Flights", reason: "실시간 항공권 최저가 비교" },
    { url: "https://tour.interpark.com", name: "인터파크 투어", reason: "여행 패키지 특가 예약" },
    { url: "https://www.hanatour.com", name: "하나투어", reason: "국내외 패키지 여행 예약" },
  ],
  건강: [
    { url: "https://www.oliveyoung.co.kr", name: "올리브영", reason: "건강·뷰티 제품 원스톱 쇼핑" },
    { url: "https://www.coupang.com", name: "쿠팡 건강", reason: "건강보조식품 로켓배송" },
    { url: "https://health.chosun.com", name: "조선일보 건강", reason: "전문 건강 정보 및 제품 추천" },
  ],
  테크: [
    { url: "https://www.danawa.com", name: "다나와", reason: "IT 제품 실시간 최저가 비교" },
    { url: "https://www.coupang.com", name: "쿠팡 IT·가전", reason: "로켓배송 가능한 노트북 모음" },
    { url: "https://shopping.naver.com", name: "네이버쇼핑", reason: "다양한 브랜드 노트북 가격 비교" },
  ],
  쇼핑: [
    { url: "https://www.coupang.com", name: "쿠팡", reason: "다양한 상품 로켓배송" },
    { url: "https://shopping.naver.com", name: "네이버쇼핑", reason: "최저가 비교 및 구매" },
    { url: "https://www.gmarket.co.kr", name: "G마켓", reason: "슈퍼딜 특가 쇼핑" },
  ],
  금융: [
    { url: "https://www.banksalad.com", name: "뱅크샐러드", reason: "금융 상품 맞춤 비교" },
    { url: "https://www.finda.co.kr", name: "핀다", reason: "대출 상품 금리 비교" },
    { url: "https://www.moneyme.co.kr", name: "머니미", reason: "개인 재무 관리 서비스" },
  ],
  교육: [
    { url: "https://www.classu.co.kr", name: "클래스유", reason: "온라인 강의 구독 서비스" },
    { url: "https://www.udemy.com", name: "유데미", reason: "글로벌 온라인 강의 플랫폼" },
    { url: "https://fastcampus.co.kr", name: "패스트캠퍼스", reason: "실무 중심 온라인 교육" },
  ],
  기타: [
    { url: "https://www.coupang.com", name: "쿠팡", reason: "다양한 상품 쇼핑" },
    { url: "https://shopping.naver.com", name: "네이버쇼핑", reason: "상품 검색 및 비교" },
    { url: "https://www.gmarket.co.kr", name: "G마켓", reason: "특가 쇼핑몰" },
  ],
};

// 카테고리별 응답 메시지
const CATEGORY_MESSAGES: Record<string, string> = {
  여행: "여행 계획을 세우고 계시는군요! 번거로운 과정 없이 바로 맞춤 여행 서비스를 찾아드렸습니다. 아래 사이트에서 최저가 항공권과 패키지를 확인해 보세요.",
  건강: "건강 관리에 관심이 있으시군요! 바로 맞춤 건강·헬스 서비스를 찾아드렸습니다. 아래 사이트에서 관심 있는 제품을 확인해 보세요.",
  테크: "IT 기기 구매를 알아보고 계시는군요! 바로 최적의 가격 비교 사이트를 찾아드렸습니다. 아래 사이트에서 가성비 좋은 제품을 확인해 보세요.",
};

function getCategoryMessage(category: string): string {
  return (
    CATEGORY_MESSAGES[category] ??
    `**${category}** 분야에 관심이 있으시군요! 번거로운 과정 없이 바로 맞춤 서비스를 찾아드렸습니다.`
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 레이트 리밋 (일반 채팅과 동일 버킷)
  const rl = await checkRateLimit(`chat:${session.user.id}`, 60, 10);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "rate_limit_exceeded" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.resetIn),
        },
      }
    );
  }

  const { text, category, keyword, pointValue, siteUrl, siteName } = await req.json();

  if (!text || !category || !keyword) {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 일일 캡 확인
  const dailyStats = await RewardService.getDailyIntentStats(session.user.id);
  if (dailyStats.totalPoints >= DAILY_INTENT_POINT_CAP) {
    return new Response(
      JSON.stringify({ error: "daily_cap_reached" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const remainingPoints = DAILY_INTENT_POINT_CAP - dailyStats.totalPoints;
  const effectivePointValue = Math.min(pointValue ?? 500, remainingPoints);

  // 활성 캠페인 중 카테고리·키워드 매칭
  const now = new Date();
  const allCampaigns = await prisma.campaign.findMany({
    where: {
      status: "active",
      url: { not: null },
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  const queryLower = `${keyword} ${text}`.toLowerCase();
  const matchedCampaigns = allCampaigns
    .filter((c) => c.spent < c.budget)
    .filter(
      (c) =>
        c.category === category ||
        c.keywords.some(
          (kw) =>
            queryLower.includes(kw.toLowerCase()) ||
            kw.toLowerCase().includes(keyword.toLowerCase())
        )
    )
    .slice(0, 3);

  // recommendedSites 구성: 안내문 지정 사이트 → DB 캠페인 → 카테고리 기본값 순
  const recommendedSites: Array<{ url: string; name: string; reason: string }> = [];

  // 1순위: 안내문에 직접 지정된 광고주 사이트
  if (siteUrl) {
    recommendedSites.push({
      url: siteUrl,
      name: siteName || siteUrl,
      reason: `${keyword} 관련 추천 광고주 사이트`,
    });
  }

  // 2순위: DB 캠페인 매칭 (중복 URL 제외)
  const existingUrls = new Set(recommendedSites.map((s) => s.url));
  for (const c of matchedCampaigns) {
    if (recommendedSites.length >= 3) break;
    if (!existingUrls.has(c.url!)) {
      recommendedSites.push({ url: c.url!, name: c.siteName || c.title, reason: c.description });
      existingUrls.add(c.url!);
    }
  }

  // 3순위: 카테고리 기본값으로 보완
  if (recommendedSites.length < 3) {
    const defaults = CATEGORY_DEFAULT_SITES[category] ?? CATEGORY_DEFAULT_SITES["기타"];
    for (const def of defaults) {
      if (recommendedSites.length >= 3) break;
      if (!existingUrls.has(def.url)) {
        recommendedSites.push(def);
        existingUrls.add(def.url);
      }
    }
  }

  // 대화 + 메시지 DB 저장
  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: text.slice(0, 50),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: text,
    },
  });

  // 인텐트 저장
  const intentData = {
    category,
    keyword,
    description: `${keyword} 관련 ${category} 탐색`,
    confidence: 0.95,
    isCommercial: true,
    pointValue: effectivePointValue,
    recommendedSites,
  };

  const created = await IntentService.saveExtractedIntents(
    session.user.id,
    conversation.id,
    [intentData]
  );

  // 백그라운드 캠페인 매칭
  if (created.length > 0) {
    Promise.allSettled(
      created.map((intent) => MatchingService.matchIntentToCampaigns(intent.id))
    ).catch(() => {});
  }

  // 어시스턴트 응답 텍스트 구성 (intents JSON 블록 포함)
  const intentsPayload = {
    intents: [intentData],
  };

  const assistantText =
    getCategoryMessage(category) +
    "\n\n```intents\n" +
    JSON.stringify(intentsPayload, null, 2) +
    "\n```";

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: assistantText,
    },
  });

  return Response.json({ assistantText });
}
