import { dodo } from "@/lib/dodo";
import { applyStanleyPayment } from "@/lib/apply-stanley-payment";
import { backfillMissingStanleyLogos } from "@/lib/backfill-stanley-logos";
import { recordReferralSale } from "@/lib/creators-server";
import { isValidStanleySlot } from "@/lib/stanley-slots";

function metaString(value: unknown): string {
  return value == null ? "" : String(value);
}

export async function confirmLocalStanleyPayment(opts: {
  url: string;
  slot: number;
  paymentId?: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return { applied: false, reason: "production" as const };
  }
  if (!opts.url || !isValidStanleySlot(opts.slot)) {
    return { applied: false, reason: "invalid" as const };
  }

  let match = null;
  if (opts.paymentId) {
    try {
      const payment = await dodo.payments.retrieve(opts.paymentId);
      if (payment.status === "succeeded") match = payment;
    } catch {
      match = null;
    }
  }

  if (!match) {
    const page = await dodo.payments.list({
      page_size: 20,
      status: "succeeded",
    });
    match =
      page.getPaginatedItems().find((payment) => {
        const meta = payment.metadata ?? {};
        return (
          metaString(meta.hopup_kind) === "stanley" &&
          metaString(meta.hopup_url) === opts.url &&
          metaString(meta.hopup_slot) === String(opts.slot)
        );
      }) ?? null;
  }

  if (!match) {
    return { applied: false, reason: "not_found" as const };
  }

  const result = await applyStanleyPayment(match);
  await backfillMissingStanleyLogos();
  const metadata = Object.fromEntries(
    Object.entries(match.metadata ?? {}).map(([key, value]) => [
      key,
      value == null ? undefined : String(value),
    ])
  );
  await recordReferralSale({
    id: "id" in match ? String(match.id ?? "") : undefined,
    payment_id: "payment_id" in match ? String(match.payment_id ?? "") : undefined,
    metadata,
  });
  return {
    applied: Boolean(result.slotNumber),
    duplicate: result.duplicate,
    skipped: "skipped" in result ? result.skipped : undefined,
  };
}
