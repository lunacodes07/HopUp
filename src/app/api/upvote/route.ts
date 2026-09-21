import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { parseVotedIds, serializeVotedIds, UPVOTE_COOKIE } from "@/lib/upvotes";
import {
  claimUpvote,
  releaseUpvote,
  upvoteRateLimited,
  voterHashFromRequest,
} from "@/lib/upvote-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

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

async function currentUpvotes(productId: string) {
  const { data } = await supabaseServer
    .from("products")
    .select("upvotes")
    .eq("id", productId)
    .maybeSingle();
  return typeof data?.upvotes === "number" ? data.upvotes : 0;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function already(upvotes: number, voted: string[]) {
  const response = NextResponse.json({ ok: true, already: true, upvotes });
  const cookie = votedCookie(voted);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

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
  const hash = voterHashFromRequest(request);

  if (voted.includes(productId)) {
    return already(await currentUpvotes(productId), voted);
  }

  if (await upvoteRateLimited(hash)) {
    return NextResponse.json(
      { error: "Too many votes. Try again tomorrow." },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  const claim = await claimUpvote(hash, productId);
  if (claim === "duplicate") {
    return already(await currentUpvotes(productId), [...voted, productId]);
  }
  if (claim === "unavailable" && process.env.NODE_ENV === "production") {
    console.error("Upvote Redis guard unavailable; falling back to cookie + SQL.");
  }

  try {
    const claimed = await supabaseServer.rpc("claim_upvote", {
      p_product_id: productId,
      p_voter_hash: hash,
    });

    if (!claimed.error) {
      const nextCount = typeof claimed.data === "number" ? claimed.data : 0;
      if (nextCount <= 0) {
        return already(await currentUpvotes(productId), [...voted, productId]);
      }
      const nextVoted = [...voted, productId];
      const response = NextResponse.json({ ok: true, upvotes: nextCount });
      const cookie = votedCookie(nextVoted);
      response.cookies.set(cookie.name, cookie.value, cookie.options);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    const missingRpc = /does not exist|42883|PGRST202/i.test(claimed.error.message || "");
    if (!missingRpc) {
      if (claim === "claimed") await releaseUpvote(hash, productId);
      console.error("claim_upvote failed:", claimed.error);
      return NextResponse.json({ error: "Could not upvote" }, { status: 500 });
    }

    const { data, error } = await supabaseServer.rpc("increment_upvotes", {
      p_product_id: productId,
    });

    if (error) {
      if (claim === "claimed") await releaseUpvote(hash, productId);
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
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    if (claim === "claimed") await releaseUpvote(hash, productId);
    console.error("Upvote error:", err);
    return NextResponse.json({ error: "Could not upvote" }, { status: 500 });
  }
}
