/** Browser + shared caches. Logos barely change; 60s was forcing constant re-resolves. */
export const LOGO_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

/**
 * Next.js `force-dynamic` can overwrite `Cache-Control` with `no-store`.
 * Vercel still honors these for the CDN, so Fluid CPU is not spent on every img hit.
 */
export const LOGO_CDN_CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export const LOGO_MISS_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=3600";

export function logoHitHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Cache-Control": LOGO_CACHE_CONTROL,
    "CDN-Cache-Control": LOGO_CDN_CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": LOGO_CDN_CACHE_CONTROL,
  };
}

export function logoMissHeaders(): HeadersInit {
  return {
    "Cache-Control": LOGO_MISS_CACHE_CONTROL,
    "CDN-Cache-Control": LOGO_MISS_CACHE_CONTROL,
    "Vercel-CDN-Cache-Control": LOGO_MISS_CACHE_CONTROL,
  };
}
