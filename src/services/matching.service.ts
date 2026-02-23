import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { EmbeddingService } from "./embedding.service";
import { invalidateCache, CacheKeys } from "@/lib/cache";
import pLimit from "p-limit";

// ── 상수 ─────────────────────────────────────────────────────────────
const VECTOR_TOP_N = 50;          // DB 단 1차 필터링: 코사인 유사도 상위 N개
const HYBRID_MIN_SCORE = 0.4;     // 최종 하이브리드 점수 최소 임계값
const VECTOR_WEIGHT = 0.40;       // α: 벡터 유사도 가중치
const SEMANTIC_WEIGHT = 0.60;     // β: 비즈니스 시맨틱 가중치

// ── 카테고리 가치 가중치 (광고 단가 기반) ────────────────────────────
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
  비영리: 0.4,
  취미: 0.45,
  기타: 0.3,
};

// ── 검색 강도 시그널 키워드 ──────────────────────────────────────────
const HIGH_INTENT_SIGNALS = [
  "구매", "구입", "결제", "주문", "예약",
  "가입", "신청", "견적", "비교", "추천",
  "최저가", "할인", "쿠폰",
];
const MID_INTENT_SIGNALS = [
  "알아보", "찾아보", "고민", "후기",
  "리뷰", "평점", "스펙", "장단점",
];

// ── 타입 ─────────────────────────────────────────────────────────────
interface IntentData {
  category: string;
  keyword: string;
  subcategory: string | null;
  description: string;
  confidence: number;
  isCommercial: boolean;
  pointValue: number;
}

/** $queryRaw로 Intent + 임베딩을 단일 왕복 조회할 때의 행 타입 */
interface IntentRow extends IntentData {
  id: string;
  status: string;
  embedding: string | null; // embedding::text → "[v1,v2,...]"
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

/** $queryRaw 결과 행 타입 */
interface VectorCandidateRow extends CampaignData {
  vector_similarity: number; // pgvector 코사인 유사도 (0~1); -1이면 폴백 캠페인
  title?: string;
}

// ── SemanticScorer ───────────────────────────────────────────────────
/**
 * 비즈니스 시그널 기반 점수 계산기.
 * 카테고리 가치(0.25) + 검색 강도(0.25) + 사이트 신뢰도(0.20) + 키워드 관련성(0.30)
 */
export class SemanticScorer {
  static score(intent: IntentData, campaign: CampaignData): number {
    const W1 = 0.25, W2 = 0.25, W3 = 0.20, W4 = 0.30;

    return Math.min(
      1,
      W1 * this.scoreCategoryValue(intent, campaign) +
      W2 * this.scoreSearchIntensity(intent) +
      W3 * this.scoreSiteReliability(campaign) +
      W4 * this.scoreKeywordRelevance(intent, campaign)
    );
  }

  private static scoreCategoryValue(intent: IntentData, campaign: CampaignData): number {
    if (intent.category !== campaign.category) return 0;
    return CATEGORY_VALUE[intent.category] ?? 0.3;
  }

  private static scoreSearchIntensity(intent: IntentData): number {
    if (!intent.isCommercial) return 0;
    const text = `${intent.keyword} ${intent.description}`.toLowerCase();
    let score = intent.confidence * 0.4;
    if (HIGH_INTENT_SIGNALS.some((s) => text.includes(s))) score += 0.4;
    else if (MID_INTENT_SIGNALS.some((s) => text.includes(s))) score += 0.2;
    score += (intent.pointValue / 1_000) * 0.2;
    return Math.min(1, score);
  }

  private static scoreSiteReliability(campaign: CampaignData): number {
    const budgetRatio = Math.max(0, (campaign.budget - campaign.spent) / campaign.budget);
    let score = budgetRatio * 0.5;
    if (campaign.url) score += 0.3;
    if (campaign.siteName) score += 0.2;
    return Math.min(1, score);
  }

  private static scoreKeywordRelevance(intent: IntentData, campaign: CampaignData): number {
    const intentTokens = this.tokenize(intent.keyword);
    const subTokens = intent.subcategory ? this.tokenize(intent.subcategory) : [];
    const allIntentTokens = [...intentTokens, ...subTokens];
    const campaignTokens = campaign.keywords.flatMap((k) => this.tokenize(k));

    if (campaignTokens.length === 0 || allIntentTokens.length === 0) return 0;

    const intentKwLower = intent.keyword.toLowerCase();
    const exactMatch = campaign.keywords.some((ck) => {
      const ckLower = ck.toLowerCase();
      return ckLower === intentKwLower || ckLower.includes(intentKwLower) || intentKwLower.includes(ckLower);
    });
    if (exactMatch) return 1.0;

    const intentSet = new Set(allIntentTokens);
    const campaignSet = new Set(campaignTokens);
    const intersection = [...intentSet].filter((t) => campaignSet.has(t));
    const union = new Set([...intentSet, ...campaignSet]);
    const jaccard = intersection.length / union.size;

    let partialHits = 0;
    for (const it of allIntentTokens) {
      if (it.length < 2) continue;
      if (campaignTokens.some((ct) => ct.length >= 2 && (ct.includes(it) || it.includes(ct)))) {
        partialHits++;
      }
    }
    const partialRatio = allIntentTokens.length > 0 ? partialHits / allIntentTokens.length : 0;

    return Math.min(1, jaccard * 0.6 + partialRatio * 0.4);
  }

