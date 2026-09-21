const SERVICE_MS = 1600;
const PAGE_MS = 2800;
const LOOKUP_MS = 2500;
const MAX_REDIRECTS = 4;
const MAX_IMAGE_BYTES = 1_200_000;
const MAX_HTML_BYTES = 262_144;
const MEMORY_HIT_MS = 10 * 60 * 1000;
const MEMORY_MISS_MS = 60 * 1000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type LogoImage = { body: ArrayBuffer; type: string };

type MemoryEntry = { expires: number; image: LogoImage | null };

const memory = new Map<string, MemoryEntry>();
const inflight = new Map<string, Promise<LogoImage | null>>();
const MEMORY_MAX = 200;

function remember(key: string, image: LogoImage | null) {
  if (memory.size >= MEMORY_MAX) {
    const now = Date.now();
    for (const [cachedKey, entry] of memory) {
      if (entry.expires <= now) memory.delete(cachedKey);
    }
    if (memory.size >= MEMORY_MAX) {
      const first = memory.keys().next().value;
      if (first) memory.delete(first);
    }
  }
  memory.set(key, {
    expires: Date.now() + (image ? MEMORY_HIT_MS : MEMORY_MISS_MS),
    image: image ? copyImage(image) : null,
  });
}

function parsePublicHttpUrl(raw: string): URL | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
      return null;
    }
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function hostnameOf(raw: string): string | null {
  const parsed = parsePublicHttpUrl(raw);
  return parsed ? parsed.hostname.toLowerCase() : null;
}

function unwrapIpv6(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

function isPrivateIpv4(a: number, b: number): boolean {
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function dottedIpv4(host: string): [number, number, number, number] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((part) => {
    if (!/^\d+$/.test(part)) return NaN;
    return Number(part);
  });
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums as [number, number, number, number];
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "::" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".onion")
  ) {
    return true;
  }

  const host = unwrapIpv6(h);
  if (host.includes(":")) {
    if (host === "::1" || host === "::" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
      return true;
    }
  }
  if (host.startsWith("::ffff:")) {
    return isBlockedHostname(host.slice("::ffff:".length));
  }

  const dotted = dottedIpv4(host);
  if (dotted && isPrivateIpv4(dotted[0], dotted[1])) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;

  if (/^0x[0-9a-f]+$/i.test(host)) return true;
  if (/^\d+$/.test(host)) {
    const n = Number(host);
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) return true;
    return isPrivateIpv4((n >>> 24) & 255, (n >>> 16) & 255);
  }

  return false;
}

export function isSafePublicUrl(raw: string): boolean {
  const u = parsePublicHttpUrl(raw);
  if (!u) return false;
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  return !isBlockedHostname(u.hostname);
}

function sniff(body: ArrayBuffer): "png" | "jpeg" | "gif" | "webp" | "ico" | "svg" | "other" {
  const b = new Uint8Array(body);
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "webp";
  }
  if (b.length >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return "ico";
  const head = new TextDecoder().decode(b.slice(0, 64)).trim().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "svg";
  return "other";
}

function isRaster(kind: ReturnType<typeof sniff>) {
  return kind === "png" || kind === "jpeg" || kind === "gif" || kind === "webp";
}

function typeFor(kind: ReturnType<typeof sniff>, fallback: string) {
  if (kind === "png") return "image/png";
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "gif") return "image/gif";
  if (kind === "webp") return "image/webp";
  if (kind === "ico") return "image/x-icon";
  if (kind === "svg") return "image/svg+xml";
  return fallback.startsWith("image/") ? fallback : "image/png";
}

function copyImage(image: LogoImage): LogoImage {
  return { body: image.body.slice(0), type: image.type };
}

export function logoResolutionKey(raw: string): string | null {
  const host = hostnameOf(raw);
  if (!raw || !host || !isSafePublicUrl(raw)) return null;
  const pageUrl = raw.startsWith("http") ? raw : `https://${raw}`;

  if (host === "x.com" || host === "twitter.com") {
    try {
      const username = new URL(pageUrl).pathname.split("/").filter(Boolean)[0];
      return username ? `x:${username.toLowerCase()}` : `host:${host}`;
    } catch {
      return `host:${host}`;
    }
  }
  if (host === "apps.apple.com" || host === "itunes.apple.com") {
    const id = appleAppId(pageUrl);
    return id ? `ios:${id}` : `host:${host}`;
  }
  return `host:${host}`;
}

export function resetLogoResolutionCache() {
  memory.clear();
  inflight.clear();
}

async function readCapped(res: Response, maxBytes: number): Promise<ArrayBuffer | null> {
  const declared = Number(res.headers.get("content-length") || 0);
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  if (!res.body) {
    const body = await res.arrayBuffer();
    return body.byteLength > maxBytes ? null : body;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }

  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}

async function fetchSafe(
  src: string,
  init: RequestInit,
  opts: { maxBytes: number; timeoutMs: number }
): Promise<Response | null> {
  let url = src;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafePublicUrl(url)) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": BROWSER_UA,
          ...(init.headers || {}),
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        await res.body?.cancel().catch(() => undefined);
        if (!location) return null;
        try {
          url = new URL(location, url).href;
        } catch {
          return null;
        }
        continue;
      }

      return res;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

