"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import LiveStats from "@/components/LiveStats";
import CustomizerControls from "./CustomizerControls";
import { STANLEY_SLOT_COUNT } from "@/lib/brand-objects";
import { getFormattedUrlInfo } from "@/lib/format-url";
import { getProxiedLogoUrl } from "@/lib/logo";
import { supabase } from "@/lib/supabase";
import type { StanleySlot } from "@/lib/stanley-slots";

/** Matches TUMBLER_PINK in TumblerViewer (kept literal so this file doesn't import the 3D bundle). */
const PINK = "#F2AFC9";

const TumblerViewer = dynamic(() => import("./TumblerViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-toggle-spin" />
      <span className="text-[12px] font-medium text-secondary">Pouring the cup…</span>
    </div>
  ),
});

const SLOT_COUNT = STANLEY_SLOT_COUNT;

/** Draws the uploaded image contain-fit onto a square transparent canvas
 *  so any logo aspect ratio sits cleanly inside its slot. */
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

function firstOpenSlot(claimed: Record<number, StanleySlot>) {
  for (let n = 1; n <= SLOT_COUNT; n++) {
    if (!claimed[n]) return n;
  }
  return 1;
}

function indexClaimed(rows: StanleySlot[]) {
  const next: Record<number, StanleySlot> = {};
  for (const row of rows) next[row.slot_number] = row;
  return next;
}

