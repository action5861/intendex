import { describe, it, expect } from "vitest";
import { SemanticScorer, HybridScorer } from "@/services/matching.service";

// ── 테스트 픽스처 ──────────────────────────────────────────────────────

const baseIntent = {
  category: "금융",
  keyword: "신용카드 추천",
  subcategory: "카드",
  description: "최저가 신용카드 비교하고 싶어요",
  confidence: 0.9,
  isCommercial: true,
  pointValue: 500,
};

const matchingCampaign = {
  id: "c1",
  category: "금융",
  keywords: ["신용카드", "카드추천", "금융"],
  url: "https://card.example.com",
  siteName: "카드모아",
  budget: 100_000,
  spent: 10_000,
  costPerMatch: 100,
};

const mismatchCampaign = {
  id: "c2",
  category: "여행",
  keywords: ["항공권", "호텔"],
  url: "https://travel.example.com",
  siteName: "여행사",
  budget: 50_000,
  spent: 1_000,
  costPerMatch: 50,
};

// ── SemanticScorer ─────────────────────────────────────────────────────

describe("SemanticScorer", () => {
  it("카테고리 일치 시 scoreCategoryValue가 0보다 커야 한다", () => {
    const score = SemanticScorer.score(baseIntent, matchingCampaign);
    expect(score).toBeGreaterThan(0);
  });

  it("카테고리 불일치 시 점수가 낮아야 한다 (카테고리 기여 0)", () => {
    const matchScore = SemanticScorer.score(baseIntent, matchingCampaign);
    const mismatchScore = SemanticScorer.score(baseIntent, mismatchCampaign);
    expect(matchScore).toBeGreaterThan(mismatchScore);
  });

  it("점수는 항상 0~1 범위여야 한다", () => {
    const score = SemanticScorer.score(baseIntent, matchingCampaign);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("키워드 완전 일치 시 점수가 높아야 한다", () => {
    const exactCampaign = { ...matchingCampaign, keywords: ["신용카드 추천"] };
    const score = SemanticScorer.score(baseIntent, exactCampaign);
    expect(score).toBeGreaterThan(0.5);
  });

  it("예산이 모두 소진된 캠페인은 siteReliability 점수가 낮아야 한다", () => {
    const depletedCampaign = { ...matchingCampaign, spent: 100_000 };
    const depletedScore = SemanticScorer.score(baseIntent, depletedCampaign);
    const normalScore = SemanticScorer.score(baseIntent, matchingCampaign);
    expect(depletedScore).toBeLessThan(normalScore);
  });

  it("isCommercial=false이면 searchIntensity 점수가 0이어야 한다", () => {
    const nonCommercialIntent = { ...baseIntent, isCommercial: false };
    const scoreNonCommercial = SemanticScorer.score(nonCommercialIntent, matchingCampaign);
    const scoreCommercial = SemanticScorer.score(baseIntent, matchingCampaign);
    expect(scoreNonCommercial).toBeLessThan(scoreCommercial);
  });

  it("고강도 구매 의도 키워드(구매/예약)는 중간 강도보다 점수가 높아야 한다", () => {
    const highIntent = { ...baseIntent, keyword: "카드 구매", description: "신용카드 구매 결제" };
    const midIntent = { ...baseIntent, keyword: "카드 후기", description: "신용카드 리뷰 평점" };
    const highScore = SemanticScorer.score(highIntent, matchingCampaign);
    const midScore = SemanticScorer.score(midIntent, matchingCampaign);
    expect(highScore).toBeGreaterThanOrEqual(midScore);
  });
});

// ── HybridScorer ───────────────────────────────────────────────────────

describe("HybridScorer", () => {
  it("벡터 유사도가 높을수록 최종 점수가 높아야 한다", () => {
    const lowVec = HybridScorer.score(baseIntent, matchingCampaign, 0.3);
    const highVec = HybridScorer.score(baseIntent, matchingCampaign, 0.9);
    expect(highVec).toBeGreaterThan(lowVec);
  });

  it("벡터 유사도가 -1(없음)이면 시맨틱 점수만 반환해야 한다", () => {
    const hybridScore = HybridScorer.score(baseIntent, matchingCampaign, -1);
    const semanticOnly = SemanticScorer.score(baseIntent, matchingCampaign);
    expect(hybridScore).toBeCloseTo(semanticOnly, 5);
  });

  it("벡터 유사도가 NaN이면 시맨틱 점수만 반환해야 한다", () => {
    const hybridScore = HybridScorer.score(baseIntent, matchingCampaign, NaN);
    const semanticOnly = SemanticScorer.score(baseIntent, matchingCampaign);
    expect(hybridScore).toBeCloseTo(semanticOnly, 5);
  });

  it("최종 점수는 항상 0~1 범위여야 한다", () => {
    const score = HybridScorer.score(baseIntent, matchingCampaign, 0.8);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("0.40 미만 점수를 가진 매칭은 임계값 이하여야 한다 (불일치 캠페인)", () => {
    // 완전히 다른 카테고리, 키워드도 없음 → 낮은 점수 예상
    const score = HybridScorer.score(baseIntent, mismatchCampaign, 0.1);
    expect(score).toBeLessThan(0.4);
  });
});

// ── EmbeddingService (순수 함수) ────────────────────────────────────────

describe("EmbeddingService helpers", () => {
  it("buildIntentText는 null subcategory를 무시하고 연결해야 한다", async () => {
    const { EmbeddingService } = await import("@/services/embedding.service");
    const text = EmbeddingService.buildIntentText({
      category: "금융",
      subcategory: null,
      keyword: "대출",
      description: "주택담보대출 알아보기",
    });
    expect(text).toBe("금융 대출 주택담보대출 알아보기");
    expect(text).not.toContain("null");
  });

  it("toVectorLiteral은 올바른 PostgreSQL vector 리터럴을 반환해야 한다", async () => {
    const { EmbeddingService } = await import("@/services/embedding.service");
    const result = EmbeddingService.toVectorLiteral([0.1, -0.5, 0.9]);
    expect(result).toBe("[0.1,-0.5,0.9]");
  });

  it("buildCampaignText는 키워드를 공백으로 연결해야 한다", async () => {
    const { EmbeddingService } = await import("@/services/embedding.service");
    const text = EmbeddingService.buildCampaignText({
      category: "테크",
      title: "스마트폰 캠페인",
      keywords: ["갤럭시", "아이폰"],
      description: "최신 스마트폰 비교",
    });
    expect(text).toBe("테크 스마트폰 캠페인 갤럭시 아이폰 최신 스마트폰 비교");
  });
});

// ── 비즈니스 규칙 검증 ──────────────────────────────────────────────────

describe("비즈니스 규칙", () => {
  it("금융 카테고리는 비영리보다 카테고리 가치가 높아야 한다", () => {
    const financialIntent = { ...baseIntent, category: "금융" };
    const nonprofitCampaign = {
      ...matchingCampaign,
      category: "비영리",
      keywords: ["신용카드 추천"],
    };
    const financialCampaign = {
      ...matchingCampaign,
      category: "금융",
      keywords: ["신용카드 추천"],
    };

    const financialScore = SemanticScorer.score(financialIntent, financialCampaign);
    const nonprofitIntent = { ...baseIntent, category: "비영리" };
    const nonprofitScore = SemanticScorer.score(nonprofitIntent, nonprofitCampaign);

    expect(financialScore).toBeGreaterThan(nonprofitScore);
  });

  it("캠페인에 url과 siteName이 모두 있으면 없는 것보다 점수가 높아야 한다", () => {
    const withMeta = SemanticScorer.score(baseIntent, matchingCampaign);
    const withoutMeta = SemanticScorer.score(baseIntent, {
      ...matchingCampaign,
      url: null,
      siteName: null,
    });
    expect(withMeta).toBeGreaterThan(withoutMeta);
  });
});
