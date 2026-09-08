import { supabaseServer } from "@/lib/supabase-server";
import { fetchMetadata } from "@/lib/metadata";
import { resolvePaymentStanleyLogo } from "@/lib/stanley-logo-server";
import { isValidStanleySlot, stanleyNextSlotPrice } from "@/lib/stanley-slots";

async function logoForPayment(opts: {
  slotNumber: number;
  url: string;
  price: number;
  metadata?: Record<string, unknown> | null;
}) {
  return resolvePaymentStanleyLogo({
    slotNumber: opts.slotNumber,
    url: opts.url,
    price: opts.price,
    rawLogo: opts.metadata?.hopup_logo,
  });
}

async function backfillLogoIfMissing(
  table: string,
  rowId: string,
  logoUrl: string | null
) {
  if (!logoUrl) return;
  const { error } = await supabaseServer
    .from(table)
    .update({ logo_url: logoUrl })
    .eq("id", rowId)
    .is("logo_url", null);
  if (error) console.error("Stanley logo backfill failed:", error);
}

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
      .select("id, logo_url")
      .eq("payment_id", paymentId)
      .limit(1);
    if (already && already.length > 0) {
      if (!already[0].logo_url) {
        const logoUrl = await logoForPayment({
          slotNumber,
          url,
          price: bidAmount,
          metadata: paymentData.metadata,
        });
        await backfillLogoIfMissing(table, already[0].id, logoUrl);
      }
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

  const logoUrl = await logoForPayment({
    slotNumber,
    url,
    price: bidAmount,
    metadata: paymentData.metadata,
  });

  const { title: fetchedTitle } = await fetchMetadata(url);
  const payload = {
    slot_number: slotNumber,
    name: fetchedTitle || nameFallback || url,
    url,
    price: bidAmount,
    payment_id: paymentId || null,
    logo_url: logoUrl,
  };

  if (!current) {
    const { error } = await supabaseServer.from(table).insert(payload);

    if (error && error.code === "23505" && /payment_id/i.test(error.message || "")) {
      const { data: row } = await supabaseServer
        .from(table)
        .select("id, logo_url")
        .eq("payment_id", paymentId)
        .limit(1);
      if (row?.[0] && !row[0].logo_url) {
        await backfillLogoIfMissing(table, row[0].id, logoUrl);
      }
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
      logo_url: payload.logo_url,
    })
    .eq("slot_number", slotNumber)
    .eq("price", current.price)
    .select("id");

  if (error && error.code === "23505" && /payment_id/i.test(error.message || "")) {
    const { data: row } = await supabaseServer
      .from(table)
      .select("id, logo_url")
      .eq("payment_id", paymentId)
      .limit(1);
    if (row?.[0] && !row[0].logo_url) {
      await backfillLogoIfMissing(table, row[0].id, logoUrl);
    }
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
