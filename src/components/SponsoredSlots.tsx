"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFormattedUrlInfo } from "@/lib/format-url";
import { getProxiedLogoUrl, handleLogoError } from "@/lib/logo";
import { rememberPendingShare } from "@/lib/share";
import { SPONSOR_PLANS, SPONSOR_SLOT_COUNT, type SponsorPlan } from "@/lib/sponsored";
import type { SponsoredSlot } from "@/types";

const SPOTS = [1, 2, 3, 4] as const;

const CATEGORIES = [
  { value: "DevTools", label: "Developer Tools" },
  { value: "AI / Builders", label: "AI / Builders" },
  { value: "AI Agents", label: "AI Agents" },
  { value: "Marketing", label: "Marketing" },
  { value: "SEO", label: "SEO" },
  { value: "Design", label: "Design" },
  { value: "Other", label: "Other" },
];

const getTimeLeft = (expiresAt: string) => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "ending";
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days <= 1) return "1 day left";
  return `${days} days left`;
};

function EmptyCard({ n, onClaim }: { n: number; onClaim: (n: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClaim(n)}
      className="group flex h-[72px] w-full items-center gap-2.5 rounded-xl border border-dashed border-accent/50 bg-[linear-gradient(180deg,rgba(255,140,115,0.06),rgba(250,248,245,0.4))] px-3 text-left transition-colors hover:border-accent hover:bg-accent/[0.08]"
    >
      <span className="w-4 shrink-0 text-[10px] font-semibold tabular-nums tracking-wide text-secondary/60">
        {String(n).padStart(2, "0")}
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-accent/55 text-[16px] leading-none text-accent-dark/80 transition-colors group-hover:border-accent group-hover:text-accent-dark">
        +
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">This spot</p>
        <p className="text-[11px] text-secondary">
          $30<span className="text-secondary/70">/week</span>
        </p>
      </div>
      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-dark/75">
        Open
      </span>
    </button>
  );
}

