import { NextResponse } from "next/server";
import { adminMustAuthenticate, isAdminRequest } from "@/lib/admin-auth";
import { backfillPaddedProductLogos } from "@/lib/unpad-product-logo";

export async function POST(request: Request) {
  if (adminMustAuthenticate() && !(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const result = await backfillPaddedProductLogos();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Crop failed";
    console.error("Padded product logo crop failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