export async function fetchRemoteImage(src: string): Promise<LogoImage | null> {
  if (!isSafePublicUrl(src)) return null;
  try {
    const res = await fetchSafe(
      src,
      { headers: { Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" } },
      { maxBytes: MAX_IMAGE_BYTES, timeoutMs: SERVICE_MS }
    );
    if (!res?.ok) return null;
    const headerType = res.headers.get("content-type") || "";
    if (headerType.includes("text/html") || headerType.includes("text/plain") || headerType.includes("json")) {
      await res.body?.cancel().catch(() => undefined);
      return null;
    }
    const body = await readCapped(res, MAX_IMAGE_BYTES);
    if (!body || body.byteLength < 32) return null;
    const kind = sniff(body);
    if (kind === "other" && (headerType.includes("text/") || headerType.includes("json"))) return null;
    return { body, type: typeFor(kind, headerType) };
  } catch {
    return null;
  }
}

async function iconsFromPage(pageUrl: string): Promise<string[]> {
  try {
    const res = await fetchSafe(
      pageUrl,
      { headers: { Accept: "text/html,application/xhtml+xml" } },
      { maxBytes: MAX_HTML_BYTES, timeoutMs: PAGE_MS }
    );
    if (!res?.ok) return [];
    const headerType = res.headers.get("content-type") || "";
    if (headerType && !headerType.includes("text/html") && !headerType.includes("application/xhtml")) {
      await res.body?.cancel().catch(() => undefined);
      return [];
    }
    const body = await readCapped(res, MAX_HTML_BYTES);
    if (!body) return [];
    const html = new TextDecoder("utf-8", { fatal: false }).decode(body);
    const { load } = await import("cheerio");
    const $ = load(html);
    const base = res.url || pageUrl;
    const hrefs: string[] = [];
    $(
      'link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"], link[rel~="icon"], link[rel="shortcut icon"]'
    ).each((_, el) => {
      const href = $(el).attr("href");
      if (href && !href.startsWith("data:")) hrefs.push(href.trim());
    });
    hrefs.push("/apple-touch-icon.png", "/favicon.ico");
    return hrefs
      .map((href) => {
        try {
          return new URL(href, base).href;
        } catch {
          return "";
        }
      })
      .filter((href) => href && isSafePublicUrl(href));
  } catch {
    return [];
  }
}

function appleAppId(pageUrl: string): string | null {
  const parsed = parsePublicHttpUrl(pageUrl);
  if (!parsed) return null;
  const match = parsed.pathname.match(/\/id(\d+)/i);
  return match?.[1] ?? null;
}

async function itunesArtwork(id: string): Promise<string | null> {
  try {
    const res = await fetchSafe(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`,
      { headers: { Accept: "application/json" } },
      { maxBytes: 200_000, timeoutMs: LOOKUP_MS }
    );
    if (!res?.ok) return null;
    const body = await readCapped(res, 200_000);
    if (!body) return null;
    const data = JSON.parse(new TextDecoder().decode(body)) as {
      results?: Array<{ artworkUrl512?: string; artworkUrl100?: string }>;
    };
    const art = data.results?.[0]?.artworkUrl512 || data.results?.[0]?.artworkUrl100;
    return typeof art === "string" && isSafePublicUrl(art) ? art : null;
  } catch {
    return null;
  }
}

async function storeArtworkUrls(host: string, pageUrl: string): Promise<string[]> {
  if (host === "apps.apple.com" || host === "itunes.apple.com") {
    const id = appleAppId(pageUrl);
    if (!id) return [];
    const art = await itunesArtwork(id);
    return art ? [art] : [];
  }
  return [];
}

export function serviceCandidates(host: string, pageUrl: string): string[] {
  const out: string[] = [];
  if (host === "x.com" || host === "twitter.com") {
    try {
      const username = new URL(pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`).pathname
        .split("/")
        .filter(Boolean)[0];
      if (username) out.push(`https://unavatar.io/x/${encodeURIComponent(username)}`);
    } catch {
      // ignore malformed twitter urls
    }
  }
  out.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`);
  out.push(
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${encodeURIComponent(host)}&size=128`
  );
  out.push(`https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`);
  out.push(`https://icon.horse/icon/${encodeURIComponent(host)}`);
  return out;
}

async function resolveLogoUncached(raw: string): Promise<LogoImage | null> {
  const host = hostnameOf(raw);
  if (!raw || !host || !isSafePublicUrl(raw)) return null;

  const pageUrl = raw.startsWith("http") ? raw : `https://${raw}`;
  const seen = new Set<string>();
  let fallback: LogoImage | null = null;

  const take = (image: LogoImage | null) => {
    if (!image) return null;
    const kind = sniff(image.body);
    if (isRaster(kind)) return image;
    if (!fallback) fallback = image;
    return null;
  };

  for (const src of await storeArtworkUrls(host, pageUrl)) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const hit = take(await fetchRemoteImage(src));
    if (hit) return hit;
  }

  for (const src of serviceCandidates(host, pageUrl)) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const hit = take(await fetchRemoteImage(src));
    if (hit) return hit;
  }

  for (const src of await iconsFromPage(pageUrl)) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const hit = take(await fetchRemoteImage(src));
    if (hit) return hit;
  }

  return fallback;
}

export async function resolveLogo(raw: string): Promise<LogoImage | null> {
  const key = logoResolutionKey(raw);
  if (!key) return null;

  const now = Date.now();
  const cached = memory.get(key);
  if (cached && cached.expires > now) {
    return cached.image ? copyImage(cached.image) : null;
  }

  const pending = inflight.get(key);
  if (pending) {
    const image = await pending;
    return image ? copyImage(image) : null;
  }

  const work = resolveLogoUncached(raw)
    .then((image) => {
      remember(key, image);
      return image;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, work);
  return work;
}

export async function rasterLogoDataUri(raw?: string | null): Promise<string | null> {
  if (!raw) return null;
  const image = await resolveLogo(raw);
  if (!image) return null;
  const kind = sniff(image.body);
  if (!isRaster(kind)) return null;
  const bytes = Buffer.from(image.body);
  return `data:${typeFor(kind, image.type)};base64,${bytes.toString("base64")}`;
}
