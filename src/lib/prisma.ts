import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// PgBouncer 경유 URL이 있으면 사용 (트랜잭션 모드: Prepared Statement 비활성화 필수)
// 없으면 기존 직접 연결 URL 사용
const datasourceUrl =
  process.env.DATABASE_POOL_URL ?? process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
