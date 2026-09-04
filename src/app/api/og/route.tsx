import { NextResponse } from "next/server";
import { displayHost } from "@/lib/product-path";
import { shareCardImage } from "@/lib/share-card";

export const revalidate = 60;

function clip(value: string | null, max: number) {
  return (value || "").trim().slice(0, max);
}

function logoForHost(host: string | null) {
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const name = clip(params.get("name"), 80) || "HopUp";
  const rank = Number(params.get("rank"));
  const price = Number(params.get("price"));
  const host = displayHost(clip(params.get("host"), 80) || clip(params.get("url"), 180));
  const kind = params.get("kind") === "sponsored" ? "sponsored" : "hop";

  try {
    return shareCardImage({
      name,
      rank: Number.isFinite(rank) ? rank : 1,
      price: Number.isFinite(price) && price > 0 ? Math.round(price) : 2,
      host,
      logoSrc: logoForHost(host),
      kind,
    });
  } catch (err) {
    console.error("Share card image failed:", err);
    return NextResponse.json({ error: "Failed to render card" }, { status: 500 });
  }
}
