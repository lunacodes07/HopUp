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
          supabase.from("products").select("clicks")
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
    <section className="w-full bg-background py-32 px-6 md:px-12 flex flex-col items-center">
      <div className="max-w-[1000px] w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground mb-4">
            Why would<br />
            anyone do this?
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 relative"
        >
          <div className="absolute -inset-10 bg-accent/10 blur-3xl rounded-full -z-10" />
          <span className="text-6xl md:text-7xl lg:text-9xl font-bold text-accent leading-none block drop-shadow-sm">
            Attention.
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-secondary max-w-[700px] font-medium leading-relaxed mb-20 text-balance"
        >
          Because attention is expensive. <br className="hidden md:block" />
          A few dollars can put your product in front of founders, builders, creators, and curious people who would never have discovered it otherwise.
        </motion.p>

        <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-20 w-full relative bg-white border border-border/50 rounded-3xl p-10 shadow-sm">
          {[
            { value: totalClicks !== null ? totalClicks.toLocaleString() : "...", label: "Clicks generated" },
            { value: "100+", label: "New signups" },
            { value: "20+", label: "Demo calls" },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.5 + idx * 0.1 }}
              className="flex flex-col items-center flex-1"
            >
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                {metric.value}
              </div>
              <div className="text-sm font-medium text-secondary">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
