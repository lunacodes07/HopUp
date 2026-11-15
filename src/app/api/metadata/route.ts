import { NextResponse } from 'next/server';
import { fetchMetadata } from '@/lib/metadata';
import { metadataRateLimited } from '@/lib/metadata-rate-limit';

export const revalidate = 3600;

export async function GET(request: Request) {
  if (await metadataRateLimited(request)) {
    return NextResponse.json(
      { error: 'Too many metadata requests' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const metadata = await fetchMetadata(targetUrl);
  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
