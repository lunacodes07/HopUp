import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StanleyExperience from "@/components/brand-my-stuff/StanleyExperience";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brand My Stanley — HopUp",
  description: "See your brand on my Stanley — your brand travels with me. 6 big spots at $30, 6 small at $15.",
  alternates: { canonical: `${SITE_URL}/brandmystanley` },
  openGraph: {
    title: "Brand My Stanley — HopUp",
    description: "See your brand on my Stanley — your brand travels with me. 6 big spots at $30, 6 small at $15.",
    url: `${SITE_URL}/brandmystanley`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand My Stanley — HopUp",
    description: "See your brand on my Stanley — your brand travels with me.",
  },
};

export default function BrandMyStanleyPage() {
  return (
    <>
      <Navbar />
      <StanleyExperience />
      <Footer />
    </>
  );
}
