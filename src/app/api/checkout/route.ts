import { NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { supabaseServer } from '@/lib/supabase-server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { cookies } from 'next/headers';
import { minBidForUrl } from '@/lib/bid';
import { DEFAULT_CATEGORY, isProductCategory } from '@/lib/categories';
import { CREATOR_COOKIE } from '@/lib/creators';
import { getCreatorBySlug } from '@/lib/creators-server';
import { getSponsorPlan, isValidSlotNumber } from '@/lib/sponsored';
import { isSlotAvailable } from '@/lib/sponsored-server';
import { isValidStanleySlot, stanleySlotPrice } from '@/lib/stanley-slots';
import { isStanleySlotAvailable } from '@/lib/stanley-slots-server';
import { getFormattedUrlInfo } from '@/lib/format-url';

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

    const refSlug = (await cookies()).get(CREATOR_COOKIE)?.value;
    const creator = await getCreatorBySlug(refSlug);

    let amountInCents = 0;
    let metadata: Record<string, string>;
    let returnHop = typeof url === 'string' ? url : '';

    if (kind === 'stanley') {
      if (typeof url !== 'string' || !url.trim()) {
        return NextResponse.json({ error: 'Add your link first' }, { status: 400 });
      }
      if (!isValidStanleySlot(slotNumber)) {
        return NextResponse.json({ error: 'Invalid Stanley spot' }, { status: 400 });
      }

      const { finalUrl, nameFallback: fromUrl } = getFormattedUrlInfo(url);
      const price = stanleySlotPrice(slotNumber);

      try {
        const open = await isStanleySlotAvailable(slotNumber);
        if (!open) {
          return NextResponse.json({ error: 'That spot is already taken. Pick another.' }, { status: 409 });
        }
      } catch (err: any) {
        console.error('Stanley slot availability check failed:', err);
        return NextResponse.json({ error: 'Stanley spots are not available yet' }, { status: 503 });
      }

      amountInCents = price * 100;
      returnHop = finalUrl;
      metadata = {
        hopup_kind: 'stanley',
        hopup_url: finalUrl,
        hopup_bid_amount: price.toString(),
        hopup_category: DEFAULT_CATEGORY,
        hopup_name_fallback: nameFallback || fromUrl || finalUrl,
        hopup_slot: String(slotNumber),
        ...(creator ? { hopup_ref: creator.slug } : {}),
      };
    } else if (kind === 'sponsored') {
      if (!url || !category) {
        return NextResponse.json({ error: 'Missing url or category' }, { status: 400 });
      }

      if (!isProductCategory(category)) {
        return NextResponse.json({ error: 'Choose a valid category' }, { status: 400 });
      }
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
        ...(creator ? { hopup_ref: creator.slug } : {}),
      };
    } else {
      if (!url || !category) {
        return NextResponse.json({ error: 'Missing url or category' }, { status: 400 });
      }

      if (!isProductCategory(category)) {
        return NextResponse.json({ error: 'Choose a valid category' }, { status: 400 });
      }
      if (!bidAmount) {
        return NextResponse.json({ error: 'Missing url, bidAmount, or category' }, { status: 400 });
      }

      const minBid = minBidForUrl(url);
      const amount = Math.round(Number(bidAmount));
      if (!Number.isFinite(amount) || amount < minBid) {
        return NextResponse.json(
          { error: `Bid amount must be at least $${minBid}` },
          { status: 400 }
        );
      }

      const { data: existingData } = await supabaseServer
        .from("products")
        .select("*")
        .in('url', [url, url + '/'])
        .limit(1);

      const existingProduct = existingData && existingData.length > 0 ? existingData[0] : null;

      amountInCents = amount * 100;
      metadata = {
        hopup_url: url,
        hopup_bid_amount: amount.toString(),
        hopup_category: category,
        hopup_name_fallback: nameFallback || url,
        hopup_product_id: existingProduct?.id || 'new',
        ...(creator ? { hopup_ref: creator.slug } : {}),
      };
    }

    const checkout = await dodo.checkoutSessions.create({
      billing_currency: 'USD',
      product_cart: [
        {
          product_id: process.env.DODO_DYNAMIC_PRODUCT_ID || "pdt_dummy_123",
          quantity: 1,
          amount: amountInCents,
        }
      ],
      metadata: metadata,
      return_url: (() => {
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const next = new URL(origin);
        next.searchParams.set('success', '1');
        next.searchParams.set('hop', returnHop);
        if (kind === 'sponsored') next.searchParams.set('kind', 'sponsored');
        if (kind === 'stanley') {
          next.pathname = '/brandmystanley';
          next.searchParams.set('kind', 'stanley');
          next.searchParams.set('slot', String(slotNumber));
        }
        if (kind !== 'sponsored' && kind !== 'stanley' && bidAmount) next.searchParams.set('bid', String(bidAmount));
        return next.toString();
      })(),
    });

    const checkoutUrl = (checkout as { checkout_url?: string; url?: string }).checkout_url || (checkout as { url?: string }).url;

    return NextResponse.json({ url: checkoutUrl });

  } catch (error: any) {
    console.error("Checkout creation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout" }, { status: 500 });
  }
}
