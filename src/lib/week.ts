export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type WeekListing = {
  id: string;
  price: number;
  category?: string;
  created_at?: string;
  last_hopped_at?: string;
  /** Latest payment only. Null means the launch fallback: lifetime price while the hop is inside 7 days. */
  week_bid?: number | null;
  is_hof?: boolean | null;
};

export function hoppedAt(item: { last_hopped_at?: string; created_at?: string }) {
  return new Date(item.last_hopped_at || item.created_at || 0).getTime();
}

function createdAt(item: { created_at?: string }) {
  return new Date(item.created_at || 0).getTime();
}

/** This week's sort key. A Hall of Fame payment stores 0 so the plaque does not set the week price. */
export function weekBid(item: WeekListing, now = Date.now()): number {
  const at = hoppedAt(item);
  const fresh = Number.isFinite(at) && at > 0 && now - at <= WEEK_MS;
  if (typeof item.week_bid === "number") {
    if (!fresh || item.week_bid <= 0) return 0;
    return item.week_bid;
  }
  if (!fresh) return 0;
  return Math.max(0, item.price || 0);
}

export function matchesCategory(category: string | undefined, filter: string) {
  if (!filter || filter === "All") return true;
  return (category || "").toLowerCase().includes(filter.toLowerCase());
}

/** Pinned Hall of Fame. Time does not clear it. Before `is_hof` exists, the highest lifetime price is the holder. */
export function findHof<T extends WeekListing>(products: T[]): T | null {
  const flagged = products.filter((p) => p.is_hof === true);
  const pool = flagged.length > 0 ? flagged : products.length >= 2 ? products : [];
  if (pool.length === 0) return null;
  return pool.reduce((top, p) => {
    if (p.price !== top.price) return p.price > top.price ? p : top;
    return hoppedAt(p) <= hoppedAt(top) ? p : top;
  });
}

export function thisWeekList<T extends WeekListing>(products: T[], now = Date.now()): T[] {
  const hofId = findHof(products)?.id;
  return products
    .filter((p) => p.id !== hofId && weekBid(p, now) > 0)
    .sort((a, b) => weekBid(b, now) - weekBid(a, now) || hoppedAt(a) - hoppedAt(b));
}

export function allTimeList<T extends WeekListing>(products: T[]): T[] {
  const hofId = findHof(products)?.id;
  return products
    .filter((p) => p.id !== hofId)
    .sort((a, b) => b.price - a.price || createdAt(a) - createdAt(b));
}

export function boardList<T extends WeekListing>(
  products: T[],
  mode: "week" | "alltime",
  now = Date.now()
): T[] {
  return mode === "week" ? thisWeekList(products, now) : allTimeList(products);
}

/** #1 costs the current top plus $1. An empty board costs the listing floor, and that payment is also #1. */
export function claimWeekPrice(topBid: number, floor: number) {
  if (topBid <= 0) return floor;
  return Math.max(floor, topBid + 1);
}

export function topWeekBid<T extends WeekListing>(products: T[], now = Date.now(), category?: string) {
  const hofId = findHof(products)?.id;
  let top = 0;
  for (const product of products) {
    if (product.id === hofId) continue;
    if (category && !matchesCategory(product.category, category)) continue;
    top = Math.max(top, weekBid(product, now));
  }
  return top;
}
