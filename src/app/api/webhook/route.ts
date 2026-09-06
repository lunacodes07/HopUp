import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { applyHopPayment } from '@/lib/apply-hop-payment';
import { applySponsoredPayment } from '@/lib/apply-sponsored-payment';
import { applyStanleyPayment } from '@/lib/apply-stanley-payment';
import { recordReferralSale } from '@/lib/creators-server';

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
      const paymentData = event.data;

      // Local/dev never writes hops or sponsored slots — those are live hopup.lol.
      // Stanley is a new table, so test-mode Dodo checkouts can fill a cup spot locally.
      if (process.env.NODE_ENV !== 'production') {
        if (paymentData.metadata?.hopup_kind === 'stanley') {
          await applyStanleyPayment(paymentData);
          await recordReferralSale(paymentData);
          return NextResponse.json({ received: true, env: 'dev' });
        }
        console.warn('Skipping payment write in local dev so hopup.lol stays untouched.');
        return NextResponse.json({ received: true, skipped: 'local_dev' });
      }

      if (paymentData.metadata?.hopup_kind === 'sponsored') {
        await applySponsoredPayment(paymentData);
        await recordReferralSale(paymentData);
        return NextResponse.json({ received: true });
      }

      if (paymentData.metadata?.hopup_kind === 'stanley') {
        await applyStanleyPayment(paymentData);
        await recordReferralSale(paymentData);
        return NextResponse.json({ received: true });
      }

      const url = paymentData.metadata?.hopup_url;
      const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || '0', 10);

      if (!url || !bidAmount) {
        console.error("Missing critical metadata in webhook payload", paymentData.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      await applyHopPayment(paymentData);
      await recordReferralSale(paymentData);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
