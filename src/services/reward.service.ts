import { prisma } from "@/lib/prisma";
import { cachedQuery, invalidateCache, CacheKeys } from "@/lib/cache";

export class RewardService {
  static async getUserBalance(userId: string) {
    return cachedQuery(
      CacheKeys.balance(userId),
      30, // 30초 TTL
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { points: true },
        });
        return user?.points ?? 0;
      }
    );
  }

  static async getTransactionHistory(
    userId: string,
    options?: { type?: string; page?: number; limit?: number }
  ) {
    const { type, page = 1, limit = 20 } = options ?? {};

    const where = {
      userId,
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getDailyIntentStats(userId: string) {
    return cachedQuery(
      CacheKeys.dailyStats(userId),
      60, // 60초 TTL
      async () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [aggregate, countResult] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId,
              type: "earn",
              source: { in: ["intent_reward", "dwell"] },
              createdAt: { gte: todayStart },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: {
              userId,
              type: "earn",
              source: { in: ["intent_reward", "dwell"] },
              createdAt: { gte: todayStart },
            },
          }),
        ]);

        return {
          totalPoints: aggregate._sum.amount ?? 0,
          count: countResult,
        };
      }
    );
  }

  static async awardIntentReward(
    userId: string,
    intentId: string,
    pointValue: number,
    keyword: string
  ) {
    const [user, transaction] = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: pointValue } },
      });

      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          type: "earn",
          amount: pointValue,
          balance: updatedUser.points,
          source: "intent_reward",
          refId: intentId,
          metadata: {
            source: "intent_reward",
            intentId,
            keyword,
          },
        },
      });

      return [updatedUser, newTransaction] as const;
    });

    await invalidateCache(
      CacheKeys.balance(userId),
      CacheKeys.dailyStats(userId)
    );

    return { newBalance: user.points, transactionId: transaction.id };
  }

  static async requestWithdrawal(
    userId: string,
    amount: number,
    accountInfo: { bank: string; accountNumber: string; holder: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user || user.points < amount) {
      throw new Error("잔액이 부족합니다");
    }

    if (amount < 10000) {
      throw new Error("최소 출금 금액은 10,000P입니다");
    }

    // Deduct points
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: amount } },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: "withdraw",
        amount,
        balance: updated.points,
        source: "withdraw",
        metadata: {
          bank: accountInfo.bank,
          accountNumber: accountInfo.accountNumber,
          holder: accountInfo.holder,
          status: "pending", // Manual processing
        },
      },
    });

    await invalidateCache(CacheKeys.balance(userId));

    return { newBalance: updated.points };
  }
}
