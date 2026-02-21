import { google } from "@ai-sdk/google";
import { streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IntentService } from "@/services/intent.service";
import { MatchingService } from "@/services/matching.service";
import { RewardService } from "@/services/reward.service";
import { checkRateLimit } from "@/lib/cache";
import { ExtractedIntentsSchema } from "@/types";
import {
  FINANCIAL_DOMAIN_MAP,
  AUTO_INSURANCE_KEYWORDS,
  DOMAIN_SITE_PATTERNS,
  buildSearchURLSitesText,
  buildKeywordRulesText,
} from "@/config/intent-rules";
import { getDBSitesText } from "@/lib/site-prompt";

const DAILY_INTENT_POINT_CAP = 1000;

interface SearchResult {
  title: string;
  url: string;
  description: string;
  sponsored?: boolean;
}

// FINANCIAL_DOMAIN_MAP, AUTO_INSURANCE_KEYWORDS, DOMAIN_SITE_PATTERNS
// → src/config/intent-rules.ts 에서 import됨

async function findMatchingCampaigns(query: string): Promise<SearchResult[]> {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "active",
      url: { not: null },
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/);

  // 자동차보험 쿼리 여부 먼저 판별 (생명보험 도메인 감지에서 제외)
  const isAutoInsuranceQuery = AUTO_INSURANCE_KEYWORDS.some((kw) =>
    queryLower.includes(kw)
  );

  // 금융 서브도메인 감지 (자동차보험 쿼리면 insurance 도메인 제외)
  const detectedDomains = Object.entries(FINANCIAL_DOMAIN_MAP)
    .filter(([domain, signals]) => {
      if (domain === "insurance" && isAutoInsuranceQuery) return false;
      return signals.some((kw) => queryLower.includes(kw));
    })
    .map(([domain]) => domain);

  const matched = campaigns.filter((campaign) => {
    if (campaign.spent >= campaign.budget) return false;

    // 1) 키워드 토큰 매칭
    // 한국어 합성어 처리: "골프클럽" ↔ "골프 클럽" 처럼 띄어쓰기 차이도 매칭
    const keywordMatch = campaign.keywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      // 1-a) 전체 구문 매칭
      if (queryTokens.some((token) => kwLower.includes(token) || token.includes(kwLower))) {
        return true;
      }
      // 1-b) 키워드 구문을 단어 단위로 분해 후 쿼리 토큰과 교차 매칭
      const kwWords = kwLower.split(/\s+/);
      return kwWords.some((word) =>
        queryTokens.some((token) => word.includes(token) || token.includes(word))
      );
    });
    if (keywordMatch) return true;

    // 2) 금융 서브도메인 감지 → 해당 도메인의 siteNmae 캠페인 포함
    if (detectedDomains.length > 0 && campaign.siteName) {
      return detectedDomains.some((domain) =>
        DOMAIN_SITE_PATTERNS[domain]?.some((pattern) =>
          campaign.siteName!.includes(pattern)
        )
      );
    }

    return false;
  });

  return matched.map((c) => {
    let url = c.url!;
    // 지역정보 캠페인(네이버플레이스 등)은 검색어를 URL에 포함
    if (c.category === "지역정보" && url.includes("place.naver.com")) {
      url = `https://m.place.naver.com/place/list?query=${encodeURIComponent(query)}`;
    } else if (c.category === "지역정보" && url.includes("map.kakao.com")) {
      url = `https://map.kakao.com/?q=${encodeURIComponent(query)}`;
    }
    return {
      title: c.siteName || c.title,
      url,
      description: c.description,
      sponsored: true,
    };
  });
}

// 정적 섹션은 모듈 로드 시 1회만 빌드
const _searchURLSitesText = buildSearchURLSitesText();
const _keywordRulesText = buildKeywordRulesText();

