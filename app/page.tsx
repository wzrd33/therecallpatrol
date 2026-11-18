import type { Metadata } from 'next';
import type { Recall } from '@/types/recalls';
import { loadRecalls } from '@/lib/cpsc';
import { dailyLineup } from '@/utils/recall-name';
import { HomeClient } from '@/components/home-client';

// Rebuilt at most once an hour, so search engines and visitors get a ready page
export const revalidate = 3600;
// The feeds are fetched uncached (they are too big for Next's data cache), which would
// otherwise make this render on every request. The rendered page is what gets cached.
export const dynamic = 'force-static';
export const maxDuration = 60;

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  // If the agencies are unreachable the page still renders and loads the list in the browser
  const recalls: Recall[] = await loadRecalls().catch(() => []);
  const counts: Record<string, number> = {};
  recalls.forEach(r => { counts[r.category] = (counts[r.category] ?? 0) + 1; });
  // Twice the shelf size: the browser deals 30 of these at random on each visit
  return <HomeClient initial={dailyLineup(recalls, 60)} counts={counts} />;
}
