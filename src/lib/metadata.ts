import * as cheerio from "cheerio";
import { getProxiedLogoUrl } from "@/lib/logo";

export async function fetchMetadata(targetUrl: string) {
  let formattedUrl = targetUrl;
  if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
    formattedUrl = "https://" + formattedUrl;
  }

  const fallbackLogo = getProxiedLogoUrl(formattedUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { title: "", description: "", logo: fallbackLogo };
    }

    const html = await response.text();
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
