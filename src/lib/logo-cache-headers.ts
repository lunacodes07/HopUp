/** Browser + shared caches. Logos barely change; 60s was forcing constant re-resolves. */
export const LOGO_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

/** Vercel honors these even when Next rewrites Cache-Control. */
export const LOGO_CDN_CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

export const LOGO_MISS_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=3600";

export function logoCdnHeaders(cacheControl = LOGO_CACHE_CONTROL, cdnControl = LOGO_CDN_CACHE_CONTROL): HeadersInit {
  return {
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cdnControl,
    "Vercel-CDN-Cache-Control": cdnControl,
    "X-Content-Type-Options": "nosniff",
  };
}

export function logoHitHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    ...logoCdnHeaders(),
  };
}

export function logoMissHeaders(): HeadersInit {
  return logoCdnHeaders(LOGO_MISS_CACHE_CONTROL, LOGO_MISS_CACHE_CONTROL);
}
