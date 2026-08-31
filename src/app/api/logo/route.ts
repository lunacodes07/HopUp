import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function hostnameOf(raw: string): string | null {
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isSafePublicUrl(raw: string): boolean {
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

async function fetchImage(src: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  if (!isSafePublicUrl(src)) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(src, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (type.includes("text/html") || type.includes("text/plain") || type.includes("json")) {
      return null;
    }
    const body = await res.arrayBuffer();
    if (body.byteLength < 32) return null;
    return { body, type: type.startsWith("image") || type.includes("icon") ? type : "image/png" };
  } catch {
    return null;
  }
}

async function iconsFromPage(pageUrl: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const base = res.url || pageUrl;
    const hrefs = [
      $('link[rel="apple-touch-icon"]').attr("href"),
      $('link[rel="apple-touch-icon-precomposed"]').attr("href"),
      $('link[rel="icon"][type="image/png"]').attr("href"),
      $('link[rel="icon"][type="image/svg+xml"]').attr("href"),
      $('link[rel="icon"]').attr("href"),
      $('link[rel="shortcut icon"]').attr("href"),
      "/favicon.ico",
    ];
    return hrefs
      .filter((href): href is string => Boolean(href && !href.startsWith("data:")))
      .map((href) => {
        try {
          return new URL(href.trim(), base).href;
        } catch {
          return "";
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") || "";
  const host = hostnameOf(raw);
  if (!raw || !host || !isSafePublicUrl(raw)) {
    return NextResponse.redirect(new URL("/globe.svg", request.url));
  }

  const pageUrl = raw.startsWith("http") ? raw : `https://${raw}`;
  const candidates: string[] = [];

  if (host === "x.com" || host === "twitter.com") {
    const username = new URL(pageUrl).pathname.split("/").filter(Boolean)[0];
    if (username) candidates.push(`https://unavatar.io/x/${username}`);
  }

  candidates.push(...(await iconsFromPage(pageUrl)));
  candidates.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);
  candidates.push(
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=128`
  );
  candidates.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
  candidates.push(`https://icon.horse/icon/${host}`);

  const seen = new Set<string>();
  for (const src of candidates) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const image = await fetchImage(src);
    if (!image) continue;
    return new NextResponse(image.body, {
      headers: {
        "Content-Type": image.type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return NextResponse.redirect(new URL("/globe.svg", request.url));
}
