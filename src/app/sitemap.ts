import type { MetadataRoute } from "next";
import { productPath } from "@/lib/product-path";
import { getRankedProducts } from "@/lib/products-server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/p`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/refunds`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const products = await getRankedProducts();
    const productRoutes = products.map((product) => ({
      url: `${SITE_URL}${productPath(product)}`,
      lastModified: new Date(product.last_hopped_at || product.created_at || Date.now()),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch (err) {
    console.error("Failed to build product sitemap:", err);
    return staticRoutes;
  }
}
