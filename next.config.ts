import type { NextConfig } from "next";

/** Public binaries are unhashed, so no `immutable`. 1 day + 7-day SWR stops FDT re-downloads. */
const PUBLIC_CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800";
const YEAR_CACHE = "public, max-age=31536000, immutable";

function cacheHeaders(value: string) {
  return [
    { key: "Cache-Control", value },
    { key: "CDN-Cache-Control", value },
    { key: "Vercel-CDN-Cache-Control", value },
  ];
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:all*(png|jpg|jpeg|webp|gif|avif|mp4|glb)",
        headers: cacheHeaders(PUBLIC_CACHE),
      },
      {
        source: "/:all*(svg|ico|woff|woff2)",
        headers: cacheHeaders(YEAR_CACHE),
      },
    ];
  },
  async redirects() {
    return [
      { source: "/og.png", destination: "/og.jpg", permanent: true },
      { source: "/ogstanley.png", destination: "/ogstanley.jpg", permanent: true },
    ];
  },
};

export default nextConfig;
