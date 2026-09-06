"use client";

import { useRef } from "react";
import { ArrowRight, Link2, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { LARGE_SLOT_COUNT, SLOT_PRICE, SMALL_SLOT_PRICE, slotPrice } from "@/lib/brand-objects";
import { handleLogoError } from "@/lib/logo";

type CustomizerControlsProps = {
  slotCount: number;
  selectedSlot: number;
  onSelectSlot: (n: number) => void;
  slotLogos: Record<number, string>;
  uploaded: boolean;
  onUploadLogo: (file: File) => void;
  onClearSlot: () => void;
  brandUrl: string;
  onBrandUrlChange: (value: string) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary mb-2.5">
      {children}
    </p>
  );
}

export default function CustomizerControls({
  slotCount,
  selectedSlot,
  onSelectSlot,
  slotLogos,
  uploaded,
  onUploadLogo,
  onClearSlot,
  brandUrl,
  onBrandUrlChange,
}: CustomizerControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const currentLogo = slotLogos[selectedSlot];
  const largeSlots = Array.from({ length: LARGE_SLOT_COUNT }, (_, i) => i + 1);
  const smallSlots = Array.from({ length: slotCount - LARGE_SLOT_COUNT }, (_, i) => LARGE_SLOT_COUNT + i + 1);

  return (
    <div className="flex flex-col gap-7">
      {/* Slot picker */}
      <div>
        <SectionLabel>Pick a spot — {slotCount} on the cup</SectionLabel>
        <div className="flex flex-col gap-3">
          {[
            { label: `Large · around the top · $${SLOT_PRICE} each`, slots: largeSlots },
            { label: `Small · around the base · $${SMALL_SLOT_PRICE} each`, slots: smallSlots },
          ].map((ring) =>
            ring.slots.length === 0 ? null : (
              <div key={ring.label}>
                <p className="text-[10.5px] font-medium text-secondary/80 mb-1.5">{ring.label}</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {ring.slots.map((n) => {
                    const filled = Boolean(slotLogos[n]);
                    const selected = n === selectedSlot;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => onSelectSlot(n)}
                        aria-label={`Slot ${n}${filled ? " (filled)" : ""}`}
                        className={`relative aspect-square rounded-xl border text-sm font-semibold transition-all overflow-hidden ${
                          selected
                            ? "border-accent bg-accent/10 text-accent-dark shadow-[0_0_0_3px_rgba(255,140,115,0.25)]"
                            : "border-border bg-white/70 text-secondary hover:border-accent/50 hover:text-foreground"
                        }`}
                      >
                        {filled ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slotLogos[n]}
                            alt={`Slot ${n} logo`}
                            className="absolute inset-0 w-full h-full object-contain p-1.5"
                            onError={(e) => handleLogoError(e.currentTarget, brandUrl)}
                          />
                        ) : (
                          <span className="tabular-nums">{n}</span>
                        )}
                        {filled && (
                          <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold text-secondary tabular-nums">
                            {n}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Link first so we can fetch the logo, then optional upload */}
      <div id="claim-spot" className="flex flex-col gap-7 scroll-mt-24">
      <div>
        <SectionLabel>Your link</SectionLabel>
        <div className="relative">
          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/70" />
          <input
            type="text"
            value={brandUrl}
            onChange={(e) => onBrandUrlChange(e.target.value)}
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
            if (file) onUploadLogo(file);
            e.target.value = "";
          }}
        />
        {currentLogo ? (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border border-border bg-white/80 p-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentLogo}
                alt={uploaded ? "Uploaded logo" : "Logo from your link"}
                className="w-full h-full object-contain"
                onError={(e) => handleLogoError(e.currentTarget, brandUrl)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[12px] text-secondary">
                {uploaded ? `On spot ${selectedSlot}` : "Pulled from your link"}
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:text-accent-dark transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploaded ? "Replace logo" : "Use a different logo"}
              </button>
              {uploaded && (
                <button
                  type="button"
                  onClick={onClearSlot}
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
            <span className="text-[11.5px] text-secondary">Optional — we'll pull it from your link if you skip this</span>
          </button>
        )}
      </div>

      {/* Claim */}
      <div className="rounded-2xl border border-white/70 bg-white/60 backdrop-blur p-4">
        <p className="text-sm font-semibold text-foreground">
          Claim spot {selectedSlot} — ${slotPrice(selectedSlot)}
        </p>
        <p className="mt-1 text-[12.5px] text-secondary leading-snug">
          One-time. Your logo rides on the cup in every video, meetup, and coffee run.
        </p>
        <Link
          href="/contact"
          className="group mt-3 inline-flex items-center gap-1.5 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors"
        >
          Claim this spot
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
      </div>
    </div>
  );
}
