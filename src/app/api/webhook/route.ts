import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { applyHopPayment } from '@/lib/apply-hop-payment';
import { applySponsoredPayment } from '@/lib/apply-sponsored-payment';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const wh = new Webhook(webhookSecret);
    const headersObj = Object.fromEntries(request.headers.entries());
    const event = wh.verify(rawBody, headersObj) as any;

    if (event.type === 'payment.succeeded') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Skipping payment write in local dev so hopup.lol stays untouched.');
        return NextResponse.json({ received: true, skipped: 'local_dev' });
      }

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

      await applyHopPayment(paymentData);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
