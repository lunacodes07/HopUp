import type { Product } from "@/types";

export type ShareKind = "hop" | "sponsored";

export type SharePayload = {
  name: string;
  rank: number;
  price: number;
  url?: string;
  kind?: ShareKind;
};

export function rankLabel(rank: number) {
  return rank === 0 ? "Hall of Fame" : `#${rank}`;
}

export function shareCaption(payload: SharePayload) {
  const spot = rankLabel(payload.rank);
  const bid = `$${payload.price.toLocaleString()}`;

  if (payload.kind === "sponsored") {
    return [
      `just grabbed a sponsored spot on hopup.lol by @alohaproxy`,
      ``,
      `${payload.name} · ${bid}`,
    ].join("\n");
  }

  if (payload.rank === 0) {
    return [
      `just claimed Hall of Fame on hopup.lol by @alohaproxy`,
      ``,
      `${payload.name} · ${bid}`,
      ``,
      `someone's gonna have to pay more 👀`,
    ].join("\n");
  }

  return [
    `just hopped ${payload.name} to ${spot} on hopup.lol by @alohaproxy`,
    ``,
    `${bid} → ${spot}`,
    ``,
    `someone's gonna have to pay more 👀`,
  ].join("\n");
}

export function xShareUrl(caption: string) {
  return `https://x.com/intent/tweet?${new URLSearchParams({ text: caption })}`;
}

export function shareImagePath(payload: SharePayload) {
  const params = new URLSearchParams({
    name: payload.name,
    rank: String(payload.rank),
    price: String(payload.price),
    kind: payload.kind || "hop",
  });
  if (payload.url) params.set("url", payload.url);
  return `/api/og?${params.toString()}`;
}

export function shareFromProduct(product: Product, kind: ShareKind = "hop"): SharePayload {
  return {
    name: product.name,
    rank: product.rank,
    price: product.price,
    url: product.url,
    kind,
  };
}

export const PENDING_SHARE_KEY = "hopup_pending_share";

export type PendingShare = {
  url: string;
  bid: number;
  name: string;
  kind: ShareKind;
};

export function rememberPendingShare(pending: PendingShare) {
  try {
    sessionStorage.setItem(PENDING_SHARE_KEY, JSON.stringify(pending));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPendingShare(): PendingShare | null {
  try {
    const raw = sessionStorage.getItem(PENDING_SHARE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingShare;
    if (!parsed?.url) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingShare() {
  try {
    sessionStorage.removeItem(PENDING_SHARE_KEY);
  } catch {
    /* ignore */
  }
}
