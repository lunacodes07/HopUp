import { idPrefixFromSlug, productSlug } from "@/lib/product-path";
import type { Product } from "@/types";

export function withBoardRanks(products: Product[]): Product[] {
  if (products.length < 2) return products;
  const champId = products[0].id;
  let next = 1;
  return products.map((item) =>
    item.id === champId ? { ...item, rank: 0 } : { ...item, rank: next++ }
  );
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
