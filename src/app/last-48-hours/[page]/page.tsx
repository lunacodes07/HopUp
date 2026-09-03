import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import {
  boardMetadata,
  boardPageParams,
  loadBoardProducts,
  resolveBoardPage,
} from "@/lib/board-page";

export const revalidate = 60;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ page: string }>;
};

export async function generateStaticParams() {
  try {
    return boardPageParams("recent", await loadBoardProducts());
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await resolveBoardPage("recent", (await params).page);
  return boardMetadata("recent", page);
}

export default async function Last48HoursPaged({ params }: PageProps) {
  const { page, products } = await resolveBoardPage("recent", (await params).page);
  return <HomeView page={page} boardMode="recent" products={products} />;
}
