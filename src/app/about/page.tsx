"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Rocket, Target, TrendingUp, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const springValue = useSpring(0, { bounce: 0, duration: 2500 });
  
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const display = useTransform(springValue, (val) => `${prefix}${Math.round(val).toLocaleString()}${suffix}`);

  return <motion.span>{display}</motion.span>;
}

export default function AboutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.from("products").select("*");
        if (error) throw error;
        if (data) setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalProducts = products.length;
  const totalMoney = useMemo(() => products.reduce((sum, p) => sum + p.price, 0), [products]);
  const totalClicks = useMemo(() => products.reduce((sum, p) => sum + p.clicks, 0), [products]);

  return (
    <>
      <Navbar />
      <main className="min-h-[100svh] bg-[#fafafa] flex flex-col items-center pt-32 pb-24 overflow-hidden relative selection:bg-accent/20">
      
      {/* Background Ornaments */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-5xl px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-24 lg:mb-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[80px] font-bold tracking-tight text-foreground mb-8 leading-[1.1]"
          >
            The internet's most <br />
            <span className="text-accent relative inline-block">
              unnecessary competition.
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-secondary max-w-3xl text-balance leading-relaxed font-medium"
          >
            HopUp is a purely pay-to-win leaderboard. List your product, set a bid, and claim your spot. But beware—anyone can pay more to take your rank. It's cutthroat, chaotic, and completely live.
          </motion.p>
        </div>

        {/* Live Stats Section - Minimal Typographic Design */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8 max-w-4xl mx-auto mb-32 lg:mb-40"
        >
          {/* Stat 1 */}
          <div className="flex flex-col items-center text-center group">
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground font-mono tracking-tight mb-2 group-hover:scale-105 transition-transform duration-500">
              {isLoading ? "..." : <AnimatedNumber value={totalProducts} />}
            </div>
            <h3 className="text-base md:text-lg font-medium text-secondary">Products Hopped</h3>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col items-center text-center group">
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-accent font-mono tracking-tight mb-2 group-hover:scale-105 transition-transform duration-500">
              {isLoading ? "..." : <AnimatedNumber value={totalMoney} prefix="$" />}
            </div>
            <h3 className="text-base md:text-lg font-medium text-accent/80">Total Money Bid</h3>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col items-center text-center group">
            <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground font-mono tracking-tight mb-2 group-hover:scale-105 transition-transform duration-500">
              {isLoading ? "..." : <AnimatedNumber value={totalClicks} />}
            </div>
            <h3 className="text-base md:text-lg font-medium text-secondary">Total Traffic Sent</h3>
          </div>
        </motion.div>

        {/* CTA Section - Minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Ready to take the top spot?</h2>
          <p className="text-secondary text-lg mb-10">
            Stop waiting for SEO. Pay your way to the top and get immediate eyeballs on your product.
          </p>
          <Link
            href="/"
            className="group relative inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:bg-accent hover:text-foreground shadow-lg"
          >
            Hop your product now
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
      </main>
      <Footer />
    </>
  );
}
