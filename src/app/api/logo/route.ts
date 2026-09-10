import { NextResponse } from "next/server";
import { getStoredProductLogo } from "@/lib/product-logo-server";
import { isSafePublicUrl, resolveLogo } from "@/lib/resolve-logo";

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw = params.get("url") || "";
  const productId = params.get("id") || "";
  const host = hostnameOf(raw);

  if (productId) {
    const stored = await getStoredProductLogo(productId);
    if (stored) {
      return new NextResponse(stored.body, {
        headers: {
          "Content-Type": stored.type,
          "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        },
      });
    }
  }

  if (!raw || !host || !isSafePublicUrl(raw)) {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }

  const image = await resolveLogo(raw);
  if (!image) {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
