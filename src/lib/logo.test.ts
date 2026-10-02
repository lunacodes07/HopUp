import assert from "node:assert/strict";
import { test } from "node:test";
import { getProductLogoUrl } from "./logo.ts";

test("product logos stay on cached same-origin routes", () => {
  const current = getProductLogoUrl({
    id: "11111111-1111-1111-1111-111111111111",
    url: "https://example.com",
    logo_url: "https://abc.supabase.co/storage/v1/object/public/product-logos/x.png",
  });
  const replaced = getProductLogoUrl({
    id: "11111111-1111-1111-1111-111111111111",
    url: "https://example.com",
    logo_url: "https://example.com/og/logo-512-v2.png",
  });
  assert.match(
    current,
    /^\/api\/logo\?id=11111111-1111-1111-1111-111111111111&url=https%3A%2F%2Fexample\.com&v=[0-9a-z]+$/
  );
  assert.notEqual(current, replaced);
  assert.equal(
    getProductLogoUrl({
      id: "11111111-1111-1111-1111-111111111111",
      url: "https://example.com",
    }),
    "/api/logo?id=11111111-1111-1111-1111-111111111111&url=https%3A%2F%2Fexample.com"
  );
  assert.equal(
    getProductLogoUrl({
      logo_url: "https://abc.supabase.co/storage/v1/object/public/product-logos/x.png",
    }),
    "/api/product-logo?u=https%3A%2F%2Fabc.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fproduct-logos%2Fx.png"
  );
});
