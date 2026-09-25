import { listingKey } from "@/lib/format-url";
import { supabaseServer } from "@/lib/supabase-server";

/** The oldest listing for this brand, however the link was typed (case, www, trailing slash, @handle). */
export async function findListingByUrl(url: string) {
  const key = listingKey(url);
  if (!key) return null;

  const host = key.slice(key.indexOf(":") + 1).split("/")[0];
  const { data, error } = await supabaseServer
    .from("products")
    .select("*")
    .ilike("url", `%${host}%`)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).find((row) => listingKey(row.url) === key) ?? null;
}
