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
    return boardPageParams("alltime", await loadBoardProducts());
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await resolveBoardPage("alltime", (await params).page);
  return boardMetadata("alltime", page);
}

export default async function AllTimePage({ params }: PageProps) {
  const { page, products } = await resolveBoardPage("alltime", (await params).page);
  return <HomeView page={page} boardMode="alltime" products={products} />;
}
