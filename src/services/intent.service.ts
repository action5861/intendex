import { prisma } from "@/lib/prisma";
import { ExtractedIntent } from "@/types";

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
        include: {
          matches: {
            include: { campaign: true },
          },
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
