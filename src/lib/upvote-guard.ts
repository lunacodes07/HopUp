import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { clientIp } from "@/lib/client-ip";
import { voterHash } from "@/lib/voter-hash";

const YEAR_SECONDS = 60 * 60 * 24 * 400;
const VOTE_PREFIX = "upvote:v1:";

let redis: Redis | null | undefined;
let dailyLimit: Ratelimit | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? Redis.fromEnv()
      : null;
  return redis;
}

function getDailyLimit(): Ratelimit | null {
  if (dailyLimit !== undefined) return dailyLimit;
  const store = getRedis();
  dailyLimit = store
    ? new Ratelimit({
        redis: store,
        limiter: Ratelimit.slidingWindow(20, "1 d"),
        prefix: "upvote-limit",
      })
    : null;
  return dailyLimit;
}

export { voterHash };

export function voterHashFromRequest(request: Request): string {
  return voterHash(clientIp(request));
}

export async function upvoteRateLimited(hash: string): Promise<boolean> {
  const limit = getDailyLimit();
  if (!limit) return false;
  const { success } = await limit.limit(hash);
  return !success;
}

export async function claimUpvote(hash: string, productId: string): Promise<"claimed" | "duplicate" | "unavailable"> {
  const store = getRedis();
  if (!store) return "unavailable";
  const ok = await store.set(`${VOTE_PREFIX}${hash}:${productId}`, "1", {
    nx: true,
    ex: YEAR_SECONDS,
  });
  return ok ? "claimed" : "duplicate";
}

export async function releaseUpvote(hash: string, productId: string) {
  const store = getRedis();
  if (!store) return;
  await store.del(`${VOTE_PREFIX}${hash}:${productId}`);
}
