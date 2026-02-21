/**
 * site-prompt.ts
 *
 * DB에서 카테고리·사이트를 읽어 시스템 프롬프트용 텍스트를 빌드합니다.
 * 10분 TTL 인메모리 캐시를 적용하여 반복 요청 시 DB 쿼리를 건너뜁니다.
 */
import { prisma } from "@/lib/prisma";

let _cached: string | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function buildDBSitesText(): Promise<string> {
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      children: {
        orderBy: { createdAt: "asc" },
        include: {
          sites: {
            orderBy: [{ isPremium: "desc" }, { priority: "asc" }],
          },
        },
      },
    },
  });

  const lines = ["[카테고리별 추천 사이트 DB (DB 연동)]"];
  for (const parent of parents) {
    lines.push(`\n[${parent.name}]`);
    for (const child of parent.children) {
      const siteList = child.sites
        .map((s) => `${s.name}(https://${s.url})`)
        .join(", ");
      lines.push(`- ${child.name}: ${siteList}`);
    }
  }
  return lines.join("\n");
}

export async function getDBSitesText(): Promise<string> {
  if (_cached && Date.now() - _cachedAt < CACHE_TTL_MS) return _cached;
  _cached = await buildDBSitesText();
  _cachedAt = Date.now();
  return _cached;
}
