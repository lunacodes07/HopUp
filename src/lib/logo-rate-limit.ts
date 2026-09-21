import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { clientIp } from "@/lib/client-ip";

let limit: Ratelimit | null | undefined;

function getLimit(): Ratelimit | null {
  if (limit !== undefined) return limit;
  const redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? Redis.fromEnv()
      : null;
  limit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        prefix: "logo-limit",
      })
    : null;
  return limit;
}

export async function logoRateLimited(request: Request): Promise<boolean> {
  const limiter = getLimit();
  if (!limiter) return false;
  const { success } = await limiter.limit(clientIp(request));
  return !success;
}
