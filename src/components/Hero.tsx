"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUp, Link as LinkIcon, Tag, Minus, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import LiveStats from "./LiveStats";

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
  const [highlightedIndex, setHighlightedIndex] = useState(3);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("DevTools");
  const [bidAmount, setBidAmount] = useState(2);
  const [leaderboardData, setLeaderboardData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("price", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(10);
        
      if (error) throw error;
      if (data) {
        // Map to include dynamic rank
        const rankedData = data.map((item, idx) => ({ ...item, rank: idx + 1 }));
        setLeaderboardData(rankedData);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel("products_changes")
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
      if (e.detail) {
        setUrl(e.detail.url || "");
        setBidAmount(e.detail.price || 2);
      }
    };
    
    window.addEventListener('prefill-hop', handlePrefill as EventListener);
    return () => window.removeEventListener('prefill-hop', handlePrefill as EventListener);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => (prev > 1 ? prev - 1 : 9));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleHop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const { finalUrl, nameFallback } = getFormattedUrlInfo(url);

      // Check if exists in DB
      const { data: existingData } = await supabase
        .from("products")
        .select("*")
        .in('url', [finalUrl, finalUrl + '/'])
        .limit(1);
        
      const existingProduct = existingData && existingData.length > 0 ? existingData[0] : null;

      // Fetch metadata from our internal API route
      let fetchedTitle = "";
      let fetchedDescription = "";
      try {
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(finalUrl)}`);
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.title) fetchedTitle = metaData.title;
          if (metaData.description) fetchedDescription = metaData.description;
        }
      } catch (e) {
        console.error("Failed to fetch metadata", e);
      }

      // Mock payment delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (existingProduct) {
        // Update existing product
        const updatePayload: any = {
          price: existingProduct.price + bidAmount,
          category: category
        };
        
        // If we found a valid description and it's not empty, update it
        if (fetchedDescription && fetchedDescription.trim() !== "") {
          updatePayload.description = fetchedDescription;
        }
        
        // If the current name is a fallback or default, and we found a real title, update it
        if (fetchedTitle && (existingProduct.name === existingProduct.url || existingProduct.name === "Freshly hopped product")) {
          updatePayload.name = fetchedTitle;
        }

        const { error } = await supabase
          .from("products")
          .update(updatePayload)
          .eq('id', existingProduct.id);
          
        if (error) throw error;
      } else {
        // Insert new product
        const { error } = await supabase.from("products").insert({
          name: fetchedTitle || nameFallback,
          description: fetchedDescription || "Freshly hopped product",
          url: finalUrl,
          category: category,
          price: bidAmount,
          rank: 0,
        });

        if (error) throw error;
      }

      // Reset form
      setUrl("");
      setBidAmount(2);
      
      // Immediately refetch data
      await fetchData();

    } catch (err) {
      console.error("Error processing hop:", err);
      alert("Failed to process payment/hop.");
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustBid = (amount: number) => {
    setBidAmount(prev => Math.max(2, prev + amount));
  };

  const handleBidInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setBidAmount(Math.max(2, val));
    }
  };

  const expectedRank = useMemo(() => {
    if (leaderboardData.length === 0) return 1;
    if (!url.trim()) return 1;
    
    const { finalUrl } = getFormattedUrlInfo(url);
    
    const existingProduct = leaderboardData.find(
      (p) => p.url?.replace(/\/$/, '').toLowerCase() === finalUrl.toLowerCase()
    );
    
    const totalBid = existingProduct ? existingProduct.price + bidAmount : bidAmount;
    
    const countHigherOrEqual = leaderboardData.filter(p => {
      if (existingProduct && p.id === existingProduct.id) return false;
      return p.price >= totalBid;
    }).length;
    
    return countHigherOrEqual + 1;
  }, [bidAmount, leaderboardData, url]);

  return (
    <section className="relative w-full min-h-[90svh] flex flex-col lg:flex-row items-center justify-center px-6 md:px-12 pt-32 pb-20 overflow-hidden gap-12 lg:gap-16">
      
      {/* Top/Left Column - Leaderboard Visual */}
      <div className="w-full lg:w-[50%] relative z-10 flex flex-col items-center lg:items-end">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[540px] flex flex-col gap-2.5 relative"
        >
          <div className="absolute -inset-10 bg-gradient-to-tr from-accent/10 to-transparent blur-3xl -z-10 rounded-full" />
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-secondary">Loading live data...</div>
          ) : leaderboardData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white/60 backdrop-blur-md rounded-3xl border border-dashed border-border/50 text-secondary p-8 text-center">
              <span className="text-4xl mb-4">🏆</span>
              <p className="font-semibold text-lg text-foreground mb-2">The board is completely empty.</p>
              <p className="text-sm">Be the first to hop up and claim the #1 spot forever (or until someone pays more).</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {leaderboardData.slice(0, 10).map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                
                let rankStyle = "bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/90 shadow-sm";
                let badgeStyle = "bg-muted text-secondary";
                
                if (idx === 0) {
                  rankStyle = "bg-gradient-to-r from-amber-200/40 to-amber-100/10 border border-amber-300/50 shadow-lg shadow-amber-500/10";
                  badgeStyle = "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-sm";
                } else if (idx === 1) {
                  rankStyle = "bg-gradient-to-r from-amber-200/20 to-transparent border border-amber-300/30 shadow-md shadow-amber-500/5";
                  badgeStyle = "bg-amber-200/70 text-amber-900";
                } else if (idx === 2) {
                  rankStyle = "bg-gradient-to-r from-amber-200/10 to-transparent border border-amber-300/20";
                  badgeStyle = "bg-amber-100/60 text-amber-900";
                }

                return (
                  <motion.a
                    key={item.id}
                    href={item.url && !item.url.startsWith('http') ? `https://${item.url}` : item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      supabase.from("products").update({ clicks: item.clicks + 1 }).eq("id", item.id).then();
                    }}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-500 cursor-pointer ${rankStyle} ${
                      isHighlighted ? "scale-[1.03] z-10 shadow-xl shadow-accent/10 border-accent/20" : "scale-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${badgeStyle}`}>
                        {item.rank}
                      </div>
                      
                      {item.url && (
                        <div className="relative flex-shrink-0">
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${item.url.replace(/^https?:\/\//, '')}&sz=128`}
                            alt={`${item.name} logo`}
                            className="w-10 h-10 rounded-xl bg-white object-cover border border-border/50 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex flex-col ml-1">
                        <span className={`font-semibold text-sm md:text-base hover:text-accent transition-colors ${isHighlighted ? 'text-foreground' : 'text-foreground/80'}`}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-secondary">
                          <span>{item.category}</span>
                          <span className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-border"></div>
                            {item.clicks.toLocaleString()} clicks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-base md:text-lg">
                        ${item.price}
                      </span>
                      {isHighlighted && (
                        <div className="absolute -right-2 md:-right-6 -top-3 bg-foreground text-background text-[10px] md:text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg rotate-[4deg] animate-bounce-subtle">
                          Live now <ArrowUp className="w-3 h-3 text-accent" />
                        </div>
                      )}
                    </div>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* Bottom/Right Column - Copy & Inline Form */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center z-10 lg:pl-10 mt-6 lg:mt-0">
        
        {/* Live Stats at the Top */}
        <div className="flex justify-center lg:justify-start mb-6 w-full max-w-[500px] mx-auto lg:mx-0">
          <LiveStats />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-6xl lg:text-[76px] font-bold leading-[1.05] tracking-tight text-foreground m-0 p-0 mb-6 text-center lg:text-left"
        >
          Your product <br className="hidden md:block" />
          deserves a <br className="hidden md:block" />
          <span className="text-accent relative inline-block lg:block mt-2 lg:mt-0">
            better spot.
            <svg className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-3 text-accent/30" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[500px] mx-auto lg:mx-0 flex flex-col items-center lg:items-start"
        >
          <p className="text-lg md:text-xl font-medium text-foreground mb-2 text-center lg:text-left">
            Hop above products competing for attention.
          </p>
          <p className="text-base text-secondary mb-6 leading-relaxed text-center lg:text-left">
            List your product. Claim a spot. Let someone pay more to take it.
          </p>

          {/* Inline Form */}
          <form onSubmit={handleHop} className="flex flex-col gap-3 bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-3xl shadow-sm w-full relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 rounded-3xl flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
                <span className="font-semibold text-foreground text-sm">Processing Payment...</span>
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="url" className="text-xs font-semibold text-secondary ml-2 uppercase tracking-wide">Product Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/70" />
                <input
                  id="url"
                  type="text"
                  placeholder="Website URL or @handle"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <label htmlFor="category" className="text-xs font-semibold text-secondary ml-2 uppercase tracking-wide">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/70" />
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white text-sm font-medium transition-all appearance-none cursor-pointer"
                >
                  <option value="AI / Builders">AI / Builders</option>
                  <option value="Marketing">Marketing</option>
                  <option value="AI Agents">AI Agents</option>
                  <option value="DevTools">Developer Tools</option>
                  <option value="SEO">SEO</option>
                  <option value="Design">Design</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-2">
              <label className="text-xs font-semibold text-secondary ml-2 uppercase tracking-wide flex justify-between">
                <span>Bid Amount</span>
                <span className="text-accent-dark">Expected Rank: #{expectedRank}</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustBid(-1)}
                  disabled={bidAmount <= 2}
                  className="w-12 h-12 flex items-center justify-center bg-muted/50 border border-border/50 rounded-full text-secondary hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="flex-1 h-12 flex items-center justify-center bg-white border border-border/50 rounded-full font-bold text-lg text-foreground shadow-inner relative overflow-hidden">
                  <span className="absolute left-4 md:left-6 text-foreground/50 select-none pointer-events-none">$</span>
                  <input
                    type="number"
                    min="2"
                    step="1"
                    value={bidAmount}
                    onChange={handleBidInputChange}
                    className="w-full h-full bg-transparent text-center font-bold text-lg outline-none focus:ring-2 focus:ring-accent/50 appearance-none m-0"
                    style={{ MozAppearance: 'textfield' }} // hide arrows in firefox
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => adjustBid(1)}
                  className="w-12 h-12 flex items-center justify-center bg-muted/50 border border-border/50 rounded-full text-secondary hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="group flex items-center justify-center gap-2 w-full bg-foreground text-background px-8 py-3.5 rounded-full text-base font-semibold hover:bg-accent hover:text-foreground transition-all duration-300 shadow-md shadow-foreground/10 hover:shadow-accent/30 hover:-translate-y-0.5 mt-2"
            >
              Confirm & Hop Up
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>
        </motion.div>
      </div>

    </section>
  );
}
