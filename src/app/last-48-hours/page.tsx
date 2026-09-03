import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { boardMetadata, boardRevalidate, loadBoardProducts } from "@/lib/board-page";

export const revalidate = boardRevalidate;

export const metadata: Metadata = boardMetadata("recent", 1);

export default async function Last48HoursPage() {
  const products = await loadBoardProducts();
  return <HomeView page={1} boardMode="recent" products={products} />;
}
