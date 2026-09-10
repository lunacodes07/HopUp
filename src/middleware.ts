import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CREATOR_CLICK_COOKIE,
  CREATOR_CLICK_HOURS,
  CREATOR_COOKIE,
  cookieMaxAge,
  normalizeCreatorSlug,
} from "@/lib/creators";

function cookieOptions(maxAge?: number) {
  return {
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  };
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.HOPUP_ADMIN_SECRET &&
    (path === "/admin/hop/me" || path.startsWith("/admin/hop/me/"))
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fromQuery = normalizeCreatorSlug(
    request.nextUrl.searchParams.get("ref") || request.nextUrl.searchParams.get("via")
  );
  const fromPath = request.nextUrl.pathname.match(/^\/c\/([a-z0-9-]+)(?:\/|$)/i);
  const pathSlug = fromPath?.[1] === "stats" ? null : normalizeCreatorSlug(fromPath?.[1]);
  const slug = fromQuery || pathSlug;

  if (!slug) return NextResponse.next();

  const response = NextResponse.next();
  // Session only — a later visit without the creator link does not pay them.
  response.cookies.set(CREATOR_COOKIE, slug, cookieOptions());

  if (pathSlug && request.cookies.get(CREATOR_CLICK_COOKIE)?.value !== pathSlug) {
    response.cookies.set(
      CREATOR_CLICK_COOKIE,
      pathSlug,
      cookieOptions(cookieMaxAge(CREATOR_CLICK_HOURS / 24))
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
