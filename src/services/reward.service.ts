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
    if (amount < 10000) {
      throw new Error("최소 출금 금액은 10,000P입니다");
    }

    // 1. Fetch user with all required fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        name: true,
        isSuspended: true,
        bankAccountNumber: true,
      },
    });

    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다");
    }

    // 2. Suspended account check
    if (user.isSuspended) {
      throw new Error("정지된 계정입니다. 출금이 불가합니다.");
    }

    if (user.points < amount) {
      throw new Error("잔액이 부족합니다");
    }

    // 3. Real-name verification
    const normalize = (s: string) => s.replace(/\s/g, "");
    const userName = user.name ?? "";
    if (normalize(userName) !== normalize(accountInfo.holder)) {
      throw new Error("예금주명이 가입자명과 일치하지 않습니다.");
    }

    // 4. Bank account duplicate / consistency check
    if (user.bankAccountNumber !== null) {
      // User already has a registered account
      if (user.bankAccountNumber !== accountInfo.accountNumber) {
        throw new Error("기존 등록 계좌로만 출금이 가능합니다.");
      }
    } else {
      // First-time withdrawal: check if another user already owns this account number
      const existingOwner = await prisma.user.findUnique({
        where: { bankAccountNumber: accountInfo.accountNumber },
        select: { id: true },
      });

      if (existingOwner && existingOwner.id !== userId) {
        // Abuse detected: suspend both accounts and create flagged transaction
        await prisma.$transaction(async (tx) => {
          // Suspend requester and existing owner
          await tx.user.updateMany({
            where: { id: { in: [userId, existingOwner.id] } },
            data: { isSuspended: true },
          });

          // Create flagged transaction (no point deduction)
          await tx.transaction.create({
            data: {
              userId,
              type: "withdraw",
              amount,
              balance: user.points,
              source: "withdraw",
              metadata: {
                bank: accountInfo.bank,
                accountNumber: accountInfo.accountNumber,
                holder: accountInfo.holder,
                status: "flagged",
                abuseReason: "duplicate_bank_account",
                duplicateUserId: existingOwner.id,
              },
            },
          });
        });

        throw new Error(
          "해당 계좌번호는 이미 다른 계정에 등록되어 있습니다. 어뷰징이 감지되어 계정이 정지됩니다."
        );
      }
    }

    // 5 & 6. First-time account registration + point deduction + pending transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Register bank account on first withdrawal
      if (user.bankAccountNumber === null) {
        await tx.user.update({
          where: { id: userId },
          data: {
            bankAccountNumber: accountInfo.accountNumber,
            bankName: accountInfo.bank,
            bankAccountHolder: accountInfo.holder,
          },
        });
      }

      // Deduct points
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
      });

      // Create pending transaction
      await tx.transaction.create({
        data: {
          userId,
          type: "withdraw",
          amount,
          balance: updatedUser.points,
          source: "withdraw",
          metadata: {
            bank: accountInfo.bank,
            accountNumber: accountInfo.accountNumber,
            holder: accountInfo.holder,
            status: "pending",
          },
        },
      });

      return updatedUser;
    });

    await invalidateCache(CacheKeys.balance(userId));

    return { newBalance: updated.points };
  }
}
