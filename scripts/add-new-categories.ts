/**
 * 신규 카테고리 추가 마이그레이션 스크립트
 * 실행: npx tsx scripts/add-new-categories.ts
 *
 * - 기존 데이터를 삭제하지 않음 (안전)
 * - 이미 존재하는 카테고리/사이트는 중복 생성하지 않음 (멱등)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

// ── 1. 새로 추가할 최상위 카테고리 ──────────────────────────────
const newTopLevelCategories = [
  {
    name: "AI 및 에이전트 서비스",
    basePointValue: 1000,
    subCategories: [
      {
        name: "AI 챗봇 및 대화형 AI",
        sites: [
          { name: "ChatGPT", url: "chat.openai.com" },
          { name: "Claude", url: "claude.ai" },
          { name: "Google Gemini", url: "gemini.google.com" },
          { name: "네이버 하이퍼클로바", url: "clova.ai" },
          { name: "카카오브레인", url: "kakaobrain.com" },
        ],
      },
      {
        name: "AI 에이전트 및 자동화",
        sites: [
          { name: "Claude Code", url: "claude.ai/code" },
          { name: "AutoGPT", url: "autogpt.com" },
          { name: "Dify", url: "dify.ai" },
          { name: "AI Dungeon", url: "aidungeon.io" },
          { name: "Character.AI", url: "character.ai" },
        ],
      },
      {
        name: "AI 이미지/영상 생성",
        sites: [
          { name: "Midjourney", url: "midjourney.com" },
          { name: "Stable Diffusion", url: "stability.ai" },
          { name: "DALL-E", url: "openai.com/dall-e" },
          { name: "Runway", url: "runwayml.com" },
          { name: "Kling AI", url: "klingai.com" },
        ],
      },
    ],
  },
  {
    name: "숏폼 콘텐츠 및 스트리밍",
    basePointValue: 800,
    subCategories: [
      {
        name: "숏폼 비디오",
        sites: [
          { name: "TikTok", url: "tiktok.com" },
          { name: "Instagram Reels", url: "instagram.com/reels" },
          { name: "YouTube Shorts", url: "youtube.com/shorts" },
          { name: "Upstage", url: "upstage.ai" },
        ],
      },
      {
        name: "실시간 스트리밍",
        sites: [
          { name: "Twitch", url: "twitch.tv" },
          { name: "AfreecaTV", url: "afreecatv.com" },
          { name: "CHZZK", url: "chzzk.naver.com" },
          { name: "KICK", url: "kick.com" },
        ],
      },
    ],
  },
  {
    name: "디지털 웰니스 및 멘탈케어",
    basePointValue: 700,
    subCategories: [
      {
        name: "멘탈헬스 앱",
        sites: [
          { name: "클라우드필", url: "cloudpill.com" },
          { name: "마인드케어", url: "mindcare.kr" },
          { name: "토닥토닥", url: "todaktodak.com" },
          { name: "Headspace", url: "headspace.com" },
          { name: "Calm", url: "calm.com" },
        ],
      },
      {
        name: "디지털 치료제",
        sites: [
          { name: "세이브", url: "saveyour.ai" },
          { name: "루나헬스", url: "lunahealth.io" },
        ],
      },
    ],
  },
  {
    name: "친환경 및 지속가능성",
    basePointValue: 600,
    subCategories: [
      {
        name: "제로웨이스트",
        sites: [
          { name: "탄소중립플랫폼", url: "carbonneutral.kr" },
          { name: "지구샵", url: "theearthshop.co.kr" },
          { name: "제로웨이스트샵", url: "zerowasteshop.kr" },
        ],
      },
      {
        name: "친환경 배달/포장",
        sites: [
          { name: "그린라이트", url: "greenlight.kr" },
          { name: "용기내 챌린지", url: "yongginae.com" },
        ],
      },
    ],
  },
  {
    name: "크리에이터 경제 및 팬플랫폼",
    basePointValue: 800,
    subCategories: [
      {
        name: "멤버십 및 팬플랫폼",
        sites: [
          { name: "Patreon", url: "patreon.com" },
          { name: "퍼블리", url: "publy.co" },
          { name: "브런치", url: "brunch.co.kr" },
          { name: "네이버 포스트", url: "post.naver.com" },
        ],
      },
      {
        name: "크리에이터 도구",
        sites: [
          { name: "커넥츠", url: "connects.kr" },
          { name: "스템플", url: "stempl.com" },
          { name: "한국미디어플랫폼", url: "kmp.kr" },
        ],
      },
    ],
  },
  {
    name: "딥테크 및 스타트업",
    basePointValue: 900,
    subCategories: [
      {
        name: "스타트업 정보",
        sites: [
          { name: "더브이씨", url: "thevc.kr" },
          { name: "플래터", url: "platter.kr" },
          { name: "스타트업레시피", url: "startuprecipe.co.kr" },
          { name: "beez", url: "beez.kr" },
        ],
      },
      {
        name: "투자 및 IR",
        sites: [
          { name: "세일즈포스", url: "salesforce.com" },
          { name: "노션", url: "notion.so" },
          { name: "플렉스", url: "flex.team" },
        ],
      },
    ],
  },
  {
    name: "디지털 자산 및 Web3",
    basePointValue: 700,
    subCategories: [
      {
        name: "NFT 마켓플레이스",
        sites: [
          { name: "OpenSea", url: "opensea.io" },
          { name: "Rarible", url: "rarible.com" },
        ],
      },
      {
        name: "암호화폐 거래소",
        sites: [
          { name: "업비트", url: "upbit.com" },
          { name: "빗썸", url: "bithumb.com" },
          { name: "코인원", url: "coinone.co.kr" },
        ],
      },
    ],
  },
];

// ── 2. 기존 카테고리에 추가할 서브카테고리 ──────────────────────
const existingCategoryUpdates = [
  {
    parentName: "금융 및 재테크",
    newSubCategories: [
      {
        name: "AI 투자 및 로보어드바이저",
        sites: [
          { name: "토스증권", url: "tossinvest.com" },
          { name: "모두증권", url: "moduinvest.com" },
          { name: "트레이딩뷰", url: "tradingview.com" },
          { name: "StockGPT", url: "stockgpt.ai" },
        ],
      },
    ],
  },
  {
    parentName: "교육 및 자기계발",
    newSubCategories: [
      {
        name: "AI 기반 학습",
        sites: [
          { name: "ChatGPT 학습", url: "chat.openai.com" },
          { name: "Claude 학습", url: "claude.ai" },
          { name: "튜링", url: "turing.com" },
          { name: "코드잇", url: "codeit.kr" },
        ],
      },
    ],
  },
  {
    parentName: "문화 및 엔터테인먼트",
    newSubCategories: [
      {
        name: "숏폼 콘텐츠",
        sites: [
          { name: "TikTok", url: "tiktok.com" },
          { name: "Instagram Reels", url: "instagram.com" },
          { name: "YouTube Shorts", url: "youtube.com/shorts" },
        ],
      },
    ],
  },
];

// ── 헬퍼: 중복 없이 카테고리 생성 ───────────────────────────────
async function upsertCategory(
  name: string,
  basePointValue: number,
  parentId: string | null
) {
  const existing = await prisma.category.findFirst({
    where: { name, parentId: parentId ?? undefined },
  });
  if (existing) return existing;
  return prisma.category.create({
    data: { name, basePointValue, ...(parentId ? { parentId } : {}) },
  });
}

// ── 헬퍼: 중복 없이 사이트 생성 ─────────────────────────────────
async function upsertSite(
  categoryId: string,
  name: string,
  url: string,
  priority: number,
  isPremium: boolean
) {
  const existing = await prisma.site.findFirst({
    where: { url, categoryId },
  });
  if (existing) return;
  await prisma.site.create({
    data: { categoryId, name, url, priority, isPremium },
  });
}

async function main() {
  console.log("=== 신규 카테고리 마이그레이션 시작 ===\n");

  let addedCategories = 0;
  let addedSites = 0;

  // ── 1. 새 최상위 카테고리 추가 ──
  console.log("1) 신규 최상위 카테고리 추가...");
  for (const cat of newTopLevelCategories) {
    const parent = await upsertCategory(cat.name, cat.basePointValue, null);
    const isNew = !(await prisma.category.findFirst({
      where: { name: cat.name, parentId: null },
    }));
    if (!isNew) {
      console.log(`  ↩ 이미 존재: ${cat.name}`);
    } else {
      addedCategories++;
      console.log(`  ✓ 추가: ${cat.name}`);
    }

    for (const sub of cat.subCategories) {
      const child = await upsertCategory(sub.name, cat.basePointValue, parent.id);
      addedCategories++;

      for (let i = 0; i < sub.sites.length; i++) {
        await upsertSite(child.id, sub.sites[i].name, sub.sites[i].url, i + 1, i === 0);
        addedSites++;
      }
    }
  }

  // ── 2. 기존 카테고리에 서브카테고리 추가 ──
  console.log("\n2) 기존 카테고리 업데이트...");
  for (const update of existingCategoryUpdates) {
    const parent = await prisma.category.findFirst({
      where: { name: update.parentName, parentId: null },
    });

    if (!parent) {
      console.log(`  ✗ 부모 카테고리 없음: ${update.parentName}`);
      continue;
    }

    console.log(`  → ${update.parentName}`);
    for (const sub of update.newSubCategories) {
      const child = await upsertCategory(sub.name, parent.basePointValue, parent.id);
      addedCategories++;
      console.log(`    ✓ 서브카테고리 추가: ${sub.name}`);

      for (let i = 0; i < sub.sites.length; i++) {
        await upsertSite(child.id, sub.sites[i].name, sub.sites[i].url, i + 1, i === 0);
        addedSites++;
      }
    }
  }

  console.log(`\n=== 완료: 카테고리 ${addedCategories}개, 사이트 ${addedSites}개 추가 ===`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
