import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks'; // Real verification
import { applyHopPayment } from '@/lib/apply-hop-payment';
import { applySponsoredPayment } from '@/lib/apply-sponsored-payment';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 1. Verify the signature securely on the server
    const wh = new Webhook(webhookSecret);
    const headersObj = Object.fromEntries(request.headers.entries());
    const event = wh.verify(rawBody, headersObj) as any;

    // 2. Handle specific event types
    // We listen for payment.succeeded
    if (event.type === 'payment.succeeded') {
      const paymentData = event.data;

      if (paymentData.metadata?.hopup_kind === 'sponsored') {
        await applySponsoredPayment(paymentData);
        return NextResponse.json({ received: true });
      }

      const url = paymentData.metadata?.hopup_url;
      const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || '0', 10);

      if (!url || !bidAmount) {
        console.error("Missing critical metadata in webhook payload", paymentData.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      console.log(`Processing successful payment for ${url} (Bid: $${bidAmount})`);
      await applyHopPayment(paymentData);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 OK to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
