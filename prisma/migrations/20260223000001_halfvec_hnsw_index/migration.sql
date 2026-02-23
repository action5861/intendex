-- Campaign 임베딩에 halfvec 캐스트 HNSW 인덱스 생성
--
-- 배경:
--   pgvector의 HNSW/IVFFlat 인덱스는 vector 타입 기준 최대 2000차원 제한.
--   gemini-embedding-001은 3072차원이므로 기존에는 exact scan(순차 탐색) 사용 중.
--
-- 해결:
--   pgvector 0.7.0+ 에서 추가된 halfvec(16비트 부동소수점) 타입은 최대 4000차원까지 인덱싱 가능.
--   컬럼 타입은 vector(3072) 그대로 유지하고, 인덱스 생성 및 쿼리 시점에만 ::halfvec(3072) 캐스트 적용.
--   float32→float16 변환으로 정밀도 미세 손실이 있으나 코사인 유사도 검색에서 실측 영향 미미(<1% 리콜 차이).

CREATE INDEX IF NOT EXISTS "Campaign_embedding_halfvec_hnsw_idx"
  ON "Campaign"
  USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);
