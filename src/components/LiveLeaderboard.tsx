"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Search, ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";

const CATEGORIES = ["All", "AI / Builders", "AI Agents", "DevTools", "Marketing", "SEO", "Design", "Other"];

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

    // Subscribe to realtime changes
    const subscription = supabase
      .channel("products_changes_full")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchData(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredData = leaderboardData.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  // Total Money Calculation and Animation
  const totalMoney = useMemo(() => leaderboardData.reduce((sum, item) => sum + item.price, 0), [leaderboardData]);

  const hoursSinceLaunch = useMemo(() => {
    if (leaderboardData.length === 0) return 1;
    const earliestDate = Math.min(...leaderboardData.map(p => new Date(p.created_at || Date.now()).getTime()));
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

  return (
    <section
      id="leaderboard"
      className="w-full bg-background py-32 px-6 md:px-12 flex flex-col items-center"
    >
      <div className="w-full max-w-[1000px]">
        {/* Header */}
        <div className="flex flex-col mb-16 text-center items-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex flex-col md:flex-row items-center gap-2 md:gap-3 px-6 py-3 bg-accent/10 border border-accent/20 rounded-full mb-8"
          >
            <div className="flex items-center gap-2 text-accent-dark font-semibold text-sm md:text-base">
              <TrendingUp className="w-5 h-5" />
              <span>This website made</span>
              <motion.span className="text-xl md:text-2xl font-bold font-mono">{displayMoney}</motion.span>
              <span>since launch {hoursSinceLaunch} hours ago</span>
            </div>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-4">
            Who's up?
          </h2>
          <p className="text-lg md:text-xl text-secondary font-medium max-w-2xl text-balance">
            The internet's most unnecessary competition.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12 bg-white p-4 rounded-3xl shadow-sm border border-border/50">
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-start">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${activeCategory === cat
                    ? "bg-foreground text-background shadow-md"
                    : "bg-transparent text-secondary hover:bg-muted"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/70" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white text-sm font-medium transition-all"
            />
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="flex flex-col gap-4 min-h-[400px]">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-white/50 border border-dashed border-border/50 rounded-3xl text-secondary">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-base font-semibold">Loading live leaderboard...</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {paginatedData.map((item) => (
                  <motion.a
                    key={item.id}
                    href={item.url && !item.url.startsWith('http') ? `https://${item.url}` : item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(item)}
                    onAuxClick={(e) => {
                      // Middle-click ("open in new tab") fires auxclick, not click
                      if (e.button === 1) trackClick(item);
                    }}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="group relative bg-white border border-border/50 p-4 md:p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-accent/5 cursor-pointer"
                  >
                    {/* Left Content */}
                    <div className="flex flex-row items-start md:items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-muted text-secondary font-bold text-sm md:text-base flex-shrink-0">
                        {item.rank}
                      </div>

                      <div className="relative flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl border border-border/50 shadow-sm overflow-hidden bg-muted flex items-center justify-center">
                        {item.url ? (
                          <img 
                            src={`https://icon.horse/icon/${item.url.replace(/^https?:\/\//, '').split('/')[0]}`}
                            alt={`${item.name} logo`}
                            className="absolute inset-0 w-full h-full object-cover bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/globe.svg';
                              (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                            }}
                          />
                        ) : (
                          <img src="/globe.svg" alt="Default logo" className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1 ml-1">
                        <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-secondary text-xs font-medium max-w-[400px]">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] md:text-xs font-semibold text-secondary/80">
                          <span className="px-2.5 py-1 bg-accent/10 text-accent-dark rounded-full">
                            {item.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                            {item.clicks.toLocaleString()} clicks
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex flex-col items-start md:items-end gap-2.5 pt-3 md:pt-0 border-t md:border-none border-border/50 w-full md:w-auto">
                      <div className="text-xl md:text-2xl font-bold text-foreground">
                        ${item.price.toLocaleString()}
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Prevent navigating to the product URL

                          // Dispatch custom event to prefill the Hero form
                          window.dispatchEvent(new CustomEvent('prefill-hop', {
                            detail: { url: item.url, price: 2 } // Start with base bid
                          }));

                          const hopSection = document.getElementById('submit') || document.querySelector('form');
                          if (hopSection) {
                            hopSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="w-full md:w-auto group/btn relative overflow-hidden bg-foreground text-background px-5 py-2 rounded-full flex items-center justify-center gap-2 font-semibold text-xs md:text-sm hover:bg-accent hover:text-foreground transition-all duration-300 shadow-md"
                      >
                        <span className="block group-hover/btn:hidden">Hop up</span>
                        <span className="hidden group-hover/btn:block">
                          Hop up
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </motion.a>
                ))}
              </AnimatePresence>

              {filteredData.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white/50 border border-dashed border-border/50 rounded-3xl text-secondary">
                  <p className="text-base font-semibold mb-1">No products found</p>
                  <p className="text-sm">The leaderboard is empty. Be the first!</p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-border/50 rounded-full text-sm font-semibold text-secondary hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      // Simple pagination dots logic if many pages, but for now just show all if small
                      // Or just show current / total
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${currentPage === page
                              ? "bg-foreground text-background"
                              : "bg-transparent text-secondary hover:bg-muted"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-border/50 rounded-full text-sm font-semibold text-secondary hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
