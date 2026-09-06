import { supabaseServer } from "@/lib/supabase-server";
import { CREATOR_COMMISSION, normalizeCreatorSlug } from "@/lib/creators";

export type Creator = {
  id: string;
  slug: string;
  name: string;
  stats_key: string;
  clicks: number;
  paid_cents: number;
};

export type ReferralSale = {
  id: string;
  created_at: string;
  kind: "hop" | "sponsored";
  amount_cents: number;
  commission_cents: number;
  url: string | null;
};

export async function getCreatorBySlug(raw: string | null | undefined): Promise<Creator | null> {
  const slug = normalizeCreatorSlug(raw);
  if (!slug) return null;
  try {
    const { data, error } = await supabaseServer
      .from("creators")
      .select("id, slug, name, stats_key, clicks, paid_cents")
      .eq("slug", slug)
      .limit(1);
    if (error || !data?.[0]) return null;
    return data[0] as Creator;
  } catch {
    return null;
  }
}

export async function incrementCreatorClicks(slug: string) {
  const { error } = await supabaseServer.rpc("increment_creator_clicks", { p_slug: slug });
  if (error) console.error("increment_creator_clicks failed:", error);
}

export async function recordReferralSale(paymentData: {
  id?: string;
  payment_id?: string;
  metadata?: Record<string, string | undefined>;
}) {
  const slug = normalizeCreatorSlug(paymentData.metadata?.hopup_ref);
  const amount = parseInt(paymentData.metadata?.hopup_bid_amount || "0", 10);
  const kind = paymentData.metadata?.hopup_kind === "sponsored" ? "sponsored" : "hop";
  const url = paymentData.metadata?.hopup_url || null;
  const paymentId = String(paymentData.payment_id || paymentData.id || "");

  if (!slug || !amount) return;

  const creator = await getCreatorBySlug(slug);
  if (!creator) return;

  const amountCents = amount * 100;
  const commissionCents = Math.round(amountCents * CREATOR_COMMISSION);

  const { error } = await supabaseServer.from("referral_sales").insert({
    creator_id: creator.id,
    kind,
    amount_cents: amountCents,
    commission_cents: commissionCents,
    url,
    payment_id: paymentId || null,
  });

  if (error && error.code === "23505") return;
  if (error) console.error("referral_sales insert failed:", error);
}

export async function getCreatorStats(creator: Creator) {
  const [{ data: recent, error: recentError }, { data: totals, error: totalsError }] =
    await Promise.all([
      supabaseServer
        .from("referral_sales")
        .select("id, created_at, kind, amount_cents, commission_cents, url")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseServer
        .from("referral_sales")
        .select("kind, commission_cents")
        .eq("creator_id", creator.id),
    ]);

  if (recentError) console.error("referral_sales load failed:", recentError);
  if (totalsError) console.error("referral_sales totals failed:", totalsError);

  const rows = totals || [];
  const earnedCents = rows.reduce((sum, sale) => sum + (sale.commission_cents || 0), 0);

  return {
    clicks: creator.clicks,
    hops: rows.filter((sale) => sale.kind === "hop").length,
    sponsored: rows.filter((sale) => sale.kind === "sponsored").length,
    sales: (recent || []) as ReferralSale[],
    earnedCents,
    unpaidCents: Math.max(0, earnedCents - creator.paid_cents),
    paidCents: creator.paid_cents,
  };
}
