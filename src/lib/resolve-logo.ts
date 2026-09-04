import * as cheerio from "cheerio";

const FETCH_MS = 4500;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export type LogoImage = { body: ArrayBuffer; type: string };

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isSafePublicUrl(raw: string): boolean {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "0.0.0.0" || h.endsWith(".local") || h.endsWith(".internal")) {
      return false;
    }
    if (
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(h) ||
      /^169\.254\./.test(h)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
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

async function fetchImage(src: string): Promise<LogoImage | null> {
  if (!isSafePublicUrl(src)) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_MS);
    const res = await fetch(src, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const headerType = res.headers.get("content-type") || "";
    if (headerType.includes("text/html") || headerType.includes("text/plain") || headerType.includes("json")) {
      return null;
    }
    const body = await res.arrayBuffer();
    if (body.byteLength < 32) return null;
    const kind = sniff(body);
    if (kind === "other" && (headerType.includes("text/") || headerType.includes("json"))) return null;
    return { body, type: typeFor(kind, headerType) };
  } catch {
    return null;
  }
}

async function iconsFromPage(pageUrl: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_MS);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const base = res.url || pageUrl;
    const hrefs: string[] = [];
    $('link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"], link[rel~="icon"], link[rel="shortcut icon"]').each(
      (_, el) => {
        const href = $(el).attr("href");
        if (href && !href.startsWith("data:")) hrefs.push(href.trim());
      }
    );
    hrefs.push("/apple-touch-icon.png", "/favicon.ico");
    return hrefs
      .map((href) => {
        try {
          return new URL(href, base).href;
        } catch {
          return "";
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function serviceCandidates(host: string, pageUrl: string): string[] {
  const out: string[] = [];
  if (host === "x.com" || host === "twitter.com") {
    const username = new URL(pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`).pathname
      .split("/")
      .filter(Boolean)[0];
    if (username) out.push(`https://unavatar.io/x/${username}`);
  }
  out.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);
  out.push(
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=128`
  );
  out.push(`https://icon.horse/icon/${host}`);
  out.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
  return out;
}

export async function resolveLogo(raw: string): Promise<LogoImage | null> {
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

  const services = serviceCandidates(host, pageUrl).filter((src) => {
    if (!src || seen.has(src)) return false;
    seen.add(src);
    return true;
  });

  const [pageIcons, ...serviceImages] = await Promise.all([
    iconsFromPage(pageUrl),
    ...services.map((src) => fetchImage(src)),
  ]);

  for (const image of serviceImages) {
    const hit = take(image);
    if (hit) return hit;
  }

  for (const src of pageIcons) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const hit = take(await fetchImage(src));
    if (hit) return hit;
  }

  return fallback;
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
