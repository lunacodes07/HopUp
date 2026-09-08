import { NextResponse } from "next/server";
import { backfillMissingStanleyLogos } from "@/lib/backfill-stanley-logos";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
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
