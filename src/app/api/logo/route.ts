import { NextResponse } from "next/server";
import { getStoredProductLogo } from "@/lib/product-logo-server";
import { isSafePublicUrl, resolveLogo } from "@/lib/resolve-logo";
import { logoHitHeaders, logoMissHeaders } from "@/lib/logo-cache-headers";

export const dynamic = "force-dynamic";

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function globe(request: Request) {
  const response = NextResponse.redirect(new URL("/globe.svg", request.url));
  const miss = logoMissHeaders();
  for (const [key, value] of Object.entries(miss)) {
    response.headers.set(key, value);
  }
  return response;
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
        headers: logoHitHeaders(stored.type),
      });
    }
  }

  if (!raw || !host || !isSafePublicUrl(raw)) {
    return globe(request);
  }

  const image = await resolveLogo(raw);
  if (!image) {
    return globe(request);
  }

  return new NextResponse(new Uint8Array(image.body), {
    headers: logoHitHeaders(image.type),
  });
}
