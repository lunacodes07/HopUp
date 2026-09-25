import assert from "node:assert/strict";
import { test } from "node:test";
import { listingKey } from "./format-url.ts";

test("the same brand matches from a link, a www host, or an @handle", () => {
  assert.equal(listingKey("https://www.Supercurve.com/"), listingKey("supercurve.com"));
  assert.equal(listingKey("https://Meethint.ai"), listingKey("https://MeetHint.ai"));
  assert.equal(listingKey("@HopUp"), listingKey("https://twitter.com/hopup"));
  assert.equal(listingKey("https://x.com/HopUp"), "x:hopup");
  assert.equal(listingKey("supercurve.com"), "web:supercurve.com");
  assert.notEqual(listingKey("supercurve.com"), listingKey("other.com"));
});
