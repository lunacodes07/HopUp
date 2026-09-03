import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { boardMetadata, loadBoardProducts } from "@/lib/board-page";

export const revalidate = 60;

export const metadata: Metadata = boardMetadata("recent", 1);

export default async function Last48HoursPage() {
  const products = await loadBoardProducts();
  return <HomeView page={1} boardMode="recent" products={products} />;
}
