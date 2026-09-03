import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  type BoardMode,
  boardCanonicalPath,
  boardSize,
  parsePageParam,
  totalPagesFor,
} from "@/lib/pagination";
import { getRankedProducts } from "@/lib/products-server";
import { SITE_URL } from "@/lib/site";
import type { Product } from "@/types";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export const boardRevalidate = 60;

function hoppedAt(item: Product) {
  return new Date(item.last_hopped_at || item.created_at || 0).getTime();
}

export function recentCount(products: Product[]) {
  const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS;
  const board = products.length >= 2 ? products.slice(1) : products;
  return board.filter((item) => hoppedAt(item) >= cutoff).length;
}

export function pageCountForMode(mode: BoardMode, products: Product[]) {
  const count = mode === "recent" ? recentCount(products) : boardSize(products.length);
  return totalPagesFor(count);
}

export async function loadBoardProducts() {
  return getRankedProducts();
}

export async function resolveBoardPage(mode: BoardMode, rawPage?: string) {
  const page = parsePageParam(rawPage ?? "1");
  if (!page) notFound();
  if (mode === "alltime" && page === 1) redirect("/");
  if (mode === "recent" && rawPage && page === 1) redirect("/last-48-hours");

  const products = await loadBoardProducts();
  if (page > pageCountForMode(mode, products)) notFound();

  return { page, products };
}

export function boardPageParams(mode: BoardMode, products: Product[]) {
  const total = pageCountForMode(mode, products);
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export function boardMetadata(mode: BoardMode, page: number): Metadata {
  const label = mode === "recent" ? "Last 48 hours" : "All time";
  const title = page <= 1 ? `${label} — HopUp` : `${label} — page ${page} — HopUp`;
  const description =
    mode === "recent"
      ? "Products that hopped on HopUp in the last 48 hours."
      : "The HopUp all-time leaderboard. Pay once. Rank higher.";
  const url = `${SITE_URL}${boardCanonicalPath(mode, page)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}