function FilledCard({ slot }: { slot: SponsoredSlot }) {
  const href = slot.url && !slot.url.startsWith("http") ? `https://${slot.url}` : slot.url;

  const trackClick = () => {
    supabase.rpc("increment_sponsored_clicks", { p_slot_id: slot.id }).then(({ error }) => {
      if (error) console.error("Failed to track sponsored click:", error.message);
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      onAuxClick={(e) => {
        if (e.button === 1) trackClick();
      }}
      className="relative flex h-[72px] w-full items-center gap-2 overflow-hidden rounded-xl border border-border bg-white/75 px-2.5 pt-3 pb-1.5 shadow-[0_1px_0_rgba(45,41,38,0.04)] transition-colors hover:border-accent/40"
    >
      <span className="absolute top-1 left-2 text-[8px] font-semibold uppercase leading-none tracking-[0.12em] text-secondary/65">
        Ad
      </span>
      <span className="absolute top-1 right-2 text-[8px] leading-none tabular-nums text-secondary/65">
        {getTimeLeft(slot.expires_at)}
      </span>
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted">
        <img
          src={getProxiedLogoUrl(slot.url)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover bg-white"
          onError={(e) => handleLogoError(e.currentTarget, slot.url)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">{slot.name}</p>
        <p className="truncate text-[12px] text-secondary">{slot.description}</p>
      </div>
    </a>
  );
}

function SponsorModal({
  slotNumber,
  onClose,
}: {
  slotNumber: number;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("DevTools");
  const [plan, setPlan] = useState<SponsorPlan>(SPONSOR_PLANS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ title: string; logo: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = url.trim();
    if (trimmed.length < 4) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    const handle = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const { finalUrl } = getFormattedUrlInfo(trimmed);
        const res = await fetch(`/api/metadata?url=${encodeURIComponent(finalUrl)}`);
        const data = await res.json();
        setPreview({
          title: data.title || finalUrl.replace(/^https?:\/\//, "").split("/")[0],
          logo: getProxiedLogoUrl(finalUrl),
        });
      } catch {
        setPreview({
          title: trimmed,
          logo: getProxiedLogoUrl(trimmed),
        });
      } finally {
        setPreviewLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(handle);
  }, [url]);

  useEffect(() => {
    urlRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isProcessing) return;

    setIsProcessing(true);
    setError("");

    try {
      const { finalUrl, nameFallback } = getFormattedUrlInfo(url);
      rememberPendingShare({
        url: finalUrl,
        bid: plan.price,
        name: nameFallback,
        kind: "sponsored",
      });
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "sponsored",
          url: finalUrl,
          category,
          nameFallback,
          slotNumber,
          weeks: plan.weeks,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }
      if (!data.url) throw new Error("No checkout URL returned.");
      window.location.href = data.url;
    } catch (err) {
      console.error("Sponsored checkout failed:", err);
      setError(err instanceof Error ? err.message : "Failed to process payment.");
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-3 pb-3 sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]"
      />

      <motion.form
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={handlePay}
        className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_60px_-24px_rgba(45,41,38,0.45)]"
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        {isProcessing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-dark/85">
              Sponsored · spot {String(slotNumber).padStart(2, "0")}
            </p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
              Claim this spot
            </h3>
            <p className="mt-0.5 text-[13px] text-secondary">
              Paid placement. Not a rank. Shows until it expires.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-4">
          <label className="block">
            <span className="sr-only">Product URL</span>
            <input
              ref={urlRef}
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yoursite.com or @handle"
              className="w-full bg-transparent border-b border-foreground/15 focus:border-accent outline-none py-2.5 text-base font-medium placeholder:text-secondary/60 transition-colors"
            />
            {(previewLoading || preview) && (
              <div className="mt-3 flex items-center gap-2.5">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {previewLoading && !preview ? (
                    <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-secondary" />
                  ) : (
                    <img
                      src={preview?.logo}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover bg-white"
                      onError={(e) => handleLogoError(e.currentTarget, url)}
                    />
                  )}
                </div>
                <p className="truncate text-[13px] text-secondary">
                  {previewLoading && !preview ? "Fetching site…" : preview?.title}
                </p>
              </div>
            )}
          </label>

          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
              className="w-full appearance-none bg-transparent border-b border-foreground/15 focus:border-accent outline-none py-2.5 pr-7 text-base font-medium cursor-pointer transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
              How long
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SPONSOR_PLANS.map((option) => {
                const selected = option.weeks === plan.weeks;
                return (
                  <button
                    key={option.weeks}
                    type="button"
                    onClick={() => setPlan(option)}
                    className={`rounded-xl border px-2 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-white/50 hover:border-accent/40"
                    }`}
                  >
                    <p className="text-[16px] font-semibold tabular-nums tracking-tight text-foreground">
                      ${option.price}
                    </p>
                    <p className="text-[11px] text-secondary">{option.label}</p>
                    <p
                      className={`text-[10px] ${
                        selected ? "text-accent-dark" : "text-secondary/70"
                      }`}
                    >
                      {option.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-[13px] text-accent-dark">{error}</p>}

          <button
            type="submit"
            disabled={isProcessing}
            className="group mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-6 py-2.5 text-base font-semibold text-background transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            Pay ${plan.price}
            <span className="font-medium text-background/70 group-hover:text-foreground/70">
              · {plan.label}
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

export default function SponsoredSlots() {
  const [listings, setListings] = useState<SponsoredSlot[]>([]);
  const [claimSlot, setClaimSlot] = useState<number | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sponsored_slots")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false });

      if (error) throw error;
      setListings((data as SponsoredSlot[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch sponsored slots:", err);
    }
  }, []);

  useEffect(() => {
    fetchSlots();

    const subscription = supabase
      .channel("sponsored_slots_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sponsored_slots" },
        () => {
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchSlots]);

  const bySlot = useMemo(() => {
    const map = new Map<number, SponsoredSlot>();
    for (const row of listings) {
      if (!map.has(row.slot_number)) map.set(row.slot_number, row);
    }
    return map;
  }, [listings]);

  const renderCard = (n: number, key: string) => {
    const listing = bySlot.get(n);
    return (
      <div key={key} className="w-[70vw] max-w-[220px] shrink-0 md:w-auto md:max-w-none">
        {listing ? (
          <FilledCard slot={listing} />
        ) : (
          <EmptyCard n={n} onClaim={setClaimSlot} />
        )}
      </div>
    );
  };

  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-dark/85">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Sponsored
          </p>
          <p className="mt-0.5 hidden text-[12px] text-secondary sm:block">
            Paid placement. Not a rank.
          </p>
        </div>
        <p className="shrink-0 pb-0.5 text-[11px] tabular-nums text-secondary">
          from $30/week · {SPONSOR_SLOT_COUNT} spots
        </p>
      </div>

      <div
        className={`-mx-4 overflow-hidden px-4 md:hidden ${
          claimSlot ? "[&_.sponsor-track]:[animation-play-state:paused]" : ""
        }`}
      >
        <div className="sponsor-track flex w-max gap-2.5 motion-safe:animate-sponsor-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused]">
          {[...SPOTS, ...SPOTS].map((n, i) => renderCard(n, `${n}-${i}`))}
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-4 md:gap-3">
        {SPOTS.map((n) => renderCard(n, `desk-${n}`))}
      </div>

      <AnimatePresence>
        {claimSlot !== null && (
          <SponsorModal slotNumber={claimSlot} onClose={() => setClaimSlot(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
