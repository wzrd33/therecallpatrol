import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Recall } from '@/types/recalls';
import { loadRecalls } from '@/lib/cpsc';
import { CATEGORY_META, CATEGORY_SLUGS, dataCategory, SITE_URL } from '@/lib/categories';
import { recallFullName, recallPath } from '@/utils/recall-name';
import { CategoryClient } from '@/components/category-client';
import { JsonLd } from '@/components/json-ld';

export const revalidate = 3600;
// The feeds are fetched uncached (they are too big for Next's data cache), which would
// otherwise make this render on every request. The rendered page is what gets cached.
export const dynamic = 'force-static';
export const maxDuration = 60;

// How many recalls are in the page itself; the browser loads the rest
const IN_PAGE = 60;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) return {};
  const title = `${meta.label} Recalls: Latest U.S. Safety Recalls`;
  const description = `Recent ${meta.label.toLowerCase()} recalls from CPSC, FDA and USDA. ${meta.desc} See the hazard, how to identify the product, and the official notice.`;
  return {
    title,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: { title, description, url: `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) notFound();

  const all: Recall[] = await loadRecalls().catch(() => []);
  const mine = all.filter(r => r.category === dataCategory(slug));
  const initial = mine.slice(0, IN_PAGE);

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${meta.label} Recalls`,
        description: meta.desc,
        url: `${SITE_URL}/categories/${slug}`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: mine.length,
          itemListElement: initial.slice(0, 25).map((r, i) => ({
            '@type': 'ListItem', position: i + 1, name: recallFullName(r), url: `${SITE_URL}${recallPath(r)}`,
          })),
        },
      }} />
      <CategoryClient slug={slug} initial={initial} total={mine.length} />
    </>
  );
}
