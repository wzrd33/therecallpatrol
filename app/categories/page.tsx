import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Recall Categories: Kids, Food, Household, Pets and Outdoors',
  description: 'Browse U.S. product and food recalls by part of the home: kids and baby, pantry, refrigerator, household, pets, and outdoors and sports.',
  alternates: { canonical: '/categories' },
};

const CATEGORIES = [
  { slug: 'kids',         label: 'Kids & Baby',  emoji: '🧸', desc: 'Toys, clothing, car seats, cribs, strollers, and more.', color: '#B026FF' },
  { slug: 'pantry',       label: 'Pantry',       emoji: '🥫', desc: 'Shelf-stable food: snacks, baking mixes, spices, canned goods, and supplements.', color: '#19E57A' },
  { slug: 'refrigerator', label: 'Refrigerator', emoji: '🧊', desc: 'Chilled and frozen food: dairy, produce, seafood, and ready meals.',    color: '#00C9D7' },
  { slug: 'household',    label: 'Household',    emoji: '🏠', desc: 'Furniture, appliances, kitchen gear, electronics, tools, and more.',   color: '#FF9A1A' },
  { slug: 'outdoors',     label: 'Outdoors & Sports', emoji: '⛺', desc: 'Bikes, e-bikes, off-road vehicles, helmets, and sports gear.', color: '#FFDC28' },
  { slug: 'pets',        label: 'Pets',         emoji: '🐶', desc: 'Pet toys, gear, and accessories.',  color: '#FF2B85' },
];

export default function CategoriesPage() {
  return (
    <div className="bg-navy flex-1">
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6 sm:mb-10 sm:text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">Browse</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Product <span className="text-magenta">Categories</span>
        </h1>
        <p className="text-white/70 sm:text-lg max-w-xl sm:mx-auto">
          Pick a part of your home and see what Scout has sniffed out.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {CATEGORIES.map(c => (
          <Link key={c.slug} href={`/categories/${c.slug}`} className="cat-tile sm:min-h-[170px]" style={{ '--cat': c.color } as React.CSSProperties}>
            <span className="cat-chip" aria-hidden="true">{c.emoji}</span>
            <span className="block">
              <span className="block text-xl font-extrabold leading-tight tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{c.label}</span>
              <span className="block text-sm text-white/85 mt-1">{c.desc}</span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider cat-sub mt-2">
                View recalls <span className="cat-arrow" aria-hidden="true">→</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
    </div>
  );
}
