import { NextResponse } from "next/server";
import { confirmLocalStanleyPayment } from "@/lib/confirm-local-stanley-payment";
import { getFormattedUrlInfo } from "@/lib/format-url";
import { isValidStanleySlot } from "@/lib/stanley-slots";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const slot = Number(body.slot);
    const rawUrl = typeof body.url === "string" ? body.url : "";
    if (!rawUrl || !isValidStanleySlot(slot)) {
      return NextResponse.json({ error: "Missing slot or url" }, { status: 400 });
    }

    const { finalUrl } = getFormattedUrlInfo(rawUrl);
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
    const result = await confirmLocalStanleyPayment({
      url: finalUrl,
      slot,
      paymentId: paymentId || undefined,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Confirm failed";
    console.error("Local Stanley confirm failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
