"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { withBoardRanks } from "@/lib/board-ranks";
import {
  clearPendingShare,
  readPendingShare,
  shareFromProduct,
  type PendingShare,
  type SharePayload,
} from "@/lib/share";
import { displayHost } from "@/lib/product-path";
import type { Product } from "@/types";
import ShareHopModal from "./ShareHopModal";

const matchesUrl = (productUrl: string | undefined, finalUrl: string) =>
  productUrl?.replace(/\/$/, "").toLowerCase() === finalUrl.replace(/\/$/, "").toLowerCase();

function fallbackPayload(pending: PendingShare): SharePayload {
  return {
    name: pending.name || displayHost(pending.url) || pending.url,
    rank: 1,
    price: pending.bid || 2,
    url: pending.url,
    kind: pending.kind,
  };
}

async function lookupProduct(hopUrl: string, seeded: Product[]) {
  const fromSeed = withBoardRanks(seeded).find((item) => matchesUrl(item.url, hopUrl));
  if (fromSeed) return fromSeed;

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, category, clicks, price, url, created_at, last_hopped_at")
    .order("price", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data) return null;
  return withBoardRanks(data as Product[]).find((item) => matchesUrl(item.url, hopUrl)) || null;
}

export default function ShareAfterPayment({ products = [] }: { products?: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const paid = success === "1" || success === "true";
    const hopFromQuery = searchParams.get("hop");

    if (!paid) {
      if (!hopFromQuery) clearPendingShare();
      return;
    }
    if (started.current) return;
    started.current = true;

    const pending = readPendingShare();
    const hopUrl = hopFromQuery || pending?.url;
    const kind =
      searchParams.get("kind") === "sponsored" || pending?.kind === "sponsored"
        ? "sponsored"
        : "hop";

    if (!hopUrl) return;

    const seed: PendingShare = pending || {
      url: hopUrl,
      bid: Number(searchParams.get("bid")) || 2,
      name: displayHost(hopUrl) || hopUrl,
      kind,
    };

    setPayload(fallbackPayload({ ...seed, kind }));

    void (async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        const product = await lookupProduct(hopUrl, products);
        if (product) {
          setPayload(shareFromProduct(product, kind));
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
    })();

    const next = new URLSearchParams(searchParams.toString());
    next.delete("success");
    next.delete("hop");
    next.delete("kind");
    next.delete("bid");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, products, router, searchParams]);

  if (!payload) return null;

  return (
    <ShareHopModal
      payload={payload}
      onClose={() => {
        clearPendingShare();
        setPayload(null);
      }}
    />
  );
}