export default function StanleyExperience({
  initialSlots = [],
}: {
  initialSlots?: StanleySlot[];
}) {
  const [claimedBySlot, setClaimedBySlot] = useState<Record<number, StanleySlot>>(() =>
    indexClaimed(initialSlots)
  );
  const [slotLogos, setSlotLogos] = useState<Record<number, string>>({});
  const [selectedSlot, setSelectedSlot] = useState(() => firstOpenSlot(indexClaimed(initialSlots)));
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [brandUrl, setBrandUrl] = useState("");
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("stanley_slots")
        .select("id, slot_number, name, url, price, created_at");
      if (error) {
        if (error.code !== "PGRST205") {
          console.warn(error.message || "Stanley slots are not loaded yet");
        }
        return;
      }
      setClaimedBySlot(indexClaimed((data as StanleySlot[]) ?? []));
    };

    void load();
    const subscription = supabase
      .channel("stanley_slots_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stanley_slots" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // After a local Dodo test checkout, pull the succeeded payment and fill the slot.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") !== "1" || params.get("kind") !== "stanley") return;
    const slot = Number(params.get("slot"));
    const url = params.get("hop") || "";
    const paymentId = params.get("payment_id") || "";
    if (!url || !slot) return;

    let cancelled = false;
    const run = async () => {
      for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
        try {
          const response = await fetch("/api/stanley/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, slot, paymentId }),
          });
          const data = await response.json();
          if (data.applied || data.duplicate || data.skipped) {
            const { data: rows } = await supabase
              .from("stanley_slots")
              .select("id, slot_number, name, url, price, created_at");
            if (!cancelled && rows) setClaimedBySlot(indexClaimed(rows as StanleySlot[]));
            return;
          }
        } catch {
          // Payment may not be listed yet — retry.
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const selectSlot = useCallback((n: number) => {
    setSelectedSlot(n);
    setClaimError(null);
    requestAnimationFrame(() => {
      document.getElementById("claim-spot")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploadError(null);
      try {
        const dataUrl = await fitLogoToSquare(file);
        setSlotLogos((prev) => ({ ...prev, [selectedSlot]: dataUrl }));
      } catch {
        setUploadError("Could not read that image. Try a PNG or JPG.");
      }
    },
    [selectedSlot]
  );

  const clearSlot = useCallback(() => {
    setSlotLogos((prev) => {
      const next = { ...prev };
      delete next[selectedSlot];
      return next;
    });
  }, [selectedSlot]);

  const claimedLogos = useMemo(() => {
    const next: Record<number, string> = {};
    for (const [key, row] of Object.entries(claimedBySlot)) {
      next[Number(key)] = getProxiedLogoUrl(row.url);
    }
    return next;
  }, [claimedBySlot]);

  const previewLogo = slotLogos[selectedSlot] || fetchedLogo;

  const displayLogos = useMemo(() => {
    const next = { ...claimedLogos };
    if (previewLogo) next[selectedSlot] = previewLogo;
    return next;
  }, [claimedLogos, previewLogo, selectedSlot]);

  const handleClaim = useCallback(async () => {
    if (claiming) return;
    const trimmed = brandUrl.trim();
    if (trimmed.length < 3) {
      setClaimError("Add your site or @handle first.");
      return;
    }

    setClaiming(true);
    setClaimError(null);

    try {
      const { finalUrl, nameFallback } = getFormattedUrlInfo(trimmed);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "stanley",
          url: finalUrl,
          nameFallback,
          slotNumber: selectedSlot,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start checkout");
      if (!data.url) throw new Error("No checkout URL returned.");
      window.location.href = data.url;
    } catch (err) {
      console.error("Stanley checkout failed:", err);
      setClaimError(err instanceof Error ? err.message : "Failed to start checkout.");
      setClaiming(false);
    }
  }, [brandUrl, claiming, selectedSlot]);

  const traveler = displayBrandOf(brandUrl);
  const filledCount = Object.keys(claimedBySlot).length;
  const raised = Object.values(claimedBySlot).reduce((sum, row) => sum + row.price, 0);
  const hoveredClaimed = hoveredSlot != null ? claimedBySlot[hoveredSlot] : undefined;

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
          <span className="text-foreground">Stanley</span>
        </p>

        {/* Hero */}
        <div className="text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-[36px] leading-[1.05] md:text-[54px] font-semibold tracking-tight text-foreground"
          >
            Brand My <span className="text-accent">Stanley.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2.5 text-[15px] md:text-lg text-secondary max-w-[440px] mx-auto md:mx-0 text-balance"
          >
            See your brand on my Stanley — hop any spot that is already taken.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 md:mt-7"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-x-2 gap-y-0.5">
            <span className="text-[28px] md:text-[34px] font-semibold tracking-tight tabular-nums text-foreground leading-none">
              ${raised}
            </span>
            <span className="text-[15px] md:text-base font-medium text-secondary">
              raised on this Stanley
            </span>
          </div>
          <p className="mt-1.5 text-[12px] text-secondary text-center md:text-left">
            hop any taken spot
            {filledCount > 0 && (
              <span className="tabular-nums">
                {" "}
                · {filledCount}/{SLOT_COUNT} spots filled
              </span>
            )}
          </p>
          <div
            className="mt-3 h-1.5 w-full max-w-[320px] mx-auto md:mx-0 rounded-full bg-border/70 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={SLOT_COUNT}
            aria-valuenow={filledCount}
            aria-label="Stanley spots filled"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${(filledCount / SLOT_COUNT) * 100}%` }}
            />
          </div>
        </motion.div>

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
                background: `radial-gradient(90% 70% at 50% 30%, ${PINK}33 0%, transparent 65%)`,
              }}
            />
            <div className="h-[420px] sm:h-[480px] lg:h-[560px]">
              <TumblerViewer
                slotLogos={displayLogos}
                claimedUrls={Object.fromEntries(
                  Object.values(claimedBySlot).map((row) => [row.slot_number, row.url])
                )}
                selectedSlot={selectedSlot}
                onSelectSlot={selectSlot}
                onHoverSlot={setHoveredSlot}
              />
            </div>

            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-secondary border border-border/60 pointer-events-none">
              <RotateCcw className="w-3 h-3" />
              Drag to spin
            </div>

            <div className="absolute bottom-3.5 left-0 right-0 flex justify-center pointer-events-none px-4">
              <span className="rounded-full bg-white/80 backdrop-blur px-3.5 py-1.5 text-[12px] font-medium text-secondary border border-border/60 truncate max-w-full">
                {hoveredClaimed ? (
                  <>
                    <span className="font-semibold text-foreground">Claim this</span>
                    {" · "}
                    ${hoveredClaimed.price}
                  </>
                ) : traveler ? (
                  <>
                    <span className="font-semibold text-foreground">{traveler}</span> travels with me
                    {filledCount > 0 && (
                      <span className="tabular-nums"> · {filledCount}/{SLOT_COUNT} spots</span>
                    )}
                  </>
                ) : (
                  "Tap a spot, add your link — we'll pull the logo"
                )}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:sticky lg:top-24">
            {uploadError && (
              <p className="mb-3 rounded-xl bg-accent/10 border border-accent/30 px-3.5 py-2 text-[13px] font-medium text-accent-dark">
                {uploadError}
              </p>
            )}
            <CustomizerControls
              slotCount={SLOT_COUNT}
              selectedSlot={selectedSlot}
              onSelectSlot={selectSlot}
              slotLogos={displayLogos}
              claimedBySlot={claimedBySlot}
              previewLogo={previewLogo}
              uploaded={Boolean(slotLogos[selectedSlot])}
              onUploadLogo={handleUpload}
              onClearSlot={clearSlot}
              brandUrl={brandUrl}
              onBrandUrlChange={setBrandUrl}
              onClaim={handleClaim}
              claiming={claiming}
              claimError={claimError}
            />
          </div>
        </motion.div>

        <p className="mt-10 text-center text-[12px] text-secondary/80 max-w-[520px] mx-auto">
          Generic premium tumbler. Not affiliated with or endorsed by Stanley — we just
          drink a lot of water.
        </p>
      </div>
    </main>
  );
}
