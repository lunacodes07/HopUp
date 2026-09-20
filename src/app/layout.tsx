import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import SceneBackdrop from "@/components/SceneBackdrop";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hopup.lol"),
  title: "HopUp — Your Product Deserves More Eyes",
  description: "A backlink on every listing. Pay once. Rank higher.",
  openGraph: {
    title: "HopUp — Your Product Deserves More Eyes",
    description: "A backlink on every listing. Pay once. Rank higher.",
    type: "website",
    locale: "en_US",
    url: "https://www.hopup.lol",
    images: [
      {
        url: "https://www.hopup.lol/og.jpg",
        width: 1200,
        height: 630,
        alt: "HopUp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HopUp — Your Product Deserves More Eyes",
    description: "A backlink on every listing. Pay once. Rank higher.",
    images: ["https://www.hopup.lol/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} scroll-smooth`}>
      <body className="relative min-h-screen bg-background text-foreground antialiased selection:bg-accent/30 selection:text-foreground">
        <SceneBackdrop />
        {children}
        <Analytics />
      </body>
    </html>
  );
}