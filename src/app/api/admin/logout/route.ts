import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { isProductionRuntime } from "@/lib/runtime-env";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime,
    maxAge: 0,
  });
  return response;
}
