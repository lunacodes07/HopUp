import { Suspense } from "react";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveLeaderboard from "@/components/LiveLeaderboard";
import StanleyHomeTeaser from "@/components/StanleyHomeTeaser";
import WhyFounders from "@/components/WhyFounders";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import ShareAfterPayment from "@/components/ShareAfterPayment";
import type { BoardMode } from "@/lib/pagination";
import type { Product } from "@/types";
import { getXDisplayNames } from "@/lib/x-profile-server";
import { parseVotedIds, UPVOTE_COOKIE } from "@/lib/upvotes";

type HomeViewProps = {
  page?: number;
  boardMode?: BoardMode;
  products?: Product[];
};

export default async function HomeView({
  page = 1,
  boardMode = "alltime",
  products = [],
}: HomeViewProps) {
  const displayNames = await getXDisplayNames();
  const initialVoted = parseVotedIds((await cookies()).get(UPVOTE_COOKIE)?.value);

  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative">
        <Hero />
        <LiveLeaderboard
          page={page}
          boardMode={boardMode}
          initialProducts={products}
          initialVoted={initialVoted}
        />
        {page === 1 && <StanleyHomeTeaser />}
        <WhyFounders />
        <Testimonials displayNames={displayNames} />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <ShareAfterPayment products={products} />
      </Suspense>
    </>
  );
}
