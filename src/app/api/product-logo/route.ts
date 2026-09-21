import { NextResponse } from "next/server";
import { isStoredProductLogoUrl } from "@/lib/product-logo-server";
import { logoCdnHeaders, logoMissHeaders } from "@/lib/logo-cache-headers";

export const revalidate = 86400;

function globe(request: Request) {
  const response = NextResponse.redirect(new URL("/globe.svg", request.url));
  const miss = logoMissHeaders();
  for (const [key, value] of Object.entries(miss)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") || "";
  if (!isStoredProductLogoUrl(raw)) {
    return globe(request);
  }

  const response = NextResponse.redirect(raw, 308);
  const cached = logoCdnHeaders();
  for (const [key, value] of Object.entries(cached)) {
    response.headers.set(key, value);
  }
  return response;
}
