import { supabaseServer } from "@/lib/supabase-server";
import { fetchMetadata } from "@/lib/metadata";
import { applyPendingProductLogo, isPendingProductLogo, storeResolvedProductLogo } from "@/lib/product-logo-server";
import { hallOfFameClaimPrice } from "@/lib/hof";
import { addedWeekBid, type WeekListing } from "@/lib/week";

function missingWeekColumn(error: { message?: string } | null) {
  const message = error?.message || "";
  return message.includes("week_bid") || message.includes("is_hof");
}

export async function applyHopPayment(paymentData: {
  metadata?: Record<string, string | undefined>;
}) {
  const url = paymentData.metadata?.hopup_url;
  const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || "0", 10);
  const category = paymentData.metadata?.hopup_category;
  const nameFallback = paymentData.metadata?.hopup_name_fallback;
  const productId = paymentData.metadata?.hopup_product_id;
  const hofClaim = paymentData.metadata?.hopup_hof === "1";
  const hoppedAt = new Date().toISOString();

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
    };

    if (!hofClaim) {
      updatePayload.last_hopped_at = hoppedAt;
      updatePayload.week_bid = addedWeekBid(existingProduct as WeekListing, bidAmount);
    }

    if (fetchedDescription && fetchedDescription.trim() !== "") {
      updatePayload.description = fetchedDescription;
    }

    if (
      fetchedTitle &&
      (existingProduct.name === existingProduct.url || existingProduct.name === "Freshly hopped product")
    ) {
      updatePayload.name = fetchedTitle;
    }

    await writeProduct(existingProduct.id, updatePayload);
    if (hofClaim) await pinHallOfFame(existingProduct.id, bidAmount, existingProduct.price);
    if (isPendingProductLogo(paymentData.metadata?.hopup_logo)) {
      await applyPendingProductLogo(existingProduct.id, paymentData.metadata.hopup_logo);
    } else if (!existingProduct.logo_url) {
      await storeResolvedProductLogo(existingProduct.id, url);
    }
    return { updated: true, id: existingProduct.id };
  }

  const created = await insertProduct({
    name: fetchedTitle || nameFallback || url,
    description: fetchedDescription || "Freshly hopped product",
    url,
    category: category || "Other",
    rank: 0,
    clicks: 0,
    price: bidAmount,
    last_hopped_at: hoppedAt,
    week_bid: hofClaim ? 0 : bidAmount,
    is_hof: false,
  });

  if (created?.id && hofClaim) await pinHallOfFame(created.id, bidAmount, 0);
  if (created?.id && isPendingProductLogo(paymentData.metadata?.hopup_logo)) {
    await applyPendingProductLogo(created.id, paymentData.metadata.hopup_logo);
  } else if (created?.id) {
    await storeResolvedProductLogo(created.id, url);
  }
  return { updated: false, id: created?.id };
}

async function writeProduct(id: string, payload: Record<string, unknown>) {
  const { error } = await supabaseServer.from("products").update(payload).eq("id", id);
  if (!error) return;
  if (!missingWeekColumn(error)) throw error;
  const { week_bid: _weekBid, is_hof: _hof, ...rest } = payload;
  const retry = await supabaseServer.from("products").update(rest).eq("id", id);
  if (retry.error) throw retry.error;
}

async function insertProduct(row: Record<string, unknown>) {
  const first = await supabaseServer.from("products").insert(row).select("id").single();
  if (!first.error) return first.data;
  if (!missingWeekColumn(first.error)) throw first.error;
  const { week_bid: _weekBid, is_hof: _hof, ...rest } = row;
  const retry = await supabaseServer.from("products").insert(rest).select("id").single();
  if (retry.error) throw retry.error;
  return retry.data;
}

async function pinHallOfFame(winnerId: string, bidAmount: number, priceBefore: number) {
  const { data, error } = await supabaseServer.from("products").select("id, price, is_hof, last_hopped_at, created_at");
  if (error) {
    if (missingWeekColumn(error)) return;
    throw error;
  }

  const rows = (data ?? []) as WeekListing[];
  const others = rows.filter((product) => product.id !== winnerId);
  const flagged = others.filter((product) => product.is_hof);
  const otherTop = others.reduce((top, product) => Math.max(top, product.price), 0);
  const baseline = flagged.length > 0
    ? flagged.reduce((top, product) => (product.price > top.price ? product : top)).price
    : Math.max(priceBefore, otherTop);
  if (baseline <= 0 || bidAmount < hallOfFameClaimPrice(baseline)) return;

  const clear = await supabaseServer.from("products").update({ is_hof: false }).neq("id", winnerId);
  if (clear.error) {
    if (missingWeekColumn(clear.error)) return;
    throw clear.error;
  }
  const pin = await supabaseServer.from("products").update({ is_hof: true }).eq("id", winnerId);
  if (pin.error && !missingWeekColumn(pin.error)) throw pin.error;
}
