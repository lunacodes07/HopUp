import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIp } from "./client-ip.ts";
import { voterHash } from "./voter-hash.ts";

test("client ip prefers vercel, then first forwarded hop", () => {
  assert.equal(
    clientIp(
      new Request("https://hopup.lol/api/upvote", {
        headers: {
          "x-forwarded-for": "1.1.1.1, 2.2.2.2",
          "x-vercel-forwarded-for": "8.8.8.8",
        },
      })
    ),
    "8.8.8.8"
  );
  assert.equal(
    clientIp(
      new Request("https://hopup.lol/api/upvote", {
        headers: { "x-forwarded-for": " 9.9.9.9, 10.0.0.1" },
      })
    ),
    "9.9.9.9"
  );
});

test("voter hashes stay stable and do not include the raw ip", () => {
  const hash = voterHash("8.8.8.8");
  assert.equal(hash, voterHash("8.8.8.8"));
  assert.notEqual(hash, "8.8.8.8");
  assert.equal(hash.length, 64);
  assert.notEqual(voterHash("8.8.8.8"), voterHash("1.1.1.1"));
});
