import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createClient(): Redis {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 2,
    lazyConnect: true,        // 실제 명령 전까지 연결 지연
    enableReadyCheck: false,  // 연결 확인 비활성화 (빠른 시작)
    connectTimeout: 2000,
    commandTimeout: 1000,
  });

  client.on("error", (err: Error) => {
    // Redis 장애 시 앱은 계속 실행 (DB로 fallback)
    if (process.env.NODE_ENV !== "test") {
      console.error("[Redis] 연결 오류:", err.message);
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