  private static tokenize(text: string): string[] {
    const JOSA = /(을|를|이|가|은|는|의|에|에서|으로|로|과|와|도|만|부터|까지|한테|께)$/;
    return text
      .toLowerCase()
      .split(/[\s,./·\-_()\[\]]+/)
      .map((t) => t.replace(JOSA, ""))
      .filter((t) => t.length >= 2);
  }
}

// ── HybridScorer ─────────────────────────────────────────────────────
/**
 * 벡터 유사도(α) + 비즈니스 시맨틱(β) 혼합 점수 계산기.
 *
 * 설계 의도:
 *  - 벡터(0.40): 의미적 유사성 → 같은 범주의 캠페인을 넓게 포착
 *  - 시맨틱(0.60): 카테고리 단가·구매 의도·키워드 정확도 등 광고 품질 신호
 *    → 실제 광고 가치를 더 직접적으로 반영하므로 가중치를 높게 설정
 *
 * vectorSimilarity = 1 - cosine_distance  (pgvector의 <=> 연산자 결과를 변환)
 */
export class HybridScorer {
  static score(
    intent: IntentData,
    campaign: CampaignData,
    vectorSimilarity: number
  ): number {
    const semanticScore = SemanticScorer.score(intent, campaign);

    // 벡터 유사도가 없거나 NaN이면 시맨틱 점수만 사용 (Graceful Degradation)
    if (!Number.isFinite(vectorSimilarity) || vectorSimilarity < 0) {
      return semanticScore;
    }

    return Math.min(
      1,
      VECTOR_WEIGHT * vectorSimilarity + SEMANTIC_WEIGHT * semanticScore
    );
  }
}

// ── MatchingService ───────────────────────────────────────────────────
export class MatchingService {
  /**
   * 핵심 매칭 파이프라인:
   *  1. Intent 임베딩 생성 (DB에 없으면 실시간 생성 후 저장)
   *  2. $queryRaw로 DB 단 코사인 유사도 Top-N 필터링
   *  3. 배치 중복 매칭 체크 (N+1 제거)
   *  4. HybridScorer로 최종 점수 계산
   *  5. Match 레코드 일괄 생성
   */
  static async matchIntentToCampaigns(intentId: string) {
    // ── Step 1: Intent + 임베딩 단일 쿼리 (왕복 2→1 절감) ──────────
    const rows = await prisma.$queryRaw<IntentRow[]>(Prisma.sql`
      SELECT
        id, category, subcategory, keyword, description,
        confidence, "isCommercial", "pointValue", status,
        embedding::text AS embedding
      FROM "Intent"
      WHERE id = ${intentId}
    `);

    const intent = rows[0];
    if (!intent || intent.status !== "active" || !intent.isCommercial) return [];

    const intentEmbedding = await this.resolveEmbedding(intentId, intent);

    // ── Step 2: DB 단 벡터 유사도 1차 필터링 ──────────────────────
    // pgvector의 <=> 연산자는 코사인 거리(0=동일, 2=반대)를 반환
    // 따라서 similarity = 1 - distance 로 변환
    // 임베딩이 없는 캠페인은 이 단계에서 제외되므로 별도 폴백 실행
    const vectorStr = EmbeddingService.toVectorLiteral(intentEmbedding);

    const [vectorCandidates, legacyCandidates] = await Promise.all([
      prisma.$queryRaw<VectorCandidateRow[]>(
        Prisma.sql`
          SELECT
            id,
            title,
            category,
            keywords,
            url,
            "siteName",
            budget,
            spent,
            "costPerMatch",
            (1 - (embedding::halfvec(3072) <=> ${vectorStr}::halfvec(3072)))::float8 AS vector_similarity
          FROM "Campaign"
          WHERE
            status    = 'active'
            AND "endDate" >= NOW()
            AND spent < budget
            AND embedding IS NOT NULL
          ORDER BY embedding::halfvec(3072) <=> ${vectorStr}::halfvec(3072)
          LIMIT ${VECTOR_TOP_N}
        `
      ),
      // 임베딩 없는 캠페인은 항상 레거시 검색으로 병렬 처리
      this.fetchLegacyCandidates(intent.category, intent.keyword),
    ]);

    // 유효한 캠페인 통합 (벡터 후보 우선, ID 기준 중복 제거)
    const vectorIds = new Set(vectorCandidates.map((c) => c.id));
    const allCandidates: VectorCandidateRow[] = [
      ...vectorCandidates,
      ...legacyCandidates
        .filter((c) => !vectorIds.has(c.id))
        .map((c) => ({ ...c, vector_similarity: -1 })), // -1: 폴백 표시
    ];

    if (allCandidates.length === 0) return [];

    // ── Step 3: 배치 중복 매칭 체크 (N+1 → 1 쿼리) ────────────────
    const candidateIds = allCandidates.map((c) => c.id);
    const existingMatches = await prisma.match.findMany({
      where: { intentId, campaignId: { in: candidateIds } },
      select: { campaignId: true },
    });
    const alreadyMatchedIds = new Set(existingMatches.map((m) => m.campaignId));

    // ── Step 4: HybridScorer 최종 점수 계산 ───────────────────────
    const scored: { campaign: VectorCandidateRow; finalScore: number }[] = [];

    for (const campaign of allCandidates) {
      if (alreadyMatchedIds.has(campaign.id)) continue;
      if (campaign.spent >= campaign.budget) continue;

      const finalScore = HybridScorer.score(intent, campaign, campaign.vector_similarity);
      if (finalScore >= HYBRID_MIN_SCORE) {
        scored.push({ campaign, finalScore });
      }
    }

    scored.sort((a, b) => b.finalScore - a.finalScore);

    // ── Step 5: Match 레코드 일괄 생성 (createMany → 단일 INSERT) ─
    if (scored.length === 0) return 0;

    await prisma.match.createMany({
      data: scored.map(({ campaign, finalScore }) => ({
        intentId: intent.id,
        campaignId: campaign.id,
        score: finalScore,
        reward: Math.round(campaign.costPerMatch * finalScore),
      })),
      skipDuplicates: true,
    });

    await prisma.intent.update({
      where: { id: intentId },
      data: { status: "matched" },
    });

    return scored.length;
  }

