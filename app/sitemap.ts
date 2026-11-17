import type { MetadataRoute } from 'next';
import { loadRecalls } from '@/lib/cpsc';
import { CATEGORY_SLUGS, SITE_URL } from '@/lib/categories';
import { recallPath } from '@/utils/recall-name';

export const revalidate = 3600;
// The feeds are fetched uncached (they are too big for Next's data cache), which would
// otherwise make this render on every request. The rendered page is what gets cached.
export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The fixed pages are always listed, even if the agencies cannot be reached
  const recalls = await loadRecalls().catch(() => []);
  const newest = recalls[0]?.date ? new Date(recalls[0].date) : new Date();
  return [
    { url: SITE_URL, lastModified: newest, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    ...CATEGORY_SLUGS.map(slug => ({ url: `${SITE_URL}/categories/${slug}`, lastModified: newest, changeFrequency: 'daily' as const, priority: 0.8 })),
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.2 },
    ...recalls.map(r => ({ url: `${SITE_URL}${recallPath(r)}`, lastModified: r.date ? new Date(r.date) : undefined, priority: 0.7 })),
  ];
}
