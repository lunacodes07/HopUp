export function getFormattedUrlInfo(rawUrl: string) {
  let finalUrl = rawUrl.trim();
  let nameFallback = finalUrl;

  if (finalUrl.startsWith("@")) {
    finalUrl = `https://x.com/${finalUrl.substring(1)}`;
    nameFallback = rawUrl;
  } else {
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && finalUrl.length > 0) {
      finalUrl = "https://" + finalUrl;
    }
    nameFallback = finalUrl.replace(/^https?:\/\//, "").split("/")[0];
  }

  finalUrl = finalUrl.replace(/\/$/, "");
  return { finalUrl, nameFallback };
}

/** Same brand, whether typed as a link, a www host, or an @handle. */
export function listingKey(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const { finalUrl } = getFormattedUrlInfo(trimmed);
    const parsed = new URL(finalUrl);
    let host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "twitter.com" || host === "mobile.twitter.com") host = "x.com";
    const path = decodeURIComponent(parsed.pathname).replace(/\/+$/, "").toLowerCase();
    if (host === "x.com") {
      const handle = path.split("/").filter(Boolean)[0]?.replace(/^@/, "");
      return handle ? `x:${handle}` : null;
    }
    return `web:${host}${path}`;
  } catch {
    return null;
  }
}
