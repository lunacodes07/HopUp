import { NextResponse } from "next/server";
import { isCurrentProductLogoUrl } from "@/lib/product-logo-server";
import { unpadProductLogoBytes } from "@/lib/unpad-product-logo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") || "";
  if (!(await isCurrentProductLogoUrl(raw))) {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }

  try {
    const image = await fetch(raw);
    if (!image.ok) {
      return NextResponse.redirect(new URL("/globe.svg", request.url));
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const fixed = unpadProductLogoBytes(bytes);
    const body = fixed ?? bytes;

    return new NextResponse(body, {
      headers: {
        "Content-Type": fixed ? "image/png" : image.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=60, must-revalidate",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }
}
