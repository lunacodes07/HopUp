import { unstable_cache } from "next/cache";
import type { Product } from "@/types";
import { findProductBySlug, withBoardRanks } from "@/lib/board-ranks";
import { supabase } from "@/lib/supabase";

export { findProductBySlug, withBoardRanks };

const PRODUCT_COLUMNS = [
  "id, name, description, category, clicks, upvotes, price, week_bid, is_hof, url, logo_url, created_at, last_hopped_at",
  "id, name, description, category, clicks, upvotes, price, url, logo_url, created_at, last_hopped_at",
  "id, name, description, category, clicks, price, url, logo_url, created_at, last_hopped_at",
  "id, name, description, category, clicks, price, url, created_at, last_hopped_at",
];

async function loadRankedProducts(): Promise<Product[]> {
  let data: Product[] | null = null;
  let error: { message: string } | null = null;

  for (const columns of PRODUCT_COLUMNS) {
    const result = await supabase
      .from("products")
      .select(columns)
      .order("price", { ascending: false })
      .order("created_at", { ascending: true });
    if (!result.error) {
      data = result.data as unknown as Product[];
      error = null;
      break;
    }
    error = result.error;
  }

  if (error) throw error;

  return (data || []).map((item, idx) => ({
    ...(item as Product),
    rank: idx + 1,
  }));
}

const getRankedProductsCached = unstable_cache(loadRankedProducts, ["ranked-products"], {
  revalidate: 60,
});

export async function getRankedProducts(): Promise<Product[]> {
  try {
    return await getRankedProductsCached();
  } catch (err) {
    console.error("Failed to load products:", err);
    return [];
  }
}
