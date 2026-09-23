"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BoardStats = {
  clicks: number;
  hopped: number;
  bid: number;
};

export default function WhyFounders() {
  const [stats, setStats] = useState<BoardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ data: analyticsData }, { data: productsData }] = await Promise.all([
          supabase.from("analytics").select("total_visits").limit(1).single(),
          supabase.from("products").select("clicks, price"),
        ]);

        const pageVisits = analyticsData?.total_visits || 0;
        const productClicks = productsData?.reduce((acc, p) => acc + (p.clicks || 0), 0) || 0;

        setStats({
          clicks: pageVisits + productClicks,
          hopped: productsData?.length || 0,
          bid: productsData?.reduce((acc, p) => acc + (p.price || 0), 0) || 0,
        });
      } catch (err) {
        console.error("Failed to fetch board stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="w-full px-4 md:px-8 py-14 md:py-16 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative page-wide px-2 md:px-4 flex flex-col items-center text-center"
      >
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
          Why hop?
        </h2>

        <p className="relative text-4xl md:text-5xl font-semibold tracking-tight text-accent mb-4">
          More eyes. A backlink.
          <span
            aria-hidden
            className="absolute -right-5 -top-2 h-3 w-3 rounded-full bg-butter shadow-[0_0_0_4px_rgba(255,212,71,0.25)]"
          />
        </p>

        <p className="text-base md:text-lg text-secondary max-w-[520px] leading-relaxed mb-8">
          $2 keeps the page. A few dollars more takes this week.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[15px] text-secondary">
          {[
            {
              value: stats ? stats.clicks.toLocaleString() : "—",
              label: "clicks sent",
              dot: "bg-accent",
            },
            {
              value: stats ? stats.hopped.toLocaleString() : "—",
              label: "products hopped",
              dot: "bg-grape",
            },
            {
              value: stats ? `$${stats.bid.toLocaleString()}` : "—",
              label: "bid on the board",
              dot: "bg-butter",
            },
          ].map((stat) => (
            <span
              key={stat.label}
              className="inline-flex items-center gap-2 px-1.5 py-1"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
              <span className="font-semibold text-foreground tabular-nums text-lg">{stat.value}</span>
              {stat.label}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
