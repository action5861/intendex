/**
 * intent-rules.ts
 *
 * 인텐덱스 비즈니스 데이터 설정 파일
 * ─────────────────────────────────────
 * 새 카테고리 · 기업 추가 시 이 파일만 수정하면 됩니다.
 * chat/route.ts 는 건드릴 필요 없습니다.
 *
 * 섹션:
 *  1. 캠페인 DB 매칭용 (findMatchingCampaigns)
 *  2. 검색 URL 템플릿 사이트
 *  3. 세부 키워드 규칙 (특정 키워드 → 고정 사이트 추천)
 *  4. 프롬프트 섹션 빌더 함수
 *
 * 카테고리별 추천 사이트는 DB(Category + Site 테이블)에서 동적으로 로드됩니다.
 * → src/lib/site-prompt.ts 의 getDBSitesText() 참조
 */

// ─────────────────────────────────────────────────────────────
// 1. 캠페인 DB 매칭용
// ─────────────────────────────────────────────────────────────

/**
 * 금융 서브도메인 감지 키워드 맵
 * ⚠️ "보험" 단독 키워드 사용 금지 — "자동차 보험" 같은 비생명보험 쿼리를 잘못 매칭함
 */
export const FINANCIAL_DOMAIN_MAP: Record<string, string[]> = {
  loan: ["대출", "전세", "주택담보", "신용대출", "모기지", "주담대", "대환대출", "전세자금", "생활자금"],
  insurance: ["암보험", "실손", "생명보험", "건강보험", "종신보험", "연금보험", "치아보험", "펫보험"],
  bank: ["예금", "적금", "저축", "통장", "파킹통장", "금리우대", "입출금"],
};

/** 자동차보험 전용 쿼리 감지 — FINANCIAL_DOMAIN_MAP.insurance와 별도 처리 */
export const AUTO_INSURANCE_KEYWORDS: string[] = [
  "자동차보험", "자동차 보험", "차보험", "자동차보험료", "차량보험",
];

/** 금융 도메인별 캠페인 siteName 패턴 */
export const DOMAIN_SITE_PATTERNS: Record<string, string[]> = {
  loan: ["국민은행", "신한은행", "하나은행", "우리은행", "농협은행", "기업은행", "카카오뱅크", "토스뱅크", "핀다", "카카오페이"],
  insurance: ["삼성생명", "한화생명", "교보생명", "현대해상", "DB손해보험", "KB손해보험", "메리츠화재", "보험다모아"],
  bank: ["국민은행", "신한은행", "하나은행", "우리은행", "농협은행", "기업은행", "카카오뱅크", "토스뱅크"],
};

// ─────────────────────────────────────────────────────────────
// 2. 검색 URL 템플릿 사이트 (DB에 없는 메타데이터)
// ─────────────────────────────────────────────────────────────

/** 검색 URL 지원 사이트 — URL 안의 {q}를 검색어로 교체 */
export interface SearchSite {
  name: string;
  searchTemplate: string;
}

