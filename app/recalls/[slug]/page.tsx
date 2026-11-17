import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Recall } from '@/types/recalls';
import { loadRecalls } from '@/lib/cpsc';
import { CATEGORY_META, categorySlug, SITE_URL } from '@/lib/categories';
import { recallName, recallFullName, recallSlug, recallPath, recallSource, hazardTag } from '@/utils/recall-name';
import { recallEmoji } from '@/utils/recall-emoji';
import { WatchButton } from '@/components/watch-button';
import { JsonLd } from '@/components/json-ld';

// One page per recall, built the first time it is asked for and then kept for a day
export const revalidate = 86400;
// The feeds are fetched uncached (they are too big for Next's data cache), which would
// otherwise make this render on every request. The rendered page is what gets cached.
export const dynamic = 'force-static';
export const maxDuration = 60;
export function generateStaticParams() { return []; }

async function findRecall(slug: string): Promise<{ recall: Recall; all: Recall[] } | null> {
  const all = await loadRecalls();
  const recall = all.find(r => recallSlug(r) === slug)
    // An older address still works if the name part changed but the id is the same
    ?? all.find(r => slug === String(r.id) || slug.endsWith(`-${r.id}`));
  return recall ? { recall, all } : null;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await findRecall(slug).catch(() => null);
  if (!found) return { title: 'Recall not found', robots: { index: false } };
  const r = found.recall;
  const name = recallName(r);
  const full = recallFullName(r);
  const title = clip(`${full} Recall${name.hazard ? `: ${name.hazard}` : ''}`, 70);
  const description = clip(`${r.title}. Recalled ${r.dateFormatted} (${recallSource(r).short}). See how to tell if yours is affected and what to do.`, 160);
  return {
    title,
    description,
    alternates: { canonical: recallPath(r) },
    openGraph: { type: 'article', title, description, url: recallPath(r), publishedTime: r.date },
  };
}

export default async function RecallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await findRecall(slug);
  if (!found) notFound();
  const { recall: r, all } = found;

  const name = recallName(r);
  const full = recallFullName(r);
  const source = recallSource(r);
  const catSlug = categorySlug(r.category);
  const cat = CATEGORY_META[catSlug];
  const related = all.filter(x => x.category === r.category && x.id !== r.id).slice(0, 6);
  const url = `${SITE_URL}${recallPath(r)}`;

  return (
    <div className="bg-navy text-white flex-1">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: clip(r.title, 110),
        description: r.hazard,
        datePublished: r.date,
        dateModified: r.date,
        mainEntityOfPage: url,
        author: { '@type': 'GovernmentOrganization', name: source.name },
        publisher: { '@type': 'Organization', name: 'Recall Patrol', url: SITE_URL },
        isBasedOn: r.url,
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Recalls', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: `${cat.label} recalls`, item: `${SITE_URL}/categories/${catSlug}` },
          { '@type': 'ListItem', position: 3, name: full, item: url },
        ],
      }} />

      <article className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-white/60 mb-5">
          <Link href="/" className="hover:text-white underline underline-offset-4">Recalls</Link>
          <span aria-hidden="true"> › </span>
          <Link href={`/categories/${catSlug}`} className="hover:text-white underline underline-offset-4">{cat.label}</Link>
        </nav>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-4xl mr-1" aria-hidden="true">{recallEmoji(r)}</span>
          <span className="sev-pill" data-sev={r.severity} data-on-dark="">{name.hazard || hazardTag(r.title)}</span>
          <span className="text-white/70 text-sm">Recalled <time dateTime={r.date}>{r.dateFormatted}</time> · {source.short}</span>
        </div>

        {name.brand && <p className="text-cyan-light text-sm font-bold uppercase tracking-wider mb-1">{name.brand}</p>}
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          {name.product} <span className="text-magenta">Recall</span>
        </h1>
        <p className="text-white/70 leading-relaxed mb-6">{r.title}</p>

        {r.hazard && (
          <section className="sheet-hazard mb-6" aria-labelledby="hazard-h">
            <h2 id="hazard-h" className="sheet-label">⚠ The hazard</h2>
            <p className="text-white leading-relaxed">{r.hazard}</p>
          </section>
        )}

        {r.products && (
          <section className="mb-6" aria-labelledby="products-h">
            <h2 id="products-h" className="sheet-label">Products affected</h2>
            <p className="text-white/90 leading-relaxed">{r.products}</p>
          </section>
        )}

        {r.description && (
          <section className="mb-6" aria-labelledby="identify-h">
            <h2 id="identify-h" className="sheet-label">How to tell if yours is affected</h2>
            <p className="text-white/80 leading-relaxed whitespace-pre-line">{r.description}</p>
          </section>
        )}

        <section className="mb-6" aria-labelledby="do-h">
          <h2 id="do-h" className="sheet-label">What to do</h2>
          <p className="text-white/80 leading-relaxed">
            If you have this product, stop using it and follow the official notice for the refund, repair or replacement.
            Recall Patrol summarises the notice; the {source.short} notice is the authority.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">Official {source.short} notice ↗</a>
          <WatchButton item={{ id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url }} />
        </div>
        <p className="text-white/50 text-xs mb-10">Source: {source.name}.</p>

        {related.length > 0 && (
          <section aria-labelledby="related-h" className="border-t border-white/10 pt-6">
            <h2 id="related-h" className="text-xl font-extrabold mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
              More {cat.label.toLowerCase()} recalls
            </h2>
            <ul className="space-y-2">
              {related.map(x => (
                <li key={x.id}>
                  <Link href={recallPath(x)} className="recall-card pl-5 pr-4 py-3 flex items-center gap-3 hover:bg-white/5">
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold leading-snug line-clamp-2">{recallFullName(x)}</span>
                      <span className="block text-white/60 text-xs mt-0.5">{hazardTag(x.title)} · {x.dateFormatted}</span>
                    </span>
                    <span className="text-yellow" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/categories/${catSlug}`} className="btn-secondary mt-4 inline-flex">All {cat.label.toLowerCase()} recalls</Link>
          </section>
        )}
      </article>
    </div>
  );
}
