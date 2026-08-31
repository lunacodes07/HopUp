"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Search, ArrowRight, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import { getLogoUrl, handleLogoError } from "@/lib/logo";
import SponsoredSlots from "./SponsoredSlots";

const CATEGORIES = ["All", "AI / Builders", "AI Agents", "DevTools", "Marketing", "SEO", "Design", "Other"];

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

export default function LiveLeaderboard() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardData, setLeaderboardData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

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

  const filteredData = activeBoard.filter((item) => {
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
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const latestActivity = useMemo(() => {
    return [...leaderboardData]
      .sort((a, b) => {
        const aTime = new Date(a.last_hopped_at || a.created_at || 0).getTime();
        const bTime = new Date(b.last_hopped_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [leaderboardData]);

  const totalMoney = useMemo(
    () => leaderboardData.reduce((sum, item) => sum + item.price, 0),
    [leaderboardData]
  );

  const hoursSinceLaunch = useMemo(() => {
    if (leaderboardData.length === 0) return 1;
    const earliestDate = Math.min(
      ...leaderboardData.map((p) => new Date(p.created_at || Date.now()).getTime())
    );
    const msSince = Date.now() - earliestDate;
    return Math.max(1, Math.floor(msSince / (1000 * 60 * 60)));
  }, [leaderboardData]);

  const springValue = useSpring(0, { bounce: 0, duration: 2500 });

  useEffect(() => {
    springValue.set(totalMoney);
  }, [totalMoney, springValue]);

  const displayMoney = useTransform(springValue, (val) => `$${Math.round(val).toLocaleString()}`);

  const trackClick = (item: Product) => {
    setLeaderboardData((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, clicks: p.clicks + 1 } : p))
    );
    supabase.rpc("increment_clicks", { p_product_id: item.id }).then(({ error }) => {
      if (error) console.error("Failed to track click:", error.message);
    });
  };

  const hopThis = (item: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("prefill-hop", {
        detail: { url: item.url, price: 2 },
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
    <section id="leaderboard" className="w-full px-4 md:px-8 pt-4 pb-20 flex flex-col items-center">
      <div className="w-full max-w-[1000px]">
        {champion && (
          <div className="relative mb-7">
            <div className="absolute -inset-3 md:-inset-4 rounded-3xl bg-gradient-to-r from-amber-300/40 via-yellow-200/25 to-transparent blur-2xl animate-hof-glow pointer-events-none" />
            <div className="absolute -top-1 left-[12%] w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_10px_3px_rgba(251,191,36,0.7)] animate-hof-sparkle pointer-events-none" />
            <div className="absolute top-2 right-[22%] w-1 h-1 rounded-full bg-yellow-100 shadow-[0_0_8px_2px_rgba(253,224,71,0.8)] animate-hof-sparkle pointer-events-none [animation-delay:0.7s]" />
            <div className="absolute bottom-3 left-[38%] w-1 h-1 rounded-full bg-amber-100 shadow-[0_0_8px_2px_rgba(251,191,36,0.75)] animate-hof-sparkle pointer-events-none [animation-delay:1.3s]" />

            <p className="relative flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800 mb-2">
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
              Hall of Fame
            </p>

            <a
              href={champion.url && !champion.url.startsWith("http") ? `https://${champion.url}` : champion.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(champion)}
              onAuxClick={(e) => {
                if (e.button === 1) trackClick(champion);
              }}
              className="group relative overflow-hidden flex items-center gap-3 md:gap-4 py-4 px-3 md:px-4 rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-200/80 via-yellow-50/70 to-white shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_12px_40px_-12px_rgba(217,119,6,0.55)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-amber-200/20 animate-hof-sheen" />
              <div className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-hof-shimmer" />

              <div className="relative shrink-0">
                <div className="absolute -inset-1.5 rounded-2xl bg-amber-300/50 blur-md animate-hof-glow" />
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white ring-2 ring-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.55)]">
                  {champion.url ? (
                    <img
                      src={getLogoUrl(champion.url)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover bg-white"
                      onError={(e) => handleLogoError(e.currentTarget, champion.url)}
                    />
                  ) : (
                    <img src="/globe.svg" alt="" className="w-6 h-6 m-auto mt-4 opacity-40" />
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
            </a>
          </div>
        )}

        <SponsoredSlots />

        <div className="flex items-end justify-between gap-3 mb-3 sm:mb-5">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Who&apos;s up
            </h2>
            <p className="hidden sm:block text-base text-secondary mt-1">
              The internet&apos;s most unnecessary competition.
            </p>
          </div>
          <p className="shrink-0 text-[12px] sm:text-sm text-secondary text-right pb-0.5">
            made{" "}
            <motion.span className="font-semibold text-accent-dark font-mono tabular-nums">
              {displayMoney}
            </motion.span>
            <span className="hidden sm:inline">
              {" "}in {hoursSinceLaunch} {hoursSinceLaunch === 1 ? "hour" : "hours"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 mb-2 border-b border-border/70">
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-0.5 w-max pr-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    activeCategory === cat
                      ? "text-foreground"
                      : "text-secondary hover:text-foreground"
                  }`}
                >
                  {cat}
                  {activeCategory === cat && (
                    <motion.span
                      layoutId="category-underline"
                      className="absolute left-3 right-3 -bottom-px h-[2px] bg-accent rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="relative shrink-0 hidden sm:block w-[180px] mb-1.5">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/70" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-5 pr-1 py-1.5 bg-transparent border-b border-transparent focus:border-accent/50 outline-none text-[13px] font-medium placeholder:text-secondary/50 transition-colors"
            />
          </div>
        </div>

        <div className="relative sm:hidden mb-3">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/70" />
          <input
            type="text"
            placeholder="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-5 pr-1 py-2 bg-transparent border-b border-border/50 outline-none text-[13px] font-medium placeholder:text-secondary/50"
          />
        </div>

        <div className="flex flex-col min-h-[280px]">
          {isLoading ? (
            <div className="py-16 text-center text-secondary text-sm">Loading live leaderboard...</div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {paginatedData.map((item, idx) => {
                  const productHref =
                    item.url && !item.url.startsWith("http") ? `https://${item.url}` : item.url;
                  const podium = item.rank === 1 ? "gold" : item.rank === 2 ? "silver" : item.rank === 3 ? "bronze" : null;

                  const rowTone = podium === "gold"
                    ? "my-2 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-200/70 via-amber-50/50 to-white shadow-[0_8px_28px_-10px_rgba(217,119,6,0.45)] px-2.5 md:px-3"
                    : podium === "silver"
                      ? "my-2 rounded-xl border-2 border-slate-400 bg-gradient-to-r from-slate-200/80 via-slate-50/50 to-white shadow-[0_8px_28px_-10px_rgba(71,85,105,0.35)] px-2.5 md:px-3"
                      : podium === "bronze"
                        ? "my-2 rounded-xl border-2 border-orange-500/80 bg-gradient-to-r from-orange-300/50 via-orange-50/40 to-white shadow-[0_8px_28px_-10px_rgba(194,65,12,0.35)] px-2.5 md:px-3"
                        : "border-b border-border/50 hover:bg-white/40";

                  const medalTone = podium === "gold"
                    ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-2 ring-amber-300/80 shadow-md shadow-amber-500/30"
                    : podium === "silver"
                      ? "bg-gradient-to-br from-slate-100 to-slate-400 text-slate-800 ring-2 ring-slate-300 shadow-md shadow-slate-400/25"
                      : podium === "bronze"
                        ? "bg-gradient-to-br from-orange-300 to-amber-700 text-orange-950 ring-2 ring-orange-400/70 shadow-md shadow-orange-500/20"
                        : "text-secondary";

                  const placeLabel = podium === "gold" ? "1st" : podium === "silver" ? "2nd" : podium === "bronze" ? "3rd" : null;
                  const placeChip = podium === "gold"
                    ? "bg-amber-400/25 text-amber-900 border-amber-400/50"
                    : podium === "silver"
                      ? "bg-slate-300/40 text-slate-700 border-slate-400/50"
                      : "bg-orange-300/30 text-orange-900 border-orange-400/50";

                  const logoRing = podium === "gold"
                    ? "ring-2 ring-amber-400"
                    : podium === "silver"
                      ? "ring-2 ring-slate-400"
                      : podium === "bronze"
                        ? "ring-2 ring-orange-500/80"
                        : "";

                  const showActivityAfter =
                    currentPage === 1 &&
                    latestActivity.length > 0 &&
                    (item.rank === 3 ||
                      (idx === paginatedData.length - 1 &&
                        item.rank <= 3 &&
                        !paginatedData.some((p) => p.rank === 3)));

                  return (
                    <Fragment key={item.id}>
                    <motion.a
                      href={productHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(item)}
                      onAuxClick={(e) => {
                        if (e.button === 1) trackClick(item);
                      }}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`group flex items-center gap-3 md:gap-4 py-3.5 transition-colors -mx-1 px-1 ${rowTone} ${podium ? "py-4" : ""}`}
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

                      <div className={`relative shrink-0 rounded-xl overflow-hidden bg-muted ${logoRing} ${podium ? "w-14 h-14" : "w-12 h-12 border border-border/40"}`}>
                        {item.url ? (
                          <img
                            src={getLogoUrl(item.url)}
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
                          <h3 className={`font-semibold tracking-tight text-foreground truncate group-hover:text-accent transition-colors ${
                            podium ? "text-[15px] md:text-[17px]" : "text-[14px] md:text-[15px]"
                          }`}>
                            {item.name}
                          </h3>
                          {placeLabel && (
                            <span className={`hidden sm:inline shrink-0 px-1.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${placeChip}`}>
                              {placeLabel}
                            </span>
                          )}
                          <span className="hidden md:inline text-[11px] text-secondary/70 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className={`text-secondary truncate max-w-[520px] ${podium ? "text-[13px]" : "text-[12px]"}`}>
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

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`font-semibold tabular-nums ${
                          podium ? "text-[17px] md:text-[18px]" : "text-[15px] md:text-base"
                        } ${
                          podium === "gold" ? "text-amber-800" : podium === "silver" ? "text-slate-700" : podium === "bronze" ? "text-orange-900" : ""
                        }`}>
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
                    </motion.a>
                    {showActivityAfter && (
                      <div className="my-3 py-2.5 -mx-1 px-1 bg-gradient-to-r from-accent/20 via-accent/8 to-transparent">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-dark/80 mb-1.5">
                          Latest activity
                        </p>
                        <div className="grid grid-cols-3 gap-2 md:gap-4">
                          {latestActivity.map((activity) => {
                            const href =
                              activity.url && !activity.url.startsWith("http")
                                ? `https://${activity.url}`
                                : activity.url;
                            return (
                              <a
                                key={activity.id}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackClick(activity)}
                                onAuxClick={(e) => {
                                  if (e.button === 1) trackClick(activity);
                                }}
                                className="group/act min-w-0 flex items-center gap-1.5"
                              >
                                <div className="relative shrink-0 w-6 h-6 rounded overflow-hidden bg-muted">
                                  {activity.url ? (
                                    <img
                                      src={getLogoUrl(activity.url)}
                                      alt=""
                                      className="absolute inset-0 w-full h-full object-cover bg-white"
                                      onError={(e) => handleLogoError(e.currentTarget, activity.url)}
                                    />
                                  ) : (
                                    <img src="/globe.svg" alt="" className="w-3 h-3 m-auto mt-1.5 opacity-40" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] md:text-[13px] font-semibold tracking-tight text-foreground truncate group-hover/act:text-accent transition-colors">
                                    {activity.name}
                                  </p>
                                  <p className="text-[11px] text-secondary truncate">
                                    at #{activity.rank} · ${activity.price.toLocaleString()} · {getTimeAgo(activity.last_hopped_at || activity.created_at)}
                                  </p>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    </Fragment>
                  );
                })}
              </AnimatePresence>

              {filteredData.length === 0 && (
                <div className="py-16 text-center text-secondary">
                  <p className="text-sm font-medium text-foreground mb-1">No products found</p>
                  <p className="text-[13px]">The board is empty. Be the first to hop up.</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-[13px] font-medium text-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                          currentPage === page
                            ? "bg-foreground text-background"
                            : "text-secondary hover:text-foreground"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-[13px] font-medium text-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