export const SEARCH_URL_SITES: SearchSite[] = [
  { name: "다나와",       searchTemplate: "https://search.danawa.com/dsearch.php?query={q}" },
  { name: "쿠팡",         searchTemplate: "https://www.coupang.com/np/search?q={q}" },
  { name: "11번가",       searchTemplate: "https://search.11st.co.kr/Search.tmall?kwd={q}" },
  { name: "G마켓",        searchTemplate: "https://browse.gmarket.co.kr/search?keyword={q}" },
  { name: "SSG",          searchTemplate: "https://www.ssg.com/search.ssg?query={q}" },
  { name: "무신사",       searchTemplate: "https://www.musinsa.com/search?q={q}" },
  { name: "올리브영",     searchTemplate: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query={q}" },
  { name: "아이허브",     searchTemplate: "https://kr.iherb.com/search?kw={q}" },
  { name: "인프런",       searchTemplate: "https://www.inflearn.com/courses?s={q}" },
  { name: "네이버 플레이스", searchTemplate: "https://m.place.naver.com/place/list?query={q}" },
  { name: "카카오맵",     searchTemplate: "https://map.kakao.com/?q={q}" },
];

// ─────────────────────────────────────────────────────────────
// 3. 세부 키워드 규칙
// ─────────────────────────────────────────────────────────────

export interface RecommendedSiteRule {
  url: string;
  name: string;
  reason: string;
}

export interface KeywordRule {
  /** 섹션 헤더에 표시할 라벨 (예: "대출·전세 키워드") */
  label: string;
  /** 트리거 키워드 목록 */
  keywords: string[];
  /** 카테고리·포인트 힌트 (선택) — "카테고리: 테크 / pointValue: 600~800P" 형식 */
  hint?: string;
  /** 추천 사이트 목록 (AI가 여기서 3개 선택) */
  sites: RecommendedSiteRule[];
  /** 후미 주의사항 (※ 접두어 없이 입력) */
  note?: string;
  /** 제외 주의사항 — 규칙 직후 ※ 로 표시 (※ 접두어 없이 입력) */
  excludeNote?: string;
}

/**
 * 키워드 규칙 목록
 *
 * 추가 방법:
 *   KEYWORD_RULES 배열 마지막에 새 KeywordRule 객체를 추가하세요.
 *   사이트 URL은 HOMEPAGE_SITES / SEARCH_URL_SITES 에도 등록해야 프롬프트 URL DB에 포함됩니다.
 */
export const KEYWORD_RULES: KeywordRule[] = [
  {
    label: "대출·전세 키워드",
    keywords: ["대출", "전세자금", "전세대출", "주택담보대출", "신용대출", "주담대", "전세"],
    sites: [
      { url: "https://www.kbstar.com",    name: "KB국민은행",  reason: "국민은행 전세자금대출·주택담보대출 금리 비교" },
      { url: "https://www.kebhana.com",   name: "하나은행",    reason: "하나은행 전세자금대출 맞춤 금리 상담" },
      { url: "https://www.ibk.co.kr",     name: "IBK기업은행", reason: "기업은행 전세자금대출·신용대출 상담" },
      { url: "https://www.shinhan.com",   name: "신한은행",    reason: "신한은행 전세자금대출 금리 안내" },
      { url: "https://www.wooribank.com", name: "우리은행",    reason: "우리은행 전세자금대출 한도 확인" },
      { url: "https://www.kakaobank.com", name: "카카오뱅크",  reason: "카카오뱅크 전세자금대출 간편 신청" },
      { url: "https://finda.co.kr",       name: "핀다",        reason: "여러 은행 대출 금리 한번에 비교" },
    ],
  },
  {
    label: "생명/건강보험 키워드",
    keywords: ["암보험", "실손보험", "건강보험", "종신보험", "연금보험", "치아보험", "생명보험", "펫보험"],
    excludeNote: '"자동차보험", "자동차 보험", "차보험"은 절대 이 목록으로 처리하지 마세요 → 아래 자동차보험 규칙으로 처리',
    sites: [
      { url: "https://www.samsunglife.com", name: "삼성생명",   reason: "삼성생명 암보험·건강보험 무료 상담" },
      { url: "https://www.hanwhalife.com",  name: "한화생명",   reason: "한화생명 암보험·CI보험 맞춤 설계" },
      { url: "https://www.kyobo.co.kr",     name: "교보생명",   reason: "교보생명 암보험·실손보험 비교 설계" },
      { url: "https://www.meritzfire.com",  name: "메리츠화재", reason: "메리츠화재 암보험·치아보험 상담" },
      { url: "https://www.directdb.co.kr",  name: "DB손해보험", reason: "DB손해보험 건강보험·실손보험 가입" },
      { url: "https://www.kbinsure.co.kr",  name: "KB손해보험", reason: "KB손해보험 암보험·운전자보험 비교" },
      { url: "https://e-insmarket.or.kr",   name: "보험다모아", reason: "여러 보험사 상품 한번에 비교" },
    ],
  },
  {
    label: "자동차보험 키워드",
    keywords: ["자동차보험", "자동차 보험", "차보험", "자동차보험료", "차량보험"],
    excludeNote: "생명보험 회사(삼성생명·한화생명·교보생명)를 절대 추천하지 마세요. 자동차보험은 손해보험사입니다.",
    sites: [
      { url: "https://www.hi.co.kr",       name: "현대해상",   reason: "현대해상 자동차보험 다이렉트 가입·보험료 계산" },
      { url: "https://www.directdb.co.kr", name: "DB손해보험", reason: "DB손해보험 자동차보험 온라인 다이렉트" },
      { url: "https://www.kbinsure.co.kr", name: "KB손해보험", reason: "KB손해보험 자동차보험 보험료 비교" },
      { url: "https://www.meritzfire.com", name: "메리츠화재", reason: "메리츠화재 자동차보험 다이렉트 할인" },
      { url: "https://e-insmarket.or.kr",  name: "보험다모아", reason: "여러 손해보험사 자동차보험 한번에 비교" },
    ],
  },
  {
    label: "번호이동/통신사 변경 키워드",
    keywords: ["번호이동", "통신사 변경", "통신사 추천", "SKT 번호이동", "KT 번호이동", "LGU+ 번호이동", "알뜰폰", "요금제 비교", "통신비 절약", "5G 요금제"],
    hint: "카테고리: 테크 / pointValue: 600~800P",
    note: "통신비 절약·알뜰폰 문의면 알뜰폰 허브를 우선 포함하세요.",
    sites: [
      { url: "https://www.tworld.co.kr", name: "SKT T월드",   reason: "SKT 번호이동 공시지원금 + 요금제 할인 혜택" },
      { url: "https://www.kt.com",       name: "KT",          reason: "KT 번호이동 스마트폰 지원금 + 3개월 요금 할인" },
      { url: "https://www.lguplus.com",  name: "LG U+",       reason: "LG U+ 번호이동 공시지원금 최대 + 유튜브 프리미엄 무료" },
      { url: "https://www.mvno.or.kr",   name: "알뜰폰 허브", reason: "알뜰폰 요금제 비교, 월 1만원대 번호이동 가능" },
    ],
  },
  {
    label: "인터넷 가입 키워드",
    keywords: ["인터넷 가입", "인터넷 신청", "인터넷 설치", "와이파이 가입", "KT 인터넷", "SK 인터넷", "LG 인터넷", "기가인터넷", "통신사 인터넷"],
    hint: "카테고리: 테크 / pointValue: 500~700P",
    sites: [
      { url: "https://www.kt.com",          name: "KT",          reason: "KT 기가인터넷 신규 가입 캐시백 혜택" },
      { url: "https://www.skbroadband.com", name: "SK브로드밴드", reason: "SK브로드밴드 인터넷 가입 최대 30만원 캐시백" },
      { url: "https://www.lguplus.com",     name: "LG U+",       reason: "LG U+ 인터넷 가입 시 넷플릭스 3개월 무료" },
    ],
  },
  {
    label: "이사 키워드",
    keywords: ["이사", "포장이사", "이사업체", "이삿짐", "이사견적", "이사비용", "용달이사", "이사 추천"],
    hint: "카테고리: 기타 / pointValue: 400~600P",
    sites: [
      { url: "https://www.zimcar.co.kr", name: "짐카", reason: "전국 이사업체 견적 한번에 비교, 최저가 보장" },
      { url: "https://soomgo.com",       name: "숨고", reason: "숨고 검증 이사업체 매칭, 포장이사 비교" },
      { url: "https://kmong.com",        name: "크몽", reason: "크몽 이사 전문가 견적 비교" },
    ],
  },
  {
    label: "가전제품 키워드",
    keywords: ["냉장고", "세탁기", "건조기", "에어컨", "TV", "텔레비전", "청소기", "식기세척기", "전자레인지", "오븐", "공기청정기", "제습기", "가전", "가전제품", "삼성 가전", "LG 가전"],
    hint: "카테고리: 테크 / pointValue: 400~700P",
    sites: [
      { url: "https://www.samsung.com/sec", name: "삼성전자",  reason: "삼성전자 공식몰 냉장고·세탁기·에어컨 직구매" },
      { url: "https://www.lge.co.kr",      name: "LG전자",    reason: "LG전자 공식몰 휘센·트롬·디오스 최신 모델 직구매" },
      { url: "https://www.e-himart.co.kr", name: "하이마트",  reason: "하이마트 가전제품 최저가 비교 + 전국 배송·설치" },
      { url: "https://search.danawa.com/dsearch.php?query={q}", name: "다나와", reason: "다나와 가전 최저가 실시간 비교" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// 4. 프롬프트 섹션 빌더
// ─────────────────────────────────────────────────────────────

/** [검색 URL 지원 사이트] 섹션 문자열 생성 */
export function buildSearchURLSitesText(): string {
  const lines = ["[검색 URL 지원 사이트] ({q} = 검색 키워드)"];
  for (const s of SEARCH_URL_SITES) {
    lines.push(`- ${s.name}: ${s.searchTemplate}`);
  }
  return lines.join("\n");
}

/** [필수] 키워드 규칙 섹션 문자열 생성 */
export function buildKeywordRulesText(): string {
  const header = "[필수] 금융 서브카테고리 사이트 추천 규칙 (반드시 따르세요):";
  const footer = "※ 위 키워드가 감지되면 searchGoogle을 호출하지 말고, 위 목록에서 바로 3개를 선택하세요.";

  const rules = KEYWORD_RULES.map((rule) => {
    const lines: string[] = [];
    const kwList = rule.keywords.map((k) => `"${k}"`).join(", ");
    lines.push(`▶ ${rule.label}: ${kwList}`);
    if (rule.excludeNote) {
      lines.push(`  ※ ${rule.excludeNote}`);
    }
    if (rule.hint) {
      lines.push(`  → ${rule.hint}`);
    }
    lines.push("  → recommendedSites 3개를 아래에서 선택 (반드시 이 사이트들로 채우세요):");
    for (const site of rule.sites) {
      lines.push(`  · ${JSON.stringify({ url: site.url, name: site.name, reason: site.reason })}`);
    }
    if (rule.note) {
      lines.push(`  ※ ${rule.note}`);
    }
    return lines.join("\n");
  });

  return [header, ...rules, footer].join("\n\n");
}