  /**
   * 단일 쿼리로 이미 조회된 IntentRow의 embedding 문자열을 number[]로 변환.
   * 임베딩이 없으면 생성 후 DB에 비동기 저장 (매칭 블로킹 최소화).
   */
  private static async resolveEmbedding(
    intentId: string,
    intent: IntentRow
  ): Promise<number[]> {
    if (intent.embedding) {
      // PostgreSQL vector 리터럴 "[0.1,0.2,...]" → number[]
      return intent.embedding.slice(1, -1).split(",").map(Number);
    }

    // 임베딩 생성 후 비동기 저장
    const text = EmbeddingService.buildIntentText(intent);
    const embedding = await EmbeddingService.embed(text);
    const vectorStr = EmbeddingService.toVectorLiteral(embedding);

    // fire-and-forget: 저장 실패해도 매칭 자체는 계속 진행
    prisma.$executeRaw(
      Prisma.sql`UPDATE "Intent" SET embedding = ${vectorStr}::vector WHERE id = ${intentId}`
    ).catch((err) => console.error("[MatchingService] Intent 임베딩 저장 실패:", err));

    return embedding;
  }

  /**
   * 임베딩 없는 캠페인을 위한 폴백 조회 (기존 카테고리/키워드 기반).
   * 전체 시스템이 벡터화 완료되면 이 메서드는 제거 가능.
   */
  private static async fetchLegacyCandidates(
    category: string,
    keyword: string
  ): Promise<CampaignData[]> {
    // Unsupported("vector") 타입은 Prisma ORM where절 사용 불가 → $queryRaw로 처리
    return prisma.$queryRaw<CampaignData[]>(
      Prisma.sql`
        SELECT id, category, keywords, url, "siteName", budget, spent, "costPerMatch"
        FROM "Campaign"
        WHERE
          status = 'active'
          AND "endDate" >= NOW()
          AND spent < budget
          AND embedding IS NULL
          AND (category = ${category} OR ${keyword} = ANY(keywords) OR ${category} = ANY(keywords))
        LIMIT 30
      `
    );
  }

  // ── 사용자 전체 의도 매칭 (동시성 제한 병렬 처리) ────────────────
  static async runMatchingForUser(userId: string) {
    const activeIntents = await prisma.intent.findMany({
      where: { userId, status: "active", isCommercial: true },
      select: { id: true },
    });

    const limit = pLimit(4); // DB 연결 풀 보호: 최대 4개 동시 실행
    const results = await Promise.allSettled(
      activeIntents.map((intent) => limit(() => this.matchIntentToCampaigns(intent.id)))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<number> => r.status === "fulfilled")
      .reduce((sum, r) => sum + r.value, 0);
  }

  // ── 매칭 수락 (원자적 처리) ──────────────────────────────────────
  static async acceptMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { intent: true, campaign: true },
    });

    if (!match || match.intent.userId !== userId) throw new Error("Match not found");
    if (match.status !== "pending") throw new Error("Match already processed");

    await prisma.$transaction(async (tx) => {
      await tx.match.update({ where: { id: matchId }, data: { status: "accepted" } });
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
          source: "match_accept",
          refId: match.id,
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

    await invalidateCache(CacheKeys.balance(userId));

    return match;
  }

  static async rejectMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { intent: true },
    });
    if (!match || match.intent.userId !== userId) throw new Error("Match not found");
    return prisma.match.update({ where: { id: matchId }, data: { status: "rejected" } });
  }
}
