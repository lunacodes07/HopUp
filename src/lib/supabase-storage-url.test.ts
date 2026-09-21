import assert from "node:assert/strict";
import { test } from "node:test";
import { isOurSupabaseStorageUrl } from "./supabase-storage-url.ts";

test("stored logo urls must be on our supabase host", () => {
  const prev = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";

  assert.equal(
    isOurSupabaseStorageUrl(
      "https://abc.supabase.co/storage/v1/object/public/product-logos/x.png",
      "product-logos"
    ),
    true
  );
  assert.equal(
    isOurSupabaseStorageUrl("https://evil.com/storage/v1/object/public/product-logos/x.png", "product-logos"),
    false
  );
  assert.equal(
    isOurSupabaseStorageUrl("https://abc.supabase.co/storage/v1/object/public/other/x.png", "product-logos"),
    false
  );

  process.env.NEXT_PUBLIC_SUPABASE_URL = prev;
});
