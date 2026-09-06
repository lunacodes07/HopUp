"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { BrandObject } from "@/lib/brand-objects";
import ObjectArt from "./ObjectArt";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function ObjectCard({ object }: { object: BrandObject }) {
  const isLive = object.status === "live";
  const isBlurred = object.status === "blurred";

  const inner = (
    <>
      <div
        className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/70"
        style={{
          background: `radial-gradient(120% 120% at 30% 20%, ${object.tint}26 0%, rgba(250,248,245,0.9) 60%), linear-gradient(180deg, rgba(255,255,255,0.75), rgba(240,237,232,0.6))`,
        }}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center p-8 md:p-9 transition-transform duration-500 ${
            isLive ? "group-hover:scale-[1.06] group-hover:-rotate-2" : ""
          } ${isBlurred ? "blur-[10px] scale-105 opacity-80" : ""}`}
        >
          <div className="w-[68%] max-w-[150px] drop-shadow-[0_10px_18px_rgba(45,41,38,0.16)]">
            <ObjectArt slug={object.slug} tint={object.tint} />
          </div>
        </div>

        {isLive ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-foreground border border-border/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Live now
          </span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-foreground/85 text-background backdrop-blur px-3.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
              Coming soon
            </span>
          </span>
        )}

        {isLive && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-secondary border border-border/60 tabular-nums">
            {object.slots} spots · from ${object.price}
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-2 px-1">
        <div className={`min-w-0 ${isBlurred ? "blur-[7px] select-none" : ""}`} aria-hidden={isBlurred}>
          <h3 className="text-[15px] md:text-base font-semibold tracking-tight text-foreground truncate">
            {object.name}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-secondary leading-snug">{object.tagline}</p>
        </div>
        {isLive && (
          <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center transition-all duration-300 group-hover:bg-accent group-hover:text-foreground group-hover:rotate-45">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </>
  );

  const className = "group block rounded-3xl p-2 -m-2 transition-colors";

  return (
    <motion.div variants={cardVariants} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      {isLive ? (
        <Link href={`/${object.slug}`} className={`${className} hover:bg-white/50`}>
          {inner}
        </Link>
      ) : (
        <div className={`${className} cursor-default`}>{inner}</div>
      )}
    </motion.div>
  );
}
