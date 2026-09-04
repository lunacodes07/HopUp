import { getFormattedUrlInfo } from "@/lib/format-url";

export const DEFAULT_MIN_BID = 2;
export const LOL_MIN_BID = 1;

export function isLolUrl(raw: string): boolean {
  if (!raw.trim()) return false;
  try {
    const { finalUrl } = getFormattedUrlInfo(raw);
    const host = new URL(finalUrl).hostname.replace(/^www\./, "").toLowerCase();
    return host === "lol" || host.endsWith(".lol");
  } catch {
    return false;
  }
}

export function minBidForUrl(raw: string): number {
  return isLolUrl(raw) ? LOL_MIN_BID : DEFAULT_MIN_BID;
}
