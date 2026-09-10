import { NextResponse } from "next/server";
import { adminMustAuthenticate, isAdminRequest } from "@/lib/admin-auth";
import { isProductId, storeProductLogo } from "@/lib/product-logo-server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  if (adminMustAuthenticate() && !(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId : "";
    const logoDataUrl = typeof body.logoDataUrl === "string" ? body.logoDataUrl : "";

    if (!isProductId(productId)) {
      return NextResponse.json({ error: "Pick a listing first." }, { status: 400 });
    }
    if (!logoDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Upload a PNG, JPG, or WebP." }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("products")
      .select("id")
      .eq("id", productId)
      .limit(1);
    if (error) throw error;
    if (!data?.[0]) {
      return NextResponse.json({ error: "That listing is gone." }, { status: 404 });
    }

    await storeProductLogo(productId, logoDataUrl);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("Admin product logo upload failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
