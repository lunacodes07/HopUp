export const CREATOR_COOKIE = "hopup_ref";
export const CREATOR_CLICK_COOKIE = "hopup_clk";
export const CREATOR_CLICK_HOURS = 12;
export const CREATOR_COMMISSION = 0.25;
export const CREATOR_PAYOUT_MIN = 25;

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const RESERVED = new Set(["hopup", "stats", "admin", "c"]);

export function isCreatorSlug(value: string | null | undefined): value is string {
  const slug = (value || "").trim().toLowerCase();
  return SLUG.test(slug) && !RESERVED.has(slug);
}

export function normalizeCreatorSlug(value: string | null | undefined): string | null {
  const slug = (value || "").trim().toLowerCase();
  return isCreatorSlug(slug) ? slug : null;
}

export function creatorPath(slug: string) {
  return `/c/${slug}`;
}

export function creatorStatsPath(slug: string, key: string) {
  return `/c/${slug}/stats?k=${encodeURIComponent(key)}`;
}

export function cookieMaxAge(days: number) {
  return days * 24 * 60 * 60;
}
