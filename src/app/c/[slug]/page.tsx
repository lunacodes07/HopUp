import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import HomeView from "@/components/HomeView";
import { CREATOR_CLICK_COOKIE } from "@/lib/creators";
import { getCreatorBySlug, incrementCreatorClicks } from "@/lib/creators-server";
import { getRankedProducts } from "@/lib/products-server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const creator = await getCreatorBySlug((await params).slug);
  if (!creator) return { title: "HopUp" };
  return {
    title: "HopUp — Your Product Deserves a Better Spot",
    description: "List it. Hop up. Get noticed.",
    robots: { index: false, follow: true },
  };
}

export default async function CreatorPage({ params }: PageProps) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) notFound();

  const incoming = (await headers()).get("cookie") || "";
  const already = incoming
    .split(";")
    .some((part) => part.trim() === `${CREATOR_CLICK_COOKIE}=${creator.slug}`);
  if (!already) {
    await incrementCreatorClicks(creator.slug);
  }

  const products = await getRankedProducts();
  return <HomeView page={1} products={products} />;
}
