"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Loader2, ChevronDown, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { DEFAULT_MIN_BID, LOL_MIN_BID, minBidForUrl } from "@/lib/bid";
import { DEFAULT_CATEGORY, isProductCategory, PRODUCT_CATEGORIES } from "@/lib/categories";
import { hallOfFameClaimPrice } from "@/lib/hof";
import { listingKey } from "@/lib/format-url";
import { claimPriceForListing, expectedAllTimeRank, findHof, topWeekBid, weekBid } from "@/lib/week";
import { rememberPendingShare } from "@/lib/share";
import LiveStats from "./LiveStats";
import Ticker from "./Ticker";

const getFormattedUrlInfo = (rawUrl: string) => {
  let finalUrl = rawUrl.trim();
  let nameFallback = finalUrl;

  if (finalUrl.startsWith("@")) {
    finalUrl = `https://x.com/${finalUrl.substring(1)}`;
    nameFallback = rawUrl;
  } else {
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && finalUrl.length > 0) {
      finalUrl = "https://" + finalUrl;
    }
    nameFallback = finalUrl.replace(/^https?:\/\//, "").split("/")[0];
  }

  finalUrl = finalUrl.replace(/\/$/, "");
  return { finalUrl, nameFallback };
};

export default function Hero() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [bidAmount, setBidAmount] = useState(DEFAULT_MIN_BID);
  const [lockedMin, setLockedMin] = useState(0);
  const [claimingHof, setClaimingHof] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const urlFloor = useMemo(() => minBidForUrl(url), [url]);
  const minBid = Math.max(urlFloor, lockedMin);

  const applyBid = (amount: number, options?: { lockMin?: number; rawUrl?: string; hof?: boolean }) => {
    const floorFromUrl = minBidForUrl(options?.rawUrl ?? url);
    const lock = options?.lockMin ?? 0;
    setClaimingHof(Boolean(options?.hof));
    setLockedMin(lock);
    setBidAmount(Math.max(floorFromUrl, lock, amount));
  };

  const fetchData = useCallback(async () => {
    try {
      const columns = "id, url, category, price, week_bid, is_hof, last_hopped_at, created_at";
      const full = await supabase
        .from("products")
        .select(columns)
        .order("price", { ascending: false })
        .order("created_at", { ascending: true });
      const result = full.error
        ? await supabase
            .from("products")
            .select("id, url, category, price, last_hopped_at, created_at")
            .order("price", { ascending: false })
            .order("created_at", { ascending: true })
        : full;

      if (result.error) throw result.error;
      if (result.data) setLeaderboardData(result.data as Product[]);
    } catch (err) {
      console.error("Failed to fetch products for rank preview:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel("hero_rank_preview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchData]);

  useEffect(() => {
    const handlePrefill = (e: CustomEvent) => {
      if (!e.detail) return;
      const nextUrl = typeof e.detail.url === "string" ? e.detail.url : undefined;
      if (nextUrl) setUrl(nextUrl);
      if (typeof e.detail.category === "string" && isProductCategory(e.detail.category)) {
        setCategory(e.detail.category);
      }
      if (typeof e.detail.price === "number") {
        applyBid(e.detail.price, {
          lockMin: e.detail.lockMin ? e.detail.price : 0,
          rawUrl: nextUrl,
          hof: Boolean(e.detail.lockMin),
        });
      } else if (nextUrl) {
        applyBid(minBidForUrl(nextUrl), { rawUrl: nextUrl });
      }
    };

    window.addEventListener("prefill-hop", handlePrefill as EventListener);

    const hopFromQuery = new URLSearchParams(window.location.search).get("hop");
    if (hopFromQuery) {
      setUrl(hopFromQuery);
      applyBid(minBidForUrl(hopFromQuery), { rawUrl: hopFromQuery });
      window.setTimeout(() => {
        urlInputRef.current?.focus();
        document.getElementById("submit")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }

    return () => window.removeEventListener("prefill-hop", handlePrefill as EventListener);
  }, []);

  useEffect(() => {
    setBidAmount((prev) => {
      if (lockedMin > 0) return Math.max(minBid, prev);
      if (prev < minBid) return minBid;
      if (prev === DEFAULT_MIN_BID && urlFloor === LOL_MIN_BID) return LOL_MIN_BID;
      return prev;
    });
  }, [minBid, lockedMin, urlFloor]);

  const handleHop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isProcessing) return;

    setIsProcessing(true);

    try {
      const { finalUrl, nameFallback } = getFormattedUrlInfo(url);
      rememberPendingShare({
        url: finalUrl,
        bid: bidAmount,
        name: nameFallback,
        kind: "hop",
      });

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          bidAmount,
          category,
          nameFallback,
          ...(logoDataUrl ? { logoDataUrl } : {}),
          ...(claimingHof ? { hof: true } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url: checkoutUrl } = await response.json();

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error("No checkout URL returned from server.");
    } catch (err) {
      console.error("Error processing hop:", err);
      alert("Failed to process payment/hop.");
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustBid = (amount: number) => {
    setBidAmount((prev) => Math.max(minBid, prev + amount));
  };

  const handleBidInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setBidAmount(Math.max(minBid, val));
    }
  };

  const pinned = useMemo(() => findHof(leaderboardData), [leaderboardData]);
  const weekTop = useMemo(() => topWeekBid(leaderboardData), [leaderboardData]);
  const matchedListing = useMemo(() => {
    const key = listingKey(url);
    if (!key) return null;
    return leaderboardData.find((product) => listingKey(product.url) === key) ?? null;
  }, [leaderboardData, url]);
  const matchedWeek = matchedListing ? weekBid(matchedListing) : 0;
  const claimThisWeek = claimPriceForListing(leaderboardData, matchedListing, urlFloor);
  const weekHasLeader = weekTop > 0;
  const staysOnPlaque = Boolean(pinned && matchedListing && matchedListing.id === pinned.id);
  const allTimeRank = useMemo(
    () => expectedAllTimeRank(leaderboardData, matchedListing, bidAmount),
    [leaderboardData, matchedListing, bidAmount],
  );
  const hofPrice = pinned ? hallOfFameClaimPrice(pinned.price) : 0;

  useEffect(() => {
    if (!claimingHof || !pinned) return;
    setLockedMin(hofPrice);
    setBidAmount(hofPrice);
  }, [claimingHof, pinned, hofPrice]);

  return (
    <section className="relative w-full px-4 md:px-8 lg:px-16 pt-20 md:pt-24 pb-3 md:pb-4">
      <div className="page-wide mx-auto flex flex-col items-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4 text-center">
          <Link
            href="/brandmystanley"
            className="group btn-glass relative inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 text-[12px] font-semibold text-foreground shadow-[0_4px_14px_-8px_rgba(255,122,31,0.6)]"
          >
            <span className="relative overflow-hidden rounded-full bg-accent px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] text-white">
              New
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-glass-sheen bg-gradient-to-r from-transparent via-white/80 to-transparent"
              />
            </span>
            <span>Brand My Stanley</span>
            <ArrowRight className="w-3 h-3 text-accent transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <span className="hidden sm:inline text-border">·</span>
          <LiveStats />
          <span className="hidden sm:inline text-border">·</span>
          <div className="hidden sm:block">
            <Ticker />
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-10 mb-6 lg:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block text-left max-w-[560px]"
          >
            <h1 className="text-[32px] md:text-[42px] lg:text-[56px] font-semibold tracking-tight text-foreground leading-[1.05] mb-3">
              Your product deserves <span className="text-accent">more eyes.</span>
            </h1>
            <p className="text-base md:text-lg lg:text-[22px] text-secondary">
              A permanent listing and a backlink. Pay once.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center lg:items-end text-center lg:text-right shrink-0"
          >
            <button
              type="button"
              onClick={() => {
                applyBid(weekHasLeader ? claimThisWeek : urlFloor);
                urlInputRef.current?.focus();
              }}
              className="text-[26px] md:text-[32px] lg:whitespace-nowrap lg:text-[40px] font-semibold tracking-tight text-foreground leading-snug hover:opacity-80 transition-opacity"
            >
              {weekHasLeader ? (
                <>
                  Claim <span className="text-accent">#1</span> this week for{" "}
                  <span className="text-accent tabular-nums">${claimThisWeek}</span>
                </>
              ) : (
                <>
                  Get listed for <span className="text-accent tabular-nums">${urlFloor}</span>
                </>
              )}
            </button>
            <p className="text-sm md:text-base lg:text-lg text-secondary mt-2">
              {weekHasLeader ? (
                <>
                  Or get listed for{" "}
                  <button
                    type="button"
                    onClick={() => {
                      applyBid(urlFloor);
                      urlInputRef.current?.focus();
                    }}
                    className="font-semibold text-accent hover:underline underline-offset-2 tabular-nums"
                  >
                    ${urlFloor}
                  </button>
                </>
              ) : (
                <>
                  Or claim #1 this week for{" "}
                  <button
                    type="button"
                    onClick={() => {
                      applyBid(claimThisWeek);
                      urlInputRef.current?.focus();
                    }}
                    className="font-semibold text-accent hover:underline underline-offset-2 tabular-nums"
                  >
                    ${claimThisWeek}
                  </button>
                </>
              )}
            </p>
            <p className="text-[12px] md:text-[13px] text-secondary/80 mt-2 max-w-[360px]">
              The page stays. This rank lasts 7 days. All time keeps the total.
            </p>
          </motion.div>
        </div>

        <motion.form
          id="submit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleHop}
          className="relative w-full px-1 py-2"
        >
          {isProcessing && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[26px] bg-background/70 backdrop-blur-[2px]">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          )}

          <div className="flex flex-col items-center md:flex-row md:items-start gap-4 md:gap-3">
            <div className="w-full md:flex-1 md:min-w-[180px]">
              <input
                ref={urlInputRef}
                id="url"
                type="text"
                placeholder="yoursite.com or @handle"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent border-b border-foreground/15 focus:border-accent outline-none py-2.5 text-base font-medium text-center md:text-left placeholder:text-secondary/60 transition-colors"
              />
              <p className="mt-2 text-center md:text-left text-sm md:text-base font-bold tracking-tight text-foreground">
                Expected All time Rank: {" "}
                {claimingHof || staysOnPlaque ? (
                  <span className="text-accent">Hall of Fame</span>
                ) : (
                  <span className="text-accent tabular-nums">#{allTimeRank}</span>
                )}
              </p>
            </div>

            <div className="relative shrink-0">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Category"
                className="appearance-none bg-transparent border-b border-foreground/15 focus:border-accent outline-none py-2.5 pr-7 text-base font-medium cursor-pointer transition-colors"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => adjustBid(-1)}
                disabled={bidAmount <= minBid}
                aria-label="Decrease bid"
                className="w-9 h-9 flex items-center justify-center text-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex items-center min-w-[80px] justify-center border-b border-foreground/20 focus-within:border-accent transition-colors">
                <span className="text-secondary text-base select-none">$</span>
                <input
                  type="number"
                  min={minBid}
                  step="1"
                  value={bidAmount}
                  onChange={handleBidInputChange}
                  aria-label="Bid amount"
                  className="w-16 bg-transparent text-center font-semibold text-lg outline-none appearance-none m-0 py-1.5 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                type="button"
                onClick={() => adjustBid(1)}
                aria-label="Increase bid"
                className="w-9 h-9 flex items-center justify-center text-secondary hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="group btn-primary shrink-0 inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-base font-semibold disabled:opacity-60"
            >
              Hop Up
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const objectUrl = URL.createObjectURL(file);
                  try {
                    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                      const el = new Image();
                      el.onload = () => resolve(el);
                      el.onerror = () => reject(new Error("Could not read that image"));
                      el.src = objectUrl;
                    });
                    const size = 512;
                    const canvas = document.createElement("canvas");
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext("2d")!;
                    const scale = Math.max(size / img.width, size / img.height);
                    ctx.drawImage(
                      img,
                      (size - img.width * scale) / 2,
                      (size - img.height * scale) / 2,
                      img.width * scale,
                      img.height * scale
                    );
                    setLogoDataUrl(canvas.toDataURL("image/png"));
                  } finally {
                    URL.revokeObjectURL(objectUrl);
                  }
                } catch {
                  setLogoDataUrl(null);
                }
              }}
            />
            {logoDataUrl ? (
              <span className="inline-flex items-center gap-2 self-center md:self-auto">
                <img src={logoDataUrl} alt="" className="w-7 h-7 rounded-md border border-border/50 bg-white object-contain" />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-[12px] font-semibold text-foreground hover:text-accent-dark"
                >
                  Replace logo
                </button>
                <button
                  type="button"
                  onClick={() => setLogoDataUrl(null)}
                  aria-label="Remove uploaded logo"
                  className="text-secondary hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 self-center md:self-auto text-[12px] font-semibold text-secondary hover:text-foreground transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload logo
              </button>
            )}
          </div>

          <p className="mt-2 text-sm text-secondary text-center md:text-left">
            {claimingHof ? (
              <>
                <span className="font-semibold text-foreground">
                  This payment takes <span className="text-accent">Hall of Fame</span>
                </span>
                {" · "}
                <button
                  type="button"
                  onClick={() => applyBid(weekHasLeader ? claimThisWeek : urlFloor)}
                  className="font-semibold text-accent hover:underline underline-offset-2"
                >
                  Back to this week
                </button>
              </>
            ) : (
              <span>
                {matchedWeek > 0
                  ? `This adds to the $${matchedWeek} already on this week. All time adds it to your total.`
                  : "This payment is this week's rank. All time adds it to your total."}
              </span>
            )}
            {urlFloor === LOL_MIN_BID && (
              <span className="text-secondary/70">{" · "}$1 min for .lol</span>
            )}
          </p>
        </motion.form>
      </div>
    </section>
  );
}
