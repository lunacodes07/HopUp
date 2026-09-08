import DodoPayments from "dodopayments";
import { dodo } from "@/lib/dodo";
import { supabaseServer } from "@/lib/supabase-server";
import { resolvePaymentStanleyLogo } from "@/lib/stanley-logo-server";

type PaymentLike = {
  metadata?: Record<string, unknown> | null;
};

async function retrievePayment(paymentId: string): Promise<PaymentLike | null> {
  try {
    return await dodo.payments.retrieve(paymentId);
  } catch {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) return null;
    const otherEnv = process.env.NODE_ENV === "production" ? "test_mode" : "live_mode";
    try {
      const other = new DodoPayments({ bearerToken: apiKey, environment: otherEnv });
      return await other.payments.retrieve(paymentId);
    } catch {
      return null;
    }
  }
}

export async function backfillMissingStanleyLogos() {
  const { data: rows, error } = await supabaseServer
    .from("stanley_slots")
    .select("id, slot_number, url, price, payment_id, logo_url")
    .is("logo_url", null);

  if (error) {
    console.error("Stanley logo backfill list failed:", error);
    return { updated: 0 };
  }

  let updated = 0;
  for (const row of rows ?? []) {
    const payment = row.payment_id ? await retrievePayment(String(row.payment_id)) : null;
    const logoUrl = await resolvePaymentStanleyLogo({
      slotNumber: row.slot_number,
      url: row.url,
      price: row.price,
      rawLogo: payment?.metadata?.hopup_logo,
    });
    if (!logoUrl) continue;

    const { error: updateError } = await supabaseServer
      .from("stanley_slots")
      .update({ logo_url: logoUrl })
      .eq("id", row.id)
      .is("logo_url", null);
    if (updateError) {
      console.error("Stanley logo backfill update failed:", updateError);
      continue;
    }
    updated += 1;
  }

  return { updated };
}
