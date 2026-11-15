'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall, Category } from '@/types/recalls';
import { useLists } from '@/lib/lists';
import { RecallSheet } from '@/components/recall-sheet';

const META: Record<string, { label: string; desc: string; color: string; emoji: string }> = {
  kids:         { label: 'Kids & Baby',   desc: 'Toys, clothing, car seats, cribs, strollers, and more.',   color: '#B026FF', emoji: '🧸' },
  pantry:       { label: 'Pantry',        desc: 'Canned goods, dry foods, snacks, condiments, and more.',   color: '#19E57A', emoji: '🥫' },
  refrigerator: { label: 'Refrigerator',  desc: 'Meats, dairy, produce, and refrigerator appliances.',      color: '#00C9D7', emoji: '🧊' },
  household:    { label: 'Household',     desc: 'Furniture, appliances, electronics, tools, and more.',     color: '#FF9A1A', emoji: '🏠' },
  pets:         { label: 'Pets',          desc: 'Pet food, toys, accessories, and veterinary products.',    color: '#FF2B85', emoji: '🐾' },
};

const sevLabel: Record<string, string> = { high: 'High risk', medium: 'Medium risk', low: 'Low risk' };

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const meta = META[slug] ?? META.household;

  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const { added, toggle, getByCategory } = useLists();
  const [selected, setSelected] = useState<Recall | null>(null);
  const [listItems, setListItems] = useState<ReturnType<typeof getByCategory>>([]);

  useEffect(() => {
    fetch('/api/recalls')
      .then(r => r.json())
      .then(d => {
        const all: Recall[] = d.recalls ?? [];
        setRecalls(all.filter(r => r.category === slug));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setListItems(getByCategory(slug));
  }, [added, slug, getByCategory]);

  return (
    <div className="bg-navy text-white flex-1" style={{ '--cat': meta.color } as React.CSSProperties}>
      {/* Category hero */}
      <section className="cat-hero px-4 pt-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="tap gap-1 px-4 rounded-full border border-white/25 text-white text-sm hover:bg-white/10" style={{ background: 'rgba(26,0,45,0.45)' }}>
            ← Back to Feed
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 min-w-0">
              <p className="text-yellow text-xs font-bold uppercase tracking-widest mb-2">{meta.emoji} {meta.label}</p>
              <h1 className="text-white text-3xl font-extrabold mb-2 leading-tight tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                {meta.label} Recalls
              </h1>
              <p className="text-white/80 text-sm">{meta.desc}</p>
            </div>
            <Image
              src="/images/scout-full.webp"
              alt={`Scout, ${meta.label}`}
              width={150} height={150}
              className="flex-shrink-0 rounded-2xl rotate-2 shadow-2xl"
              style={{ width: 'min(132px, 27vw)', height: 'auto' }}
            />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-10">

        {/* Recall list */}
        <section>
          <h2 className="font-bold text-base mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            {loading ? 'Loading recalls…' : `${recalls.length} recent ${meta.label.toLowerCase()} recalls`}
          </h2>

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && recalls.length === 0 && (
            <div className="text-center py-12 text-white/60">
              <div className="text-4xl mb-3">🐾</div>
              <p>No recent recalls in this category. Scout is keeping watch.</p>
            </div>
          )}

          <div className="space-y-3">
            {recalls.map(r => (
              <div
                key={r.id}
                className="recall-card pl-5 pr-4 py-4 flex flex-col sm:flex-row gap-3 sm:items-start"
              >
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  aria-label={`More info: ${r.title}`}
                  className="vhs-open flex gap-3 items-start flex-1 min-w-0 text-left"
                >
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${meta.color}26`, boxShadow: `inset 0 0 0 1px ${meta.color}80` }} aria-hidden="true">
                    {meta.emoji}
                  </span>
                  <span className="block flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="sev-pill" data-on-dark="" data-sev={r.severity}>{sevLabel[r.severity] ?? r.severity}</span>
                      <span className="text-white/60 text-xs">{r.dateFormatted}</span>
                    </span>
                    <span className="block font-bold text-[15px] leading-snug mb-1.5 line-clamp-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{r.title}</span>
                    <span className="block text-white/70 text-[13px] leading-relaxed line-clamp-3">{r.hazard}</span>
                    <span className="block mt-2 text-yellow text-xs font-bold">More info <span aria-hidden="true">›</span></span>
                  </span>
                </button>
                <div className="flex sm:flex-col gap-2 flex-shrink-0 sm:w-28">
                  <button
                    type="button"
                    aria-pressed={!!added[r.id]}
                    onClick={() => toggle({ id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url })}
                    data-added={!!added[r.id]}
                    className="tap add-btn flex-1 px-4 rounded-full text-sm"
                  >
                    {added[r.id] ? '✓ Added' : '+ Add'}
                  </button>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap flex-1 px-4 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    Official ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* My list for this category */}
        <section>
          <h2 className="font-bold text-base mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            My {meta.label} Watchlist
          </h2>
          {listItems.length === 0 ? (
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center text-white/60">
              <div className="text-3xl mb-2">🐾</div>
              <p className="text-sm">Nothing added yet. Tap <strong>+ Add</strong> on any recall above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {listItems.map(item => (
                <div key={item.id} className="recall-card pl-5 pr-2 py-1.5 flex items-center gap-3">
                  <div className="flex-1 font-semibold text-sm truncate">{item.title}</div>
                  <span className="sev-pill flex-shrink-0" data-on-dark="" data-sev={item.severity}>{item.severity}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title} from watchlist`}
                    onClick={() => toggle(item)}
                    className="tap w-11 h-11 rounded-full text-white/60 text-xl hover:bg-magenta hover:text-white flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <RecallSheet
          recall={selected}
          isAdded={!!added[selected.id]}
          onToggle={() => toggle({ id: selected.id, title: selected.title, category: selected.category, severity: selected.severity, date: selected.dateFormatted, url: selected.url })}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
