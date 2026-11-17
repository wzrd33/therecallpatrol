import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SearchLauncher } from '@/components/product-search';
import { CATEGORY_META, CATEGORY_SLUGS } from '@/lib/categories';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

/** Shown for any missing page, most often a recall that has aged out of the two-year list. */
export default function NotFound() {
  return (
    <div className="bg-navy text-white flex-1">
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 text-center">
        <Image src="/images/scout-full.webp" alt="Scout the Recall Patrol dog" width={140} height={140} className="mx-auto mb-5 rounded-3xl -rotate-2" style={{ width: 120, height: 'auto' }} />
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Scout couldn&apos;t <span className="text-magenta">sniff this one out</span>
        </h1>
        <p className="text-white/70 mb-6">
          This page doesn&apos;t exist, or the recall is more than two years old and has dropped off our list.
          Search for the product, or pick a category.
        </p>
        <SearchLauncher className="max-w-md mx-auto" />
        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
          {CATEGORY_SLUGS.map(slug => (
            <li key={slug}>
              <Link href={`/categories/${slug}`} className="tap w-full justify-start gap-2 px-4 rounded-full border border-white/20 text-sm font-bold hover:bg-white/10">
                <span aria-hidden="true">{CATEGORY_META[slug].emoji}</span> {CATEGORY_META[slug].label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="inline-block mt-8 text-sm text-white/70 underline underline-offset-4 hover:text-white">Back to the latest recalls</Link>
      </div>
    </div>
  );
}
