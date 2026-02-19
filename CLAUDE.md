# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npm run promote-admin  # Elevate user to admin role (see scripts/promote-admin.ts)
npx tsx scripts/backfill-embeddings.ts  # 기존 Campaign에 벡터 임베딩 일괄 생성

# Database
npx prisma migrate dev    # Apply migrations
npx prisma db push        # Sync schema without migrations
npx prisma db seed        # Seed with admin, categories, campaigns, sites
npx prisma studio         # Open DB browser
npx prisma generate       # Regenerate client after schema changes
```

No test framework is set up.

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/intendex"
AUTH_SECRET="your-auth-secret"
GOOGLE_GENERATIVE_AI_API_KEY="..."
```

## Architecture

### Route Groups
- `src/app/(auth)/` — Unauthenticated routes (login, register, onboarding)
- `src/app/(main)/` — Authenticated routes (chat, dashboard, intents, rewards, settings, admin) with sidebar layout
- `src/app/api/` — API routes

### Auth
- NextAuth v5 with Credentials provider (email/password, bcrypt 12 rounds)
- JWT sessions; JWT payload carries `id` and `role`
- **Middleware** (`src/middleware.ts`): Custom cookie-based check (`authjs.session-token`) — NOT NextAuth middleware, to avoid Edge Runtime + Prisma incompatibility
- Registration at `/api/register` grants 5,000P signup bonus

### AI Chat Pipeline (`src/app/api/chat/route.ts`)
- Model: Google Gemini 2.0 Flash via `@ai-sdk/google` (AI SDK v6)
- System prompt includes 14 intent categories, 100+ hardcoded site URLs, and point value guidelines
- AI embeds detected intents as a fenced ` ```intents ``` ` JSON block in its response
- Route extracts intents via regex, saves to DB if `confidence ≥ 0.7`
- Daily per-user intent point cap: 1,000P

### Services (`src/services/`)
| File | Responsibility |
|------|---------------|
| `intent.service.ts` | Extract & persist intents; threshold 0.7; 30-day expiry |
| `matching.service.ts` | Semantic scoring of intent→campaign (min score 0.4) |
| `reward.service.ts` | Points, balance, transactions; dwell rewards with 24h duplicate prevention |

**Matching score formula:**
```
Score = 0.25×CategoryValue + 0.25×SearchIntensity + 0.20×SiteReliability + 0.30×KeywordRelevance
```
Category weights range from 1.0 (금융/부동산) to 0.4 (비영리).

### Prisma Client
- Output: `src/generated/prisma` (custom output path)
- **Always import from** `@/generated/prisma/client`, not a barrel export
- Run `npx prisma generate` after any schema change

### State Management
- Zustand store at `src/stores/chat.store.ts` manages `conversationId` and `isExtracting`

### Key Business Rules
- Intent confidence threshold: 0.7
- Dwell reward requires 60+ seconds on recommended site
- Dwell daily cap: 1,000P per user; 24h duplicate URL prevention
- Withdrawal minimum: 10,000P; processed manually by admin
- Admin seed credentials: `admin@intendex.kr` / `admin1234`

## Intent Categories (14)
`여행`, `쇼핑`, `건강`, `교육`, `금융`, `음식`, `패션`, `테크`, `부동산`, `자동차`, `취미`, `지역정보`, `비영리`, `기타`
