function hostnameOf(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const href = raw.startsWith("@")
      ? `https://x.com/${raw.slice(1)}`
      : raw.startsWith("http")
        ? raw
        : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function productIdPrefix(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toLowerCase();
}

export function productSlug(product: { id: string; name?: string; url?: string }): string {
  const base =
    slugify(product.name || "") || slugify(hostnameOf(product.url) || "") || "listing";
  return `${base}-${productIdPrefix(product.id)}`;
}

export function productPath(product: { id: string; name?: string; url?: string }): string {
  return `/p/${productSlug(product)}`;
}

export function idPrefixFromSlug(slug: string): string | null {
  const suffix = slug.split("-").pop();
  if (!suffix || !/^[a-f0-9]{8}$/i.test(suffix)) return null;
  return suffix.toLowerCase();
}

export function toExternalUrl(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("@")) return `https://x.com/${raw.slice(1)}`;
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export const HOPUP_REF = "hopup";

export function withHopupRef(raw?: string | null): string | null {
  const href = toExternalUrl(raw);
  if (!href) return null;
  try {
    const next = new URL(href);
    if (!next.searchParams.has("ref")) {
      next.searchParams.set("ref", HOPUP_REF);
    }
    return next.toString();
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}ref=${HOPUP_REF}`;
  }
}

export function displayHost(raw?: string | null): string | null {
  const href = toExternalUrl(raw);
  if (!href) return null;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return raw ?? null;
  }
}
