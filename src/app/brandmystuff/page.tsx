import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandMyStuffHub from "@/components/brand-my-stuff/BrandMyStuffHub";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brand My Stuff — HopUp",
  description: "Ever wondered what your brand would look like on the things I use every day?",
  alternates: { canonical: `${SITE_URL}/brandmystuff` },
  openGraph: {
    title: "Brand My Stuff — HopUp",
    description: "Put your logo on the things I use every day.",
    url: `${SITE_URL}/brandmystuff`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand My Stuff — HopUp",
    description: "Put your logo on the things I use every day.",
  },
};

export default function BrandMyStuffPage() {
  return (
    <>
      <Navbar />
      <BrandMyStuffHub />
      <Footer />
    </>
  );
}
