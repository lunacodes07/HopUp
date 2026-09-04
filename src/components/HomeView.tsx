import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveLeaderboard from "@/components/LiveLeaderboard";
import WhyFounders from "@/components/WhyFounders";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import ShareAfterPayment from "@/components/ShareAfterPayment";
import type { BoardMode } from "@/lib/pagination";
import type { Product } from "@/types";

type HomeViewProps = {
  page?: number;
  boardMode?: BoardMode;
  products?: Product[];
};

export default function HomeView({
  page = 1,
  boardMode = "alltime",
  products = [],
}: HomeViewProps) {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative">
        <Hero />
        <LiveLeaderboard page={page} boardMode={boardMode} initialProducts={products} />
        <WhyFounders />
        <Pricing />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ShareAfterPayment products={products} />
      </Suspense>
    </>
  );
}
