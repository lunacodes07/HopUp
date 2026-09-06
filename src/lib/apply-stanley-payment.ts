import { supabaseServer } from "@/lib/supabase-server";
import { fetchMetadata } from "@/lib/metadata";
import { isValidStanleySlot, stanleySlotPrice } from "@/lib/stanley-slots";

export async function applyStanleyPayment(paymentData: any) {
  const url = paymentData.metadata?.hopup_url;
  const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || "0", 10);
  const nameFallback = paymentData.metadata?.hopup_name_fallback;
  const slotNumber = parseInt(paymentData.metadata?.hopup_slot || "0", 10);
  const paymentId = String(paymentData.payment_id || paymentData.id || "");
  const table = "stanley_slots";

  if (!url || !isValidStanleySlot(slotNumber) || bidAmount !== stanleySlotPrice(slotNumber)) {
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

  const { data: taken } = await supabaseServer
    .from(table)
    .select("id")
    .eq("slot_number", slotNumber)
    .limit(1);

  if (taken && taken.length > 0) {
    console.error(
      `Stanley payment ${paymentId} for ${url}: slot ${slotNumber} already claimed. Skipping insert.`
    );
    return { slotNumber: null, duplicate: false, table, skipped: "slot_taken" };
  }

  const { title: fetchedTitle } = await fetchMetadata(url);

  const { error } = await supabaseServer.from(table).insert({
    slot_number: slotNumber,
    name: fetchedTitle || nameFallback || url,
    url,
    price: bidAmount,
    payment_id: paymentId || null,
  });

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
