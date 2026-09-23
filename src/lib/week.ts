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

/** Numbered all-time spot after this payment. Hall of Fame stays off this list. A new brand loses ties. */
export function expectedAllTimeRank<T extends WeekListing>(
  products: T[],
  listing: T | null,
  payment: number,
) {
  const lifetime = Math.max(0, (listing?.price || 0) + payment);
  const created = listing ? createdAt(listing) : Number.POSITIVE_INFINITY;
  const hofId = findHof(products)?.id;
  let ahead = 0;
  for (const product of products) {
    if (product.id === hofId) continue;
    if (listing && product.id === listing.id) continue;
    const at = createdAt(product);
    if (product.price > lifetime || (product.price === lifetime && at < created)) ahead += 1;
  }
  return ahead + 1;
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

/** A payment inside the current 7 days stacks. After the week ends, the next payment starts over. */
export function addedWeekBid(item: WeekListing, payment: number, now = Date.now()) {
  const current = weekBid(item, now);
  return current > 0 ? current + payment : payment;
}

/**
 * What this brand still has to pay to be #1.
 * Money already on this week counts, so typing their link lowers the quote.
 */
export function claimPriceForListing<T extends WeekListing>(
  products: T[],
  listing: T | null,
  floor: number,
  now = Date.now(),
) {
  const mine = listing ? weekBid(listing, now) : 0;
  if (!listing || mine <= 0) return claimWeekPrice(topWeekBid(products, now), floor);
  const rivalTop = topWeekBid(
    products.filter((product) => product.id !== listing.id),
    now,
  );
  return Math.max(floor, claimWeekPrice(rivalTop, floor) - mine);
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
