import { NextResponse } from 'next/server';
import { fetchRecalls } from '@/lib/cpsc';

// Always runs on request; caching is done at Vercel's CDN via the headers below.
export const dynamic = 'force-dynamic';
// A cold CPSC query can take close to a minute; give the function room to wait for it.
export const maxDuration = 60;

// CDN keeps a copy for 5 minutes, then serves the old copy while it refreshes in the
// background (for up to a day), so visitors never wait on the CPSC API directly.
const CDN_CACHE = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';

export async function GET() {
  try {
    const recalls = await fetchRecalls();
    return NextResponse.json(
      { recalls, lastUpdated: new Date().toISOString() },
      { headers: { 'Cache-Control': CDN_CACHE } },
    );
  } catch (err) {
    console.error('CPSC fetch failed:', err);
    return NextResponse.json(
      { recalls: [], error: 'Failed to fetch recall data' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
