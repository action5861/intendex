/**
 * 기존 Campaign에 임베딩을 일괄 생성하는 백필 스크립트.
 *
 * 실행:
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * 옵션:
 *   BATCH_SIZE 환경변수로 배치 크기 조절 가능 (기본 20)
 *   Google API rate-limit을 고려하여 배치 간 딜레이 포함
 */

import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true }); // Next.js와 동일하게 .env.local 우선
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { EmbeddingService } from "../src/services/embedding.service";

const prisma = new PrismaClient();
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "20", 10);
const BATCH_DELAY_MS = 1_000; // rate-limit 대응용 딜레이

async function main() {
  console.log("📡 Campaign 임베딩 백필 시작...");

  // 임베딩이 없는 캠페인만 대상
  const total = await prisma.$queryRaw<[{ count: bigint }]>(
    Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Campaign" WHERE embedding IS NULL`
  );
  const totalCount = Number(total[0].count);
  console.log(`총 ${totalCount}개 캠페인 처리 예정`);

  let processed = 0;
  let cursor: string | null = null;

  type CampaignRow = {
    id: string;
    category: string;
    title: string;
    keywords: string[];
    description: string;
  };

  while (processed < totalCount) {
    // 커서 기반 페이지네이션 (OFFSET 대신 → 대용량에서도 일정 속도 유지)
    // 삼항 연산자 대신 if/else로 분리: $queryRaw 제네릭 추론을 보장
    let campaigns: CampaignRow[];
    if (cursor) {
      campaigns = await prisma.$queryRaw<CampaignRow[]>(
        Prisma.sql`
          SELECT id, category, title, keywords, description
          FROM "Campaign"
          WHERE embedding IS NULL AND id > ${cursor}
          ORDER BY id
          LIMIT ${BATCH_SIZE}
        `
      );
    } else {
      campaigns = await prisma.$queryRaw<CampaignRow[]>(
        Prisma.sql`
          SELECT id, category, title, keywords, description
          FROM "Campaign"
          WHERE embedding IS NULL
          ORDER BY id
          LIMIT ${BATCH_SIZE}
        `
      );
    }

    if (campaigns.length === 0) break;

    // 배치 임베딩 생성
    const texts = campaigns.map((c) => EmbeddingService.buildCampaignText(c));
    let embeddings: number[][];
    try {
      embeddings = await EmbeddingService.embedBatch(texts);
    } catch (err) {
      console.error(`배치 임베딩 생성 실패 (cursor=${cursor}):`, err);
      break;
    }

    // 개별 업데이트 (pgvector는 bulk UPDATE를 지원하지 않으므로 순차 실행)
    for (let i = 0; i < campaigns.length; i++) {
      const vectorStr = EmbeddingService.toVectorLiteral(embeddings[i]);
      await prisma.$executeRaw(
        Prisma.sql`UPDATE "Campaign" SET embedding = ${vectorStr}::vector WHERE id = ${campaigns[i].id}`
      );
    }

    processed += campaigns.length;
    cursor = campaigns[campaigns.length - 1].id;
    console.log(`  ✓ ${processed}/${totalCount} 처리 완료`);

    // rate-limit 대응
    if (processed < totalCount) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`\n✅ 백필 완료: ${processed}개 Campaign 임베딩 생성`);
}

main()
  .catch((err) => {
    console.error("백필 실패:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
