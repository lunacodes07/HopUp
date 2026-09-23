import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import {
  boardMetadata,
  boardPageParams,
  loadBoardProducts,
  resolveBoardPage,
} from "@/lib/board-page";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ page: string }>;
};

export async function generateStaticParams() {
  try {
    return boardPageParams("week", await loadBoardProducts());
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await resolveBoardPage("week", (await params).page);
  return boardMetadata("week", page);
}

export default async function ThisWeekPage({ params }: PageProps) {
  const { page, products } = await resolveBoardPage("week", (await params).page);
  return <HomeView page={page} boardMode="week" products={products} />;
}
