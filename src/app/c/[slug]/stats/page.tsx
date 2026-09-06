import type { Metadata } from "next";
import { timingSafeEqual } from "crypto";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CopyTextButton from "@/components/CopyTextButton";
import { CREATOR_PAYOUT_MIN, creatorPath } from "@/lib/creators";
import { getCreatorBySlug, getCreatorStats } from "@/lib/creators-server";
import { SITE_URL } from "@/lib/site";
import { getTimeAgo } from "@/lib/time-ago";
import { displayHost } from "@/lib/product-path";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Creator stats — HopUp",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
};

function keysMatch(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function Locked() {
  return (
    <>
      <Navbar />
      <main className="w-full px-4 md:px-8 pt-24 md:pt-28 pb-20">
        <div className="w-full max-w-[480px] mx-auto text-center">
          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight">
            Private stats
          </h1>
          <p className="mt-2 text-sm md:text-base text-secondary">
            Open the secret link we sent you. There is no login.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default async function CreatorStatsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { k } = await searchParams;
  const creator = await getCreatorBySlug(slug);
  if (!creator || !k || !keysMatch(k, creator.stats_key)) {
    return <Locked />;
  }

  const stats = await getCreatorStats(creator);
  const shareUrl = `${SITE_URL}${creatorPath(creator.slug)}`;
  const ready = stats.unpaidCents >= CREATOR_PAYOUT_MIN * 100;

  return (
    <>
      <Navbar />
      <main className="w-full px-4 md:px-8 pt-24 md:pt-28 pb-20">
        <div className="w-full max-w-[640px] mx-auto">
          <p className="text-[11px] font-medium text-secondary mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-border mx-1.5">/</span>
            <span className="text-foreground">{creator.name}</span>
          </p>

          <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight">
            {creator.name}
          </h1>
          <p className="mt-1 text-sm md:text-base text-secondary">
            25% of hops and sponsored checkouts from your link. Paid monthly over ${CREATOR_PAYOUT_MIN}.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <code className="min-w-0 flex-1 truncate rounded-full border border-border bg-white/70 px-4 py-2 text-[13px]">
              {shareUrl.replace(/^https:\/\//, "")}
            </code>
            <CopyTextButton
              value={shareUrl}
              className="inline-flex items-center justify-center border border-border bg-white/70 px-5 py-2 rounded-full text-sm font-semibold hover:border-accent/50 hover:text-accent transition-colors"
            />
          </div>

          <dl className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-muted/70 px-2 py-3">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Clicks</dt>
              <dd className="mt-0.5 text-[17px] md:text-xl font-semibold tabular-nums">
                {stats.clicks.toLocaleString()}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/70 px-2 py-3">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Sales</dt>
              <dd className="mt-0.5 text-[17px] md:text-xl font-semibold tabular-nums">
                {(stats.hops + stats.sponsored).toLocaleString()}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/70 px-2 py-3">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Earned</dt>
              <dd className="mt-0.5 text-[17px] md:text-xl font-semibold tabular-nums">
                {dollars(stats.earnedCents)}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/70 px-2 py-3">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Unpaid</dt>
              <dd className="mt-0.5 text-[17px] md:text-xl font-semibold tabular-nums">
                {dollars(stats.unpaidCents)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-[13px] text-secondary">
            {ready
              ? "Over $25 unpaid — ready for the next payout."
              : `Payouts start at $${CREATOR_PAYOUT_MIN}. ${dollars(stats.unpaidCents)} waiting.`}
          </p>

          <section className="mt-10">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-secondary mb-3">
              Recent sales
            </h2>
            {stats.sales.length === 0 ? (
              <p className="text-sm text-secondary">No hops from your link yet.</p>
            ) : (
              <ul className="flex flex-col">
                {stats.sales.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex items-center justify-between gap-3 border-b border-border/50 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate">
                        {sale.kind === "sponsored"
                          ? "Sponsored"
                          : sale.kind === "stanley"
                            ? "Stanley"
                            : "Hop"}{" "}
                        · {dollars(sale.amount_cents)}
                      </p>
                      <p className="text-[12px] text-secondary truncate">
                        {displayHost(sale.url) || "hopup.lol"} · {getTimeAgo(sale.created_at) || "just now"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[14px] font-semibold tabular-nums">
                      {dollars(sale.commission_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
