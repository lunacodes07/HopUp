import { unstable_cache } from "next/cache";
import type { Product } from "@/types";
import { findProductBySlug, withBoardRanks } from "@/lib/board-ranks";
import { supabase } from "@/lib/supabase";

export { findProductBySlug, withBoardRanks };

async function loadRankedProducts(): Promise<Product[]> {
  const withUpvotes = await supabase
    .from("products")
    .select("id, name, description, category, clicks, upvotes, price, url, logo_url, created_at, last_hopped_at")
    .order("price", { ascending: false })
    .order("created_at", { ascending: true });

  const withLogo = withUpvotes.error
    ? await supabase
        .from("products")
        .select("id, name, description, category, clicks, price, url, logo_url, created_at, last_hopped_at")
        .order("price", { ascending: false })
        .order("created_at", { ascending: true })
    : withUpvotes;

  const { data, error } = withLogo.error
    ? await supabase
        .from("products")
        .select("id, name, description, category, clicks, price, url, created_at, last_hopped_at")
        .order("price", { ascending: false })
        .order("created_at", { ascending: true })
    : withLogo;

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