const SYSTEM_PROMPT_STATIC = `당신은 인텐덱스(Intendex)의 AI 어시스턴트입니다. 사용자와 자연스럽고 친근하게 대화하면서, 대화 속에서 사용자의 구매 의도, 관심사, 니즈를 파악합니다.

대화 원칙:
1. 친근하고 공감하는 어조로 대화하세요
2. 과도한 질문은 피하고 자연스러운 흐름을 유지하세요
3. 사용자가 특정 주제에 관심을 보이면 적절히 더 깊이 물어보세요
4. 한국어로 대화하세요

[중요] 의도 감지 및 사이트 추천 규칙:
- 사용자가 무언가를 사고 싶다, 가고 싶다, 알아보고 싶다, 추천해달라 등의 의도를 표현하면 의도를 감지하세요.
- 첫 번째 메시지에서 의도가 보이면 바로 추출하세요. 추가 질문을 하기 전에도 의도를 먼저 추출하세요.
- "~하고 싶어", "~추천해줘", "~알아보는 중", "~살까" 같은 표현이 있으면 무조건 의도로 감지하세요.
- 일상적인 인사나 잡담에만 JSON 블록을 생략하세요.

[중요] 지역정보 의도 감지:
- "근처", "주변", "동네", "OO역", "OO동", "OO구", "가까운", "어디", "찾아줘", "추천해줘" 등 지역 키워드가 포함된 질문은 지역정보 의도로 감지하세요.
- 맛집, 음식점, 병원, 의원, 약국, 미용실, 헤어샵, 네일샵, 카페, 헬스장, 필라테스, 요가, 학원, 동물병원, 자동차정비, 세차, 세탁소 등 지역 업종 키워드가 포함되면 지역정보 카테고리로 분류하세요.
- 지역정보 의도는 isCommercial: true, pointValue: 100으로 설정하세요.

[매우 중요] 추천 사이트 URL에 검색어 포함 규칙:
- 아래 "검색 URL 지원 사이트"에 해당하면 검색어를 URL에 포함하세요.
- DB에서 제공된 다른 모든 사이트는 https:// + 도메인 형식으로 홈페이지 URL만 사용하세요.
- 검색 URL을 임의로 추측하거나 만들어내지 마세요.`;

async function buildSystemPrompt(
  remainingPoints: number,
  sponsoredCampaigns: SearchResult[] = []
): Promise<string> {
  const dbSitesText = await getDBSitesText();

  const sponsoredSection =
    sponsoredCampaigns.length > 0
      ? `\n[현재 대화에 매칭된 스폰서 사이트 — recommendedSites 첫 번째에 반드시 포함]\n${sponsoredCampaigns
          .map((c) => `• 사이트명: ${c.title} | URL: ${c.url} | 설명: ${c.description}`)
          .join("\n")}\n`
      : "";

  return `${SYSTEM_PROMPT_STATIC}

${_searchURLSitesText}
${sponsoredSection}
[중요] 사이트 추천 방식:
- 상업적 의도 감지 시 위 "스폰서 사이트"가 있으면 반드시 recommendedSites 첫 번째에 포함하세요.
- 스폰서 사이트가 없거나 부족하면 아래 "카테고리별 추천 사이트 DB"에서 채워 총 3개를 포함하세요.
- 추천할 때 광고라고 따로 표시하지 마세요. 자연스럽게 추천하세요.

${dbSitesText}

${_keywordRulesText}

[중요] 비영리·기부·봉사 의도 감지:
- "기부", "후원", "봉사", "나눔", "도움", "구호", "보호" 등 비영리 키워드가 포함되면 비영리 카테고리로 분류하세요.
- 아동보호, 유기동물, 환경보호, 난민구호, 장애인지원 등도 비영리입니다.
- 비영리 의도는 isCommercial: true, pointValue: 100으로 설정하세요.
- 비영리 사이트는 모두 홈페이지만 연결하세요 (검색어 파라미터 넣지 마세요).

[중요] 상업적 의도 vs 비상업적 의도 판단:
- **상업적 의도 (isCommercial: true)**: 제품/서비스 구매, 비교, 추천, 가격 조회, 예약, 구독 등 상업적 행동으로 이어질 수 있는 의도
- **비상업적 의도 (isCommercial: false, pointValue: 0)**: 날씨, 상식, 역사, 수학, 뉴스, 일반 지식 질문 등 구매 행동과 무관한 의도
  - 예시: "오늘 날씨 어때?", "한국의 수도는?", "피타고라스 정리 알려줘", "최근 뉴스 알려줘"
  - 비상업적 의도 감지 시: searchGoogle 도구를 호출하지 마세요. recommendedSites도 생략하세요.
  - 비상업적 의도 감지 시 응답에 다음 안내를 포함하세요:
    "이 질문은 데이터 기본소득 대상이 아닙니다. 구매하고 싶은 제품이나 관심 있는 서비스에 대해 이야기해주시면 포인트를 적립할 수 있어요!"

[중요] 상업적 의도 포인트 가치 판단 기준 (추천 사이트 60초 체류 시 지급):
- **고가치 (800~1000P)**: 보험, 대출, 부동산, 자동차, 명품, 법률 서비스, 의료/성형
- **중간 가치 (400~700P)**: 가전제품, 여행 패키지, 교육/학원, 인테리어, 건강보조식품, 구독 서비스
- **일반 가치 (100~300P)**: 의류, 음식 배달, 생활용품, 도서, 취미 용품

의도 감지 시 응답 마지막에 반드시 추가할 JSON 블록:
\`\`\`intents
{
  "intents": [
    {
      "category": "카테고리 (여행/쇼핑/건강/교육/금융/음식/패션/테크/부동산/자동차/취미/지역정보/비영리/기타 중 하나)",
      "subcategory": "세부 카테고리 (선택)",
      "keyword": "핵심 키워드",
      "description": "의도 요약 (한 문장)",
      "confidence": 0.0~1.0 (확신 정도),
      "isCommercial": true 또는 false,
      "pointValue": 0~1000 (상업적 가치에 따른 포인트, 비상업적이면 0),
      "recommendedSites": [
        {
          "url": "추천 사이트 URL (카테고리별 DB에서 선택)",
          "name": "사이트명",
          "reason": "추천 이유 (한 문장)"
        }
      ]
    }
  ]
}
\`\`\`

recommendedSites는 상업적 의도일 때 **반드시 3개**를 포함하세요. 비상업적 의도일 때는 생략하세요.
포인트는 추천 사이트에 60초 이상 체류해야 지급됩니다.

[현재 사용자 일일 현황]
- 오늘 남은 적립 가능 포인트: ${remainingPoints}P / ${DAILY_INTENT_POINT_CAP}P`;
}

