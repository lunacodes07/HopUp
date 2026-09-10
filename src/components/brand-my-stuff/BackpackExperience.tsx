"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Link2, Lock, Play, RotateCcw, Trash2, Upload } from "lucide-react";
import LiveStats from "@/components/LiveStats";
import ObjectArt from "./ObjectArt";
import {
  BACKPACK_SLOT_COUNT,
  BACKPACK_ZONES,
  backpackCapacity,
  backpackSlotPrice,
} from "@/lib/brand-objects";
import { getFormattedUrlInfo } from "@/lib/format-url";
import { getProxiedLogoUrl, handleLogoError } from "@/lib/logo";

/** Matches PACK_BLUE in BackpackViewer (kept literal so this file doesn't import the 3D bundle). */
const BLUE = "#A6C3E2";

const BackpackViewer = dynamic(() => import("./BackpackViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-toggle-spin" />
      <span className="text-[12px] font-medium text-secondary">Packing the bag…</span>
    </div>
  ),
});

const SLOT_COUNT = BACKPACK_SLOT_COUNT;

/** Draws the uploaded image contain-fit onto a square transparent canvas
 *  so any logo aspect ratio sits cleanly inside its patch. */
async function fitLogoToSquare(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image"));
      el.src = objectUrl;
    });

    const size = 512;
    const pad = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const scale = Math.min((size - pad * 2) / img.width, (size - pad * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fitRemoteLogoToSquare(src: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not load logo"));
    el.src = src;
  });

  const size = 512;
  const pad = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.min((size - pad * 2) / img.width, (size - pad * 2) / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return canvas.toDataURL("image/png");
}

function displayBrandOf(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const { nameFallback } = getFormattedUrlInfo(trimmed);
  if (nameFallback.startsWith("@")) return nameFallback;
  return nameFallback.replace(/^www\./, "");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary mb-2.5">
      {children}
    </p>
  );
}

