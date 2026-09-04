import type { Product } from "@/types";
import { findProductBySlug, withBoardRanks } from "@/lib/board-ranks";
import { supabase } from "@/lib/supabase";

export { findProductBySlug, withBoardRanks };

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
