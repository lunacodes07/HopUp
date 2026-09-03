import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VisitSiteButton from "@/components/VisitSiteButton";
import { getProxiedLogoUrl } from "@/lib/logo";
import { displayHost, productPath, toExternalUrl } from "@/lib/product-path";
import { getTimeAgo } from "@/lib/time-ago";
import type { Product } from "@/types";

export default function ListingsIndex({ products }: { products: Product[] }) {
  return (
    <>
      <Navbar />
      <main className="w-full px-4 md:px-8 pt-24 md:pt-28 pb-20">
        <div className="w-full max-w-[1000px] mx-auto">
          <p className="text-[11px] font-medium text-secondary mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-border mx-1.5">/</span>
            Listings
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div>
              <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-foreground leading-snug">
                All listings
              </h1>
              <p className="text-sm md:text-base text-secondary mt-1">
                {products.length} {products.length === 1 ? "product" : "products"} on the board.
              </p>
            </div>
            <Link
              href="/#submit"
              className="inline-flex items-center justify-center self-start sm:self-auto bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors"
            >
              Hop your product
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-foreground mb-1">The board is empty</p>
              <p className="text-[13px] text-secondary">Be the first to hop up.</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {products.map((item) => {
                const href = toExternalUrl(item.url);
                const host = displayHost(item.url);
                const isChamp = item.rank === 0;

                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 md:gap-4 py-3.5 border-b border-border/50"
                  >
                    <span className="w-8 shrink-0 text-[13px] font-semibold tabular-nums text-secondary">
                      {isChamp ? "★" : `#${item.rank}`}
                    </span>

                    <Link
                      href={productPath(item)}
                      className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-muted border border-border/40"
                    >
                      <img
                        src={getProxiedLogoUrl(item.url)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover bg-white"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <Link
                          href={productPath(item)}
                          className="font-semibold tracking-tight text-[14px] md:text-[15px] text-foreground truncate hover:text-accent transition-colors"
                        >
                          {item.name}
                        </Link>
                        {isChamp && (
                          <span className="hidden sm:inline shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                            Hall of Fame
                          </span>
                        )}
                        <span className="hidden md:inline text-[11px] text-secondary/70 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[12px] text-secondary truncate">
                        {item.description || host}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-[15px]">
                        ${item.price.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-secondary/80">
                        <span className="hidden sm:inline">
                          {(item.clicks || 0).toLocaleString()} clicks
                        </span>
                        <span className="hidden sm:inline text-border">·</span>
                        <span>{getTimeAgo(item.last_hopped_at || item.created_at)}</span>
                      </div>
                      {href && (
                        <VisitSiteButton
                          productId={item.id}
                          href={href}
                          className="text-[11px] font-medium text-secondary hover:text-accent transition-colors"
                        >
                          Visit
                        </VisitSiteButton>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
