import type { Category } from '@/types/recalls';

/** The six aisles, shared by the pages, the sitemap and page titles. */
export const CATEGORY_META: Record<string, { label: string; desc: string; color: string; emoji: string }> = {
  kids:         { label: 'Kids & Baby',   desc: 'Toys, clothing, car seats, cribs, strollers, and more.',   color: '#B026FF', emoji: '🧸' },
  pantry:       { label: 'Pantry',        desc: 'Shelf-stable food: snacks, baking mixes, spices, canned goods, and supplements.',   color: '#19E57A', emoji: '🥫' },
  refrigerator: { label: 'Refrigerator',  desc: 'Chilled and frozen food: dairy, produce, seafood, and ready meals.',      color: '#00C9D7', emoji: '🧊' },
  household:    { label: 'Household',     desc: 'Furniture, appliances, kitchen gear, electronics, tools, and more.',     color: '#FF9A1A', emoji: '🏠' },
  outdoors:     { label: 'Outdoors & Sports', desc: 'Bikes, e-bikes, off-road vehicles, helmets, and sports gear.', color: '#FFDC28', emoji: '⛺' },
  pets:         { label: 'Pets',          desc: 'Pet toys, gear, and accessories.',    color: '#FF2B85', emoji: '🐶' },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_META);

/** The feed files sports, vehicles and outdoor gear under 'other'. */
export const dataCategory = (slug: string): Category => (slug === 'outdoors' ? 'other' : slug) as Category;
export const categorySlug = (c: Category): string => (c === 'other' ? 'outdoors' : c);

// The bare domain redirects to www, so www is the address search engines should keep
export const SITE_URL = 'https://www.therecallpatrol.com';
