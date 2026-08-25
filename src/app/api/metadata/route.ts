import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let formattedUrl = targetUrl;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HopUpBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get title
    let title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || null;
    
    // Get description
    let description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      null;

    return NextResponse.json({
      title: title || '',
      description: description || ''
    });
  } catch (error) {
    console.error('Error fetching metadata for', formattedUrl, error);
    // Return empty strings on failure so the client can fallback
    return NextResponse.json({ title: '', description: '' });
  }
}
