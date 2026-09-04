import { NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { supabaseServer } from '@/lib/supabase-server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { getSponsorPlan, isValidSlotNumber } from '@/lib/sponsored';
import { isSlotAvailable } from '@/lib/sponsored-server';

// Safely initialize Upstash Ratelimit only if the environment variables exist
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? Redis.fromEnv() 
  : null;

const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // Allow 5 checkouts per minute per IP
}) : null;

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    if (ratelimit) {
      // Get the user's IP (works on Vercel)
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await ratelimit.limit(`ratelimit_${ip}`);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Too many checkout requests. Please try again in a minute.' }, 
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { url, bidAmount, category, nameFallback, kind, slotNumber, weeks } = body;

    if (!url || !category) {
      return NextResponse.json({ error: 'Missing url or category' }, { status: 400 });
    }

    let amountInCents = 0;
    let metadata: Record<string, string>;

    if (kind === 'sponsored') {
      const plan = getSponsorPlan(weeks);
      if (!plan) {
        return NextResponse.json({ error: 'Choose 1, 2, or 4 weeks' }, { status: 400 });
      }
      if (!isValidSlotNumber(slotNumber)) {
        return NextResponse.json({ error: 'Invalid sponsored slot' }, { status: 400 });
      }

      try {
        const open = await isSlotAvailable(slotNumber);
        if (!open) {
          return NextResponse.json({ error: 'That spot was just taken. Try another.' }, { status: 409 });
        }
      } catch (err: any) {
        console.error('Sponsored slot availability check failed:', err);
        return NextResponse.json({ error: 'Sponsored slots are not available yet' }, { status: 503 });
      }

      amountInCents = plan.price * 100;
      metadata = {
        hopup_kind: 'sponsored',
        hopup_url: url,
        hopup_bid_amount: plan.price.toString(),
        hopup_category: category,
        hopup_name_fallback: nameFallback || url,
        hopup_slot: String(slotNumber),
        hopup_weeks: String(plan.weeks),
      };
    } else {
      if (!bidAmount) {
        return NextResponse.json({ error: 'Missing url, bidAmount, or category' }, { status: 400 });
      }

      // Server-side validation: Ensure the bid is valid for the product (if it exists)
      // To prevent race conditions and hacking, we should ensure the user's bid isn't blindly accepted.
      // However, in a "Pay What You Want" model or cumulative bid model, any bid > 0 is usually fine 
      // to add to the existing total, but let's just make sure it's at least 1.
      if (bidAmount < 1) {
        return NextResponse.json({ error: 'Bid amount must be at least $1' }, { status: 400 });
      }

      const { data: existingData } = await supabaseServer
        .from("products")
        .select("*")
        .in('url', [url, url + '/'])
        .limit(1);

      const existingProduct = existingData && existingData.length > 0 ? existingData[0] : null;

      amountInCents = bidAmount * 100;
      metadata = {
        hopup_url: url,
        hopup_bid_amount: bidAmount.toString(),
        hopup_category: category,
        hopup_name_fallback: nameFallback || url,
        hopup_product_id: existingProduct?.id || 'new',
      };
    }

    // Create Dodo Checkout Session
    const checkout = await dodo.checkoutSessions.create({
      billing_currency: 'USD',
      product_cart: [
        {
          product_id: process.env.DODO_DYNAMIC_PRODUCT_ID || "pdt_dummy_123",
          quantity: 1,
          amount: amountInCents, // Overrides amount for pay-what-you-want products
        }
      ],
      metadata: metadata,
      return_url: (() => {
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const next = new URL(origin);
        next.searchParams.set('success', '1');
        next.searchParams.set('hop', url);
        if (kind === 'sponsored') next.searchParams.set('kind', 'sponsored');
        if (kind !== 'sponsored' && bidAmount) next.searchParams.set('bid', String(bidAmount));
        return next.toString();
      })(),
    });

    // Return the secure checkout link to the client
    // @ts-ignore - Some API versions return checkout_url, some return url. We'll use checkout_url per convention.
    const checkoutUrl = (checkout as any).checkout_url || (checkout as any).url;

    return NextResponse.json({ url: checkoutUrl });

  } catch (error: any) {
    console.error("Checkout creation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout" }, { status: 500 });
  }
}
