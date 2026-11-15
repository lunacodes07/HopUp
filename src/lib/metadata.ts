import * as cheerio from "cheerio";
import { getProxiedLogoUrl } from "@/lib/logo";
import { isSafePublicUrl } from "@/lib/resolve-logo";

const MAX_REDIRECTS = 4;
const MAX_HTML_BYTES = 262_144;
const FETCH_TIMEOUT_MS = 8000;

async function readLimitedText(response: Response): Promise<string | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function fetchMetadata(targetUrl: string) {
  let formattedUrl = targetUrl;
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = "https://" + formattedUrl;
  }

  if (!isSafePublicUrl(formattedUrl)) {
    return { title: "", description: "", logo: "/globe.svg" };
  }

  const fallbackLogo = getProxiedLogoUrl(formattedUrl);

  try {
    let response: Response | null = null;
    let currentUrl = formattedUrl;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        response = await fetch(currentUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          redirect: "manual",
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) {
        response = null;
        break;
      }
      const nextUrl = new URL(location, currentUrl).toString();
      if (!isSafePublicUrl(nextUrl)) {
        response = null;
        break;
      }
      currentUrl = nextUrl;
    }

    if (!response || !response.ok) {
      return { title: "", description: "", logo: fallbackLogo };
    }

    const html = await readLimitedText(response);
    if (html === null) {
      return { title: "", description: "", logo: fallbackLogo };
    }
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content")?.trim()
      || $("title").text().trim()
      || "";
    const description =
      $('meta[property="og:description"]').attr("content")
      || $('meta[name="description"]').attr("content")
      || "";

    return { title, description, logo: fallbackLogo };
  } catch (error) {
    console.error("Error fetching metadata for", formattedUrl, error);
    return { title: "", description: "", logo: fallbackLogo };
  }
}
