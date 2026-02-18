import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// 확장된 분야별 매칭 사이트 데이터 (14개 대분류, 70+ 소분류, 350+ 사이트)
// ──────────────────────────────────────────────
const categorySiteData = [
  {
    name: "여행 및 레저",
    basePointValue: 800,
    subCategories: [
      {
        name: "항공권 예약/비교",
        sites: [
          { name: "스카이스캐너", url: "skyscanner.co.kr" },
          { name: "네이버 항공권", url: "flight.naver.com" },
          { name: "카약", url: "kayak.co.kr" },
          { name: "구글 플라이트", url: "google.com/flights" },
          { name: "익스피디아", url: "expedia.co.kr" },
        ],
      },
      {
        name: "국내 여행지 추천",
        sites: [
          { name: "네이버 지도", url: "map.naver.com" },
          { name: "대한민국 구석구석", url: "korean.visitkorea.or.kr" },
          { name: "인스타그램", url: "instagram.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "트립어드바이저", url: "tripadvisor.co.kr" },
        ],
      },
      {
        name: "해외 자유/배낭여행",
        sites: [
          { name: "트리플", url: "triple.guide" },
          { name: "마이리얼트립", url: "myrealtrip.com" },
          { name: "에어비앤비", url: "airbnb.co.kr" },
          { name: "부킹닷컴", url: "booking.com" },
          { name: "아고다", url: "agoda.com" },
        ],
      },
      {
        name: "해외 패키지/골프",
        sites: [
          { name: "하나투어", url: "hanatour.com" },
          { name: "모두투어", url: "modetour.com" },
          { name: "인터파크 투어", url: "travel.interpark.com" },
          { name: "롯데관광", url: "lottetour.com" },
          { name: "노랑풍선", url: "ybtour.co.kr" },
        ],
      },
      {
        name: "호텔/펜션/숙박",
        sites: [
          { name: "야놀자", url: "yanolja.com" },
          { name: "여기어때", url: "yeogi.com" },
          { name: "호텔스컴바인", url: "hotelscombined.co.kr" },
          { name: "데일리호텔", url: "dailyhotel.com" },
          { name: "네이버 예약", url: "booking.naver.com" },
        ],
      },
      {
        name: "캠핑·글램핑",
        sites: [
          { name: "땡큐캠핑", url: "thankqcamping.com" },
          { name: "캠핏", url: "camfit.co.kr" },
          { name: "고캠핑", url: "gocamping.or.kr" },
          { name: "캠핑클럽", url: "campingclub.co.kr" },
          { name: "캠핑커뮤니티", url: "cafe.naver.com/campingfirst" },
        ],
      },
      {
        name: "등산·트레킹",
        sites: [
          { name: "트랭글", url: "tranggle.com" },
          { name: "블랙야크 BAC", url: "bac.blackyak.com" },
          { name: "국립공원공단", url: "reservation.knps.or.kr" },
          { name: "산림청 숲나들e", url: "foresttrip.go.kr" },
          { name: "등산 커뮤니티", url: "cafe.naver.com/hiking" },
        ],
      },
    ],
  },
  {
    name: "디지털·IT·전자제품",
    basePointValue: 800,
    subCategories: [
      {
        name: "PC·하드웨어 조립",
        sites: [
          { name: "다나와", url: "danawa.com" },
          { name: "퀘이사존", url: "quasarzone.com" },
          { name: "쿨엔조이", url: "coolenjoy.net" },
          { name: "컴퓨존", url: "compuzone.co.kr" },
          { name: "용산 전자상가", url: "yongsan.co.kr" },
        ],
      },
      {
        name: "스마트폰·모바일",
        sites: [
          { name: "뽐뿌 휴대폰", url: "ppomppu.co.kr" },
          { name: "알고사", url: "rgo4.com" },
          { name: "세티즌", url: "cetizen.com" },
          { name: "삼성닷컴", url: "samsung.com" },
          { name: "Apple", url: "apple.com/kr" },
        ],
      },
      {
        name: "노트북·태블릿",
        sites: [
          { name: "Apple MacBook", url: "apple.com/kr" },
          { name: "삼성 갤럭시북", url: "samsung.com" },
          { name: "LG그램", url: "lge.co.kr" },
          { name: "다나와 노트북", url: "danawa.com" },
          { name: "노트북 커뮤니티", url: "cafe.naver.com/gamingnotebook" },
        ],
      },
      {
        name: "카메라·촬영장비",
        sites: [
          { name: "SLR클럽", url: "slrclub.com" },
          { name: "팝코넷", url: "popco.net" },
          { name: "소니코리아", url: "sony.co.kr" },
          { name: "캐논코리아", url: "canon.co.kr" },
          { name: "니콘코리아", url: "nikon.co.kr" },
        ],
      },
      {
        name: "가전제품",
        sites: [
          { name: "LG전자", url: "lge.co.kr" },
          { name: "삼성전자", url: "samsung.com" },
          { name: "하이마트", url: "himart.co.kr" },
          { name: "전자랜드", url: "etland.co.kr" },
          { name: "다이슨", url: "dyson.co.kr" },
        ],
      },
    ],
  },
  {
    name: "쇼핑 및 패션",
    basePointValue: 500,
    subCategories: [
      {
        name: "할인·특가 정보",
        sites: [
          { name: "뽐뿌", url: "ppomppu.co.kr" },
          { name: "다나와 특가", url: "danawa.com" },
          { name: "클리앙 알뜰구매", url: "clien.net" },
          { name: "루리웹 핫딜", url: "ruliweb.com" },
          { name: "쿨엔조이 핫딜", url: "coolenjoy.net" },
        ],
      },
      {
        name: "여성 패션·코디",
        sites: [
          { name: "에이블리", url: "a-bly.com" },
          { name: "지그재그", url: "zigzag.kr" },
          { name: "스타일쉐어", url: "styleshare.kr" },
          { name: "W컨셉", url: "wconcept.co.kr" },
          { name: "29CM", url: "29cm.co.kr" },
        ],
      },
      {
        name: "남성 패션·스트릿",
        sites: [
          { name: "무신사", url: "musinsa.com" },
          { name: "하입비스트", url: "hypebeast.com/kr" },
          { name: "STCO", url: "stco.co.kr" },
          { name: "온더룩", url: "on-the-look.com" },
          { name: "SSF샵", url: "ssfshop.com" },
        ],
      },
      {
        name: "명품·리셀",
        sites: [
          { name: "크림", url: "kream.co.kr" },
          { name: "트렌비", url: "trenbe.com" },
          { name: "발란", url: "balaan.co.kr" },
          { name: "머스트잇", url: "mustit.co.kr" },
          { name: "파페치", url: "farfetch.com" },
        ],
      },
      {
        name: "중고거래",
        sites: [
          { name: "당근마켓", url: "daangn.com" },
          { name: "번개장터", url: "bunjang.co.kr" },
          { name: "중고나라", url: "cafe.naver.com/joonggonara" },
          { name: "헬로마켓", url: "hellomarket.com" },
          { name: "알라딘 중고", url: "aladin.co.kr" },
        ],
      },
      {
        name: "화장품·뷰티",
        sites: [
          { name: "올리브영", url: "oliveyoung.co.kr" },
          { name: "화해", url: "hwahae.co.kr" },
          { name: "글로우픽", url: "glowpick.com" },
          { name: "세포라", url: "sephora.kr" },
          { name: "랄라블라", url: "lalavla.gsretail.com" },
        ],
      },
    ],
  },
  {
    name: "건강 및 뷰티케어",
    basePointValue: 600,
    subCategories: [
      {
        name: "운동·피트니스",
        sites: [
          { name: "다짐", url: "dagym.co.kr" },
          { name: "핏데이", url: "fitday.co.kr" },
          { name: "스포애니", url: "spoany.com" },
          { name: "홈트레이닝", url: "youtube.com" },
          { name: "헬스 커뮤니티", url: "cafe.naver.com/bodybuilding" },
        ],
      },
      {
        name: "다이어트·식단관리",
        sites: [
          { name: "다이어트신", url: "dietshin.com" },
          { name: "팻시크릿", url: "fatsecret.kr" },
          { name: "마이핏", url: "myfit.care" },
          { name: "다노", url: "dano.me" },
          { name: "다이어트 커뮤니티", url: "cafe.naver.com/diet" },
        ],
      },
      {
        name: "영양제·건강식품",
        sites: [
          { name: "아이허브", url: "iherb.com" },
          { name: "올리브영", url: "oliveyoung.co.kr" },
          { name: "필리", url: "pilly.kr" },
          { name: "영양제연구소", url: "yeongulab.com" },
          { name: "쿠팡 헬스", url: "coupang.com" },
        ],
      },
      {
        name: "성형·피부관리",
        sites: [
          { name: "강남언니", url: "gangnamunni.com" },
          { name: "바비톡", url: "babitalk.com" },
          { name: "모두의성형", url: "modoosung.com" },
          { name: "성형 커뮤니티", url: "cafe.naver.com/feko" },
          { name: "피부과 정보", url: "dermatology.co.kr" },
        ],
      },
      {
        name: "탈모·모발관리",
        sites: [
          { name: "대다모", url: "daedamo.com" },
          { name: "이마반", url: "cafe.naver.com/emaban" },
          { name: "탈모갤러리", url: "gall.dcinside.com" },
          { name: "모발이식 정보", url: "hairline.co.kr" },
        ],
      },
      {
        name: "정신건강·명상",
        sites: [
          { name: "마보", url: "mabo.kr" },
          { name: "트로스트", url: "trost.co.kr" },
          { name: "캄", url: "calm.com" },
          { name: "마음챙김", url: "mindfulness.co.kr" },
          { name: "정신건강 커뮤니티", url: "cafe.naver.com/mentalhealth" },
        ],
      },
    ],
  },
  {
    name: "교육 및 자기계발",
    basePointValue: 600,
    subCategories: [
      {
        name: "코딩·프로그래밍",
        sites: [
          { name: "인프런", url: "inflearn.com" },
          { name: "프로그래머스", url: "programmers.co.kr" },
          { name: "패스트캠퍼스", url: "fastcampus.co.kr" },
          { name: "코드잇", url: "codeit.kr" },
          { name: "OKKY", url: "okky.kr" },
        ],
      },
      {
        name: "외국어·어학",
        sites: [
          { name: "듀오링고", url: "duolingo.com" },
          { name: "야나두", url: "yanadoo.co.kr" },
          { name: "해커스", url: "hackers.co.kr" },
          { name: "링글", url: "ringle.co.kr" },
          { name: "캠블리", url: "cambly.com" },
        ],
      },
      {
        name: "자격증·공무원",
        sites: [
          { name: "Q-Net", url: "q-net.or.kr" },
          { name: "에듀윌", url: "eduwill.net" },
          { name: "해커스", url: "hackers.co.kr" },
          { name: "시대에듀", url: "sdedu.co.kr" },
          { name: "공무원 커뮤니티", url: "cafe.naver.com/gongmuwon" },
        ],
      },
      {
        name: "온라인 클래스",
        sites: [
          { name: "클래스101", url: "class101.net" },
          { name: "탈잉", url: "taling.me" },
          { name: "프립", url: "frip.co.kr" },
          { name: "유데미", url: "udemy.com" },
          { name: "스킬쉐어", url: "skillshare.com" },
        ],
      },
    ],
  },
  {
    name: "금융 및 재테크",
    basePointValue: 900,
    subCategories: [
      {
        name: "주식·증권",
        sites: [
          { name: "토스증권", url: "tossinvest.com" },
          { name: "키움증권", url: "kiwoom.com" },
          { name: "인베스팅닷컴", url: "kr.investing.com" },
          { name: "네이버 증권", url: "finance.naver.com" },
          { name: "팍스넷", url: "paxnet.co.kr" },
        ],
      },
      {
        name: "가상자산(코인)",
        sites: [
          { name: "업비트", url: "upbit.com" },
          { name: "빗썸", url: "bithumb.com" },
          { name: "코인원", url: "coinone.co.kr" },
          { name: "코인판", url: "coinpan.com" },
          { name: "코인마켓캡", url: "coinmarketcap.com" },
        ],
      },
      {
        name: "금융상품 비교",
        sites: [
          { name: "뱅크샐러드", url: "banksalad.com" },
          { name: "카드고릴라", url: "card-gorilla.com" },
          { name: "모네타", url: "moneta.co.kr" },
          { name: "금융감독원 파인", url: "fine.fss.or.kr" },
          { name: "보험다모아", url: "e-insmarket.or.kr" },
        ],
      },
      {
        name: "대출·신용관리",
        sites: [
          { name: "핀다", url: "finda.co.kr" },
          { name: "토스", url: "toss.im" },
          { name: "카카오페이", url: "kakaopay.com" },
          { name: "크레딧", url: "credit.co.kr" },
          { name: "렌딧", url: "lendit.co.kr" },
        ],
      },
      {
        name: "부동산 투자",
        sites: [
          { name: "호갱노노", url: "hogangnono.com" },
          { name: "아실", url: "asil.kr" },
          { name: "부동산스터디", url: "cafe.naver.com/jaegebal" },
          { name: "부동산 커뮤니티", url: "cafe.naver.com/realestate" },
          { name: "직방 투자", url: "zigbang.com" },
        ],
      },
      {
        name: "재테크 커뮤니티",
        sites: [
          { name: "뽐뿌 재테크", url: "ppomppu.co.kr" },
          { name: "82쿡 재테크", url: "82cook.com" },
          { name: "클리앙 재테크", url: "clien.net" },
          { name: "월급쟁이재테크", url: "cafe.naver.com/financialplanning" },
        ],
      },
    ],
  },
  {
    name: "부동산 및 주거",
    basePointValue: 800,
    subCategories: [
      {
        name: "아파트 시세·매매",
        sites: [
          { name: "호갱노노", url: "hogangnono.com" },
          { name: "네이버 부동산", url: "land.naver.com" },
          { name: "부동산114", url: "r114.com" },
          { name: "KB부동산", url: "kbland.kr" },
          { name: "아실", url: "asil.kr" },
        ],
      },
      {
        name: "원룸·오피스텔 전월세",
        sites: [
          { name: "직방", url: "zigbang.com" },
          { name: "다방", url: "dabangapp.com" },
          { name: "방콕", url: "bangkog.com" },
          { name: "피터팬", url: "peterpanz.com" },
          { name: "부동산써브", url: "serve.co.kr" },
        ],
      },
      {
        name: "분양·청약",
        sites: [
          { name: "청약홈", url: "applyhome.co.kr" },
          { name: "분양닷컴", url: "bunyang.com" },
          { name: "리치고", url: "richgo.com" },
          { name: "LH청약", url: "lh.or.kr" },
          { name: "청약 커뮤니티", url: "cafe.naver.com/cheongyak" },
        ],
      },
      {
        name: "인테리어·가구",
        sites: [
          { name: "오늘의집", url: "ohou.se" },
          { name: "이케아", url: "ikea.com/kr" },
          { name: "한샘몰", url: "hanssem.com" },
          { name: "까사미아", url: "casamia.co.kr" },
          { name: "리바트", url: "livart.co.kr" },
        ],
      },
      {
        name: "이사·청소·수리",
        sites: [
          { name: "숨고", url: "soomgo.com" },
          { name: "크몽", url: "kmong.com" },
          { name: "헬프미", url: "helpme.co.kr" },
          { name: "홈마스터", url: "homemaster.co.kr" },
          { name: "이사 커뮤니티", url: "cafe.naver.com/moving" },
        ],
      },
    ],
  },
  {
    name: "취업 및 커리어",
    basePointValue: 600,
    subCategories: [
      {
        name: "종합 채용정보",
        sites: [
          { name: "사람인", url: "saramin.co.kr" },
          { name: "잡코리아", url: "jobkorea.co.kr" },
          { name: "워크넷", url: "work.go.kr" },
          { name: "인크루트", url: "incruit.com" },
          { name: "커리어", url: "career.co.kr" },
        ],
      },
      {
        name: "IT·스타트업 채용",
        sites: [
          { name: "원티드", url: "wanted.co.kr" },
          { name: "로켓펀치", url: "rocketpunch.com" },
          { name: "점핏", url: "jumpit.co.kr" },
          { name: "랠릿", url: "rallit.com" },
          { name: "링크드인", url: "linkedin.com" },
        ],
      },
      {
        name: "연봉·기업정보",
        sites: [
          { name: "잡플래닛", url: "jobplanet.co.kr" },
          { name: "블라인드", url: "teamblind.com" },
          { name: "크레딧잡", url: "creditjob.com" },
          { name: "사람인 연봉", url: "saramin.co.kr" },
          { name: "잡코리아 연봉", url: "jobkorea.co.kr" },
        ],
      },
      {
        name: "프리랜서·부업",
        sites: [
          { name: "크몽", url: "kmong.com" },
          { name: "숨고", url: "soomgo.com" },
          { name: "위시켓", url: "wishket.com" },
          { name: "탈잉", url: "taling.me" },
          { name: "프립", url: "frip.co.kr" },
        ],
      },
      {
        name: "공무원·공기업",
        sites: [
          { name: "나라일터", url: "gojobs.go.kr" },
          { name: "공무원닷컴", url: "gongmuwon.com" },
          { name: "에듀윌", url: "eduwill.net" },
          { name: "공기업 채용", url: "alio.go.kr" },
        ],
      },
    ],
  },
  {
    name: "음식 및 배달",
    basePointValue: 200,
    subCategories: [
      {
        name: "음식 배달",
        sites: [
          { name: "배달의민족", url: "baemin.com" },
          { name: "쿠팡이츠", url: "coupangeats.com" },
          { name: "요기요", url: "yogiyo.co.kr" },
          { name: "땡겨요", url: "ddangyo.com" },
          { name: "위메프오", url: "wmpo.wemakeprice.com" },
        ],
      },
      {
        name: "맛집 정보·리뷰",
        sites: [
          { name: "망고플레이트", url: "mangoplate.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "식신", url: "siksinhot.com" },
          { name: "네이버 플레이스", url: "map.naver.com" },
          { name: "다이닝코드", url: "diningcode.com" },
        ],
      },
      {
        name: "장보기·마트",
        sites: [
          { name: "쿠팡", url: "coupang.com" },
          { name: "마켓컬리", url: "kurly.com" },
          { name: "SSG", url: "ssg.com" },
          { name: "이마트몰", url: "emart.ssg.com" },
          { name: "롯데온", url: "lotteon.com" },
        ],
      },
      {
        name: "밀키트·간편식",
        sites: [
          { name: "마켓컬리", url: "kurly.com" },
          { name: "쿡킷", url: "cookit.co.kr" },
          { name: "헬로네이처", url: "hellonature.net" },
          { name: "프레시지", url: "freshage.co.kr" },
        ],
      },
      {
        name: "레시피·요리",
        sites: [
          { name: "만개의레시피", url: "10000recipe.com" },
          { name: "쿠킹엠", url: "cookingm.com" },
          { name: "해먹남녀", url: "haemukja.com" },
          { name: "백종원의요리비책", url: "youtube.com" },
        ],
      },
    ],
  },
  {
    name: "자동차 및 모빌리티",
    basePointValue: 800,
    subCategories: [
      {
        name: "신차·중고차 거래",
        sites: [
          { name: "엔카", url: "encar.com" },
          { name: "KB차차차", url: "kbchachacha.com" },
          { name: "보배드림", url: "bobaedream.co.kr" },
          { name: "헤이딜러", url: "heydealer.com" },
          { name: "K카", url: "kcar.com" },
        ],
      },
      {
        name: "전기차·친환경차",
        sites: [
          { name: "테슬라", url: "tesla.com/ko_kr" },
          { name: "현대자동차", url: "hyundai.com" },
          { name: "EV Post", url: "evpost.co.kr" },
          { name: "전기차 충전소", url: "ev.or.kr" },
          { name: "전기차 커뮤니티", url: "cafe.naver.com/ev" },
        ],
      },
      {
        name: "카셰어링·렌터카",
        sites: [
          { name: "쏘카", url: "socar.kr" },
          { name: "그린카", url: "greencar.co.kr" },
          { name: "롯데렌터카", url: "lotterentacar.net" },
          { name: "AJ렌터카", url: "ajrentacar.co.kr" },
          { name: "SK렌터카", url: "skcarrental.com" },
        ],
      },
      {
        name: "자동차 커뮤니티",
        sites: [
          { name: "보배드림", url: "bobaedream.co.kr" },
          { name: "클리앙 자동차", url: "clien.net" },
          { name: "SLR클럽 자동차", url: "slrclub.com" },
          { name: "오토타임즈", url: "autotimes.co.kr" },
          { name: "네이버 자동차 카페", url: "cafe.naver.com/car" },
        ],
      },
      {
        name: "자동차 보험·정비",
        sites: [
          { name: "보험다모아", url: "e-insmarket.or.kr" },
          { name: "카닥", url: "cardoc.co.kr" },
          { name: "불스원", url: "bullsone.com" },
          { name: "카카오모빌리티", url: "kakaomobility.com" },
        ],
      },
    ],
  },
  {
    name: "문화 및 엔터테인먼트",
    basePointValue: 300,
    subCategories: [
      {
        name: "영화·OTT",
        sites: [
          { name: "넷플릭스", url: "netflix.com" },
          { name: "티빙", url: "tving.com" },
          { name: "왓챠", url: "watcha.com" },
          { name: "웨이브", url: "wavve.com" },
          { name: "디즈니플러스", url: "disneyplus.com" },
        ],
      },
      {
        name: "공연·전시·콘서트",
        sites: [
          { name: "인터파크 티켓", url: "ticket.interpark.com" },
          { name: "멜론티켓", url: "ticket.melon.com" },
          { name: "예스24 티켓", url: "ticket.yes24.com" },
          { name: "티켓링크", url: "ticketlink.co.kr" },
          { name: "네이버 예약", url: "booking.naver.com" },
        ],
      },
      {
        name: "웹툰·도서",
        sites: [
          { name: "네이버 웹툰", url: "comic.naver.com" },
          { name: "카카오페이지", url: "page.kakao.com" },
          { name: "밀리의서재", url: "millie.co.kr" },
          { name: "리디북스", url: "ridibooks.com" },
          { name: "교보문고", url: "kyobobook.co.kr" },
        ],
      },
      {
        name: "게임·e스포츠",
        sites: [
          { name: "스팀", url: "steampowered.com" },
          { name: "인벤", url: "inven.co.kr" },
          { name: "루리웹", url: "ruliweb.com" },
          { name: "트위치", url: "twitch.tv" },
          { name: "아프리카TV", url: "afreecatv.com" },
        ],
      },
      {
        name: "음악·스트리밍",
        sites: [
          { name: "멜론", url: "melon.com" },
          { name: "지니뮤직", url: "genie.co.kr" },
          { name: "플로", url: "music-flo.com" },
          { name: "유튜브 뮤직", url: "music.youtube.com" },
          { name: "스포티파이", url: "spotify.com" },
        ],
      },
    ],
  },
  {
    name: "육아·가족·반려동물",
    basePointValue: 500,
    subCategories: [
      {
        name: "임신·출산·육아",
        sites: [
          { name: "맘스홀릭베이비", url: "cafe.naver.com/imsanbu" },
          { name: "베이비뉴스", url: "ibabynews.com" },
          { name: "차이의놀이", url: "havitplay.com" },
          { name: "82쿡 육아", url: "82cook.com" },
          { name: "맘카페", url: "cafe.naver.com/mamcafe" },
        ],
      },
      {
        name: "키즈용품·장난감",
        sites: [
          { name: "토이저러스", url: "toysrus.co.kr" },
          { name: "베이비페어", url: "babyfair.co.kr" },
          { name: "아이소리", url: "isori.co.kr" },
          { name: "쿠팡 키즈", url: "coupang.com" },
          { name: "11번가 베이비", url: "11st.co.kr" },
        ],
      },
      {
        name: "결혼·웨딩",
        sites: [
          { name: "웨딩북", url: "weddingbook.co.kr" },
          { name: "아이웨딩", url: "iwedding.co.kr" },
          { name: "더웨딩", url: "thewedding.co.kr" },
          { name: "웨딩 커뮤니티", url: "cafe.naver.com/directwedding" },
          { name: "마리앤", url: "marianne.co.kr" },
        ],
      },
      {
        name: "반려동물",
        sites: [
          { name: "펫프렌즈", url: "petfriends.co.kr" },
          { name: "마이펫", url: "mypet.co.kr" },
          { name: "펫닥", url: "petdoc.co.kr" },
          { name: "강아지 카페", url: "cafe.naver.com/dogpalza" },
          { name: "고양이 카페", url: "cafe.naver.com/ilovecat" },
        ],
      },
    ],
  },
  {
    name: "생활편의 및 서비스",
    basePointValue: 400,
    subCategories: [
      {
        name: "생활 서비스 매칭",
        sites: [
          { name: "숨고", url: "soomgo.com" },
          { name: "크몽", url: "kmong.com" },
          { name: "헬프미", url: "helpme.co.kr" },
          { name: "프립", url: "frip.co.kr" },
          { name: "탈잉", url: "taling.me" },
        ],
      },
      {
        name: "커뮤니티·정보",
        sites: [
          { name: "디시인사이드", url: "dcinside.com" },
          { name: "에펨코리아", url: "fmkorea.com" },
          { name: "네이버 카페", url: "cafe.naver.com" },
          { name: "82쿡", url: "82cook.com" },
          { name: "클리앙", url: "clien.net" },
        ],
      },
      {
        name: "법률·세무·행정",
        sites: [
          { name: "로톡", url: "lawtalk.co.kr" },
          { name: "정부24", url: "gov.kr" },
          { name: "홈택스", url: "hometax.go.kr" },
          { name: "삼쩜삼", url: "3o3.co.kr" },
          { name: "대한법률구조공단", url: "klac.or.kr" },
        ],
      },
      {
        name: "통신·인터넷",
        sites: [
          { name: "SKT", url: "skt.com" },
          { name: "KT", url: "kt.com" },
          { name: "LG U+", url: "uplus.co.kr" },
          { name: "알뜰폰 비교", url: "mvno.or.kr" },
        ],
      },
    ],
  },
  {
    name: "지역정보·플레이스",
    basePointValue: 200,
    subCategories: [
      {
        name: "맛집·음식점",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "망고플레이트", url: "mangoplate.com" },
          { name: "다이닝코드", url: "diningcode.com" },
          { name: "식신", url: "siksinhot.com" },
        ],
      },
      {
        name: "병원·의원·약국",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "굿닥", url: "goodoc.co.kr" },
          { name: "똑닥", url: "ddocdoc.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "모두닥", url: "modoodoc.com" },
        ],
      },
      {
        name: "미용실·헤어샵",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오 헤어샵", url: "hairshop.kakao.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "네이버 예약", url: "booking.naver.com" },
        ],
      },
      {
        name: "카페·디저트",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "인스타그램", url: "instagram.com" },
          { name: "망고플레이트", url: "mangoplate.com" },
        ],
      },
      {
        name: "헬스장·필라테스·요가",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "다짐", url: "dagym.co.kr" },
          { name: "클래스패스", url: "classpass.com" },
        ],
      },
      {
        name: "네일·왁싱·피부관리샵",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "네이버 예약", url: "booking.naver.com" },
          { name: "강남언니", url: "gangnamunni.com" },
        ],
      },
      {
        name: "학원·교습소",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "학원나라", url: "hagwonnara.com" },
          { name: "김과외", url: "kimgwaoe.co.kr" },
        ],
      },
      {
        name: "동물병원·펫샵",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "펫닥", url: "petdoc.co.kr" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "어바웃펫", url: "aboutpet.co.kr" },
        ],
      },
      {
        name: "자동차정비·세차",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카닥", url: "cardoc.co.kr" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "타이어픽", url: "tirepick.com" },
        ],
      },
      {
        name: "세탁소·수선·생활편의",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "카카오맵", url: "map.kakao.com" },
          { name: "런드리고", url: "laundrygo.com" },
          { name: "숨고", url: "soomgo.com" },
        ],
      },
      {
        name: "치과·안과·한의원",
        sites: [
          { name: "네이버 플레이스", url: "m.place.naver.com" },
          { name: "모두닥", url: "modoodoc.com" },
          { name: "굿닥", url: "goodoc.co.kr" },
          { name: "카카오맵", url: "map.kakao.com" },
        ],
      },
      {
        name: "부동산중개·공인중개사",
        sites: [
          { name: "네이버 부동산", url: "land.naver.com" },
          { name: "직방", url: "zigbang.com" },
          { name: "다방", url: "dabangapp.com" },
          { name: "카카오맵", url: "map.kakao.com" },
        ],
      },
    ],
  },
  {
    name: "B2B·창업·업무도구",
    basePointValue: 1000,
    subCategories: [
      {
        name: "협업툴·업무관리",
        sites: [
          { name: "노션", url: "notion.so" },
          { name: "슬랙", url: "slack.com" },
          { name: "지라", url: "atlassian.com/software/jira" },
          { name: "아사나", url: "asana.com" },
          { name: "트렐로", url: "trello.com" },
        ],
      },
      {
        name: "마케팅·CRM·광고",
        sites: [
          { name: "카카오모먼트", url: "moment.kakao.com" },
          { name: "네이버 광고", url: "searchad.naver.com" },
          { name: "페이스북 광고", url: "business.facebook.com" },
          { name: "채널톡", url: "channel.io" },
          { name: "세일즈포스", url: "salesforce.com" },
        ],
      },
      {
        name: "창업·프랜차이즈",
        sites: [
          { name: "창업넷", url: "changupnet.co.kr" },
          { name: "소상공인시장진흥공단", url: "semas.or.kr" },
          { name: "프랜차이즈월드", url: "franchiseworld.co.kr" },
          { name: "창업 커뮤니티", url: "cafe.naver.com/changup" },
          { name: "배달창업", url: "cafe.naver.com/delivery" },
        ],
      },
      {
        name: "회계·세무·노무",
        sites: [
          { name: "삼쩜삼", url: "3o3.co.kr" },
          { name: "더존 SmartA", url: "douzone.com" },
          { name: "로움 노무사", url: "roum.co.kr" },
          { name: "국세청 홈택스", url: "hometax.go.kr" },
          { name: "노무사 카페", url: "cafe.naver.com/nomu" },
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────────
// 확장된 광고주(캠페인) 데이터 (30개)
// ──────────────────────────────────────────────
const campaigns = [
  // 여행 및 레저
  {
    title: "제주도 봄 여행 프로모션",
    description: "제주도 항공권+숙소 패키지 특별 할인 캠페인",
    category: "여행",
    keywords: ["제주도", "여행", "항공권", "숙박", "리조트", "국내여행", "제주"],
    budget: 1000000,
    costPerMatch: 500,
    url: "https://www.jejuair.net",
    siteName: "제주항공",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "해외여행 보험 가입 이벤트",
    description: "해외여행 시 필수! 여행자 보험 특별 할인",
    category: "여행",
    keywords: ["해외여행", "보험", "여행보험", "안전", "유럽여행", "동남아"],
    budget: 500000,
    costPerMatch: 300,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "글램핑·캠핑 장비 특가전",
    description: "봄맞이 캠핑 장비 & 글램핑 예약 패키지 할인",
    category: "여행",
    keywords: ["캠핑", "글램핑", "차박", "텐트", "캠핑장", "아웃도어"],
    budget: 600000,
    costPerMatch: 400,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 디지털·IT·전자제품
  {
    title: "프리미엄 노트북 런칭 캠페인",
    description: "최신 노트북 신제품 출시 기념 이벤트",
    category: "디지털",
    keywords: ["노트북", "컴퓨터", "맥북", "업무용", "게이밍", "태블릿", "아이패드"],
    budget: 2000000,
    costPerMatch: 800,
    url: "https://www.apple.com/kr/macbook-pro",
    siteName: "Apple MacBook Pro",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "스마트폰 보상판매 프로그램",
    description: "기존 스마트폰 보상판매로 새 폰 할인",
    category: "디지털",
    keywords: ["스마트폰", "핸드폰", "갤럭시", "아이폰", "휴대폰", "보상판매"],
    budget: 1500000,
    costPerMatch: 600,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "프리미엄 가전 페스타",
    description: "LG·삼성·다이슨 인기 가전 최대 30% 할인",
    category: "디지털",
    keywords: ["가전", "냉장고", "에어컨", "세탁기", "건조기", "청소기", "다이슨"],
    budget: 1800000,
    costPerMatch: 700,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 쇼핑 및 패션
  {
    title: "봄 신상 패션 컬렉션",
    description: "S/S 신상품 선공개 및 특별 할인 이벤트",
    category: "패션",
    keywords: ["패션", "옷", "의류", "신상", "봄옷", "코디", "향수", "남성향수"],
    budget: 1000000,
    costPerMatch: 350,
    url: "https://www.ralphlauren.co.kr",
    siteName: "Ralph Lauren",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "명품 리셀 인증 서비스",
    description: "정품 인증 100% 보장! 명품 리셀 플랫폼 수수료 할인",
    category: "패션",
    keywords: ["명품", "리셀", "중고명품", "구찌", "샤넬", "루이비통", "스니커즈"],
    budget: 1200000,
    costPerMatch: 500,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "올리브영 뷰티 페스타",
    description: "인기 화장품·스킨케어 최대 50% 할인 이벤트",
    category: "패션",
    keywords: ["화장품", "뷰티", "스킨케어", "메이크업", "선크림", "올리브영"],
    budget: 900000,
    costPerMatch: 300,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 건강 및 뷰티케어
  {
    title: "프리미엄 헬스장 체험권",
    description: "전국 프리미엄 헬스장 1주일 무료 체험",
    category: "건강",
    keywords: ["헬스", "운동", "피트니스", "다이어트", "건강", "헬스장", "PT"],
    budget: 600000,
    costPerMatch: 300,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "건강식품 정기배송 서비스",
    description: "맞춤형 건강식품 정기배송 첫 달 50% 할인",
    category: "건강",
    keywords: ["건강식품", "영양제", "비타민", "건강관리", "식단", "프로틴"],
    budget: 900000,
    costPerMatch: 450,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "피부과·성형 상담 이벤트",
    description: "강남언니 앱 통해 무료 상담 + 시술 할인쿠폰",
    category: "건강",
    keywords: ["성형", "피부과", "시술", "보톡스", "필러", "레이저", "피부관리"],
    budget: 700000,
    costPerMatch: 400,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 교육 및 자기계발
  {
    title: "온라인 영어회화 3개월 무료 체험",
    description: "AI 기반 1:1 영어회화 서비스 무료 체험",
    category: "교육",
    keywords: ["영어", "영어회화", "어학", "영어공부", "토익", "외국어", "일본어"],
    budget: 800000,
    costPerMatch: 400,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "코딩 부트캠프 할인 이벤트",
    description: "프로그래밍/개발 교육 과정 특별 할인",
    category: "교육",
    keywords: ["코딩", "프로그래밍", "개발", "부트캠프", "IT", "웹개발", "파이썬"],
    budget: 1200000,
    costPerMatch: 700,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "자격증 합격 패키지",
    description: "에듀윌 인기 자격증 합격보장 패키지 30% 할인",
    category: "교육",
    keywords: ["자격증", "공무원", "토익", "공인중개사", "전기기사", "한능검"],
    budget: 700000,
    costPerMatch: 500,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 금융 및 재테크
  {
    title: "신용카드 신규 발급 이벤트",
    description: "연회비 면제 + 10만 포인트 적립 혜택",
    category: "금융",
    keywords: ["카드", "신용카드", "금융", "혜택", "포인트", "체크카드", "캐시백"],
    budget: 2000000,
    costPerMatch: 1000,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "주식 계좌 개설 이벤트",
    description: "토스증권 신규 계좌 개설 시 주식 1주 무료 증정",
    category: "금융",
    keywords: ["주식", "증권", "투자", "주식투자", "ETF", "해외주식", "계좌"],
    budget: 1500000,
    costPerMatch: 900,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "대출 금리비교 서비스",
    description: "핀다에서 최저금리 대출 비교하고 0.5% 추가 할인",
    category: "금융",
    keywords: ["대출", "금리", "주택담보", "전세대출", "신용대출", "금리비교"],
    budget: 1000000,
    costPerMatch: 800,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 부동산 및 주거
  {
    title: "신규 분양 알림 서비스",
    description: "내 조건에 맞는 분양·청약 정보 실시간 알림",
    category: "부동산",
    keywords: ["분양", "청약", "아파트", "부동산", "입주", "모델하우스", "신축"],
    budget: 1200000,
    costPerMatch: 800,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "오늘의집 인테리어 패키지",
    description: "원룸부터 신혼집까지 맞춤 인테리어 컨설팅 무료",
    category: "부동산",
    keywords: ["인테리어", "가구", "이사", "집꾸미기", "리모델링", "원룸", "신혼집"],
    budget: 800000,
    costPerMatch: 500,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 취업 및 커리어
  {
    title: "이력서 첨삭·면접 코칭",
    description: "이력서 첨삭부터 면접 코칭까지 무료 체험",
    category: "취업",
    keywords: ["취업", "이력서", "면접", "구직", "채용", "경력", "자소서", "컨설팅"],
    budget: 800000,
    costPerMatch: 600,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "IT 개발자 채용 매칭",
    description: "원티드 AI 매칭으로 나에게 맞는 IT 기업 추천",
    category: "취업",
    keywords: ["개발자", "IT채용", "스타트업", "프론트엔드", "백엔드", "연봉"],
    budget: 1000000,
    costPerMatch: 700,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 음식 및 배달
  {
    title: "맛집 구독 서비스 출시",
    description: "전국 인기 맛집 밀키트 구독 서비스",
    category: "음식",
    keywords: ["맛집", "음식", "밀키트", "배달", "요리", "레스토랑", "간편식"],
    budget: 700000,
    costPerMatch: 350,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "신선식품 새벽배송 첫 주문 할인",
    description: "마켓컬리 신규 가입 시 첫 주문 50% 할인",
    category: "음식",
    keywords: ["장보기", "마트", "새벽배송", "신선식품", "쿠팡", "컬리", "식재료"],
    budget: 600000,
    costPerMatch: 200,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 자동차 및 모빌리티
  {
    title: "전기차 시승 이벤트",
    description: "최신 전기차 무료 시승 체험 프로그램",
    category: "자동차",
    keywords: ["자동차", "전기차", "시승", "차량", "EV", "테슬라", "현대"],
    budget: 1500000,
    costPerMatch: 900,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "자동차 보험 비교 서비스",
    description: "최대 5개 보험사 비교 견적으로 최저가 자동차 보험",
    category: "자동차",
    keywords: ["자동차보험", "보험비교", "보험료", "갱신", "다이렉트보험"],
    budget: 1000000,
    costPerMatch: 700,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 문화 및 엔터테인먼트
  {
    title: "OTT 통합 구독권",
    description: "넷플릭스+티빙+디즈니+ 3개월 특가",
    category: "문화",
    keywords: ["OTT", "넷플릭스", "티빙", "영화", "드라마", "구독", "스트리밍", "디즈니"],
    budget: 800000,
    costPerMatch: 300,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "공연·콘서트 얼리버드 할인",
    description: "인기 공연·콘서트 얼리버드 예매 시 20% 할인",
    category: "문화",
    keywords: ["공연", "콘서트", "뮤지컬", "전시", "티켓", "예매", "페스티벌"],
    budget: 600000,
    costPerMatch: 250,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 육아·가족·반려동물
  {
    title: "반려동물 건강관리 패키지",
    description: "반려동물 건강검진 + 사료 정기배송 첫 달 무료",
    category: "육아",
    keywords: ["반려동물", "강아지", "고양이", "사료", "펫", "동물병원", "산책"],
    budget: 700000,
    costPerMatch: 400,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "키즈용품 시즌오프 세일",
    description: "유아·키즈 인기 브랜드 최대 60% 시즌오프 세일",
    category: "육아",
    keywords: ["육아", "유아", "키즈", "아기", "장난감", "출산", "유모차"],
    budget: 500000,
    costPerMatch: 300,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 지역정보·플레이스
  {
    title: "네이버플레이스 지역 맛집 찾기",
    description: "내 주변 맛집·음식점을 네이버플레이스에서 검색하고 리뷰 확인",
    category: "지역정보",
    keywords: ["맛집", "음식점", "근처맛집", "주변맛집", "점심", "저녁", "브런치", "혼밥", "회식장소", "데이트맛집", "가족외식"],
    budget: 500000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 병원·의원 찾기",
    description: "내 주변 병원·의원·약국을 네이버플레이스에서 검색하고 진료시간 확인",
    category: "지역정보",
    keywords: ["병원", "의원", "약국", "내과", "이비인후과", "정형외과", "소아과", "피부과", "치과", "안과", "한의원", "응급실"],
    budget: 500000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 미용실·뷰티샵 찾기",
    description: "내 주변 미용실·헤어샵·네일샵을 네이버플레이스에서 검색하고 예약",
    category: "지역정보",
    keywords: ["미용실", "헤어샵", "네일샵", "왁싱", "피부관리", "속눈썹", "머리", "펌", "염색", "커트", "탈색"],
    budget: 300000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 카페·디저트 찾기",
    description: "내 주변 카페·디저트 맛집을 네이버플레이스에서 검색",
    category: "지역정보",
    keywords: ["카페", "커피", "디저트", "베이커리", "케이크", "브런치카페", "스터디카페", "작업하기좋은카페"],
    budget: 300000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 헬스·운동시설 찾기",
    description: "내 주변 헬스장·필라테스·요가·수영장을 네이버플레이스에서 검색",
    category: "지역정보",
    keywords: ["헬스장", "필라테스", "요가", "수영장", "크로스핏", "PT", "운동", "체육관", "GX"],
    budget: 300000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 학원·교육 찾기",
    description: "내 주변 학원·교습소·과외를 네이버플레이스에서 검색",
    category: "지역정보",
    keywords: ["학원", "영어학원", "수학학원", "입시", "과외", "피아노", "미술학원", "태권도", "코딩학원"],
    budget: 300000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 동물병원·펫 찾기",
    description: "내 주변 동물병원·펫샵·펫카페를 네이버플레이스에서 검색",
    category: "지역정보",
    keywords: ["동물병원", "펫샵", "펫카페", "애견미용", "고양이카페", "반려동물병원"],
    budget: 200000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 자동차정비·세차 찾기",
    description: "내 주변 자동차정비소·세차장·타이어샵을 네이버플레이스에서 검색",
    category: "지역정보",
    keywords: ["자동차정비", "세차", "타이어", "오일교환", "광택", "자동차수리", "정비소"],
    budget: 200000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "네이버플레이스 생활편의시설 찾기",
    description: "내 주변 세탁소·수선집·열쇠·편의점 등 생활편의시설 검색",
    category: "지역정보",
    keywords: ["세탁소", "수선", "열쇠", "편의점", "마트", "슈퍼", "꽃집", "인쇄소", "사진관"],
    budget: 200000,
    costPerMatch: 100,
    url: "https://m.place.naver.com",
    siteName: "네이버 플레이스",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // 생활편의 및 서비스
  {
    title: "생활 서비스 첫 이용 할인",
    description: "숨고·크몽 생활 서비스 첫 이용 시 30% 할인",
    category: "생활",
    keywords: ["생활서비스", "이사", "청소", "수리", "인테리어", "세탁"],
    budget: 500000,
    costPerMatch: 300,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },

  // B2B·창업·업무도구
  {
    title: "노션 비즈니스 무료 체험",
    description: "노션 비즈니스 플랜 3개월 무료 체험 이벤트",
    category: "B2B",
    keywords: ["노션", "협업툴", "업무관리", "프로젝트관리", "문서관리", "팀워크"],
    budget: 1500000,
    costPerMatch: 1000,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
  {
    title: "소상공인 창업 지원 패키지",
    description: "창업 컨설팅 + 마케팅 + 세무 3종 원스톱 지원",
    category: "B2B",
    keywords: ["창업", "소상공인", "프랜차이즈", "사업", "스타트업", "마케팅"],
    budget: 1200000,
    costPerMatch: 800,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
  },
];

// ──────────────────────────────────────────────
// 시딩 함수
// ──────────────────────────────────────────────

async function seedCategoriesAndSites() {
  console.log("Seeding Category & Site (분야별 매칭 사이트)...");
  let categoryCount = 0;
  let siteCount = 0;

  for (const cat of categorySiteData) {
    const parent = await prisma.category.create({
      data: { name: cat.name, basePointValue: cat.basePointValue },
    });
    categoryCount++;

    for (const sub of cat.subCategories) {
      const child = await prisma.category.create({
        data: { name: sub.name, parentId: parent.id, basePointValue: cat.basePointValue },
      });
      categoryCount++;

      for (let i = 0; i < sub.sites.length; i++) {
        await prisma.site.create({
          data: {
            categoryId: child.id,
            name: sub.sites[i].name,
            url: sub.sites[i].url,
            priority: i + 1,
            isPremium: i === 0,
          },
        });
        siteCount++;
      }
    }
  }
  console.log(`  ✓ Seeded ${categoryCount} categories, ${siteCount} sites`);
}

async function main() {
  // ── 0. 기존 데이터 초기화 (중복 방지) ──
  console.log("Cleaning existing data...");
  await prisma.site.deleteMany();
  await prisma.category.deleteMany();
  await prisma.match.deleteMany();
  await prisma.campaign.deleteMany();
  console.log("  ✓ Cleaned");

  // ── 1. 관리자 계정 ──
  console.log("Seeding admin user...");
  const adminPassword = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@intendex.kr" },
    update: { role: "admin", passwordHash: adminPassword },
    create: {
      email: "admin@intendex.kr",
      name: "관리자",
      role: "admin",
      passwordHash: adminPassword,
    },
  });
  console.log("  ✓ Admin: admin@intendex.kr / admin1234");

  // ── 2. 분야별 카테고리 & 사이트 ──
  await seedCategoriesAndSites();

  // ── 3. 캠페인 (광고주) ──
  console.log("Seeding campaigns...");
  for (const c of campaigns) {
    await prisma.campaign.create({ data: c });
  }
  console.log(`  ✓ Seeded ${campaigns.length} campaigns`);

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
