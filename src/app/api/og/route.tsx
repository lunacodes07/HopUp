import { NextResponse } from "next/server";
import { displayHost } from "@/lib/product-path";
import { shareCardImage } from "@/lib/share-card";

export const revalidate = 60;

function clip(value: string | null, max: number) {
  return (value || "").trim().slice(0, max);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const name = clip(params.get("name"), 80) || "HopUp";
  const rank = Number(params.get("rank"));
  const price = Number(params.get("price"));
  const pageUrl = clip(params.get("url"), 180);
  const host = displayHost(clip(params.get("host"), 80) || pageUrl);
  const kind = params.get("kind") === "sponsored" ? "sponsored" : "hop";

  try {
    return shareCardImage({
      name,
      rank: Number.isFinite(rank) ? rank : 1,
      price: Number.isFinite(price) && price > 0 ? Math.round(price) : 2,
      host,
      pageUrl: pageUrl || (host ? `https://${host}` : null),
      kind,
    });
  } catch (err) {
    console.error("Share card image failed:", err);
    return NextResponse.json({ error: "Failed to render card" }, { status: 500 });
  }
}
