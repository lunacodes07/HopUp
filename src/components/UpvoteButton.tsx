"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { upvoteProduct } from "@/lib/upvotes";

export default function UpvoteButton({
  productId,
  count,
  voted,
  onVoted,
}: {
  productId: string;
  count: number;
  voted: boolean;
  onVoted: (productId: string, nextCount: number) => void;
}) {
  const [pending, setPending] = useState(false);

  const vote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (voted || pending) return;
    setPending(true);
    try {
      const result = await upvoteProduct(productId);
      onVoted(productId, typeof result.upvotes === "number" ? result.upvotes : count + 1);
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={vote}
      disabled={voted || pending}
      aria-pressed={voted}
      aria-label={voted ? `Upvoted, ${count}` : `Upvote, ${count}`}
      className={`shrink-0 flex flex-col items-center justify-center min-w-10 min-h-10 lg:min-w-9 lg:min-h-0 px-1.5 py-1 rounded-xl border border-border/70 bg-white/80 lg:border-0 lg:bg-transparent transition-colors ${
        voted
          ? "text-accent-dark border-accent/40 bg-accent/10"
          : "text-secondary hover:text-accent hover:bg-white"
      } disabled:opacity-100`}
    >
      <ChevronUp className={`w-4 h-4 ${voted ? "fill-accent/30" : ""}`} />
      <span className="text-[11px] font-semibold tabular-nums leading-none">{count}</span>
    </button>
  );
}
