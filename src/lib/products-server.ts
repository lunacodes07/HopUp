import type { Product } from "@/types";
import { idPrefixFromSlug, productSlug } from "@/lib/product-path";
import { supabase } from "@/lib/supabase";

export async function getRankedProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, category, clicks, price, url, created_at, last_hopped_at")
      .order("price", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load products:", error);
      return [];
    }

    return (data || []).map((item, idx) => ({
      ...(item as Product),
      rank: idx + 1,
    }));
  } catch (err) {
    console.error("Failed to load products:", err);
    return [];
  }
}

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
