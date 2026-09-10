import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackpackExperience from "@/components/brand-my-stuff/BackpackExperience";
import { SITE_URL } from "@/lib/site";

const OG = {
  url: `${SITE_URL}/brandmybackpack/og.png`,
  width: 1200,
  height: 630,
  alt: "Brand My Backpack — HopUp",
};

export const metadata: Metadata = {
  title: "Brand My Backpack — HopUp",
  description:
    "14 patch spots on Aloha's daily backpack — hero front patch at $100, sides at $40, top at $50, hidden inside panel at $30.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/brandmybackpack` },
  openGraph: {
    title: "Brand My Backpack — HopUp",
    description:
      "14 patch spots on Aloha's daily backpack — hero front patch at $100, sides at $40, top at $50, hidden inside panel at $30.",
    url: `${SITE_URL}/brandmybackpack`,
    type: "website",
    images: [OG],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand My Backpack — HopUp",
    description: "Your brand rides on my back. Campus, flights, cafes.",
    images: [OG.url],
  },
};

export default function BrandMyBackpackPage() {
  return (
    <>
      <Navbar />
      <BackpackExperience />
      <Footer />
    </>
  );
}
