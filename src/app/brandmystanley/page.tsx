import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StanleyExperience from "@/components/brand-my-stuff/StanleyExperience";
import { getStanleySlots } from "@/lib/stanley-slots-server";
import type { StanleySlot } from "@/lib/stanley-slots";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Brand My Stanley — HopUp",
  description: "See your brand on my Stanley — your brand travels with me. 6 big spots at $35, 6 small at $20.",
  alternates: { canonical: `${SITE_URL}/brandmystanley` },
  openGraph: {
    title: "Brand My Stanley — HopUp",
    description: "See your brand on my Stanley — your brand travels with me. 6 big spots at $35, 6 small at $20.",
    url: `${SITE_URL}/brandmystanley`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand My Stanley — HopUp",
    description: "See your brand on my Stanley — your brand travels with me.",
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
