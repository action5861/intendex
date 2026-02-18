import { prisma } from "@/lib/prisma";

// ── 카테고리 가치 가중치 (광고 단가 기반) ──
const CATEGORY_VALUE: Record<string, number> = {
  금융: 1.0,
  부동산: 1.0,
  자동차: 0.95,
  건강: 0.85,
  교육: 0.8,
  테크: 0.75,
  여행: 0.7,
  패션: 0.6,
  쇼핑: 0.55,
  음식: 0.5,
  지역정보: 0.5,
  취미: 0.45,
  기타: 0.3,
};

// ── 검색 강도 시그널 키워드 ──
const HIGH_INTENT_SIGNALS = [
  "구매",
  "구입",
  "결제",
  "주문",
  "예약",
  "가입",
  "신청",
  "견적",
  "비교",
  "추천",
  "최저가",
  "할인",
  "쿠폰",
];
const MID_INTENT_SIGNALS = [
  "알아보",
  "찾아보",
  "고민",
  "후기",
  "리뷰",
  "평점",
  "스펙",
  "장단점",
];

// ── 타입 ──
interface IntentData {
  category: string;
  keyword: string;
  subcategory: string | null;
  description: string;
  confidence: number;
  isCommercial: boolean;
  pointValue: number;
}

interface CampaignData {
  id: string;
  category: string;
  keywords: string[];
  url: string | null;
  siteName: string | null;
  budget: number;
  spent: number;
  costPerMatch: number;
}

// ── Scorer ──
export class SemanticScorer {
  /**
   * 최종 점수 = W1·categoryValue + W2·searchIntensity + W3·siteReliability + W4·keywordRelevance
   * 가중치: 카테고리(0.25) + 검색강도(0.25) + 사이트신뢰도(0.20) + 키워드관련성(0.30)
   */
  static score(intent: IntentData, campaign: CampaignData): number {
    const W1 = 0.25;
    const W2 = 0.25;
    const W3 = 0.20;
    const W4 = 0.30;

    const categoryValue = this.scoreCategoryValue(intent, campaign);
    const searchIntensity = this.scoreSearchIntensity(intent);
    const siteReliability = this.scoreSiteReliability(campaign);
    const keywordRelevance = this.scoreKeywordRelevance(intent, campaign);

    return Math.min(
      1,
      W1 * categoryValue +
        W2 * searchIntensity +
        W3 * siteReliability +
        W4 * keywordRelevance
    );
  }

  /** 카테고리 가치: 같은 카테고리면 가치 가중치 반환, 다르면 0 */
  private static scoreCategoryValue(
    intent: IntentData,
    campaign: CampaignData
  ): number {
    if (intent.category !== campaign.category) return 0;
    return CATEGORY_VALUE[intent.category] ?? 0.3;
  }

  /** 검색 강도: 의도 텍스트에 구매/비교/추천 등 시그널이 있으면 가산 */
  private static scoreSearchIntensity(intent: IntentData): number {
    const text = `${intent.keyword} ${intent.description}`.toLowerCase();

    // 비상업적 의도는 강도 0
    if (!intent.isCommercial) return 0;

    let score = 0;

    // confidence 자체가 AI가 판단한 의도 확실성
    score += intent.confidence * 0.4;

    // 고강도 시그널
    if (HIGH_INTENT_SIGNALS.some((s) => text.includes(s))) {
      score += 0.4;
    }
    // 중강도 시그널
    else if (MID_INTENT_SIGNALS.some((s) => text.includes(s))) {
      score += 0.2;
    }

    // pointValue가 높으면 AI가 고가치로 판단한 것 → 가산
    score += (intent.pointValue / 1000) * 0.2;

    return Math.min(1, score);
  }

  /** 사이트 신뢰도: 캠페인 잔여 예산 비율 + URL 보유 여부 + siteName 보유 여부 */
  private static scoreSiteReliability(campaign: CampaignData): number {
    let score = 0;

    // 잔여 예산 비율 (예산 여유가 많을수록 신뢰)
    const budgetRatio = Math.max(
      0,
      (campaign.budget - campaign.spent) / campaign.budget
    );
    score += budgetRatio * 0.5;

    // URL 보유 → 실제 랜딩 페이지가 있음
    if (campaign.url) score += 0.3;

    // siteName 보유 → 브랜드 정보 있음
    if (campaign.siteName) score += 0.2;

    return Math.min(1, score);
  }

