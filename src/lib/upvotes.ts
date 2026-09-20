export const UPVOTE_COOKIE = "hopup_upvotes";
export const UPVOTE_STORAGE_KEY = "hopup_upvoted";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseVotedIds(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => UUID.test(id))
    .slice(0, 200);
}

export function serializeVotedIds(ids: string[]): string {
  return [...new Set(ids)].filter((id) => UUID.test(id)).slice(0, 200).join(",");
}

export function readVotedFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(UPVOTE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parseVotedIds(parsed.join(",")) : [];
  } catch {
    return [];
  }
}

export function writeVotedToStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UPVOTE_STORAGE_KEY, JSON.stringify(serializeVotedIds(ids).split(",").filter(Boolean)));
  } catch {
    // ignore quota / private mode
  }
}

export async function upvoteProduct(productId: string): Promise<{ ok: boolean; already?: boolean; upvotes?: number }> {
  const response = await fetch("/api/upvote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not upvote");
  }
  return data;
}
