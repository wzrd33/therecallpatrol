'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall, Category } from '@/types/recalls';
import { useLists } from '@/lib/lists';

const META: Record<string, { label: string; desc: string; bg: string; accentColor: string; emoji: string }> = {
  kids:         { label: 'Kids & Baby',   desc: 'Toys, clothing, car seats, cribs, strollers, and more.',   bg: 'linear-gradient(135deg,#4A1A8B,#7B10CC)', accentColor: '#FFDC28', emoji: '🧸' },
  pantry:       { label: 'Pantry',        desc: 'Canned goods, dry foods, snacks, condiments, and more.',   bg: 'linear-gradient(135deg,#1A5A30,#1E9A50)', accentColor: '#FFDC28', emoji: '🥫' },
  refrigerator: { label: 'Refrigerator',  desc: 'Meats, dairy, produce, and refrigerator appliances.',      bg: 'linear-gradient(135deg,#0A3A8A,#1060C0)', accentColor: '#00C9D7', emoji: '🧊' },
  household:    { label: 'Household',     desc: 'Furniture, appliances, electronics, tools, and more.',     bg: 'linear-gradient(135deg,#6B3A00,#B06010)', accentColor: '#FFDC28', emoji: '🏠' },
  pets:         { label: 'Pets',          desc: 'Pet food, toys, accessories, and veterinary products.',    bg: 'linear-gradient(135deg,#7A0A0A,#C03030)', accentColor: '#FF2B85', emoji: '🐾' },
};

const sevColor = { high: '#FF2B85', medium: '#FFDC28', low: '#00C9D7' };

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const meta = META[slug] ?? META.household;

  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const { added, toggle, getByCategory } = useLists();
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
    <>
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 m-4 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors" style={{ background: 'rgba(26,0,45,0.8)' }}>
        ← Back to Feed
      </Link>

      {/* Category hero */}
      <section className="px-4 pb-10 pt-2 flex items-center gap-6 flex-wrap" style={{ background: meta.bg }}>
        <div className="flex-1 min-w-48">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: meta.accentColor }}>{meta.emoji} {meta.label}</p>
          <h1 className="text-white text-3xl font-extrabold mb-2 leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            {meta.label} Recalls
          </h1>
          <p className="text-white/75 text-sm">{meta.desc}</p>
        </div>
        <Image
          src="/images/scout-full.webp"
          alt={`Scout — ${meta.label}`}
          width={150} height={150}
          className="flex-shrink-0 drop-shadow-2xl"
          style={{ width: 'min(150px, 38vw)', height: 'auto' }}
        />
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
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!loading && recalls.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-3">🐾</div>
              <p>No recent recalls in this category — Scout is keeping watch!</p>
            </div>
          )}

          <div className="space-y-3">
            {recalls.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{r.title}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sevColor[r.severity], color: r.severity === 'medium' ? '#1A002D' : 'white' }}>
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">⚠️ {r.hazard}</p>
                  <div className="text-muted-foreground text-xs">📅 {r.dateFormatted}</div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggle({ id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url })}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-colors"
                    style={{ background: added[r.id] ? '#259A36' : '#FF2B85' }}
                  >
                    {added[r.id] ? '✓ Added' : '+ Add'}
                  </button>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors text-center"
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
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
              <div className="text-3xl mb-2">🐾</div>
              <p className="text-sm">Nothing added yet. Tap <strong>+ Add</strong> on any recall above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {listItems.map(item => (
                <div key={item.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 font-semibold text-sm truncate">{item.title}</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sevColor[item.severity as keyof typeof sevColor] ?? '#ccc', color: item.severity === 'medium' ? '#1A002D' : 'white' }}>
                    {item.severity}
                  </span>
                  <button
                    onClick={() => toggle(item)}
                    className="w-6 h-6 rounded-full bg-muted text-muted-foreground hover:bg-magenta hover:text-white transition-colors flex items-center justify-center text-sm flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
