import { createHmac } from "crypto";

function voteSalt(): string {
  return (
    process.env.HOPUP_ADMIN_SECRET?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    "hopup-dev-upvote"
  );
}

export function voterHash(ip: string): string {
  return createHmac("sha256", voteSalt()).update(`upvote:${ip}`).digest("hex");
}
