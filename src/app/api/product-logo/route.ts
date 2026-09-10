import { NextResponse } from "next/server";
import { isStoredProductLogoUrl } from "@/lib/product-logo-server";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") || "";
  if (!isStoredProductLogoUrl(raw)) {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }

  try {
    const image = await fetch(raw);
    if (!image.ok) {
      return NextResponse.redirect(new URL("/globe.svg", request.url));
    }

    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }
}
