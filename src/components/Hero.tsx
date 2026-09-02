"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Minus, Plus, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { hallOfFameClaimPrice } from "@/lib/hof";
import LiveStats from "./LiveStats";
import Ticker from "./Ticker";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

const hoppedAt = (item: Product) =>
  new Date(item.last_hopped_at || item.created_at || 0).getTime();

const matchesUrl = (productUrl: string | undefined, finalUrl: string) =>
  productUrl?.replace(/\/$/, "").toLowerCase() === finalUrl.toLowerCase();

const CATEGORIES = [
  { value: "DevTools", label: "Developer Tools" },
  { value: "AI / Builders", label: "AI / Builders" },
  { value: "AI Agents", label: "AI Agents" },
  { value: "Marketing", label: "Marketing" },
  { value: "SEO", label: "SEO" },
  { value: "Design", label: "Design" },
  { value: "Other", label: "Other" },
];

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
  const [category, setCategory] = useState("DevTools");
  const [bidAmount, setBidAmount] = useState(2);
  const [minBid, setMinBid] = useState(2);
  const [leaderboardData, setLeaderboardData] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const applyBid = (amount: number, floor = 2) => {
    const nextFloor = Math.max(2, floor);
    setMinBid(nextFloor);
    setBidAmount(Math.max(nextFloor, amount));
  };

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, url, price, last_hopped_at, created_at")
        .order("price", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setLeaderboardData(data as Product[]);
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
      if (typeof e.detail.url === "string") setUrl(e.detail.url);
      if (typeof e.detail.price === "number") {
        const next = Math.max(2, e.detail.price);
        applyBid(next, e.detail.lockMin ? next : 2);
      }
    };

    window.addEventListener("prefill-hop", handlePrefill as EventListener);

    const hopFromQuery = new URLSearchParams(window.location.search).get("hop");
    if (hopFromQuery) {
      setUrl(hopFromQuery);
      applyBid(2);
      window.setTimeout(() => {
        urlInputRef.current?.focus();
        document.getElementById("submit")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }

    return () => window.removeEventListener("prefill-hop", handlePrefill as EventListener);
  }, []);

  const handleHop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isProcessing) return;

    setIsProcessing(true);

    try {
      const { finalUrl, nameFallback } = getFormattedUrlInfo(url);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          bidAmount,
          category,
          nameFallback,
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

  const champion = useMemo(() => {
    if (leaderboardData.length < 2) return null;
    return leaderboardData.reduce((top, p) => (p.price > top.price ? p : top));
  }, [leaderboardData]);

  const champId = champion?.id ?? null;

  const activeBoard = useMemo(
    () => (champId ? leaderboardData.filter((p) => p.id !== champId) : leaderboardData),
    [leaderboardData, champId]
  );

  const recentBoard = useMemo(() => {
    const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS;
    return activeBoard.filter((p) => hoppedAt(p) >= cutoff);
  }, [activeBoard]);

  const rankOnBoard = useCallback(
    (board: Product[], bid: number) => {
      let totalBid = bid;
      let existingProductId: string | null = null;

      if (url.trim()) {
        const { finalUrl } = getFormattedUrlInfo(url);
        const existingProduct = leaderboardData.find((p) => matchesUrl(p.url, finalUrl));
        if (existingProduct) {
          totalBid = existingProduct.price + bid;
          existingProductId = existingProduct.id;
        }
      }

      return (
        board.filter((p) => {
          if (existingProductId && p.id === existingProductId) return false;
          return p.price >= totalBid;
        }).length + 1
      );
    },
    [leaderboardData, url]
  );

  const expectedRank = useMemo(
    () => rankOnBoard(activeBoard, bidAmount),
    [rankOnBoard, activeBoard, bidAmount]
  );

  const expectedRecentRank = useMemo(
    () => rankOnBoard(recentBoard, bidAmount),
    [rankOnBoard, recentBoard, bidAmount]
  );

  const rankForTwoRecent = useMemo(
    () => rankOnBoard(recentBoard, 2),
    [rankOnBoard, recentBoard]
  );

  const amountForRank1 = useMemo(() => {
    if (activeBoard.length === 0) return 2;

    const topPrice = Math.max(...activeBoard.map((p) => p.price));

    let currentPrice = 0;
    if (url.trim()) {
      const { finalUrl } = getFormattedUrlInfo(url);
      const existingProduct = activeBoard.find((p) => matchesUrl(p.url, finalUrl));
      if (existingProduct) {
        currentPrice = existingProduct.price;
        const othersTop = activeBoard.filter((p) => p.id !== existingProduct.id && p.price >= topPrice);
        if (othersTop.length === 0 && currentPrice === topPrice) {
          return 2;
        }
      }
    }

    const requiredTotal = topPrice + 1;
    const requiredAdditionalBid = requiredTotal - currentPrice;

    return Math.max(2, requiredAdditionalBid);
  }, [activeBoard, url]);

  const amountForRecentRank1 = useMemo(() => {
    if (recentBoard.length === 0) return 2;

    const topPrice = Math.max(...recentBoard.map((p) => p.price));

    let currentPrice = 0;
    if (url.trim()) {
      const { finalUrl } = getFormattedUrlInfo(url);
      const existingProduct = activeBoard.find((p) => matchesUrl(p.url, finalUrl));
      if (existingProduct) {
        currentPrice = existingProduct.price;
        const othersTop = recentBoard.filter((p) => p.id !== existingProduct.id && p.price >= topPrice);
        if (othersTop.length === 0 && currentPrice === topPrice) {
          return 2;
        }
      }
    }

    return Math.max(2, topPrice + 1 - currentPrice);
  }, [recentBoard, activeBoard, url]);

  const projectedTotal = useMemo(() => {
    if (!url.trim()) return bidAmount;
    const { finalUrl } = getFormattedUrlInfo(url);
    const existing = leaderboardData.find((p) => matchesUrl(p.url, finalUrl));
    return existing ? existing.price + bidAmount : bidAmount;
  }, [bidAmount, url, leaderboardData]);

  const wouldTakeHof = Boolean(champion && projectedTotal > champion.price);

  const showRecentBoard = () => {
    window.dispatchEvent(new CustomEvent("show-recent-board"));
    document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative w-full px-4 md:px-8 pt-20 md:pt-24 pb-3 md:pb-4">
      <div className="w-full max-w-[1000px] mx-auto flex flex-col items-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 mb-4 text-center">
          <LiveStats />
          <span className="hidden sm:inline text-border">·</span>
          <div className="hidden sm:block">
            <Ticker />
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-8 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block text-left max-w-[520px]"
          >
            <h1 className="text-[32px] md:text-[42px] font-semibold tracking-tight text-foreground leading-snug mb-2">
              Your product deserves a <span className="text-accent">better spot.</span>
            </h1>
            <p className="text-base md:text-lg text-secondary">
              Pay once. No subscriptions. Pay more to rank higher.
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
                applyBid(amountForRank1);
                urlInputRef.current?.focus();
              }}
              className="text-[26px] md:text-[32px] font-semibold tracking-tight text-foreground leading-snug hover:opacity-80 transition-opacity"
            >
              Claim Rank <span className="text-accent">#1</span> for{" "}
              <span className="text-accent tabular-nums">${amountForRank1}</span>
            </button>
            <p className="text-sm md:text-base text-secondary mt-1.5">
              {rankForTwoRecent === 1 ? (
                <>
                  Or take{" "}
                  <button
                    type="button"
                    onClick={showRecentBoard}
                    className="font-semibold text-foreground hover:text-accent transition-colors"
                  >
                    Last 48 hrs #1
                  </button>{" "}
                  for{" "}
                  <button
                    type="button"
                    onClick={() => {
                      applyBid(2);
                      urlInputRef.current?.focus();
                    }}
                    className="font-semibold text-accent hover:underline underline-offset-2 tabular-nums"
                  >
                    $2
                  </button>
                </>
              ) : (
                <>
                  Or hop for{" "}
                  <button
                    type="button"
                    onClick={() => {
                      applyBid(2);
                      urlInputRef.current?.focus();
                    }}
                    className="font-semibold text-accent hover:underline underline-offset-2 tabular-nums"
                  >
                    $2
                  </button>
                  {" — "}
                  <button
                    type="button"
                    onClick={showRecentBoard}
                    className="font-semibold text-foreground hover:text-accent transition-colors tabular-nums"
                  >
                    #{rankForTwoRecent} on Last 48 hrs
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>

        <motion.form
          id="submit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleHop}
          className="w-full relative"
        >
          {isProcessing && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          )}

          <div className="flex flex-col items-center md:flex-row md:items-end gap-4 md:gap-3">
            <input
              ref={urlInputRef}
              id="url"
              type="text"
              placeholder="yoursite.com or @handle"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full md:flex-1 md:min-w-[180px] bg-transparent border-b border-foreground/15 focus:border-accent outline-none py-2.5 text-base font-medium text-center md:text-left placeholder:text-secondary/60 transition-colors"
            />

            <div className="relative shrink-0">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Category"
                className="appearance-none bg-transparent border-b border-foreground/15 focus:border-accent outline-none py-2.5 pr-7 text-base font-medium cursor-pointer transition-colors"
              >
                {CATEGORIES.map((cat) => (
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
              className="group shrink-0 inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-6 py-2.5 rounded-full text-base font-semibold hover:bg-accent hover:text-foreground transition-colors disabled:opacity-60"
            >
              Hop Up
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-secondary text-center md:text-left">
            {wouldTakeHof ? (
              <>
                <span className="font-semibold text-foreground">
                  Takes <span className="text-accent">Hall of Fame</span>
                </span>

              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={showRecentBoard}
                  className="font-semibold text-foreground hover:text-accent transition-colors tabular-nums"
                >
                  #{expectedRecentRank} on Last 48 hrs
                </button>
                <span className="text-secondary/70">
                  {" · "}all time #{expectedRank}
                </span>
              </>
            )}
            {!wouldTakeHof && expectedRecentRank > 1 && amountForRecentRank1 < amountForRank1 && (
              <>
                {" · "}
                <button
                  type="button"
                    onClick={() => {
                      applyBid(amountForRecentRank1);
                      urlInputRef.current?.focus();
                    }}
                  className="text-accent hover:underline underline-offset-2"
                >
                  take 48hr #1 for ${amountForRecentRank1}
                </button>
              </>
            )}
          </p>
        </motion.form>
      </div>
    </section>
  );
}
