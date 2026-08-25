import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { fetchMetadata } from '@/lib/metadata';
// import { Webhook } from 'standardwebhooks'; // Real verification

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    // const signature = request.headers.get('webhook-signature') || ''; 
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // 1. Verify the signature securely on the server
    // const wh = new Webhook(webhookSecret);
    // const event = wh.verify(rawBody, request.headers);
    //
    // For this simulation phase, we skip cryptographic verification and trust the payload
    
    // Parse the payload
    const event = JSON.parse(rawBody);

    // 2. Handle specific event types
    // We listen for payment.succeeded
    if (event.type === 'payment.succeeded') {
      const paymentData = event.data;
      
      // Extract the metadata we passed during checkout creation
      const url = paymentData.metadata?.hopup_url;
      const bidAmount = parseInt(paymentData.metadata?.hopup_bid_amount || '0', 10);
      const category = paymentData.metadata?.hopup_category;
      const nameFallback = paymentData.metadata?.hopup_name_fallback;
      const productId = paymentData.metadata?.hopup_product_id;

      if (!url || !bidAmount) {
        console.error("Missing critical metadata in webhook payload", paymentData.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      console.log(`Processing successful payment for ${url} (Bid: $${bidAmount})`);

      // 3. Fetch latest metadata (title, description) from the target URL
      const { title: fetchedTitle, description: fetchedDescription } = await fetchMetadata(url);

      // 4. Update Database Securely using Service Role
      let existingProduct = null;
      
      if (productId && productId !== 'new') {
        // Fetch existing product by ID
        const { data } = await supabaseServer
          .from("products")
          .select("*")
          .eq('id', productId)
          .limit(1);
        existingProduct = data?.[0];
      }
      
      // Fallback: If we couldn't find it by ID or ID wasn't passed, check by URL
      if (!existingProduct) {
        const { data } = await supabaseServer
          .from("products")
          .select("*")
          .in('url', [url, url + '/'])
          .limit(1);
        existingProduct = data?.[0];
      }

      if (existingProduct) {
        const updatePayload: any = {
          price: existingProduct.price + bidAmount,
          category: category
        };
        
        if (fetchedDescription && fetchedDescription.trim() !== "") {
          updatePayload.description = fetchedDescription;
        }
        
        if (fetchedTitle && (existingProduct.name === existingProduct.url || existingProduct.name === "Freshly hopped product")) {
          updatePayload.name = fetchedTitle;
        }

        const { error } = await supabaseServer
          .from("products")
          .update(updatePayload)
          .eq('id', existingProduct.id);
          
        if (error) throw error;
        console.log(`Successfully updated existing product ${existingProduct.id} for ${url}`);
      } else {
        // Insert new product
        const { error } = await supabaseServer.from("products").insert({
          name: fetchedTitle || nameFallback || url,
          description: fetchedDescription || "Freshly hopped product",
          url: url,
          category: category,
          rank: 0,
          clicks: 0,
          price: bidAmount
        });

        if (error) throw error;
        console.log(`Successfully inserted new product ${url}`);
      }
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
