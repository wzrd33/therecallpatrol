'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall, Category } from '@/types/recalls';
import { useLists } from '@/lib/lists';
import { RecallSheet } from '@/components/recall-sheet';
import { recallName, hazardTag } from '@/utils/recall-name';

const META: Record<string, { label: string; desc: string; color: string; emoji: string }> = {
  kids:         { label: 'Kids & Baby',   desc: 'Toys, clothing, car seats, cribs, strollers, and more.',   color: '#B026FF', emoji: '🧸' },
  pantry:       { label: 'Pantry',        desc: 'Shelf-stable food: snacks, baking mixes, spices, canned goods, and supplements.',   color: '#19E57A', emoji: '🥫' },
  refrigerator: { label: 'Refrigerator',  desc: 'Chilled and frozen food: dairy, produce, seafood, and ready meals.',      color: '#00C9D7', emoji: '🧊' },
  household:    { label: 'Household',     desc: 'Furniture, appliances, kitchen gear, electronics, tools, and more.',     color: '#FF9A1A', emoji: '🏠' },
  outdoors:     { label: 'Outdoors & Sports', desc: 'Bikes, e-bikes, off-road vehicles, helmets, and sports gear.', color: '#FFDC28', emoji: '⛺' },
  pets:         { label: 'Pets',          desc: 'Pet toys, gear, and accessories.',    color: '#FF2B85', emoji: '🐶' },
};


export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const meta = META[slug] ?? META.household;
  // The feed files sports, vehicles and outdoor gear under 'other'
  const dataCategory = slug === 'outdoors' ? 'other' : slug;

  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { added, toggle, getByCategory } = useLists();
  const [selected, setSelected] = useState<Recall | null>(null);
  const [listItems, setListItems] = useState<ReturnType<typeof getByCategory>>([]);

  useEffect(() => {
    fetch('/api/recalls')
      .then(r => { if (!r.ok) throw new Error('recalls unavailable'); return r.json(); })
      .then(d => {
        const all: Recall[] = d.recalls ?? [];
        setRecalls(all.filter(r => r.category === dataCategory));
        setLoading(false);
      })
      .catch(() => { setFailed(true); setLoading(false); });
  }, [dataCategory]);

  useEffect(() => {
    setListItems(getByCategory(dataCategory));
  }, [added, dataCategory, getByCategory]);

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
            {loading ? 'Loading recalls…' : failed ? 'Recalls are unavailable right now' : `${recalls.length} recent ${meta.label.toLowerCase()} recalls`}
          </h2>

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {failed && (
            <p className="text-white/60 text-sm py-6">Scout could not reach the recall database. Try again in a few minutes.</p>
          )}

          {!loading && !failed && recalls.length === 0 && (
            <div className="text-center py-12 text-white/60">
              <div className="text-4xl mb-3">🐶</div>
              <p>No recent recalls in this category. Scout is keeping watch.</p>
            </div>
          )}

          <div className="space-y-3">
            {recalls.map(r => { const name = recallName(r); return (
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
                      <span className="sev-pill" data-on-dark="" data-sev={r.severity}>{name.hazard || hazardTag(r.title)}</span>
                      <span className="text-white/60 text-xs">{r.dateFormatted}</span>
                    </span>
                    {name.brand && <span className="block text-cyan-light text-[11px] font-bold uppercase tracking-wider mb-0.5">{name.brand}</span>}
                    <span className="block font-extrabold text-lg leading-tight tracking-tight mb-1.5 line-clamp-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{name.product}</span>
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
            ); })}
          </div>
        </section>

        {/* My list for this category */}
        <section>
          <h2 className="font-bold text-base mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            My {meta.label} Watchlist
          </h2>
          {listItems.length === 0 ? (
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center text-white/60">
              <div className="text-3xl mb-2">🐶</div>
              <p className="text-sm">Nothing added yet. Tap <strong>+ Add</strong> on any recall above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {listItems.map(item => (
                <div key={item.id} className="recall-card pl-5 pr-2 py-1.5 flex items-center gap-3">
                  <div className="flex-1 font-semibold text-sm truncate">{item.title}</div>
                  <span className="sev-pill flex-shrink-0" data-on-dark="" data-sev={item.severity}>{hazardTag(item.title)}</span>
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
