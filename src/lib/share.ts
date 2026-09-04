import { productPath } from "@/lib/product-path";
import { SITE_URL } from "@/lib/site";
import type { Product } from "@/types";

export type ShareKind = "hop" | "sponsored";

export type SharePayload = {
  name: string;
  rank: number;
  price: number;
  url?: string;
  listingPath?: string;
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
      `just grabbed a sponsored spot on @hopuplol`,
      ``,
      `${payload.name} · ${bid}`,
    ].join("\n");
  }

  if (payload.rank === 0) {
    return [
      `just claimed Hall of Fame on @hopuplol`,
      ``,
      `${payload.name} · ${bid}`,
      ``,
      `someone's gonna have to pay more`,
    ].join("\n");
  }

  return [
    `just hopped ${payload.name} to ${spot} on @hopuplol`,
    ``,
    `${bid} → ${spot}`,
    ``,
    `someone's gonna have to pay more`,
  ].join("\n");
}

export function sharePageUrl(payload: SharePayload) {
  if (payload.listingPath) return `${SITE_URL}${payload.listingPath}`;
  return SITE_URL;
}

export function xShareUrl(payload: SharePayload, caption = shareCaption(payload)) {
  const intent = new URL("https://x.com/intent/post");
  intent.searchParams.set("text", caption);
  intent.searchParams.set("url", sharePageUrl(payload));
  return intent.toString();
}

export function shareFromProduct(product: Product, kind: ShareKind = "hop"): SharePayload {
  return {
    name: product.name,
    rank: product.rank,
    price: product.price,
    url: product.url,
    listingPath: productPath(product),
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
