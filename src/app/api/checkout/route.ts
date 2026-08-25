import { NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { supabaseServer } from '@/lib/supabase-server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

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

    const { url, bidAmount, category, nameFallback } = await request.json();

    if (!url || !bidAmount || !category) {
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

    // Convert to cents (Dodo expects lowest denomination)
    const amountInCents = bidAmount * 100;

    // We pass the HopUp product details in metadata 
    // so the webhook knows what to insert/update when the payment succeeds.
    const metadata = {
      hopup_url: url,
      hopup_bid_amount: bidAmount.toString(),
      hopup_category: category,
      hopup_name_fallback: nameFallback || url,
      hopup_product_id: existingProduct?.id || 'new',
    };

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
      // Dynamically get the origin to return the user to the correct environment
      return_url: request.headers.get('origin') ? `${request.headers.get('origin')}?success=true` : 'http://localhost:3000/?success=true',
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
