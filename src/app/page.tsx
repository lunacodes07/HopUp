import HomeView from "@/components/HomeView";
import { getRankedProducts } from "@/lib/products-server";

export const revalidate = 300;

export default async function Home() {
  const products = await getRankedProducts();
  return <HomeView page={1} products={products} />;
}
