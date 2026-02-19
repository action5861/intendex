import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

// gemini-embedding-001: 3072차원 (이 API 키에서 사용 가능한 유일한 임베딩 모델)
const EMBEDDING_MODEL = google.textEmbeddingModel("gemini-embedding-001");

export class EmbeddingService {
  /**
   * 단일 텍스트 임베딩 생성
   * @throws AI SDK / network 오류를 그대로 전파 (호출자가 처리)
   */
  static async embed(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: EMBEDDING_MODEL,
      value: text.slice(0, 2_048), // 모델 토큰 한계 대비 트렁케이션
    });
    return embedding;
  }

  /**
   * 배치 임베딩 (캠페인 bulk 업데이트 시 사용)
   * AI SDK embedMany는 내부적으로 rate-limit 재시도를 처리함
   */
  static async embedBatch(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: texts.map((t) => t.slice(0, 2_048)),
    });
    return embeddings;
  }

  // ── 도메인 텍스트 빌더 ──────────────────────────────────────────────

  /**
   * Intent → 임베딩용 텍스트
   * 카테고리, 서브카테고리, 키워드, 설명을 공백으로 연결.
   * AI가 이미 구조화한 필드를 그대로 활용하므로 전처리 최소화.
   */
  static buildIntentText(intent: {
    category: string;
    subcategory?: string | null;
    keyword: string;
    description: string;
  }): string {
    return [intent.category, intent.subcategory, intent.keyword, intent.description]
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Campaign → 임베딩용 텍스트
   * 카테고리 + 제목 + 키워드 배열 + 설명 순으로 연결.
   * 키워드를 앞쪽에 배치하여 의미적 중심 역할을 강화.
   */
  static buildCampaignText(campaign: {
    category: string;
    title: string;
    keywords: string[];
    description: string;
  }): string {
    return [campaign.category, campaign.title, ...campaign.keywords, campaign.description]
      .join(" ");
  }

  /**
   * number[] 배열 → PostgreSQL vector 리터럴 문자열
   * $queryRaw 에서 Prisma.raw() 없이 파라미터로 넘길 때 사용.
   * 예: "[0.12, -0.34, ...]"
   */
  static toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
  }
}
