import { supabaseServer } from "@/lib/supabase-server";
import { fetchMetadata } from "@/lib/metadata";

export async function applyHopPayment(paymentData: {
  metadata?: Record<string, string | undefined>;
}) {
  const url = paymentData.metadata?.hopup_url;
  const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || "0", 10);
  const category = paymentData.metadata?.hopup_category;
  const nameFallback = paymentData.metadata?.hopup_name_fallback;
  const productId = paymentData.metadata?.hopup_product_id;

  if (!url || !bidAmount) {
    throw new Error("Missing hop payment metadata");
  }

  const { title: fetchedTitle, description: fetchedDescription } = await fetchMetadata(url);

  let existingProduct = null;

  if (productId && productId !== "new") {
    const { data } = await supabaseServer.from("products").select("*").eq("id", productId).limit(1);
    existingProduct = data?.[0];
  }

  if (!existingProduct) {
    const { data } = await supabaseServer
      .from("products")
      .select("*")
      .in("url", [url, url + "/"])
      .limit(1);
    existingProduct = data?.[0];
  }

  if (existingProduct) {
    const updatePayload: Record<string, unknown> = {
      price: existingProduct.price + bidAmount,
      category: category || existingProduct.category,
      last_hopped_at: new Date().toISOString(),
    };

    if (fetchedDescription && fetchedDescription.trim() !== "") {
      updatePayload.description = fetchedDescription;
    }

    if (
      fetchedTitle &&
      (existingProduct.name === existingProduct.url || existingProduct.name === "Freshly hopped product")
    ) {
      updatePayload.name = fetchedTitle;
    }

    const { error } = await supabaseServer.from("products").update(updatePayload).eq("id", existingProduct.id);
    if (error) throw error;
    return { updated: true, id: existingProduct.id };
  }

  const { error } = await supabaseServer.from("products").insert({
    name: fetchedTitle || nameFallback || url,
    description: fetchedDescription || "Freshly hopped product",
    url,
    category: category || "Other",
    rank: 0,
    clicks: 0,
    price: bidAmount,
    last_hopped_at: new Date().toISOString(),
  });

  if (error) throw error;
  return { updated: false };
}
