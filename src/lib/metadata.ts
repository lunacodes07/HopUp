import * as cheerio from 'cheerio';

export async function fetchMetadata(targetUrl: string) {
  let formattedUrl = targetUrl;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HopUpBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { title: '', description: '' };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    let description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    return { title, description };
  } catch (error) {
    console.error('Error fetching metadata for', formattedUrl, error);
    return { title: '', description: '' };
  }
}
