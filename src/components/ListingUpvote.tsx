"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { readVotedFromStorage, upvoteProduct, writeVotedToStorage } from "@/lib/upvotes";

type VoteState = {
  total: number;
  voted: boolean;
  pending: boolean;
  vote: () => void;
};

const VoteContext = createContext<VoteState | null>(null);

function useVote() {
  const value = useContext(VoteContext);
  if (!value) throw new Error("Listing upvote used outside its provider");
  return value;
}

export function ListingVote({
  productId,
  count,
  initialVoted,
  children,
}: {
  productId: string;
  count: number;
  initialVoted: boolean;
  children: React.ReactNode;
}) {
  const [total, setTotal] = useState(count);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setTotal(count);
  }, [count]);

  useEffect(() => {
    if (readVotedFromStorage().includes(productId)) setVoted(true);
  }, [productId]);

  const vote = async () => {
    if (voted || pending) return;
    setPending(true);
    try {
      const result = await upvoteProduct(productId);
      const next = typeof result.upvotes === "number" ? result.upvotes : total + 1;
      setTotal(next);
      setVoted(true);
      const ids = readVotedFromStorage();
      if (!ids.includes(productId)) writeVotedToStorage([...ids, productId]);
    } catch (err) {
      console.error("Upvote failed:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <VoteContext.Provider value={{ total, voted, pending, vote }}>
      {children}
    </VoteContext.Provider>
  );
}

export function ListingUpvoteStat() {
  const { total } = useVote();
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-secondary">Upvotes</dt>
      <dd className="mt-0.5 text-[20px] md:text-2xl font-semibold tabular-nums">
        {total.toLocaleString()}
      </dd>
    </div>
  );
}

export function ListingUpvoteButton() {
  const { total, voted, pending, vote } = useVote();
  return (
    <button
      type="button"
      onClick={vote}
      disabled={voted || pending}
      aria-pressed={voted}
      className={`btn-glass inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-[15px] font-semibold ${
        voted ? "text-accent-dark" : "text-foreground hover:text-accent"
      }`}
    >
      <ChevronUp className={`w-4 h-4 ${voted ? "fill-accent/30" : ""}`} />
      {voted ? "Upvoted" : "Upvote"}
      <span className="tabular-nums">{total.toLocaleString()}</span>
    </button>
  );
}
