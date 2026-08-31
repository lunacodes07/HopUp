import { supabaseServer } from "@/lib/supabase-server";
import { fetchMetadata } from "@/lib/metadata";
import { getSponsorPlan, isValidSlotNumber } from "@/lib/sponsored";
import { resolveSponsoredSlot } from "@/lib/sponsored-server";

export async function applySponsoredPayment(paymentData: any) {
  const url = paymentData.metadata?.hopup_url;
  const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || "0", 10);
  const category = paymentData.metadata?.hopup_category;
  const nameFallback = paymentData.metadata?.hopup_name_fallback;
  const requestedSlot = parseInt(paymentData.metadata?.hopup_slot || "0", 10);
  const weeks = parseInt(paymentData.metadata?.hopup_weeks || "0", 10);
  const paymentId = String(paymentData.payment_id || paymentData.id || "");
  const table = "sponsored_slots";

  const plan = getSponsorPlan(weeks);
  if (!url || !plan || !isValidSlotNumber(requestedSlot) || bidAmount !== plan.price) {
    console.error("Invalid sponsored payment metadata", paymentData.metadata);
    throw new Error("Invalid sponsored payment metadata");
  }

  if (paymentId) {
    const { data: already } = await supabaseServer
      .from(table)
      .select("id")
      .eq("payment_id", paymentId)
      .limit(1);
    if (already && already.length > 0) {
      console.log(`Skipping duplicate sponsored payment ${paymentId}`);
      return { slotNumber: null, duplicate: true, table };
    }
  }

  const slotNumber = await resolveSponsoredSlot(requestedSlot);
  if (slotNumber == null) {
    console.error(
      `Sponsored payment ${paymentId} for ${url}: no free slot after checkout. Skipping insert to avoid a duplicate occupant.`
    );
    return { slotNumber: null, duplicate: false, table, skipped: "no_free_slot" };
  }

  const { title: fetchedTitle, description: fetchedDescription } = await fetchMetadata(url);
  const expiresAt = new Date(Date.now() + plan.weeks * 7 * 24 * 60 * 60 * 1000).toISOString();

  const row = {
    slot_number: slotNumber,
    name: fetchedTitle || nameFallback || url,
    description: fetchedDescription || "Sponsored placement",
    url,
    category: category || "Other",
    clicks: 0,
    price: plan.price,
    weeks: plan.weeks,
    expires_at: expiresAt,
    payment_id: paymentId || null,
  };

  let { error } = await supabaseServer.from(table).insert(row);

  if (error && error.code === "23505" && /payment_id/i.test(error.message || "")) {
    return { slotNumber: null, duplicate: true, table };
  }

  // Concurrent webhook won the last free slot between our read and insert.
  if (error && (error.code === "23P01" || error.code === "23505")) {
    const retrySlot = await resolveSponsoredSlot(requestedSlot);
    if (retrySlot == null || retrySlot === slotNumber) {
      console.error(
        `Sponsored payment ${paymentId} for ${url}: slot race, no free slot left. Skipping insert.`
      );
      return { slotNumber: null, duplicate: false, table, skipped: "no_free_slot" };
    }
    ({ error } = await supabaseServer.from(table).insert({ ...row, slot_number: retrySlot }));
    if (!error) {
      console.log(`Filled ${table} slot ${retrySlot} for ${url} (${plan.weeks}w / $${plan.price})`);
      return { slotNumber: retrySlot, duplicate: false, table };
    }
  }

  if (error) throw error;
  console.log(`Filled ${table} slot ${slotNumber} for ${url} (${plan.weeks}w / $${plan.price})`);
  return { slotNumber, duplicate: false, table };
}
