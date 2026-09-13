import { NextResponse } from "next/server";
import { isCurrentProductLogoUrl } from "@/lib/product-logo-server";
import { unpadProductLogoBytes } from "@/lib/unpad-product-logo";
import { logoHitHeaders, logoMissHeaders } from "@/lib/logo-cache-headers";

export const dynamic = "force-dynamic";

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
  if (!(await isCurrentProductLogoUrl(raw))) {
    return globe(request);
  }

  try {
    const image = await fetch(raw);
    if (!image.ok) {
      return globe(request);
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const fixed = unpadProductLogoBytes(bytes);
    const body = new Uint8Array(fixed ?? bytes);

    return new NextResponse(body, {
      headers: logoHitHeaders(fixed ? "image/png" : image.headers.get("content-type") || "image/png"),
    });
  } catch {
    return globe(request);
  }
}
