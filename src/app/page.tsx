import HomeView from "@/components/HomeView";
import { getCreatorBySlug } from "@/lib/creators-server";
import { getRankedProducts } from "@/lib/products-server";

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{ ref?: string; via?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const products = await getRankedProducts();
  const params = await searchParams;
  const creator = await getCreatorBySlug(params.ref || params.via);
  return <HomeView page={1} products={products} viaName={creator?.name} />;
}
