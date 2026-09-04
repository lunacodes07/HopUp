import { NextResponse } from "next/server";
import { isSafePublicUrl, resolveLogo } from "@/lib/resolve-logo";

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") || "";
  const host = hostnameOf(raw);
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
