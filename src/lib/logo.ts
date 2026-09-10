function getHostname(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getGoogleLogoUrl(raw?: string | null): string {
  const host = getHostname(raw);
  if (!host) return "/globe.svg";
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

export function getProxiedLogoUrl(raw?: string | null): string {
  if (!raw) return "/globe.svg";
  try {
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    new URL(href);
    return `/api/logo?url=${encodeURIComponent(href)}`;
  } catch {
    return "/globe.svg";
  }
}

/** Leaderboard logo: uploaded override when present, otherwise the site favicon. */
export function getProductLogoUrl(product: {
  id?: string;
  url?: string | null;
  logo_url?: string | null;
}): string {
  if (product.logo_url) {
    if (product.logo_url.includes("/product-logos/")) {
      return `/api/product-logo?u=${encodeURIComponent(product.logo_url)}`;
    }
    return product.logo_url;
  }
  return getProxiedLogoUrl(product.url);
}

export function handleLogoError(img: HTMLImageElement, raw?: string | null) {
  if (img.dataset.fallback === "done") return;
  if (img.dataset.fallback === "google") {
    img.dataset.fallback = "done";
    img.src = "/globe.svg";
    return;
  }
  img.dataset.fallback = "google";
  img.src = getGoogleLogoUrl(raw);
}
