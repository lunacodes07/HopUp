import assert from "node:assert/strict";
import { test } from "node:test";
import { HOUSE_SPONSOR, isValidSlotNumber, SPONSOR_SLOT_COUNT } from "./sponsored.ts";

test("the complimentary sponsor stays on a real spot and keeps its own referral", () => {
  assert.ok(HOUSE_SPONSOR);
  assert.equal(isValidSlotNumber(HOUSE_SPONSOR.slot), true);
  assert.ok(HOUSE_SPONSOR.slot >= 1 && HOUSE_SPONSOR.slot <= SPONSOR_SLOT_COUNT);
  const link = new URL(HOUSE_SPONSOR.url);
  assert.equal(link.hostname, "mysiren.ai");
  assert.equal(link.pathname, "/ref/ALOHA30");
  assert.equal(link.search, "");
});
