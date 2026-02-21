-- ============================================================
-- 1단계 성능 최적화: 누락 인덱스 + Transaction 컬럼 분리
-- ============================================================

-- ── Transaction: source / refId 컬럼 추가 ───────────────────
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "refId"  TEXT;

-- 기존 레코드 backfill: metadata JSON → source 컬럼
UPDATE "Transaction"
SET source = (metadata->>'source')
WHERE source IS NULL
  AND metadata IS NOT NULL
  AND metadata->>'source' IS NOT NULL;

-- ── Conversation: userId + createdAt 복합 인덱스 ────────────
CREATE INDEX IF NOT EXISTS "Conversation_userId_createdAt_idx"
  ON "Conversation"("userId", "createdAt" DESC);

-- ── Message: conversationId + createdAt 인덱스 ──────────────
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx"
  ON "Message"("conversationId", "createdAt");

-- ── Intent: 복합 쿼리 / expiresAt 인덱스 ───────────────────
CREATE INDEX IF NOT EXISTS "Intent_expiresAt_idx"
  ON "Intent"("expiresAt");

CREATE INDEX IF NOT EXISTS "Intent_userId_status_createdAt_idx"
  ON "Intent"("userId", "status", "createdAt" DESC);

-- ── Match: intentId + status 복합 인덱스 ───────────────────
CREATE INDEX IF NOT EXISTS "Match_intentId_status_idx"
  ON "Match"("intentId", "status");

-- ── Transaction: userId + source + createdAt 복합 인덱스 ───
CREATE INDEX IF NOT EXISTS "Transaction_userId_source_createdAt_idx"
  ON "Transaction"("userId", "source", "createdAt" DESC);
