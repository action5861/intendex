-- vector(768) → vector(3072) 변경
-- 컬럼이 모두 NULL이므로 DROP/ADD 방식으로 타입 변경
-- (데이터 손실 없음)

ALTER TABLE "Campaign" DROP COLUMN IF EXISTS embedding;
ALTER TABLE "Campaign" ADD COLUMN embedding vector(3072);

ALTER TABLE "Intent" DROP COLUMN IF EXISTS embedding;
ALTER TABLE "Intent" ADD COLUMN embedding vector(3072);

-- HNSW/IVFFlat 인덱스 모두 최대 2000차원 제한으로 3072차원에서 사용 불가
-- → exact scan (순차 탐색) 사용. LIMIT 50 쿼리이므로 수천 개 캠페인까지 충분히 허용.
-- 향후 text-embedding-004(768차원)으로 전환 시 인덱스 추가 예정.
DROP INDEX IF EXISTS "Campaign_embedding_hnsw_idx";
