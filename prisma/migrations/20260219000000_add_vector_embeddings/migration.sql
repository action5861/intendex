-- pgvector 익스텐션 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- Campaign 임베딩 컬럼 추가 (768차원 = Google text-embedding-004)
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Intent 임베딩 컬럼 추가
ALTER TABLE "Intent" ADD COLUMN IF NOT EXISTS embedding vector(768);

-- HNSW 인덱스: 코사인 유사도 검색 최적화
-- m=16 (각 노드의 최대 연결 수), ef_construction=64 (인덱스 빌드 탐색 깊이)
-- 트레이드오프: m/ef_construction을 높이면 검색 정확도↑ 빌드 시간·메모리↑
CREATE INDEX IF NOT EXISTS "Campaign_embedding_hnsw_idx"
  ON "Campaign" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Intent는 검색 대상이 아니라 쿼리 주체이므로 일반 인덱스만 추가
CREATE INDEX IF NOT EXISTS "Intent_embedding_idx" ON "Intent" (id) WHERE embedding IS NOT NULL;
