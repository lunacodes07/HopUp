"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  LARGE_SLOT_COUNT,
  SLOT_PRICE,
  SMALL_SLOT_PRICE,
  STANLEY_SLOT_COUNT,
} from "@/lib/brand-objects";
import { handleLogoError } from "@/lib/logo";
import { stanleyDisplayLogo, type StanleySlot } from "@/lib/stanley-slots";
import { supabase } from "@/lib/supabase";

const PINK = "#F2AFC9";

const TumblerViewer = dynamic(() => import("./brand-my-stuff/TumblerViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <span className="w-7 h-7 rounded-full border-2 border-border border-t-accent animate-toggle-spin" />
    </div>
  ),
});

function indexClaimed(rows: StanleySlot[]) {
  const next: Record<number, StanleySlot> = {};
  for (const row of rows) next[row.slot_number] = row;
  return next;
}

export default function StanleyHomeTeaser() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [claimedBySlot, setClaimedBySlot] = useState<Record<number, StanleySlot>>({});
  const [selectedSlot, setSelectedSlot] = useState(1);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "240px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("stanley_slots")
        .select("id, slot_number, name, url, price, logo_url, created_at");
      if (error) {
        const fallback = await supabase
          .from("stanley_slots")
          .select("id, slot_number, name, url, price, created_at");
        if (fallback.error) return;
        setClaimedBySlot(indexClaimed((fallback.data as StanleySlot[]) ?? []));
        return;
      }
      setClaimedBySlot(indexClaimed((data as StanleySlot[]) ?? []));
    };

    void load();
    const subscription = supabase
      .channel("stanley_home_teaser")
      .on("postgres_changes", { event: "*", schema: "public", table: "stanley_slots" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [visible]);

  const slotLogos = useMemo(() => {
    const next: Record<number, string> = {};
    for (const [key, row] of Object.entries(claimedBySlot)) {
      next[Number(key)] = stanleyDisplayLogo(row);
    }
    return next;
  }, [claimedBySlot]);

  const filledCount = Object.keys(claimedBySlot).length;
  const raised = Object.values(claimedBySlot).reduce((sum, row) => sum + row.price, 0);
  const largeSlots = Array.from({ length: LARGE_SLOT_COUNT }, (_, i) => i + 1);
  const smallSlots = Array.from(
    { length: STANLEY_SLOT_COUNT - LARGE_SLOT_COUNT },
    (_, i) => LARGE_SLOT_COUNT + i + 1
  );

  const go = (slot?: number) => {
    if (slot) setSelectedSlot(slot);
    router.push(slot ? `/brandmystanley?slot=${slot}` : "/brandmystanley");
  };

  return (
    <section ref={rootRef} className="w-full px-4 md:px-8 pt-2 pb-8 md:pb-10 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1000px] rounded-[28px] border border-white/70 bg-white/40 backdrop-blur-xl shadow-[0_12px_40px_-24px_rgba(45,41,38,0.35)] overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(300px,1.15fr)] gap-5 md:gap-7 p-5 md:p-7 items-center">
          <div className="min-w-0 text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-dark">
              Brand My Stanley
            </p>
            <h2 className="mt-1.5 text-[26px] md:text-[34px] font-semibold tracking-tight text-foreground leading-[1.1]">
              Your logo on my <span className="text-accent">daily cup.</span>
            </h2>
            <p className="mt-2.5 text-[14px] md:text-[15px] text-secondary max-w-[420px] mx-auto md:mx-0 text-balance">
              This Stanley comes with me everywhere — uni, cafes, flights, work. People see it
              in my hand. Then they ask whose logo that is.
            </p>
            <p className="mt-2 text-[14px] md:text-[15px] text-foreground/85 max-w-[420px] mx-auto md:mx-0 text-balance">
              That&apos;s you, in a real conversation. Not a banner. Personal-level marketing for
              your brand. 12 spots — large from ${SLOT_PRICE}, small from ${SMALL_SLOT_PRICE}.
            </p>
            <p className="mt-2.5 text-[13px] text-secondary">
              <span className="font-semibold tabular-nums text-foreground">${raised}</span> raised
              {filledCount > 0 && (
                <span className="tabular-nums">
                  {" "}
                  · {filledCount}/{STANLEY_SLOT_COUNT} filled
                </span>
              )}
            </p>

            <div className="mt-4 flex flex-col gap-2 max-w-[232px] mx-auto md:mx-0">
              {[
                { label: `Large · from $${SLOT_PRICE}`, slots: largeSlots },
                { label: `Small · from $${SMALL_SLOT_PRICE}`, slots: smallSlots },
              ].map((ring) => (
                <div key={ring.label}>
                  <p className="text-[10px] font-medium text-secondary/80 mb-1">{ring.label}</p>
                  <div className="grid grid-cols-6 gap-1">
                    {ring.slots.map((n) => {
                      const claimed = claimedBySlot[n];
                      const logo = slotLogos[n];
                      const selected = n === selectedSlot;
                      return (
                        <button
                          key={n}
                          type="button"
                          onMouseEnter={() => setSelectedSlot(n)}
                          onFocus={() => setSelectedSlot(n)}
                          onClick={() => go(n)}
                          title={claimed ? `${claimed.name} · $${claimed.price}` : `Open spot ${n}`}
                          aria-label={claimed ? `Spot ${n}, taken by ${claimed.name}` : `Open spot ${n}`}
                          className={`relative aspect-square rounded-lg border overflow-hidden transition-all ${
                            selected
                              ? "border-accent bg-accent/10 shadow-[0_0_0_2px_rgba(255,140,115,0.22)]"
                              : claimed
                                ? "border-border bg-white"
                                : "border-border bg-white/70 hover:border-accent/50"
                          }`}
                        >
                          {logo ? (
                            <img
                              src={logo}
                              alt=""
                              className="absolute inset-0 w-full h-full object-contain p-0.5"
                              onError={(e) => handleLogoError(e.currentTarget, claimed?.url)}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold tabular-nums text-secondary">
                              {n}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/brandmystanley"
              className="mt-5 inline-flex items-center justify-center gap-1.5 bg-foreground text-background px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent hover:text-foreground transition-colors"
            >
              Get on the cup
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative rounded-2xl border border-white/70 bg-white/50 overflow-hidden h-[320px] sm:h-[380px] md:h-[440px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(90% 70% at 50% 28%, ${PINK}40 0%, transparent 68%)`,
              }}
            />
            {visible ? (
              <TumblerViewer
                compact
                slotLogos={slotLogos}
                claimedSlots={Object.fromEntries(
                  Object.values(claimedBySlot).map((row) => [row.slot_number, true])
                )}
                selectedSlot={selectedSlot}
                onSelectSlot={go}
                onHoverSlot={(n) => {
                  if (n) setSelectedSlot(n);
                }}
              />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
