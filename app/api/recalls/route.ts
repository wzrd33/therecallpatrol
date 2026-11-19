import { NextResponse } from 'next/server';
import { fetchRecalls } from '@/lib/cpsc';

// Always runs on request; caching is done at Vercel's CDN via the headers below.
export const dynamic = 'force-dynamic';
// A cold CPSC query can take close to a minute; give the function room to wait for it.
export const maxDuration = 60;

// Both Vercel's CDN and the visitor's browser keep a copy for 5 minutes, then use the old
// copy while a fresh one loads in the background (for up to a day). Visitors never wait on
// the agency APIs, and a repeat visit or a second page doesn't download the list again.
// Vercel strips s-maxage from Cache-Control, so the CDN gets its own header.
const CACHE = 'public, max-age=300, stale-while-revalidate=86400';

export async function GET() {
  try {
    const recalls = await fetchRecalls();
    return NextResponse.json(
      { recalls, lastUpdated: new Date().toISOString() },
      { headers: { 'Cache-Control': CACHE, 'Vercel-CDN-Cache-Control': CACHE } },
    );
  } catch (err) {
    console.error('CPSC fetch failed:', err);
    return NextResponse.json(
      { recalls: [], error: 'Failed to fetch recall data' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
