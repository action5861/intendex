import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ExtractedIntent } from "@/types";
import { EmbeddingService } from "./embedding.service";

const CONFIDENCE_THRESHOLD = 0.7;

export class IntentService {
  static async saveExtractedIntents(
    userId: string,
    conversationId: string,
    intents: ExtractedIntent[]
  ) {
    const validIntents = intents.filter(
      (i) => i.confidence >= CONFIDENCE_THRESHOLD
    );

    if (validIntents.length === 0) return [];

    const created = await Promise.all(
      validIntents.map((intent) => {
        const isCommercial = intent.isCommercial ?? true;
        const pointValue = isCommercial ? (intent.pointValue ?? 0) : 0;

        return prisma.intent.create({
          data: {
            userId,
            conversationId,
            category: intent.category,
            subcategory: intent.subcategory,
            keyword: intent.keyword,
            description: intent.description,
            confidence: intent.confidence,
            isCommercial,
            pointValue,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      })
    );

    // Fire-and-forget: 상업적 Intent에 대해 임베딩을 미리 생성해 DB에 저장.
    // 다음 매칭 실행 시 getOrCreateIntentEmbedding이 DB 캐시 히트 → API 호출 생략.
    const commercialIntents = created.filter((i) => i.isCommercial);
    if (commercialIntents.length > 0) {
      const texts = commercialIntents.map((i) => EmbeddingService.buildIntentText(i));
      EmbeddingService.embedBatch(texts)
        .then((embeddings) =>
          Promise.allSettled(
            commercialIntents.map((intent, idx) => {
              const vectorStr = EmbeddingService.toVectorLiteral(embeddings[idx]);
              return prisma.$executeRaw(
                Prisma.sql`UPDATE "Intent" SET embedding = ${vectorStr}::vector WHERE id = ${intent.id}`
              );
            })
          )
        )
        .catch((err) => console.error("[IntentService] 임베딩 사전 생성 실패:", err));
    }

    return created;
  }

  static async getUserIntents(
    userId: string,
    options?: {
      category?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const { category, status, page = 1, limit = 20 } = options ?? {};

    const where = {
      userId,
      ...(category && { category }),
      ...(status && { status }),
    };

    const [intents, total] = await Promise.all([
      prisma.intent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          category: true,
          subcategory: true,
          keyword: true,
          description: true,
          confidence: true,
          isCommercial: true,
          pointValue: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      prisma.intent.count({ where }),
    ]);

    return { intents, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async deleteIntent(intentId: string, userId: string) {
    return prisma.intent.deleteMany({
      where: { id: intentId, userId },
    });
  }
}
