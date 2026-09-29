import assert from "node:assert/strict";
import { test } from "node:test";
import { BOARD_FILTERS, isProductCategory, PRODUCT_CATEGORIES } from "./categories.ts";
import { matchesCategory } from "./week.ts";

test("security can be listed and filtered", () => {
  assert.equal(isProductCategory("Security"), true);
  assert.equal(BOARD_FILTERS.includes("Security"), true);
});

test("each board filter only matches its own category", () => {
  for (const filter of PRODUCT_CATEGORIES) {
    const matched = PRODUCT_CATEGORIES.filter((c) => matchesCategory(c.value, filter.value));
    assert.deepEqual(matched.map((c) => c.value), [filter.value]);
  }
});
