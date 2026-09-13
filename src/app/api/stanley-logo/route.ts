import { NextResponse } from "next/server";
import { isStoredStanleyLogoUrl } from "@/lib/stanley-logo-server";
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
  if (!isStoredStanleyLogoUrl(raw)) {
    return globe(request);
  }

  try {
    const image = await fetch(raw);
    if (!image.ok) {
      return globe(request);
    }

    return new NextResponse(image.body, {
      headers: logoHitHeaders(image.headers.get("content-type") || "image/png"),
    });
  } catch {
    return globe(request);
  }
}
