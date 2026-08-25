import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HopUp — Pay to Hop Higher",
  description: "List your product, claim a spot, and hop higher on a public leaderboard built for founders.",
  openGraph: {
    title: "HopUp — Your Product Deserves a Better Spot",
    description: "List it. Hop up. Get noticed.",
    type: "website",
    locale: "en_US",
    url: "https://hopup.lol",
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
