"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

  const stats = [
    { label: "Products hopped", value: totalProducts, accent: false },
    { label: "Total money bid", value: totalMoney, prefix: "$", accent: true },
    { label: "Traffic sent", value: totalClicks, accent: false },
  ];

  return (
    <>
      <Navbar />
      <main className="w-full px-4 md:px-8 pt-28 md:pt-32 pb-20">
        <div className="w-full max-w-[1000px] mx-auto text-center">
          <p className="text-sm font-medium text-secondary mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-border mx-1.5">/</span>
            About
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-[72px] font-semibold tracking-tight text-foreground leading-[1.05] text-balance">
              The internet&apos;s most{" "}
              <span className="text-accent">unnecessary competition.</span>
            </h1>
            <p className="mt-6 text-lg md:text-2xl text-secondary max-w-3xl mx-auto leading-relaxed text-balance">
              HopUp is a purely pay-to-win leaderboard. List your product, set a bid, and claim your spot.
              Anyone can pay more to take your rank. It&apos;s cutthroat, chaotic, and completely live.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 md:mt-20 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <p
                  className={`text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight tabular-nums leading-none ${
                    stat.accent ? "text-accent" : "text-foreground"
                  }`}
                >
                  {isLoading ? "…" : (
                    <AnimatedNumber value={stat.value} prefix={stat.prefix} />
                  )}
                </p>
                <p className={`mt-3 text-base md:text-lg font-medium ${stat.accent ? "text-accent/80" : "text-secondary"}`}>
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 md:mt-24"
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Ready to take the top spot?
            </h2>
            <p className="mt-3 text-lg md:text-xl text-secondary max-w-xl mx-auto">
              Stop waiting for SEO. Pay your way to the top and get immediate eyeballs on your product.
            </p>
            <Link
              href="/#submit"
              className="btn-primary mt-8 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-base font-semibold"
            >
              Hop your product
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
