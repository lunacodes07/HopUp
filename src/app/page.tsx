import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

import LiveLeaderboard from "@/components/LiveLeaderboard";
import WhyFounders from "@/components/WhyFounders";

import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col flex-1 w-full relative">
        <Hero />

        <LiveLeaderboard />
        <WhyFounders />

      </main>
      <Footer />
    </>
  );
}