  /** 키워드 관련성: 정확 일치 > 부분 포함 > 토큰 겹침 */
  private static scoreKeywordRelevance(
    intent: IntentData,
    campaign: CampaignData
  ): number {
    const intentTokens = this.tokenize(intent.keyword);
    const subTokens = intent.subcategory
      ? this.tokenize(intent.subcategory)
      : [];
    const allIntentTokens = [...intentTokens, ...subTokens];
    const campaignTokens = campaign.keywords.flatMap((k) => this.tokenize(k));

    if (campaignTokens.length === 0 || allIntentTokens.length === 0) return 0;

    // 1) 정확 일치 (intent keyword가 campaign keyword에 그대로 포함)
    const intentKwLower = intent.keyword.toLowerCase();
    const exactMatch = campaign.keywords.some((ck) => {
      const ckLower = ck.toLowerCase();
      return ckLower === intentKwLower || ckLower.includes(intentKwLower) || intentKwLower.includes(ckLower);
    });
    if (exactMatch) return 1.0;

    // 2) 토큰 Jaccard 유사도
    const intentSet = new Set(allIntentTokens);
    const campaignSet = new Set(campaignTokens);
    const intersection = [...intentSet].filter((t) => campaignSet.has(t));
    const union = new Set([...intentSet, ...campaignSet]);
    const jaccard = intersection.length / union.size;

    // 3) 토큰 부분 포함 (한국어 조사/어미 때문에 부분 일치 필요)
    let partialHits = 0;
    for (const it of allIntentTokens) {
      if (it.length < 2) continue;
      for (const ct of campaignTokens) {
        if (ct.length < 2) continue;
        if (ct.includes(it) || it.includes(ct)) {
          partialHits++;
          break;
        }
      }
    }
    const partialRatio =
      allIntentTokens.length > 0 ? partialHits / allIntentTokens.length : 0;

    // Jaccard(0.6 가중) + 부분 매칭(0.4 가중)
    return Math.min(1, jaccard * 0.6 + partialRatio * 0.4);
  }

  /** 한국어 + 영어 토크나이저 (공백/특수문자 분리, 2자 이상) */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s,./·\-_()]+/)
      .filter((t) => t.length >= 2);
  }
}

// ── MatchingService ──
export class MatchingService {
  static async matchIntentToCampaigns(intentId: string) {
    const intent = await prisma.intent.findUnique({
      where: { id: intentId },
    });

    if (!intent || intent.status !== "active") return [];

    // 비상업적 의도는 매칭 스킵
    if (!intent.isCommercial) return [];

    // 활성 캠페인 조회 (카테고리 OR 키워드 매칭)
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: "active",
        endDate: { gte: new Date() },
        OR: [
          { category: intent.category },
          { keywords: { hasSome: [intent.keyword, intent.category] } },
        ],
      },
    });

    const scored: { campaign: CampaignData; score: number }[] = [];

    for (const campaign of campaigns) {
      if (campaign.spent >= campaign.budget) continue;

      // 이미 매칭된 건 스킵
      const existing = await prisma.match.findUnique({
        where: {
          intentId_campaignId: {
            intentId: intent.id,
            campaignId: campaign.id,
          },
        },
      });
      if (existing) continue;

      const score = SemanticScorer.score(intent, campaign);
      if (score >= 0.4) {
        scored.push({ campaign, score });
      }
    }

    // 점수 내림차순 정렬
    scored.sort((a, b) => b.score - a.score);

    const matches = [];
    for (const { campaign, score } of scored) {
      // 보상 = costPerMatch × score (고품질 매칭일수록 보상 증가)
      const reward = Math.round(campaign.costPerMatch * score);

      const match = await prisma.match.create({
        data: {
          intentId: intent.id,
          campaignId: campaign.id,
          score,
          reward,
        },
      });
      matches.push(match);
    }

    if (matches.length > 0) {
      await prisma.intent.update({
        where: { id: intentId },
        data: { status: "matched" },
      });
    }

    return matches;
  }

  static async runMatchingForUser(userId: string) {
    const activeIntents = await prisma.intent.findMany({
      where: { userId, status: "active", isCommercial: true },
    });

    const allMatches = [];
    for (const intent of activeIntents) {
      const matches = await this.matchIntentToCampaigns(intent.id);
      allMatches.push(...matches);
    }

    return allMatches;
  }

  static async acceptMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { intent: true, campaign: true },
    });

    if (!match || match.intent.userId !== userId) {
      throw new Error("Match not found");
    }

    if (match.status !== "pending") {
      throw new Error("Match already processed");
    }

    // 원자적 처리: 매칭 수락 + 캠페인 지출 + 유저 포인트 + 트랜잭션
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: "accepted" },
      });

      await tx.campaign.update({
        where: { id: match.campaignId },
        data: { spent: { increment: match.reward } },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: match.reward } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "earn",
          amount: match.reward,
          balance: user.points,
          metadata: {
            source: "match_accept",
            matchId: match.id,
            campaignId: match.campaignId,
            campaignTitle: match.campaign.title,
            matchScore: match.score,
          },
        },
      });
    });

    return match;
  }

  static async rejectMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { intent: true },
    });

    if (!match || match.intent.userId !== userId) {
      throw new Error("Match not found");
    }

    return prisma.match.update({
      where: { id: matchId },
      data: { status: "rejected" },
    });
  }
}
