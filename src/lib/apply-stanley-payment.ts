import { supabaseServer } from "@/lib/supabase-server";
import { fetchMetadata } from "@/lib/metadata";
import { isValidStanleySlot, stanleyNextSlotPrice } from "@/lib/stanley-slots";

export async function applyStanleyPayment(paymentData: any) {
  const url = paymentData.metadata?.hopup_url;
  const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || "0", 10);
  const nameFallback = paymentData.metadata?.hopup_name_fallback;
  const slotNumber = parseInt(paymentData.metadata?.hopup_slot || "0", 10);
  const paymentId = String(paymentData.payment_id || paymentData.id || "");
  const table = "stanley_slots";

  if (!url || !isValidStanleySlot(slotNumber)) {
    console.error("Invalid Stanley payment metadata", paymentData.metadata);
    throw new Error("Invalid Stanley payment metadata");
  }

  if (paymentId) {
    const { data: already } = await supabaseServer
      .from(table)
      .select("id")
      .eq("payment_id", paymentId)
      .limit(1);
    if (already && already.length > 0) {
      console.log(`Skipping duplicate Stanley payment ${paymentId}`);
      return { slotNumber: null, duplicate: true, table };
    }
  }

  const { data: existingRows } = await supabaseServer
    .from(table)
    .select("id, price")
    .eq("slot_number", slotNumber)
    .limit(1);

  const current = existingRows?.[0] ?? null;
  const expected = stanleyNextSlotPrice(slotNumber, current?.price);
  if (bidAmount !== expected) {
    console.error("Invalid Stanley payment metadata", paymentData.metadata, {
      currentPrice: current?.price ?? null,
      expected,
    });
    throw new Error("Invalid Stanley payment metadata");
  }

  const { title: fetchedTitle } = await fetchMetadata(url);
  const payload = {
    slot_number: slotNumber,
    name: fetchedTitle || nameFallback || url,
    url,
    price: bidAmount,
    payment_id: paymentId || null,
  };

  if (!current) {
    const { error } = await supabaseServer.from(table).insert(payload);

    if (error && error.code === "23505" && /payment_id/i.test(error.message || "")) {
      return { slotNumber: null, duplicate: true, table };
    }

    if (error && error.code === "23505") {
      console.error(
        `Stanley payment ${paymentId} for ${url}: slot ${slotNumber} lost the race. Skipping insert.`
      );
      return { slotNumber: null, duplicate: false, table, skipped: "slot_taken" };
    }

    if (error) throw error;
    console.log(`Filled ${table} slot ${slotNumber} for ${url} ($${bidAmount})`);
    return { slotNumber, duplicate: false, table };
  }

  const { data: updated, error } = await supabaseServer
    .from(table)
    .update({
      name: payload.name,
      url: payload.url,
      price: payload.price,
      payment_id: payload.payment_id,
    })
    .eq("slot_number", slotNumber)
    .eq("price", current.price)
    .select("id");

  if (error && error.code === "23505" && /payment_id/i.test(error.message || "")) {
    return { slotNumber: null, duplicate: true, table };
  }

  if (error) throw error;

  if (!updated || updated.length === 0) {
    console.error(
      `Stanley payment ${paymentId} for ${url}: slot ${slotNumber} was hopped first. Skipping update.`
    );
    return { slotNumber: null, duplicate: false, table, skipped: "stale_hop" };
  }

  console.log(`Hopped ${table} slot ${slotNumber} for ${url} ($${bidAmount})`);
  return { slotNumber, duplicate: false, table, hopped: true };
}
