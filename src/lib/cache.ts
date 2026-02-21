import { redis } from "./redis";

const NS = "idx:"; // 네임스페이스 prefix

// ── 캐시 키 생성 ────────────────────────────────────────────────
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export const CacheKeys = {
  /** 사용자 포인트 잔액 (TTL: 30s) */
  balance: (userId: string) => `${NS}bal:${userId}`,
  /** 오늘 의도 적립 통계 (TTL: 60s) */
  dailyStats: (userId: string) => `${NS}dstats:${userId}:${todayStr()}`,
};

// ── 범용 캐시 조회 / 저장 ───────────────────────────────────────
/**
 * Redis에 캐시된 값이 있으면 반환, 없으면 fetchFn 실행 후 저장.
 * Redis 장애 시 캐시 없이 DB 직접 조회로 graceful fallback.
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;
  } catch {
    // Redis 조회 실패 → DB fallback
  }

  const data = await fetchFn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // 저장 실패는 무시 (TTL 자연 만료로 처리)
  }

  return data;
}

// ── Rate Limiter (고정 윈도우) ───────────────────────────────────
/**
 * Redis 기반 고정 윈도우 rate limiter.
 * Redis 장애 시 허용으로 graceful degradation.
 *
 * @param key         고유 식별자 (예: `chat:userId`)
 * @param windowSecs  윈도우 크기 (초)
 * @param maxRequests 윈도우 내 최대 요청 수
 */
export async function checkRateLimit(
  key: string,
  windowSecs: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const window = Math.floor(Date.now() / 1000 / windowSecs);
  const redisKey = `${NS}rl:${key}:${window}`;
  const resetIn = (window + 1) * windowSecs - Math.floor(Date.now() / 1000);

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      // 첫 요청 시 TTL 설정 (윈도우의 2배로 여유있게)
      await redis.expire(redisKey, windowSecs * 2);
    }
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetIn,
    };
  } catch {
    // Redis 장애 → 허용 (앱 정상 운영 우선)
    return { allowed: true, remaining: maxRequests, resetIn: windowSecs };
  }
}

// ── 캐시 무효화 ────────────────────────────────────────────────
/**
 * 지정한 키를 즉시 삭제. 실패해도 앱 동작에 영향 없음 (TTL 자연 만료).
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // 무시 — 다음 TTL 만료 시 자동 정리
  }
}
