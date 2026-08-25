import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Ensure URL has protocol
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Fetch the HTML
    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'HopUp-Twitter-Card-Validator/1.0 (+https://hopup.lol)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
      // Timeout and caching
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Domain
    const domain = new URL(formattedUrl).hostname.replace(/^www\./, '');

    // Extract Tags
    const getMeta = (name: string, property?: string) => {
      let val = null;
      if (name) val = $(`meta[name="${name}"]`).attr('content');
      if (!val && property) val = $(`meta[property="${property}"]`).attr('content');
      return val || null;
    };

    // Standard Tags
    const title = $('title').text() || null;
    const description = getMeta('description');

    // Open Graph Tags
    const ogTitle = getMeta('', 'og:title');
    const ogDescription = getMeta('', 'og:description');
    const ogImage = getMeta('', 'og:image');
    const ogUrl = getMeta('', 'og:url');

    // Twitter Tags
    const twitterCard = getMeta('twitter:card', 'twitter:card');
    const twitterTitle = getMeta('twitter:title', 'twitter:title');
    const twitterDescription = getMeta('twitter:description', 'twitter:description');
    const twitterImage = getMeta('twitter:image', 'twitter:image');
    const twitterSite = getMeta('twitter:site', 'twitter:site');

    // Computed / Fallback values for the UI
    const finalTitle = twitterTitle || ogTitle || title || '';
    const finalDescription = twitterDescription || ogDescription || description || '';
    const finalImage = twitterImage || ogImage || null;
    const finalCard = twitterCard || (finalImage ? 'summary_large_image' : 'summary');

    return NextResponse.json({
      success: true,
      data: {
        domain,
        url: formattedUrl,
        finalTitle,
        finalDescription,
        finalImage,
        finalCard,
        rawTags: {
          title,
          description,
          ogTitle,
          ogDescription,
          ogImage,
          ogUrl,
          twitterCard,
          twitterTitle,
          twitterDescription,
          twitterImage,
          twitterSite
        }
      }
    });

  } catch (error: any) {
    console.error("Meta parse error:", error);
    return NextResponse.json({ error: error.message || 'Failed to parse URL' }, { status: 500 });
  }
}
