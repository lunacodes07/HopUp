import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { boardMetadata, loadBoardProducts } from "@/lib/board-page";

export const revalidate = 300;

export const metadata: Metadata = boardMetadata("alltime", 1);

export default async function AllTimeIndex() {
  const products = await loadBoardProducts();
  return <HomeView page={1} boardMode="alltime" products={products} />;
}
