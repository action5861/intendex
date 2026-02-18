# 인텐덱스 (Intendex)

**당신의 의도가 자산이 되는 곳** — 하루 한 번 60초, 데이터 기본소득 서비스

AI와의 대화를 통해 사용자의 구매 의도·관심사를 추출하고, 광고주 캠페인과 매칭하여 포인트를 적립받는 플랫폼입니다.

---

## 주요 기능

### 사용자
- **AI 채팅**: AI와 자연스럽게 대화하며 관심사·의도를 공유
- **의도 추출**: 대화에서 Intent(카테고리, 키워드) 자동 추출 및 저장
- **캠페인 매칭**: 광고주 캠페인과 Intent 매칭 시 포인트 적립
- **Dwell 보상**: 추천 사이트 60초 이상 체류 시 일 1,000P 적립
- **출금**: 10,000P 이상 적립 시 출금 신청 가능

### 관리자 (Admin)
- **사용자 관리**: 회원 조회, 역할(user/admin) 전환, 포인트 수동 조정
- **광고주 관리**: 캠페인 CRUD, active/paused/completed 상태 관리
- **출금 관리**: 출금 신청 승인/거절

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js v5 (Credentials, JWT) |
| DB | PostgreSQL + Prisma |
| AI | Vercel AI SDK, Google Gemini 2.0 Flash |
| UI | React 19, Tailwind CSS, Radix UI, shadcn/ui |

---

## 프로젝트 구조

```
intendex/
├── prisma/
│   ├── schema.prisma    # DB 스키마
│   └── seed.ts          # 시드 데이터 (관리자, 캠페인)
├── scripts/
│   └── promote-admin.ts # 사용자를 admin으로 승격
├── src/
│   ├── app/
│   │   ├── (auth)/      # 로그인, 온보딩
│   │   ├── (main)/      # 대시보드, 채팅, 어드민 등 (사이드바 레이아웃)
│   │   ├── api/         # API 라우트
│   │   └── page.tsx     # 랜딩 페이지
│   ├── components/
│   │   ├── admin/       # 어드민 UI
│   │   ├── chat/        # 채팅, 광고 카드, Dwell 타이머
│   │   ├── common/      # 사이드바, 헤더, 프로바이더
│   │   ├── dashboard/   # 대시보드, 의도, 포인트
│   │   └── ui/          # shadcn 컴포넌트
│   ├── lib/             # auth, prisma, utils
│   ├── services/        # IntentService, MatchingService, RewardService
│   ├── stores/          # Zustand (채팅 등)
│   └── types/           # 공통 타입, INTENT_CATEGORIES
└── package.json
```

---

## 시작하기

### 1. 환경 변수

`.env` 또는 `.env.local` 파일 생성:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/intendex"
AUTH_SECRET="your-auth-secret"           # next-auth 세션 암호화
GOOGLE_GENERATIVE_AI_API_KEY="..."       # Gemini API (AI 채팅용)
```

### 2. 의존성 설치 및 DB 설정

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

### 3. 시드 데이터 (선택)

관리자 계정과 샘플 캠페인 생성:

```bash
npx prisma db seed
```

- 관리자: `admin@intendex.kr` / `admin1234`
- 가입 시 보너스: 5,000P

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

---

## 주요 흐름

1. **회원가입/로그인** → `POST /api/register`, NextAuth Credentials
2. **AI 채팅** → `/api/chat` (Google Gemini), 응답에서 `\`\`\`intents` JSON 블록 파싱
3. **Intent 저장** → `IntentService.saveExtractedIntents()` (confidence ≥ 0.7)
4. **매칭** → `MatchingService.matchIntentToCampaigns()` (카테고리·키워드 매칭)
5. **매칭 수락** → 포인트 적립, Transaction 기록
6. **Dwell 보상** → 추천 사이트 60초 체류 시 `/api/rewards/dwell` 호출, 일 1,000P 한도

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 실행 |
| `npm run promote-admin <이메일>` | 해당 이메일 사용자를 admin으로 승격 |

### Admin 계정 만들기

이미 가입한 사용자를 admin으로 변경:

```bash
npm run promote-admin user@example.com
```

이후 **로그아웃 후 다시 로그인**하면 사이드바에 관리 메뉴(사용자 관리, 광고주 관리, 출금 관리)가 표시됩니다.

---

## 보호 경로

미들웨어로 아래 경로는 로그인 필요:

- `/chat`, `/dashboard`, `/intents`, `/rewards`, `/settings`, `/onboarding`, `/admin`

---

## 라이선스

Private
