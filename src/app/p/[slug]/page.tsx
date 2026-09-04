import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VisitSiteButton from "@/components/VisitSiteButton";
import { getProxiedLogoUrl } from "@/lib/logo";
import { displayHost, productPath, productSlug, toExternalUrl } from "@/lib/product-path";
import { findProductBySlug, getRankedProducts, withBoardRanks } from "@/lib/products-server";
import { shareFromProduct, xShareUrl } from "@/lib/share";
import { SITE_URL } from "@/lib/site";
import { getTimeAgo } from "@/lib/time-ago";
import type { Product } from "@/types";

export const revalidate = 60;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function loadListing(slug: string) {
  const ranked = withBoardRanks(await getRankedProducts());
  const product = findProductBySlug(ranked, slug);
  return { ranked, product };
}

export async function generateStaticParams() {
  try {
    const products = await getRankedProducts();
    return products.map((product) => ({ slug: productSlug(product) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await loadListing(slug);
    if (!product) return { title: "Listing not found — HopUp" };

    const title = `${product.name} — HopUp`;
    const description =
      product.description ||
      `${product.name} is listed on HopUp${product.category ? ` in ${product.category}` : ""}.`;

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}${productPath(product)}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}${productPath(product)}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: "HopUp listing" };
  }
}

function nearbyListings(ranked: Product[], currentId: string): Product[] {
  const idx = ranked.findIndex((p) => p.id === currentId);
  if (idx < 0) return ranked.slice(0, 3);
  return [ranked[idx - 1], ranked[idx + 1], ranked[idx + 2] || ranked[idx - 2]].filter(
    (item): item is Product => Boolean(item) && item.id !== currentId
  );
}

export default async function ProductListingPage({ params }: PageProps) {
  const { slug } = await params;
  let ranked: Product[] = [];
  let product: Product | null = null;

  try {
    const loaded = await loadListing(slug);
    ranked = loaded.ranked;
    product = loaded.product;
  } catch (err) {
    console.error("Failed to load listing:", err);
    notFound();
  }

  if (!product) notFound();

  const canonicalSlug = productSlug(product);
  if (canonicalSlug !== slug) {
    redirect(productPath(product));
  }

  const href = toExternalUrl(product.url);
  const host = displayHost(product.url);
  const isChamp = product.rank === 0;
  const nearby = nearbyListings(ranked, product.id);
  const hopped = getTimeAgo(product.last_hopped_at || product.created_at);
  const hopPrefill = href ? `/?hop=${encodeURIComponent(href)}` : "/";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description || undefined,
    url: href || undefined,
    applicationCategory: product.category || undefined,
    image: href ? `${SITE_URL}${getProxiedLogoUrl(product.url)}` : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="w-full px-4 md:px-8 pt-24 md:pt-28 pb-20">
        <div className="w-full max-w-[720px] mx-auto">
          <p className="text-[11px] font-medium text-secondary mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-border mx-1.5">/</span>
            <Link href="/p" className="hover:text-foreground transition-colors">
              Listings
            </Link>
            <span className="text-border mx-1.5">/</span>
            <span className="text-foreground">{product.name}</span>
          </p>

          <article className="rounded-3xl border border-white/70 bg-white/50 backdrop-blur-xl shadow-[0_12px_40px_-24px_rgba(45,41,38,0.35)] px-5 py-6 md:px-8 md:py-8">
            <div className="flex items-start gap-4 md:gap-5">
              <div className="relative shrink-0 w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm">
                <img
                  src={getProxiedLogoUrl(product.url)}
                  alt={`${product.name} logo`}
                  className="absolute inset-0 w-full h-full object-cover bg-white"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-secondary mb-1.5">
                  {isChamp ? (
                    <span className="text-amber-800 font-semibold uppercase tracking-[0.14em]">
                      Hall of Fame
                    </span>
                  ) : (
                    <span className="tabular-nums">#{product.rank}</span>
                  )}
                  {product.category && (
                    <>
                      <span className="text-border">·</span>
                      <span>{product.category}</span>
                    </>
                  )}
                </div>

                <h1 className="text-[26px] md:text-[34px] font-semibold tracking-tight text-foreground leading-snug">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="mt-2 text-sm md:text-base text-secondary leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-muted/70 px-2 py-3">
                <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Bid</dt>
                <dd className="mt-0.5 text-[17px] md:text-xl font-semibold tabular-nums">
                  ${product.price.toLocaleString()}
                </dd>
              </div>
              <div className="rounded-2xl bg-muted/70 px-2 py-3">
                <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Clicks</dt>
                <dd className="mt-0.5 text-[17px] md:text-xl font-semibold tabular-nums">
                  {(product.clicks || 0).toLocaleString()}
                </dd>
              </div>
              <div className="rounded-2xl bg-muted/70 px-2 py-3">
                <dt className="text-[10px] font-medium uppercase tracking-wider text-secondary">Hopped</dt>
                <dd className="mt-0.5 text-[17px] md:text-xl font-semibold">{hopped || "—"}</dd>
              </div>
            </dl>

            {host && (
              <p className="mt-4 text-[13px] text-secondary truncate">
                {href ? (
                  <VisitSiteButton
                    productId={product.id}
                    href={href}
                    className="hover:text-accent transition-colors"
                  >
                    {host}
                  </VisitSiteButton>
                ) : (
                  host
                )}
              </p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              {href && (
                <VisitSiteButton
                  productId={product.id}
                  href={href}
                  className="group inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-6 py-2.5 rounded-full text-[15px] font-semibold hover:bg-accent hover:text-foreground transition-colors"
                >
                  Visit site
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </VisitSiteButton>
              )}
              <Link
                href={hopPrefill}
                className="inline-flex items-center justify-center gap-1.5 border border-border bg-white/70 px-6 py-2.5 rounded-full text-[15px] font-semibold text-foreground hover:border-accent/50 hover:text-accent transition-colors"
              >
                Hop this
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={xShareUrl(shareFromProduct(product))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 border border-border bg-white/70 px-6 py-2.5 rounded-full text-[15px] font-semibold text-foreground hover:border-accent/50 hover:text-accent transition-colors"
              >
                Share on X
              </a>
            </div>
          </article>

          {nearby.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-secondary mb-3">
                Nearby on the board
              </h2>
              <ul className="flex flex-col">
                {nearby.map((item) => (
                  <li key={item.id} className="border-b border-border/50">
                    <Link href={productPath(item)} className="group flex items-center gap-3 py-3">
                      <span className="w-7 shrink-0 text-[12px] font-semibold tabular-nums text-secondary">
                        {item.rank === 0 ? "★" : `#${item.rank}`}
                      </span>
                      <div className="relative shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted border border-border/40">
                        <img
                          src={getProxiedLogoUrl(item.url)}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover bg-white"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold tracking-tight text-foreground truncate group-hover:text-accent transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[12px] text-secondary truncate">
                          {item.description || displayHost(item.url)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[14px] font-semibold tabular-nums">
                        ${item.price.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
