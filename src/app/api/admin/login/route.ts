import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminSecret, adminSessionToken, secretsMatch } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const secret = adminSecret();
  if (!secret) {
    return NextResponse.json({ error: "Admin is not configured." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    if (!secretsMatch(password, secret)) {
      return NextResponse.json({ error: "Wrong password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, await adminSessionToken(secret), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not sign in." }, { status: 400 });
  }
}
