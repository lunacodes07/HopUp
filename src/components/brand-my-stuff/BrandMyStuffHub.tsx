"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import LiveStats from "@/components/LiveStats";
import { BRAND_OBJECTS } from "@/lib/brand-objects";
import ObjectCard from "./ObjectCard";

export default function BrandMyStuffHub() {
  return (
    <main className="w-full px-4 md:px-8 pt-20 md:pt-24 pb-20 overflow-hidden">
      <div className="w-full max-w-[1000px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 mb-4 text-center">
          <LiveStats />
        </div>

        {/* Hero */}
        <div className="relative text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[380px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,140,115,0.28), rgba(255,140,115,0.06) 65%, transparent)",
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative inline-flex items-center gap-2 rounded-full border border-border bg-white/70 backdrop-blur px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary"
          >
            HopUp Presents
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-5 text-[44px] leading-[1.02] md:text-[72px] font-semibold tracking-tight text-foreground text-balance"
          >
            Brand My <span className="text-accent">Stuff.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-4 text-base md:text-lg text-secondary max-w-[460px] mx-auto text-balance"
          >
            Ever wondered what your brand would look like on the things you use
            every day?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-7"
          >
            <Link
              href="/brandmystanley"
              className="group inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors"
            >
              Try Brand My Stanley
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Object showcase */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } } }}
          className="mt-16 md:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-5"
        >
          {BRAND_OBJECTS.map((object) => (
            <ObjectCard key={object.slug} object={object} />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-12 text-center text-[13px] text-secondary"
        >
          One object at a time. Stanley is first — the rest are on the shelf.
        </motion.p>
      </div>
    </main>
  );
}
