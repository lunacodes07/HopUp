import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  try {
    const { error } = await supabaseServer.rpc("increment_clicks", {
      p_product_id: productId,
    });

    if (error) {
      console.error("increment_clicks failed:", error);
      return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Click track error:", err);
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
