import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StanleyExperience from "@/components/brand-my-stuff/StanleyExperience";
import { getStanleySlots } from "@/lib/stanley-slots-server";
import type { StanleySlot } from "@/lib/stanley-slots";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

const STANLEY_OG = {
  url: `${SITE_URL}/ogstanley.png`,
  width: 1200,
  height: 630,
  alt: "Brand My Stanley — HopUp",
};

export const metadata: Metadata = {
  title: "Brand My Stanley — HopUp",
  description: "Aloha's daily tumbler — real cup plus this page. 6 big spots from $35 (hop +$15), 6 small from $20 (hop +$10).",
  alternates: { canonical: `${SITE_URL}/brandmystanley` },
  openGraph: {
    title: "Brand My Stanley — HopUp",
    description: "Aloha's daily tumbler — real cup plus this page. 6 big spots from $35 (hop +$15), 6 small from $20 (hop +$10).",
    url: `${SITE_URL}/brandmystanley`,
    type: "website",
    images: [STANLEY_OG],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand My Stanley — HopUp",
    description: "Your brand on my Stanley. My Stanley goes everywhere. Your brand comes with it.",
    images: [STANLEY_OG.url],
  },
};

export default async function BrandMyStanleyPage() {
  const initialSlots: StanleySlot[] = await getStanleySlots();

  return (
    <>
      <Navbar />
      <StanleyExperience initialSlots={initialSlots} />
      <Footer />
    </>
  );
}
