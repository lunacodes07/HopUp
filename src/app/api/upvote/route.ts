import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { parseVotedIds, serializeVotedIds, UPVOTE_COOKIE } from "@/lib/upvotes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function votedCookie(ids: string[]) {
  return {
    name: UPVOTE_COOKIE,
    value: serializeVotedIds(ids),
    options: {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    },
  };
}

export async function POST(request: Request) {
  let productId: unknown;
  try {
    ({ productId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  if (typeof productId !== "string" || !UUID.test(productId)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const store = await cookies();
  const voted = parseVotedIds(store.get(UPVOTE_COOKIE)?.value);

  if (voted.includes(productId)) {
    const { data } = await supabaseServer
      .from("products")
      .select("upvotes")
      .eq("id", productId)
      .maybeSingle();
    const response = NextResponse.json({
      ok: true,
      already: true,
      upvotes: typeof data?.upvotes === "number" ? data.upvotes : 0,
    });
    const cookie = votedCookie(voted);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  }

  try {
    const { data, error } = await supabaseServer.rpc("increment_upvotes", {
      p_product_id: productId,
    });

    if (error) {
      console.error("increment_upvotes failed:", error);
      return NextResponse.json({ error: "Could not upvote" }, { status: 500 });
    }

    const nextVoted = [...voted, productId];
    const response = NextResponse.json({
      ok: true,
      upvotes: typeof data === "number" ? data : 1,
    });
    const cookie = votedCookie(nextVoted);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (err) {
    console.error("Upvote error:", err);
    return NextResponse.json({ error: "Could not upvote" }, { status: 500 });
  }
}
