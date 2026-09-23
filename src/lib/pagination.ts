export const LISTINGS_PER_PAGE = 10;

export type BoardMode = "week" | "alltime";

export function boardPath(mode: BoardMode, page = 1) {
  if (mode === "week") {
    return page <= 1 ? "/#leaderboard" : `/this-week/${page}#leaderboard`;
  }
  return page <= 1 ? "/all-time#leaderboard" : `/all-time/${page}#leaderboard`;
}

export function boardCanonicalPath(mode: BoardMode, page = 1) {
  if (mode === "week") {
    return page <= 1 ? "/" : `/this-week/${page}`;
  }
  return page <= 1 ? "/all-time" : `/all-time/${page}`;
}

export function totalPagesFor(count: number, perPage = LISTINGS_PER_PAGE) {
  return Math.max(1, Math.ceil(count / perPage));
}

export function parsePageParam(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export function pageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(sorted[i]);
  }
  return out;
}
