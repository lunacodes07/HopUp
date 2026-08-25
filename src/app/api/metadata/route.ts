import { NextResponse } from 'next/server';
import { fetchMetadata } from '@/lib/metadata';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const metadata = await fetchMetadata(targetUrl);
  return NextResponse.json(metadata);
}
