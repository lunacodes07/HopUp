import type { Metadata } from "next";
import ListingsIndex from "@/components/ListingsIndex";
import { getRankedProducts, withBoardRanks } from "@/lib/products-server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All listings — HopUp",
  description: "Every product currently hopped on HopUp. Pay once. Rank higher.",
  alternates: { canonical: `${SITE_URL}/p` },
  openGraph: {
    title: "All listings — HopUp",
    description: "Every product currently hopped on HopUp.",
    url: `${SITE_URL}/p`,
  },
};

export default async function ListingsPage() {
  const products = withBoardRanks(await getRankedProducts());
  return <ListingsIndex products={products} />;
}
