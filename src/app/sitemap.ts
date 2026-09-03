import type { MetadataRoute } from "next";
import { boardCanonicalPath } from "@/lib/pagination";
import { pageCountForMode } from "@/lib/board-page";
import { productPath } from "@/lib/product-path";
import { getRankedProducts } from "@/lib/products-server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/last-48-hours`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/p`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/refunds`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const products = await getRankedProducts();
    const boardPages = (["alltime", "recent"] as const).flatMap((mode) =>
      Array.from({ length: Math.max(0, pageCountForMode(mode, products) - 1) }, (_, i) => ({
        url: `${SITE_URL}${boardCanonicalPath(mode, i + 2)}`,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.7,
      }))
    );
    const productRoutes = products.map((product) => ({
      url: `${SITE_URL}${productPath(product)}`,
      lastModified: new Date(product.last_hopped_at || product.created_at || Date.now()),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...boardPages, ...productRoutes];
  } catch (err) {
    console.error("Failed to build sitemap:", err);
    return staticRoutes;
  }
}
