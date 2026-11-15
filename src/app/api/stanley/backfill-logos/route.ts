import { NextResponse } from "next/server";
import { backfillMissingStanleyLogos } from "@/lib/backfill-stanley-logos";
import { isProductionRuntime } from "@/lib/runtime-env";

export async function POST() {
  if (isProductionRuntime) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const result = await backfillMissingStanleyLogos();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Backfill failed";
    console.error("Stanley logo backfill failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
