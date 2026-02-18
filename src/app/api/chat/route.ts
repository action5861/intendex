import { google } from "@ai-sdk/google";
import { streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IntentService } from "@/services/intent.service";
import { RewardService } from "@/services/reward.service";
import { ExtractedIntentsSchema } from "@/types";

const DAILY_INTENT_POINT_CAP = 1000;

interface SearchResult {
  title: string;
  url: string;
  description: string;
  sponsored?: boolean;
}

async function searchGoogleWeb(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ko&gl=kr&num=5`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    // Google wraps organic result URLs in /url?q= redirects
    const urlRegex = /\/url\?q=(https?:\/\/[^&"]+)/g;
    let match;

    while ((match = urlRegex.exec(html)) !== null && results.length < 3) {
      const decodedUrl = decodeURIComponent(match[1]);

      let hostname: string;
      try {
        hostname = new URL(decodedUrl).hostname;
      } catch {
        continue;
      }

      if (
        hostname.includes("google.") ||
        hostname.includes("googleapis.") ||
        seen.has(hostname)
      ) {
        continue;
      }
      seen.add(hostname);

      results.push({
        title: hostname.replace(/^www\./, ""),
        url: decodedUrl,
        description: `${query} 관련 검색 결과`,
      });
    }

    return results;
  } catch {
    return [];
  }
}

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

  const matched = campaigns.filter((campaign) => {
    if (campaign.spent >= campaign.budget) return false;
    return campaign.keywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      return queryTokens.some(
        (token) => kwLower.includes(token) || token.includes(kwLower)
      );
    });
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

const SYSTEM_PROMPT_BASE = `당신은 인텐덱스(Intendex)의 AI 어시스턴트입니다. 사용자와 자연스럽고 친근하게 대화하면서, 대화 속에서 사용자의 구매 의도, 관심사, 니즈를 파악합니다.

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
- 아래 "홈페이지만 연결 사이트"에 해당하면 반드시 홈페이지 URL만 사용하세요. 검색 파라미터를 절대 넣지 마세요.
- 목록에 없는 사이트도 홈페이지 URL만 사용하세요. 검색 URL을 유추하거나 만들어내지 마세요.

[검색 URL 지원 사이트] ({q} = 검색 키워드)
- 다나와: https://search.danawa.com/dsearch.php?query={q}
- 쿠팡: https://www.coupang.com/np/search?q={q}
- 11번가: https://search.11st.co.kr/Search.tmall?kwd={q}
- G마켓: https://browse.gmarket.co.kr/search?keyword={q}
- SSG: https://www.ssg.com/search.ssg?query={q}
- 무신사: https://www.musinsa.com/search?q={q}
- 올리브영: https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query={q}
- 아이허브: https://kr.iherb.com/search?kw={q}
- 인프런: https://www.inflearn.com/courses?s={q}
- 네이버 플레이스: https://m.place.naver.com/place/list?query={q}
- 카카오맵: https://map.kakao.com/?q={q}

[홈페이지만 연결 사이트] (검색 파라미터 넣지 마세요!)
- 야놀자: https://www.yanolja.com
- 여기어때: https://www.goodchoice.kr
- 트리플: https://triple.guide
- 마이리얼트립: https://www.myrealtrip.com
- 클룩: https://www.klook.com/ko
- W컨셉: https://www.wconcept.co.kr
- 지그재그: https://zigzag.kr
- 에이블리: https://www.a-bly.com
- 하이마트: https://www.e-himart.co.kr
- 컴퓨존: https://www.compuzone.co.kr
- 클래스101: https://class101.net
- 패스트캠퍼스: https://fastcampus.co.kr
- 에듀윌: https://www.eduwill.net
- 마켓컬리: https://www.kurly.com
- 롯데ON: https://www.lotteon.com
- K카: https://www.kcar.com
- 엔카: https://www.encar.com
- KB차차차: https://www.kbchachacha.com
- 카닥: https://www.cardoc.co.kr
- 굿닥: https://www.goodoc.co.kr
- 망고플레이트: https://www.mangoplate.com
- 배달의민족: https://www.baemin.com
- 요기요: https://www.yogiyo.co.kr
- 쿠팡이츠: https://www.coupangeats.com
- 토스: https://toss.im
- 카카오뱅크: https://www.kakaobank.com
- 뱅크샐러드: https://www.banksalad.com
- 핀다: https://finda.co.kr
- 직방: https://www.zigbang.com
- 다방: https://www.dabang.app
- 발란: https://www.balaan.co.kr
- 트렌비: https://www.trenbe.com
- 머스트잇: https://www.mustit.co.kr
- 닥터나우: https://doctornow.co.kr
- 보험다모아: https://e-insmarket.or.kr
- 탈잉: https://taling.me
- 텀블벅: https://tumblbug.com
- 아이디어스: https://www.idus.com

[중요] 사이트 추천 방식:
- 상업적 의도 감지 시 아래 "카테고리별 추천 사이트 DB"에서 3개를 골라 recommendedSites에 포함하세요.
- DB에 없는 세부 분야라면 searchGoogle 도구를 사용해 보충하세요. 단, Google 검색은 최소한으로 사용하세요.
- 검색 결과에 sponsored: true인 사이트가 있으면 해당 사이트를 우선적으로 포함하세요.
- 추천할 때 광고라고 따로 표시하지 마세요. 자연스럽게 추천하세요.

[카테고리별 추천 사이트 DB] (URL은 위의 검색URL/홈페이지 목록을 참조)
- 여행: 야놀자, 여기어때, 트리플, 마이리얼트립, 클룩
- 쇼핑: 쿠팡, 11번가, G마켓, SSG, 롯데ON
- 건강: 올리브영, 아이허브, 닥터나우, 굿닥
- 교육: 클래스101, 인프런, 패스트캠퍼스, 에듀윌
- 금융: 토스, 카카오뱅크, 뱅크샐러드, 핀다
- 음식: 배달의민족, 요기요, 쿠팡이츠, 마켓컬리
- 패션: 무신사, W컨셉, 지그재그, 에이블리
- 테크: 다나와, 컴퓨존, 하이마트
- 부동산: 직방, 다방
- 자동차: K카, 엔카, 카닥, KB차차차
- 취미: 클래스101, 탈잉, 텀블벅, 아이디어스
- 명품: 발란, 트렌비, 머스트잇
- 보험: 보험다모아
- 지역정보: 네이버 플레이스, 카카오맵, 망고플레이트, 굿닥

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
      "category": "카테고리 (여행/쇼핑/건강/교육/금융/음식/패션/테크/부동산/자동차/취미/지역정보/기타 중 하나)",
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
포인트는 추천 사이트에 60초 이상 체류해야 지급됩니다.`;

function buildSystemPrompt(remainingPoints: number): string {
  return `${SYSTEM_PROMPT_BASE}

[현재 사용자 일일 현황]
- 오늘 남은 적립 가능 포인트: ${remainingPoints}P / ${DAILY_INTENT_POINT_CAP}P
${remainingPoints <= 0 ? "- ⚠️ 오늘 포인트 적립 한도에 도달했습니다. 내일 다시 적립할 수 있습니다." : ""}`;
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
  const remainingPoints = Math.max(0, DAILY_INTENT_POINT_CAP - dailyStats.totalPoints);

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: buildSystemPrompt(remainingPoints),
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
          // 캠페인 DB에서 매칭되는 캠페인 우선 조회
          const sponsoredResults = await findMatchingCampaigns(query);

          if (sponsoredResults.length > 0) {
            // 캠페인 매칭 시 Google 검색도 함께 반환 (캠페인이 상단)
            const googleResults = await searchGoogleWeb(query);
            return { results: [...sponsoredResults, ...googleResults] };
          }

          // 캠페인 없으면 기존 Google 검색 fallback
          const results = await searchGoogleWeb(query);
          if (results.length === 0) {
            return {
              results: [],
              note: "검색 결과를 가져올 수 없었습니다. 알고 있는 적절한 사이트를 추천해주세요.",
            };
          }
          return { results };
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

          await IntentService.saveExtractedIntents(
            session.user!.id!,
            conversation.id,
            sanitizedIntents
          );
        } catch {
          // Intent parsing failed, skip silently
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