export default function BackpackExperience() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [brandUrl, setBrandUrl] = useState("");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [introDone, setIntroDone] = useState(false);

  // Same as the leaderboard: if they skip an upload, pull the logo from the URL.
  useEffect(() => {
    const trimmed = brandUrl.trim();
    if (trimmed.length < 3) {
      setFetchedLogo(null);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      const { finalUrl } = getFormattedUrlInfo(trimmed);
      const proxied = getProxiedLogoUrl(finalUrl);
      try {
        const fitted = await fitRemoteLogoToSquare(proxied);
        if (!cancelled) setFetchedLogo(fitted);
      } catch {
        if (!cancelled) setFetchedLogo(proxied);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [brandUrl]);

  const selectSlot = useCallback((n: number, opts?: { scroll?: boolean }) => {
    setSelectedSlot(n);
    if (opts?.scroll === false) return;
    requestAnimationFrame(() => {
      document.getElementById("claim-spot")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setUploadError(null);
    try {
      setUploadedLogo(await fitLogoToSquare(file));
    } catch {
      setUploadError("Could not read that image. Try a PNG or JPG.");
    }
  }, []);

  const previewLogo = uploadedLogo || fetchedLogo;

  const displayLogos = useMemo(() => {
    const next: Record<number, string> = {};
    if (previewLogo) next[selectedSlot] = previewLogo;
    return next;
  }, [previewLogo, selectedSlot]);

  const traveler = displayBrandOf(brandUrl);
  const capacity = backpackCapacity();
  const selectedPrice = backpackSlotPrice(selectedSlot);
  const selectedZone = BACKPACK_ZONES.find((zone) => zone.slots.includes(selectedSlot));

  return (
    <main className="w-full px-4 md:px-8 pt-20 md:pt-24 pb-20">
      <div className="w-full max-w-[1080px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 mb-4 text-center">
          <LiveStats />
        </div>

        {/* Breadcrumb */}
        <p className="text-[11px] font-medium text-secondary mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="text-border mx-1.5">/</span>
          <Link href="/brandmystuff" className="hover:text-foreground transition-colors">
            Brand My Stuff
          </Link>
          <span className="text-border mx-1.5">/</span>
          <span className="text-foreground">Backpack</span>
        </p>

        {/* Hero */}
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] md:gap-10 md:items-start">
          <div className="text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="text-[36px] leading-[1.05] md:text-[54px] font-semibold tracking-tight text-foreground"
            >
              Brand My <span className="text-accent">Backpack.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2.5 text-[15px] md:text-lg text-secondary max-w-[480px] mx-auto md:mx-0 text-balance"
            >
              I&apos;m Aloha. This bag is on my back every single day — {SLOT_COUNT} patch
              spots, from the hero patch to the hidden inside panel.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 text-[13px] text-secondary/90"
            >
              <a
                href="https://x.com/alohaproxy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-accent-dark transition-colors"
              >
                @alohaproxy
              </a>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 md:mt-7"
            >
              <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-x-2 gap-y-0.5">
                <span className="text-[28px] md:text-[34px] font-semibold tracking-tight tabular-nums text-foreground leading-none">
                  {SLOT_COUNT} spots
                </span>
                <span className="text-[15px] md:text-base font-medium text-secondary">
                  on the backpack
                </span>
              </div>
              <p className="mt-1.5 text-[12px] text-secondary text-center md:text-left">
                from $30 · <span className="tabular-nums">${capacity}</span> if the bag fills — checkout opens soon
              </p>
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 md:mt-1 rounded-3xl border border-white/70 bg-white/50 backdrop-blur p-5 md:p-6 text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
              Where it goes
            </p>
            <p className="mt-2 text-[15px] md:text-base text-foreground leading-snug text-balance">
              This backpack rides with me everywhere ~ uni, cafes, flights, and everything in between.
            </p>

            <Link
              href="/brandmystanley"
              className="group mt-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-white/70 px-3 py-2.5 transition-colors hover:border-accent/50"
            >
              <span className="w-11 h-11 shrink-0">
                <ObjectArt slug="brandmystanley" tint="#F2AFC9" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-foreground">
                  Wanna brand my Stanley?
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-dark">
                  Live now
                </span>
              </span>
            </Link>
          </motion.aside>
        </div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6 lg:gap-8 items-start"
        >
          {/* Viewer */}
          <div className="relative rounded-3xl border border-white/70 bg-white/40 backdrop-blur-xl shadow-[0_12px_40px_-24px_rgba(45,41,38,0.35)] overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(90% 70% at 50% 30%, ${BLUE}40 0%, transparent 65%)`,
              }}
            />
            <div className="h-[420px] sm:h-[480px] lg:h-[560px]">
              <BackpackViewer
                slotLogos={displayLogos}
                selectedSlot={selectedSlot}
                onSelectSlot={(n) => selectSlot(n, { scroll: false })}
              />
            </div>

            {/* Launch film intro — tap anywhere to jump into the 3D bag */}
            {!introDone && (
              <button
                type="button"
                onClick={() => setIntroDone(true)}
                className="absolute inset-0 z-20 group text-left"
                aria-label="Skip intro film and open the 3D backpack"
              >
                <video
                  src="/brandmybackpack/launch.mp4"
                  poster="/brandmybackpack/poster.png"
                  autoPlay
                  muted
                  playsInline
                  onEnded={() => setIntroDone(true)}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-medium">
                  <span className="rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-secondary border border-border/60">
                    4s film · tap to skip
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 font-semibold text-foreground border border-border/60 transition-colors group-hover:text-accent-dark">
                    <Play className="w-3 h-3" />
                    Open 3D
                  </span>
                </span>
              </button>
            )}

            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
              {introDone && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-secondary border border-border/60">
                  <RotateCcw className="w-3 h-3" />
                  Drag to spin
                </span>
              )}
              <span className="ml-auto rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-foreground border border-border/60 tabular-nums">
                Spot {selectedSlot} · ${selectedPrice}
              </span>
            </div>

            {introDone && (
              <div className="absolute bottom-3.5 left-0 right-0 flex justify-center pointer-events-none px-16">
                <span className="rounded-full bg-white/80 backdrop-blur px-3.5 py-1.5 text-[12px] font-medium text-secondary border border-border/60 truncate max-w-full">
                  {traveler ? (
                    <>
                      <span className="font-semibold text-foreground">{traveler}</span> rides on my back
                      {selectedZone && <span> · {selectedZone.label.toLowerCase()}</span>}
                    </>
                  ) : (
                    "Pick a numbered spot to preview it"
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="lg:sticky lg:top-24">
            {uploadError && (
              <p className="mb-3 rounded-xl bg-accent/10 border border-accent/30 px-3.5 py-2 text-[13px] font-medium text-accent-dark">
                {uploadError}
              </p>
            )}

            <div className="flex flex-col gap-7">
              <div>
                <SectionLabel>Pick your spot — {SLOT_COUNT} on the bag</SectionLabel>
                <div className="flex flex-col gap-3">
                  {BACKPACK_ZONES.map((zone) => (
                    <div key={zone.label}>
                      <p className="text-[10.5px] font-medium text-secondary/80 mb-1">
                        {zone.label} · {zone.hint} · ${zone.price} each
                      </p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {zone.slots.map((n) => {
                          const shownLogo = displayLogos[n];
                          const selected = n === selectedSlot;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => selectSlot(n)}
                              aria-label={`Spot ${n}, $${backpackSlotPrice(n)}`}
                              className={`group relative aspect-square rounded-xl border text-sm font-semibold transition-all overflow-visible ${
                                selected
                                  ? "border-accent bg-accent/10 text-accent-dark shadow-[0_0_0_3px_rgba(255,140,115,0.25)]"
                                  : "border-border bg-white/70 text-secondary hover:border-accent/50 hover:text-foreground"
                              }`}
                            >
                              <span className="absolute inset-0 rounded-xl overflow-hidden">
                                {shownLogo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={shownLogo}
                                    alt={`Spot ${n} preview`}
                                    className="absolute inset-0 w-full h-full object-contain p-1.5"
                                    onError={(e) => handleLogoError(e.currentTarget, brandUrl)}
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center tabular-nums">
                                    {n}
                                  </span>
                                )}
                                <span className="absolute bottom-0.5 left-1 text-[9px] font-semibold text-secondary tabular-nums">
                                  ${backpackSlotPrice(n)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="claim-spot" className="flex flex-col gap-7 scroll-mt-24">
                <div>
                  <SectionLabel>Your link</SectionLabel>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/70" />
                    <input
                      type="text"
                      value={brandUrl}
                      onChange={(e) => setBrandUrl(e.target.value)}
                      placeholder="yoursite.com or @handle"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full rounded-full border border-border bg-white/70 pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-accent transition-colors placeholder:text-secondary/60"
                    />
                  </div>
                </div>

                <div>
                  <SectionLabel>Your logo — optional</SectionLabel>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                      e.target.value = "";
                    }}
                  />
                  {previewLogo ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-border bg-white/80 p-2 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewLogo}
                          alt={uploadedLogo ? "Uploaded logo" : "Logo from your link"}
                          className="w-full h-full object-contain"
                          onError={(e) => handleLogoError(e.currentTarget, brandUrl)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[12px] text-secondary">
                          {uploadedLogo ? "Your upload" : "Pulled from your link"}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:text-accent-dark transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {uploadedLogo ? "Replace logo" : "Use a different logo"}
                        </button>
                        {uploadedLogo && (
                          <button
                            type="button"
                            onClick={() => setUploadedLogo(null)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary hover:text-foreground transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Use the link logo
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="group w-full rounded-2xl border-2 border-dashed border-border hover:border-accent/60 bg-white/50 hover:bg-accent/[0.06] px-4 py-6 flex flex-col items-center gap-2 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-full bg-muted group-hover:bg-accent/15 flex items-center justify-center transition-colors">
                        <Upload className="w-4 h-4 text-secondary group-hover:text-accent-dark transition-colors" />
                      </span>
                      <span className="text-[13px] font-semibold text-foreground">Upload a logo</span>
                      <span className="text-[11.5px] text-secondary">
                        Optional — we&apos;ll pull it from your link if you skip this
                      </span>
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/60 backdrop-blur p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Claim spot {selectedSlot} — ${selectedPrice}
                  </p>
                  <p className="mt-1 text-[12.5px] text-secondary leading-snug">
                    {selectedZone?.label}
                    {selectedZone ? ` — ${selectedZone.hint}. ` : " "}
                    Checkout isn&apos;t live yet — preview your logo and DM{" "}
                    <a
                      href="https://x.com/alohaproxy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-accent-dark transition-colors"
                    >
                      @alohaproxy
                    </a>{" "}
                    to reserve it.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="group mt-3 inline-flex items-center gap-1.5 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Opens soon
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="mt-10 text-center text-[12px] text-secondary/80 max-w-[520px] mx-auto">
          Generic everyday backpack. The inside-panel spots ride hidden while I wear it —
          they show every time the bag comes off my back.
        </p>
      </div>
    </main>
  );
}
