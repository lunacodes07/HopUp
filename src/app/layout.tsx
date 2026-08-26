import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hopup.lol"),
  title: "HopUp — Your Product Deserves a Better Spot",
  description: "List it. Hop up. Get noticed.",
  openGraph: {
    title: "HopUp — Your Product Deserves a Better Spot",
    description: "List it. Hop up. Get noticed.",
    type: "website",
    locale: "en_US",
    url: "https://www.hopup.lol",
    images: [
      {
        url: "https://www.hopup.lol/og.png",
        width: 1200,
        height: 630,
        alt: "HopUp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HopUp — Your Product Deserves a Better Spot",
    description: "List it. Hop up. Get noticed.",
    images: ["https://www.hopup.lol/og.png"],
  },

  icons: {
    icon: "/hoplogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} scroll-smooth`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-accent/30 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}