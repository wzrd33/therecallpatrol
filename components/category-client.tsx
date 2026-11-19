'use client';

import React, { useState, useEffect } from 'react';
import { CATEGORY_META, dataCategory as toDataCategory } from '@/lib/categories';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall, Category } from '@/types/recalls';
import { loadRecallList } from '@/lib/recall-list';
import { useLists } from '@/lib/lists';
import { RecallSheet } from '@/components/recall-sheet';
import { recallName, hazardTag, recallPath } from '@/utils/recall-name';
import { recallEmoji } from '@/utils/recall-emoji';

const META = CATEGORY_META;

/** `initial` is the newest recalls in this aisle, rendered on the server; the rest load in the browser. */
export function CategoryClient({ slug, initial, total }: { slug: string; initial: Recall[]; total: number }) {
  const meta = META[slug] ?? META.household;
  const dataCategory = toDataCategory(slug);

  const [recalls, setRecalls] = useState<Recall[]>(initial);
  const [count, setCount] = useState(total);
  const [loading, setLoading] = useState(initial.length === 0);
  const [failed, setFailed] = useState(false);
  const { added, toggle } = useLists();
  const [selected, setSelected] = useState<Recall | null>(null);

  useEffect(() => {
    loadRecallList()
      .then(d => {
        const all: Recall[] = d.recalls ?? [];
        const mine = all.filter(r => r.category === dataCategory);
        setRecalls(mine);
        setCount(mine.length);
        setLoading(false);
      })
      // Keep showing the server-rendered list if the refresh fails
      .catch(() => { setFailed(initial.length === 0); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataCategory]);

  return (
    <div className="bg-navy text-white flex-1" style={{ '--cat': meta.color } as React.CSSProperties}>
      {/* Category hero */}
      <section className="cat-hero px-4 pt-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="tap gap-1 px-4 rounded-full border border-white/25 text-white text-sm hover:bg-white/10" style={{ background: 'rgba(26,0,45,0.45)' }}>
            ← All recalls
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
            {loading ? 'Loading recalls…' : failed ? 'Recalls are unavailable right now' : `${count} recent ${meta.label.toLowerCase()} recalls`}
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
                <a
                  href={recallPath(r)}
                  onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); setSelected(r); }}
                  aria-label={`More info: ${r.title}`}
                  className="vhs-open flex gap-3 items-start flex-1 min-w-0 text-left"
                >
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${meta.color}26`, boxShadow: `inset 0 0 0 1px ${meta.color}80` }} aria-hidden="true">
                    {recallEmoji(r)}
                  </span>
                  <span className="block flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="sev-pill" data-on-dark="" data-sev={r.severity}>{name.hazard || hazardTag(r.title)}</span>
                      <span className="text-white/60 text-xs">{r.dateFormatted}</span>
                    </span>
                    {name.brand && <span className="block text-cyan-light text-[13px] font-bold uppercase tracking-wider mb-0.5">{name.brand}</span>}
                    <span className="block font-extrabold text-lg leading-tight tracking-tight mb-1.5 line-clamp-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{name.product}</span>
                    <span className="block text-white/70 text-[13px] leading-relaxed line-clamp-3">{r.hazard}</span>
                    <span className="block mt-2 text-yellow text-xs font-bold">More info <span aria-hidden="true">›</span></span>
                  </span>
                </a>
                <div className="flex sm:flex-col gap-2 flex-shrink-0 sm:w-28">
                  <button
                    type="button"
                    aria-pressed={!!added[r.id]}
                    onClick={() => toggle({ id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url })}
                    data-added={!!added[r.id]}
                    className="tap add-btn flex-1 px-4 rounded-full text-sm"
                  >
                    {added[r.id] ? '✓ Watching' : '+ Watch'}
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

        <p className="text-white/70 text-sm">
          Recalls you tap <strong className="text-white">+ Watch</strong> on are kept in{' '}
          <Link href="/my-home" className="text-white font-bold underline underline-offset-4 decoration-magenta decoration-2 hover:text-yellow">My Home</Link>
          {Object.keys(added).length > 0 ? ` (${Object.keys(added).length} so far).` : '.'}
        </p>
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
