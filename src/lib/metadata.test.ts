import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchMetadata } from "./metadata.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("a page larger than the read cap still keeps the title in the head", async () => {
  const head =
    '<!doctype html><html><head><meta property="og:title" content="ServerOS · Ship your code">' +
    '<meta property="og:description" content="Install one daemon."></head><body>';
  const html = head + "x".repeat(300_000);
  globalThis.fetch = async () =>
    new Response(html, { status: 200, headers: { "content-type": "text/html" } });

  const meta = await fetchMetadata("https://example.com");
  assert.equal(meta.title, "ServerOS · Ship your code");
  assert.equal(meta.description, "Install one daemon.");
});
