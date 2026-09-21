"use client";

import { Fragment, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { getProductLogoUrl, handleLogoError } from "@/lib/logo";
import { minBidForUrl } from "@/lib/bid";
import { hallOfFameClaimPrice } from "@/lib/hof";
import { BOARD_FILTERS } from "@/lib/categories";
import { LISTINGS_PER_PAGE, type BoardMode, boardCanonicalPath, boardPath } from "@/lib/pagination";
import { productPath } from "@/lib/product-path";
import { trackProductClick } from "@/lib/track-click";
import { readVotedFromStorage, writeVotedToStorage } from "@/lib/upvotes";
import Pagination from "./Pagination";
import SponsoredSlots from "./SponsoredSlots";
import LatestActivity from "./LatestActivity";
import TopUpvoted from "./TopUpvoted";
import UpvoteButton from "./UpvoteButton";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

const BOARD_MODES: { id: BoardMode; label: string; shortLabel?: string }[] = [
  { id: "alltime", label: "All time" },
  { id: "recent", label: "Last 48 hrs", shortLabel: "48 hrs" },
];

const hoppedAt = (item: Product) =>
  new Date(item.last_hopped_at || item.created_at || 0).getTime();

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export default function LiveLeaderboard({
  page = 1,
  boardMode = "alltime",
  initialProducts = [],
  initialVoted = [],
}: {
  page?: number;
  boardMode?: BoardMode;
  initialProducts?: Product[];
  initialVoted?: string[];
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [leaderboardData, setLeaderboardData] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set(initialVoted));

  const ITEMS_PER_PAGE = LISTINGS_PER_PAGE;
  const currentPage = page;

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    setVotedIds((prev) => new Set([...prev, ...readVotedFromStorage()]));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("price", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (data) {
          const rankedData = data.map((item, idx) => ({ ...item, rank: idx + 1 }));
          setLeaderboardData(rankedData);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const subscription = supabase
      .channel("products_changes_full")
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
  }, []);

  const champion = useMemo(() => {
    if (leaderboardData.length < 2) return null;
    return leaderboardData[0];
  }, [leaderboardData]);

  const activeBoard = useMemo(() => {
    if (!champion) return leaderboardData;
    return leaderboardData
      .filter((p) => p.id !== champion.id)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [leaderboardData, champion]);

  const recentBoard = useMemo(() => {
    const cutoff = now - FORTY_EIGHT_HOURS_MS;
    return activeBoard
      .filter((item) => hoppedAt(item) >= cutoff)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [activeBoard, now]);

  const sourceBoard = boardMode === "recent" ? recentBoard : activeBoard;

  const filteredData = sourceBoard.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || (item.category || "").toLowerCase().includes(activeCategory.toLowerCase());
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (item.name || "").toLowerCase().includes(query) ||
      (item.description || "").toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if ((searchQuery || activeCategory !== "All") && page > 1) {
      router.replace(`${boardCanonicalPath(boardMode, 1)}#leaderboard`);
    }
  }, [searchQuery, activeCategory, boardMode, page, router]);

  useEffect(() => {
    if (page <= 1) return;
    document.getElementById("leaderboard")?.scrollIntoView({ block: "start" });
  }, [page]);

  const latestActivity = useMemo(() => {
    return [...sourceBoard]
      .sort((a, b) => hoppedAt(b) - hoppedAt(a))
      .slice(0, 5);
  }, [sourceBoard]);

  const latestActivityMobile = latestActivity.slice(0, 3);

  const topUpvoted = useMemo(() => {
    const pool = champion ? [champion, ...activeBoard] : leaderboardData;
    return [...pool]
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0) || hoppedAt(b) - hoppedAt(a))
      .slice(0, 5);
  }, [leaderboardData, champion, activeBoard]);

  const topUpvotedMobile = topUpvoted.slice(0, 3);

  const showMobileExtras =
    currentPage === 1 &&
    activeCategory === "All" &&
    !searchQuery.trim();

  const showLatestActivity = showMobileExtras && latestActivity.length > 0;

  const trackClick = (item: Product) => {
    setLeaderboardData((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, clicks: (p.clicks || 0) + 1 } : p))
    );
    trackProductClick(item.id);
  };

  const markVoted = (productId: string, nextCount: number) => {
    setLeaderboardData((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, upvotes: nextCount } : p))
    );
    setVotedIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      writeVotedToStorage([...next]);
      return next;
    });
  };

  const hopThis = (item: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("prefill-hop", {
        detail: { url: item.url, price: minBidForUrl(item.url) },
      })
    );
    const hopSection = document.getElementById("submit");
    if (hopSection) {
      hopSection.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const claimHof = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!champion) return;
    window.dispatchEvent(
      new CustomEvent("prefill-hop", {
        detail: { price: hallOfFameClaimPrice(champion.price), lockMin: true },
      })
    );
    const hopSection = document.getElementById("submit");
    if (hopSection) {
      hopSection.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="leaderboard" className="w-full px-4 md:px-8 lg:px-16 pt-2 pb-10 flex flex-col items-center">
      <div className="page-wide mx-auto">
        <div className="lg:grid lg:grid-cols-[70%_minmax(0,1fr)] lg:gap-x-12 lg:items-start">
        <div className="min-w-0">
        {champion && (
          <div className="relative mb-5">
            <div className="absolute -inset-3 md:-inset-4 rounded-3xl bg-gradient-to-r from-amber-300/40 via-yellow-200/25 to-transparent blur-2xl animate-hof-glow pointer-events-none" />
            <div className="absolute -top-1 left-[12%] w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_10px_3px_rgba(251,191,36,0.7)] animate-hof-sparkle pointer-events-none" />
            <div className="absolute top-2 right-[22%] w-1 h-1 rounded-full bg-yellow-100 shadow-[0_0_8px_2px_rgba(253,224,71,0.8)] animate-hof-sparkle pointer-events-none [animation-delay:0.7s]" />
            <div className="absolute bottom-3 left-[38%] w-1 h-1 rounded-full bg-amber-100 shadow-[0_0_8px_2px_rgba(251,191,36,0.75)] animate-hof-sparkle pointer-events-none [animation-delay:1.3s]" />

            <div className="relative flex items-center justify-between gap-3 mb-1.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
                Hall of Fame
              </p>
              <button
                type="button"
                onClick={claimHof}
                className="text-[10px] md:text-[11px] font-medium text-amber-900/75 hover:text-amber-950 transition-colors"
              >
                claim this for{" "}
                <span className="font-semibold tabular-nums">
                  ${hallOfFameClaimPrice(champion.price).toLocaleString()}
                </span>
              </button>
            </div>

            <img
              src="/theme/hoppy-rocket.png"
              alt=""
              width={243}
              height={328}
              className="pointer-events-none absolute left-2 bottom-1 z-10 hidden h-[70px] w-auto select-none lg:block"
            />

            <a
              href={productPath(champion)}
              onClick={() => trackClick(champion)}
              onAuxClick={(e) => {
                if (e.button === 1) trackClick(champion);
              }}
              className="group relative overflow-hidden flex items-center gap-2.5 md:gap-3.5 py-3.5 px-3 md:px-3.5 lg:pl-[4.75rem] rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-200/80 via-yellow-50/70 to-white/80 backdrop-blur-xl shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_12px_40px_-12px_rgba(217,119,6,0.55)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-amber-200/20 animate-hof-sheen" />
              <div className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-hof-shimmer" />

              <div className="relative shrink-0">
                <div className="absolute -inset-1.5 rounded-2xl bg-amber-300/50 blur-md animate-hof-glow" />
                <div className="relative w-[50px] h-[50px] rounded-2xl overflow-hidden bg-white ring-2 ring-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.55)]">
                  {champion.url ? (
                    <img
                      src={getProductLogoUrl(champion)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover bg-white"
                      onError={(e) => handleLogoError(e.currentTarget, champion.url)}
                    />
                  ) : (
                    <img src="/globe.svg" alt="" className="w-5 h-5 m-auto mt-3.5 opacity-40" />
                  )}
                </div>
                <Crown className="absolute -top-2 -right-1.5 w-4 h-4 fill-amber-400 text-amber-700 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
              </div>

              <div className="relative flex-1 min-w-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <h3 className="text-[16px] md:text-[18px] font-semibold tracking-tight text-amber-950 truncate group-hover:text-amber-800 transition-colors">
                    {champion.name}
                  </h3>
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-400/30 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                    Unchallenged
                  </span>
                </div>
                <p className="text-[12px] text-amber-900/60 truncate max-w-[520px]">
                  {champion.description}
                </p>
                <p className="text-[11px] text-amber-800/70 mt-0.5">
                  {(champion.clicks || 0).toLocaleString()} clicks
                  {champion.created_at && (
                    <>
                      {" · "}
                      {getTimeAgo(champion.last_hopped_at || champion.created_at)}
                    </>
                  )}
                </p>
              </div>

              <div className="relative shrink-0 text-right">
                <div className="text-[18px] md:text-[20px] font-semibold tabular-nums text-amber-900 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]">
                  ${champion.price.toLocaleString()}
                </div>
                <div className="text-[11px] font-medium text-amber-800/80">enshrined</div>
              </div>
              <UpvoteButton
                productId={champion.id}
                count={champion.upvotes || 0}
                voted={votedIds.has(champion.id)}
                onVoted={markVoted}
              />
            </a>
          </div>
        )}

        <div className="lg:hidden">
          <SponsoredSlots />
        </div>

        <div className="relative mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground leading-none">
              Who&apos;s up
            </h2>
            <p className="hidden sm:block mt-1 text-[10px] md:text-[11px] leading-tight text-secondary/80">
              {boardMode === "recent"
                ? "Separate ranks for anyone who hopped in the last 48 hours."
                : "The internet's most unnecessary competition."}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Leaderboard period"
            className="relative inline-flex items-center rounded-full border border-white/70 bg-white/30 p-[3px] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_28px_-18px_rgba(45,41,38,0.45)]"
          >
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-glass-sheen" />
            </span>
            {BOARD_MODES.map((mode) => {
              const selected = boardMode === mode.id;
              return (
                <Link
                  key={mode.id}
                  href={boardPath(mode.id, 1)}
                  role="tab"
                  aria-selected={selected}
                  className={`relative z-10 rounded-full px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-semibold tracking-tight transition-colors ${
                    selected ? "text-foreground" : "text-secondary/80 hover:text-foreground"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="board-mode-pill"
                      className="absolute -inset-px overflow-hidden rounded-full shadow-[0_0_10px_rgba(212,175,55,0.55),0_0_22px_rgba(245,215,110,0.4)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    >
                      <span
                        className="absolute left-1/2 top-1/2 h-[230%] w-[230%] -translate-x-1/2 -translate-y-1/2 animate-toggle-spin"
                        style={{
                          background:
                            "conic-gradient(from 0deg, transparent 0deg 190deg, #8A6A1A 240deg, #D4AF37 290deg, #F5D76E 325deg, #FFF4C2 348deg, transparent 360deg)",
                        }}
                      />
                      <span className="absolute inset-[1.5px] overflow-hidden rounded-full bg-[linear-gradient(180deg,#FFF8E4_0%,#FFFBF2_55%,#F7E7B8_100%)] backdrop-blur-md">
                        <span className="absolute inset-y-0 -left-1/2 w-2/3 bg-gradient-to-r from-transparent via-white to-transparent animate-glass-sheen" />
                        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,244,194,0.9),transparent_55%)]" />
                      </span>
                    </motion.span>
                  )}
                  <span className="relative">
                    {mode.shortLabel ? (
                      <>
                        <span className="sm:hidden">{mode.shortLabel}</span>
                        <span className="hidden sm:inline">{mode.label}</span>
                      </>
                    ) : (
                      mode.label
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-0.5 w-max">
              {BOARD_FILTERS.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`relative shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold tracking-tight transition-colors ${
                      active ? "text-white" : "text-secondary hover:text-foreground hover:bg-white/60"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="category-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FF8E3C] to-[#F06A0F] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_18px_-8px_rgba(255,122,31,0.8)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="relative hidden sm:flex shrink-0 items-center w-[180px] rounded-full bg-white/60 border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-within:border-accent/50 transition-colors">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-secondary/70 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-8 pr-3 py-1.5 outline-none text-[13px] font-medium placeholder:text-secondary/50"
            />
          </label>
        </div>

        <label className="relative sm:hidden mb-3 flex items-center border-b border-foreground/15 focus-within:border-accent transition-colors">
          <Search className="absolute left-3.5 w-3.5 h-3.5 text-secondary/70 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-9 pr-3 py-2.5 outline-none text-[13px] font-medium placeholder:text-secondary/50"
          />
        </label>

        <div className="flex flex-col min-h-[280px]">
          {isLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-[76px] border-b border-border/50 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {paginatedData.map((item) => {
                  const productHref = productPath(item);
                  const podium = item.rank === 1 ? "gold" : item.rank === 2 ? "silver" : item.rank === 3 ? "bronze" : null;

                  const medalTone = podium === "gold"
                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-2 ring-amber-300/80 shadow-md shadow-amber-500/30"
                    : podium === "silver"
                      ? "bg-gradient-to-br from-slate-100 to-slate-400 text-slate-800 ring-2 ring-slate-300 shadow-md shadow-slate-400/25"
                      : podium === "bronze"
                        ? "bg-gradient-to-br from-orange-300 to-amber-700 text-orange-950 ring-2 ring-orange-400/70 shadow-md shadow-orange-500/20"
                        : "";

                  const insertMobileExtras =
                    showMobileExtras &&
                    (item.rank === 3 ||
                      (item === paginatedData[paginatedData.length - 1] &&
                        !paginatedData.some((row) => row.rank === 3)));

                  return (
                    <Fragment key={item.id}>
                    <motion.a
                      href={productHref}
                      onClick={() => trackClick(item)}
                      onAuxClick={(e) => {
                        if (e.button === 1) trackClick(item);
                      }}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group flex items-center gap-3 md:gap-4 py-3.5 border-b border-border/50 hover:bg-white/40 -mx-1 px-1 transition-colors"
                    >
                      {podium ? (
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold tabular-nums shrink-0 ${medalTone}`}>
                          {item.rank}
                        </span>
                      ) : (
                        <span className="w-7 shrink-0 text-[13px] font-semibold tabular-nums text-secondary">
                          #{item.rank}
                        </span>
                      )}

                      <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border/40">
                        {item.url ? (
                          <img
                            src={getProductLogoUrl(item)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover bg-white"
                            onError={(e) => handleLogoError(e.currentTarget, item.url)}
                          />
                        ) : (
                          <img src="/globe.svg" alt="" className="w-5 h-5 m-auto mt-3.5 opacity-40" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <h3 className="text-[14px] md:text-[15px] font-semibold tracking-tight text-foreground truncate group-hover:text-accent transition-colors">
                            {item.name}
                          </h3>
                          <span className="hidden md:inline text-[11px] text-secondary/70 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-secondary truncate max-w-[520px] text-[12px]">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary/80">
                          <span>{(item.clicks || 0).toLocaleString()} clicks</span>
                          {item.created_at && (
                            <>
                              <span className="text-border">·</span>
                              <span>{getTimeAgo(item.last_hopped_at || item.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-semibold tabular-nums text-[15px] md:text-base">
                            ${item.price.toLocaleString()}
                          </span>
                          <button
                            onClick={(e) => hopThis(item, e)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-accent transition-colors"
                          >
                            hop
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <UpvoteButton
                          productId={item.id}
                          count={item.upvotes || 0}
                          voted={votedIds.has(item.id)}
                          onVoted={markVoted}
                        />
                      </div>
                    </motion.a>
                    {insertMobileExtras && (
                      <div className="lg:hidden">
                        <TopUpvoted
                          items={topUpvotedMobile}
                          voted={votedIds}
                          championId={champion?.id}
                          onOpen={trackClick}
                          onVoted={markVoted}
                          layout="strip"
                        />
                        {showLatestActivity && (
                          <LatestActivity items={latestActivityMobile} onOpen={trackClick} />
                        )}
                      </div>
                    )}
                    </Fragment>
                  );
                })}
              </AnimatePresence>

              {filteredData.length === 0 && (
                <div className="my-6 py-10 px-2 text-center text-secondary flex flex-col items-center">
                  <img
                    src="/theme/hoppy-angry.png"
                    alt=""
                    width={142}
                    height={189}
                    className="h-16 w-auto mb-3 animate-hoppy-bob select-none"
                  />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {boardMode === "recent" && !searchQuery && activeCategory === "All"
                      ? "No hops in the last 48 hours"
                      : "No products found"}
                  </p>
                  <p className="text-[13px]">
                    {boardMode === "recent" && !searchQuery && activeCategory === "All"
                      ? "Hop now and you can take #1 on this board."
                      : "The board is empty. Be the first to hop up."}
                  </p>
                </div>
              )}

              <Pagination
                current={currentPage}
                total={totalPages}
                hrefForPage={(nextPage) => boardPath(boardMode, nextPage)}
              />
            </>
          )}
        </div>
        </div>

        <aside className="hidden lg:block self-start">
          <SponsoredSlots variant="sidebar" />
          <TopUpvoted
            items={topUpvoted}
            voted={votedIds}
            championId={champion?.id}
            onOpen={trackClick}
            onVoted={markVoted}
          />
          <LatestActivity items={latestActivity} layout="stack" onOpen={trackClick} />
        </aside>
        </div>
      </div>
    </section>
  );
}