function extractTextFromUIMessages(messages: UIMessage[]): { role: "user" | "assistant"; content: string }[] {
  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join(""),
  }));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 분당 10회 제한 (봇 Gemini API 비용 방어)
  const rl = await checkRateLimit(`chat:${session.user.id}`, 60, 10);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "rate_limit_exceeded" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(rl.resetIn),
        },
      }
    );
  }

  const body = await req.json();
  const uiMessages: UIMessage[] = body.messages ?? [];

  // Convert UIMessages to simple format for Claude
  const simpleMessages = extractTextFromUIMessages(uiMessages);

  // Create conversation on first message
  const lastUserMessage = simpleMessages[simpleMessages.length - 1];
  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: lastUserMessage?.content?.slice(0, 50) || "새 대화",
    },
  });

  // Save user message
  if (lastUserMessage?.role === "user") {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: lastUserMessage.content,
      },
    });
  }

  // Get daily intent stats for dynamic prompt
  const dailyStats = await RewardService.getDailyIntentStats(session.user.id);

  // Block chat when daily cap is reached
  if (dailyStats.totalPoints >= DAILY_INTENT_POINT_CAP) {
    return new Response(
      JSON.stringify({ error: "daily_cap_reached" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const remainingPoints = DAILY_INTENT_POINT_CAP - dailyStats.totalPoints;

  // 사용자 마지막 메시지로 스폰서 캠페인 미리 계산 → 시스템 프롬프트에 직접 주입
  // AI가 searchGoogle 도구를 호출하지 않아도 스폰서 결과가 항상 AI 컨텍스트에 노출됨
  const lastUserContent =
    lastUserMessage?.role === "user" ? lastUserMessage.content : "";
  const preMatchedCampaigns = lastUserContent
    ? await findMatchingCampaigns(lastUserContent)
    : [];
  const systemPrompt = await buildSystemPrompt(remainingPoints, preMatchedCampaigns);

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: systemPrompt,
    messages: simpleMessages,
    tools: {
      searchGoogle: tool({
        description:
          "Google에서 검색하여 관련 사이트를 찾습니다. 사용자의 의도에 맞는 사이트를 추천할 때 사용하세요.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("검색할 키워드 (예: '청바지 쇼핑 추천 사이트')"),
        }),
        execute: async ({ query }) => {
          const sponsoredResults = await findMatchingCampaigns(query);

          if (sponsoredResults.length > 0) {
            return {
              results: sponsoredResults,
              note: "매칭된 스폰서 캠페인이 있습니다. 이 사이트를 최우선으로 추천하고, 부족한 추천 수는 카테고리별 추천 사이트 DB에서 채워주세요.",
            };
          }

          return {
            results: [],
            note: "캠페인 매칭 결과가 없습니다. 제공된 '카테고리별 추천 사이트 DB'를 적극 활용해서 상황에 맞는 사이트를 반드시 3개 추천해 주세요.",
          };
        },
      }),
    },
    stopWhen: stepCountIs(2),
    onFinish: async ({ text }) => {
      // Save assistant message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: text,
        },
      });

      // Extract intents from response
      const intentMatch = text.match(/```intents\n([\s\S]*?)\n```/);
      if (intentMatch) {
        try {
          const parsed = JSON.parse(intentMatch[1]);
          const validated = ExtractedIntentsSchema.pick({
            intents: true,
          }).parse(parsed);

          // Server-side validation: enforce isCommercial=false → pointValue=0
          const sanitizedIntents = validated.intents.map((intent) => ({
            ...intent,
            pointValue: intent.isCommercial ? Math.min(intent.pointValue, 1000) : 0,
          }));

          const created = await IntentService.saveExtractedIntents(
            session.user!.id!,
            conversation.id,
            sanitizedIntents
          );

          // 저장된 인텐트에 대해 즉시 캠페인 매칭 실행 (fire-and-forget)
          if (created.length > 0) {
            Promise.allSettled(
              created.map((intent) =>
                MatchingService.matchIntentToCampaigns(intent.id)
              )
            ).catch(() => {});
          }
        } catch {
          // Intent parsing failed, skip silently
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
