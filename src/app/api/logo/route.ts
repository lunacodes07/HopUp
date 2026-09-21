import { NextResponse } from "next/server";
import {
  getStoredProductLogo,
  isProductId,
  productHasUploadedLogo,
  storeProductLogo,
} from "@/lib/product-logo-server";
import { isSafePublicUrl, resolveLogo } from "@/lib/resolve-logo";
import { logoHitHeaders, logoMissHeaders } from "@/lib/logo-cache-headers";
import { logoRateLimited } from "@/lib/logo-rate-limit";

export const revalidate = 86400;

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

async function persistResolvedLogo(productId: string, image: { body: ArrayBuffer; type: string }) {
  if (!isProductId(productId)) return;
  if (await productHasUploadedLogo(productId)) return;
  const type = image.type === "image/jpeg" || image.type === "image/jpg"
    ? "image/jpeg"
    : image.type === "image/webp"
      ? "image/webp"
      : "image/png";
  const uri = `data:${type};base64,${Buffer.from(image.body).toString("base64")}`;
  await storeProductLogo(productId, uri);
}

export async function GET(request: Request) {
  if (await logoRateLimited(request)) {
    return globe(request);
  }

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

  if (productId) {
    try {
      await persistResolvedLogo(productId, image);
    } catch (error) {
      console.error("Persist resolved logo failed:", error);
    }
  }

  return new NextResponse(new Uint8Array(image.body), {
    headers: logoHitHeaders(image.type),
  });
}
