"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WhyFounders() {
  const [totalClicks, setTotalClicks] = useState<number | null>(null);

  useEffect(() => {
    const fetchClicks = async () => {
      try {
        const [{ data: analyticsData }, { data: productsData }] = await Promise.all([
          supabase.from("analytics").select("total_visits").limit(1).single(),
          supabase.from("products").select("clicks"),
        ]);

        const pageVisits = analyticsData?.total_visits || 0;
        const productClicks = productsData?.reduce((acc, p) => acc + p.clicks, 0) || 0;

        setTotalClicks(pageVisits + productClicks);
      } catch (err) {
        console.error("Failed to fetch exact clicks", err);
      }
    };
    fetchClicks();
  }, []);

  return (
    <section className="w-full px-4 md:px-8 py-16 md:py-20 flex flex-col items-center">
      <div className="max-w-[1000px] w-full flex flex-col items-center text-center">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3"
        >
          Why would anyone do this?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-accent mb-4"
        >
          Attention.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base md:text-lg text-secondary max-w-[480px] leading-relaxed mb-8"
        >
          A few dollars puts your product in front of people who would never have found you otherwise.
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-base text-secondary">
          <span>
            <span className="font-semibold text-foreground tabular-nums text-lg">
              {totalClicks !== null ? totalClicks.toLocaleString() : "—"}
            </span>{" "}
            clicks
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span>
            <span className="font-semibold text-foreground tabular-nums text-lg">165+</span> signups
          </span>
          <span className="text-border hidden sm:inline">·</span>
          <span>
            <span className="font-semibold text-foreground tabular-nums text-lg">35+</span> demo calls
          </span>
        </div>
      </div>
    </section>
  );
}
