import { NextResponse } from 'next/server';
import { fetchRecalls } from '@/lib/cpsc';

export const revalidate = 300;

export async function GET() {
  try {
    const recalls = await fetchRecalls();
    return NextResponse.json({ recalls, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error('CPSC fetch failed:', err);
    return NextResponse.json({ recalls: [], error: 'Failed to fetch recall data' }, { status: 500 });
  }
}
