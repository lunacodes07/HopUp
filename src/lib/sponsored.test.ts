import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidSlotNumber, SPONSOR_SLOT_COUNT } from "./sponsored.ts";

test("all sponsored slots are valid", () => {
  for (let slot = 1; slot <= SPONSOR_SLOT_COUNT; slot += 1) {
    assert.equal(isValidSlotNumber(slot), true);
  }
});
