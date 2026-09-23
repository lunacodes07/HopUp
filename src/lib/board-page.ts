import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  type BoardMode,
  boardCanonicalPath,
  parsePageParam,
  totalPagesFor,
} from "@/lib/pagination";
import { getRankedProducts } from "@/lib/products-server";
import { SITE_URL } from "@/lib/site";
import { boardList } from "@/lib/week";
import type { Product } from "@/types";

export function pageCountForMode(mode: BoardMode, products: Product[], now = Date.now()) {
  return totalPagesFor(boardList(products, mode, now).length);
}

export async function loadBoardProducts() {
  return getRankedProducts();
}

export async function resolveBoardPage(mode: BoardMode, rawPage?: string) {
  const page = parsePageParam(rawPage ?? "1");
  if (!page) notFound();
  if (mode === "week" && page === 1) redirect("/");
  if (mode === "alltime" && rawPage && page === 1) redirect("/all-time");

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
  const label = mode === "week" ? "This week" : "All time";
  const title = page <= 1 ? `${label} — HopUp` : `${label} — page ${page} — HopUp`;
  const description =
    mode === "week"
      ? "Ranked by what you paid this week. $2 gets you on here for 7 days."
      : "Ranked by total paid. The page stays.";
  const url = `${SITE_URL}${boardCanonicalPath(mode, page)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}
