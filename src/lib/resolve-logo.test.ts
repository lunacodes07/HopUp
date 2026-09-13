import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import {
  isSafePublicUrl,
  logoResolutionKey,
  resetLogoResolutionCache,
  resolveLogo,
  serviceCandidates,
} from "./resolve-logo.ts";

afterEach(() => {
  resetLogoResolutionCache();
  mock.restoreAll();
});

function pngBody() {
  const bytes = new Uint8Array(64);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes.buffer;
}

function jpegBody() {
  const bytes = new Uint8Array(64);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes.buffer;
}

function jsonBody(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).buffer;
}

function okImage(type = "image/png", body: ArrayBuffer = pngBody()) {
  return new Response(body, { status: 200, headers: { "content-type": type } });
}

test("isSafePublicUrl blocks private and local targets", () => {
  assert.equal(isSafePublicUrl("https://example.com/logo.png"), true);
  assert.equal(isSafePublicUrl("https://facebook.com"), true);
  assert.equal(isSafePublicUrl("https://fda.gov"), true);
  assert.equal(isSafePublicUrl("https://localhost/logo"), false);
  assert.equal(isSafePublicUrl("http://127.0.0.1/logo"), false);
  assert.equal(isSafePublicUrl("http://10.0.0.4/x"), false);
  assert.equal(isSafePublicUrl("http://192.168.1.9/x"), false);
  assert.equal(isSafePublicUrl("http://172.16.0.2/x"), false);
  assert.equal(isSafePublicUrl("http://169.254.169.254/latest"), false);
  assert.equal(isSafePublicUrl("http://[::1]/logo"), false);
  assert.equal(isSafePublicUrl("http://2130706433/"), false);
  assert.equal(isSafePublicUrl("ftp://example.com"), false);
  assert.equal(isSafePublicUrl("https://user:pass@example.com"), false);
});

test("serviceCandidates keep X first and Google as the primary generic provider", () => {
  const twitter = serviceCandidates("x.com", "https://x.com/hopup");
  assert.match(twitter[0], /unavatar\.io\/x\/hopup/);
  assert.match(twitter[1], /google\.com\/s2\/favicons/);

  const generic = serviceCandidates("example.com", "https://example.com");
  assert.match(generic[0], /google\.com\/s2\/favicons/);
  assert.match(generic[1], /t0\.gstatic\.com/);
  assert.match(generic[2], /icons\.duckduckgo\.com/);
  assert.match(generic[3], /icon\.horse/);
});

test("logoResolutionKey is host-based except X and App Store", () => {
  assert.equal(logoResolutionKey("https://example.com/a"), "host:example.com");
  assert.equal(logoResolutionKey("https://example.com/b?x=1"), "host:example.com");
  assert.equal(logoResolutionKey("https://x.com/HopUp"), "x:hopup");
  assert.equal(logoResolutionKey("https://apps.apple.com/us/app/id12345"), "ios:12345");
  assert.equal(logoResolutionKey("http://127.0.0.1"), null);
});

test("resolveLogo stops after the first valid Google raster", async () => {
  const requested: string[] = [];
  mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const href = String(input);
    requested.push(href);
    if (href.includes("google.com/s2/favicons")) return okImage();
    throw new Error(`unexpected fetch ${href}`);
  });

  const image = await resolveLogo("https://brand.example");
  assert.ok(image);
  assert.equal(image?.type, "image/png");
  assert.equal(requested.length, 1);
  assert.match(requested[0], /google\.com\/s2\/favicons/);
  assert.equal(
    requested.some((href) => href.includes("gstatic") || href.includes("duckduckgo") || href.includes("icon.horse")),
    false
  );
});

test("resolveLogo falls back when the primary provider fails", async () => {
  const requested: string[] = [];
  mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const href = String(input);
    requested.push(href);
    if (href.includes("google.com/s2/favicons")) return new Response(null, { status: 404 });
    if (href.includes("t0.gstatic.com")) return okImage("image/jpeg", jpegBody());
    throw new Error(`unexpected fetch ${href}`);
  });

  const image = await resolveLogo("https://fallback.example");
  assert.ok(image);
  assert.equal(image?.type, "image/jpeg");
  assert.equal(requested.length, 2);
  assert.match(requested[0], /google\.com\/s2\/favicons/);
  assert.match(requested[1], /t0\.gstatic\.com/);
});

test("resolveLogo uses App Store artwork and skips generic favicon providers", async () => {
  const requested: string[] = [];
  mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const href = String(input);
    requested.push(href);
    if (href.startsWith("https://itunes.apple.com/lookup")) {
      return new Response(jsonBody({ results: [{ artworkUrl512: "https://is1-ssl.mzstatic.com/image/thumb/app.png" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (href.includes("mzstatic.com")) return okImage();
    throw new Error(`unexpected fetch ${href}`);
  });

  const image = await resolveLogo("https://apps.apple.com/us/app/test/id555");
  assert.ok(image);
  assert.equal(requested[0].startsWith("https://itunes.apple.com/lookup"), true);
  assert.match(requested[1], /mzstatic\.com/);
  assert.equal(requested.some((href) => href.includes("google.com")), false);
});

test("resolveLogo uses unavatar for X profiles before Google", async () => {
  const requested: string[] = [];
  mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const href = String(input);
    requested.push(href);
    if (href.includes("unavatar.io/x/hopup")) return okImage();
    throw new Error(`unexpected fetch ${href}`);
  });

  const image = await resolveLogo("https://x.com/hopup");
  assert.ok(image);
  assert.equal(requested.length, 1);
  assert.match(requested[0], /unavatar\.io\/x\/hopup/);
});

test("resolveLogo refuses redirects onto private hosts", async () => {
  const requested: string[] = [];
  mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const href = String(input);
    requested.push(href);
    if (href.includes("google.com/s2/favicons")) {
      return new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/secret.png" },
      });
    }
    if (href.includes("t0.gstatic.com")) return okImage("image/jpeg", jpegBody());
    return new Response(null, { status: 404 });
  });

  const image = await resolveLogo("https://redirect.example");
  assert.ok(image);
  assert.equal(requested.some((href) => href.includes("127.0.0.1")), false);
});

test("resolveLogo reuses the in-memory cache for the same host", async () => {
  let googleHits = 0;
  mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const href = String(input);
    if (href.includes("google.com/s2/favicons")) {
      googleHits += 1;
      return okImage();
    }
    throw new Error(`unexpected fetch ${href}`);
  });

  await resolveLogo("https://cached.example/one");
  await resolveLogo("https://cached.example/two");
  assert.equal(googleHits, 1);
});
