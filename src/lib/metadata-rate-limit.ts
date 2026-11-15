import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { clientIp } from "@/lib/client-ip";

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? Redis.fromEnv()
      : null;
  limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        prefix: "metadata-limit",
      })
    : null;
  return limiter;
}

export async function metadataRateLimited(request: Request): Promise<boolean> {
  const current = getLimiter();
  if (!current) return false;
  const { success } = await current.limit(clientIp(request));
  return !success;
}
