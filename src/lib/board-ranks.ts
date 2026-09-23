import { idPrefixFromSlug, productSlug } from "@/lib/product-path";
import type { Product } from "@/types";
import { allTimeList, findHof } from "@/lib/week";

export function withBoardRanks(products: Product[]): Product[] {
  const hof = findHof(products);
  const ranked = allTimeList(products).map((item, idx) => ({ ...item, rank: idx + 1 }));
  if (!hof) return ranked;
  return [{ ...hof, rank: 0 }, ...ranked];
}

export function findProductBySlug(products: Product[], slug: string): Product | null {
  const exact = products.find((p) => productSlug(p) === slug);
  if (exact) return exact;

  const prefix = idPrefixFromSlug(slug);
  if (!prefix) return null;

  return (
    products.find((p) => p.id.replace(/-/g, "").toLowerCase().startsWith(prefix)) || null
  );
}
