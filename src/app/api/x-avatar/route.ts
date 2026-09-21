import { NextResponse } from "next/server";
import { canonicalTestimonialHandle } from "@/lib/testimonials";
import { logoHitHeaders, logoMissHeaders } from "@/lib/logo-cache-headers";
import { getXAvatarImage } from "@/lib/x-profile-server";

export const revalidate = 86400;

function miss(request: Request) {
  const response = NextResponse.redirect(new URL("/theme/avatar.svg", request.url));
  const headers = logoMissHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function GET(request: Request) {
  const handle = canonicalTestimonialHandle(new URL(request.url).searchParams.get("h") || "");
  if (!handle) return miss(request);

  const image = await getXAvatarImage(handle);
  if (!image) return miss(request);

  return new NextResponse(new Uint8Array(image.body), {
    headers: logoHitHeaders(image.type),
  });
}
