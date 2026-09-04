"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { shareCaption, shareImagePath, xShareUrl, type SharePayload } from "@/lib/share";
import DownloadCardButton from "./DownloadCardButton";

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.51-8.583L1.5 2.25h7.08l4.261 5.685 5.403-5.685Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function ShareHopModal({
  payload,
  onClose,
  kicker,
}: {
  payload: SharePayload;
  onClose: () => void;
  kicker?: string;
}) {
  const [caption, setCaption] = useState(() => shareCaption(payload));
  const [cardFailed, setCardFailed] = useState(false);
  const previewSrc = shareImagePath(payload);
  const label =
    kicker || (payload.kind === "sponsored" ? "You're featured" : "You hopped");

  useEffect(() => {
    setCaption(shareCaption(payload));
    setCardFailed(false);
  }, [payload]);

  useEffect(() => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#141210]/55 backdrop-blur-sm px-3 py-3 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] rounded-[28px] bg-[#FAF8F5] border border-white/70 shadow-[0_24px_80px_-28px_rgba(20,18,16,0.55)] overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-dark">
              {label}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
              Download the card, then post it.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 -mr-1 rounded-full text-secondary hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5">
          <div className="rounded-2xl overflow-hidden border border-[#2D2926]/10 shadow-[0_12px_40px_-20px_rgba(20,18,16,0.45)] bg-[#141210]">
            {cardFailed ? (
              <div className="aspect-[1200/630] px-6 py-5 flex flex-col justify-between text-[#FAF8F5]">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-accent">JUST HOPPED</p>
                <div>
                  <p className="text-[22px] font-semibold tracking-tight leading-tight">{payload.name}</p>
                  <p className="mt-3 text-[28px] font-semibold tabular-nums">
                    {payload.rank === 0 ? "Hall of Fame" : `#${payload.rank}`}
                    <span className="mx-2 text-white/30">·</span>
                    ${payload.price.toLocaleString()}
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-[12px] text-white/45">
                  <img src="/hoplogo.png" alt="" className="w-4 h-4 object-contain" />
                  hopup.lol
                </p>
              </div>
            ) : (
              <img
                src={previewSrc}
                alt={`${payload.name} HopUp card`}
                width={1200}
                height={630}
                className="w-full h-auto block"
                onError={() => setCardFailed(true)}
              />
            )}
          </div>
        </div>

        <div className="px-5 pt-4 pb-5">
          <label htmlFor="share-caption" className="sr-only">
            Caption
          </label>
          <textarea
            id="share-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-2xl border border-border bg-white/80 px-3.5 py-3 text-[14px] leading-relaxed text-foreground outline-none focus:border-accent/60"
          />

          <DownloadCardButton
            payload={payload}
            className="mt-3 flex items-center justify-center w-full bg-[#141210] text-[#FAF8F5] px-5 py-3 rounded-full text-[15px] font-semibold hover:bg-accent hover:text-foreground transition-colors disabled:opacity-70"
          >
            Download PNG
          </DownloadCardButton>

          <a
            href={xShareUrl(caption)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 w-full border border-border bg-white/80 px-5 py-3 rounded-full text-[15px] font-semibold text-foreground hover:border-accent/50 hover:text-accent transition-colors"
          >
            <XMark className="w-3.5 h-3.5" />
            Post on X
          </a>

          <p className="mt-2 text-center text-[12px] text-secondary">
            X only prefills the caption. Attach the PNG after you download it.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 w-full py-2 text-[13px] font-medium text-secondary hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
