'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall } from '@/types/recalls';
import { useLists } from '@/lib/lists';
import { RecallSheet, recallEmoji } from '@/components/recall-sheet';
import { PatrolReport } from '@/components/patrol-report';
import { MyHome } from '@/components/my-home';
import { RecallOfDay, pickRecallOfDay } from '@/components/recall-of-day';
import { usePatrol } from '@/hooks/use-patrol';
import { useHomeItems } from '@/hooks/use-home-items';
import { findOwnedMatches } from '@/utils/recall-match';
import { recallName, dailyLineup } from '@/utils/recall-name';

const CATEGORIES = [
  { slug: 'kids',         label: 'Kids',      emoji: '🧸', color: '#B026FF' },
  { slug: 'pantry',       label: 'Pantry',    emoji: '🥫', color: '#19E57A' },
  { slug: 'refrigerator', label: 'Fridge',    emoji: '🧊', color: '#00C9D7' },
  { slug: 'household',    label: 'Household', emoji: '🏠', color: '#FF9A1A' },
  { slug: 'pets',         label: 'Pets',      emoji: '🐶', color: '#FF2B85' },
  // The feed files sports, vehicles and outdoor gear under 'other'
  { slug: 'outdoors',     label: 'Outdoors',  emoji: '⛺', color: '#FFDC28', dataCategory: 'other' },
];

const CAROUSEL_LIMIT = 30;
const sevLabel = { high: '⚠ High', medium: 'Medium', low: 'Low' };

export default function HomePage() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { added, toggle } = useLists();
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Recall | null>(null);

  useEffect(() => {
    fetch('/api/recalls')
      .then(r => { if (!r.ok) throw new Error('recalls unavailable'); return r.json(); })
      .then(d => { setRecalls(d.recalls ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // Carousel: newest recalls first, then a fresh draw from recent months each day.
  // Category counts below still use the full list.
  const latest = useMemo(
    () => dailyLineup(recalls, CAROUSEL_LIMIT).map(r => ({ r, name: recallName(r) })),
    [recalls],
  );

  const patrol = usePatrol(recalls);
  const { items: homeItems, addItem, removeItem } = useHomeItems();
  const homeMatches = useMemo(() => {
    const out: Record<string, Recall[]> = {};
    homeItems.forEach(i => { out[i.id] = findOwnedMatches(recalls, i.name); });
    return out;
  }, [homeItems, recalls]);
  const homeAlerts = homeItems.filter(i => homeMatches[i.id]?.length > 0).length;
  const recallOfDay = useMemo(() => pickRecallOfDay(recalls), [recalls]);

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-12 px-4 text-center">
        <div className="relative z-10 max-w-xl mx-auto">
          {/* Scout on a spotlight so the badge art reads as a sticker, not a floating square */}
          <div className="relative mx-auto mb-5 w-fit">
            <div
              className="absolute -inset-6 rounded-full blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(closest-side, rgba(255,43,133,0.45), rgba(0,201,215,0.18) 60%, transparent)' }}
              aria-hidden="true"
            />
            <Image
              src="/images/scout-full.webp"
              alt="Scout the Recall Patrol dog"
              width={220} height={220}
              className="relative rounded-3xl -rotate-2"
              style={{ width: 'min(176px, 44vw)', height: 'auto', boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 18px 40px -12px rgba(0,0,0,0.7)' }}
              priority
            />
            <span
              className="absolute -right-3 -bottom-2 rotate-6 rounded-full bg-yellow text-navy text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 shadow-lg"
              style={{ fontFamily: "'Space Grotesk',sans-serif" }}
            >
              On patrol
            </span>
          </div>
          <p className="text-cyan text-xs font-bold uppercase tracking-widest mb-2">Your Home Safety Partner</p>
          <h1 className="text-white text-[2rem] sm:text-5xl font-extrabold leading-[1.08] tracking-tight mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Scout the Recalls.<br />
            <span className="text-magenta">Guard Your Home.</span>
          </h1>
          <p className="text-white/70 mb-6 text-base max-w-md mx-auto">
            Real-time alerts on recalled products: food, toys, appliances, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs sm:max-w-none mx-auto">
            {patrol.nickname
              ? <Link href="/#my-home" className="btn-primary">Check My Home <span aria-hidden="true">→</span></Link>
              : <Link href="/signup" className="btn-primary">Start Patrolling Free <span aria-hidden="true">→</span></Link>}
            <Link href="/categories" className="btn-secondary">Browse by Category</Link>
          </div>
        </div>
      </section>

      {/* Patrol report: streak, what's new, My Home status */}
      {!error && (
        <section className="bg-navy px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            <PatrolReport
              ready={patrol.ready}
              firstVisit={patrol.firstVisit}
              newCount={patrol.newIds.size}
              lastVisit={patrol.lastVisit}
              streak={patrol.streak}
              nickname={patrol.nickname}
              homeCount={homeItems.length}
              homeAlerts={homeAlerts}
            />
          </div>
        </section>
      )}

      {/* Blockbuster Carousel */}
      <section id="now-recalled" className="bg-navy pt-2 pb-8 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between px-4 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>📼 Now Recalled</h2>
              <span className="px-2 py-0.5 bg-magenta text-white text-xs font-bold rounded uppercase tracking-wide animate-pulse">Live</span>
              <span className="text-white/50 text-xs max-sm:hidden">New shelf every day</span>
              {patrol.newIds.size > 0 && (
                <span className="px-2 py-0.5 bg-yellow text-navy text-xs font-bold rounded uppercase tracking-wide">{patrol.newIds.size} new</span>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label="Scroll recalls left" onClick={() => scroll(-1)} className="tap w-11 h-11 rounded-full border border-white/20 bg-white/5 text-white text-xl hover:bg-magenta hover:border-magenta">‹</button>
              <button type="button" aria-label="Scroll recalls right" onClick={() => scroll(1)} className="tap w-11 h-11 rounded-full border border-white/20 bg-white/5 text-white text-xl hover:bg-magenta hover:border-magenta">›</button>
            </div>
          </div>

          {loading && (
            <div className="px-4 py-3 flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 h-72 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="px-4 text-white/50 text-sm">Could not load recall data. Try refreshing.</p>
          )}

          {!loading && !error && (
            <div
              ref={trackRef}
              className="vhs-track flex gap-3 overflow-x-auto px-4 pt-3 pb-5 scroll-px-4"
            >
              {latest.map(({ r, name }) => (
                <div
                  key={r.id}
                  data-sev={r.severity}
                  className="vhs-card flex-shrink-0 w-40 rounded-xl overflow-hidden flex flex-col"
                >
                  {/* Tapping the artwork or title opens the detail sheet */}
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    aria-label={`More info: ${r.title}`}
                    className="vhs-open flex-1 flex flex-col text-left"
                  >
                    <span className="h-20 w-full flex items-center justify-center text-4xl relative flex-shrink-0">
                      {recallEmoji(r)}
                      {patrol.newIds.has(r.id) && <span className="new-flag absolute top-3 left-2">New</span>}
                      <span className="sev-badge absolute top-3 right-2" data-sev={r.severity}>
                        {sevLabel[r.severity]}
                      </span>
                    </span>
                    <span className="flex-1 w-full px-2.5 flex flex-col gap-1">
                      <span className="text-cyan-light text-[11px] font-bold uppercase tracking-wider truncate">{name.brand || (r.category === 'other' ? 'outdoors' : r.category)}</span>
                      <span className="text-white text-base font-extrabold leading-tight tracking-tight line-clamp-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{name.product}</span>
                      {name.hazard && <span className="vhs-hazard line-clamp-2">{name.hazard}</span>}
                      <span className="text-white/60 text-xs">{r.dateFormatted}</span>
                      <span className="mt-auto pt-1 text-yellow text-xs font-bold">More info <span aria-hidden="true">›</span></span>
                    </span>
                  </button>
                  <div className="px-2.5 pb-2.5 flex flex-col gap-1">
                    <div className="mt-auto flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        aria-pressed={!!added[r.id]}
                        onClick={() => toggle({ id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url })}
                        data-added={!!added[r.id]}
                        className="tap add-btn w-full rounded-lg text-sm"
                      >
                        {added[r.id] ? '✓ Added' : '+ Add'}
                      </button>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap w-full rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        Official ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recall of the day + My Home */}
      {!error && (
        <section className="bg-navy border-t border-white/10 px-4 py-8">
          <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-2 items-start">
            <RecallOfDay recall={recallOfDay} onOpen={setSelected} />
            <MyHome items={homeItems} matches={homeMatches} loading={loading} onAdd={addItem} onRemove={removeItem} onOpen={setSelected} />
          </div>
        </section>
      )}

      {/* Category grid */}
      <section className="bg-navy border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">Browse</p>
        <h2 className="text-white text-2xl font-extrabold mb-5" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Scout's <span className="text-magenta">On Watch</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(c => {
            const count = recalls.filter(r => r.category === (c.dataCategory ?? c.slug)).length;
            return (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="cat-tile sm:min-h-[150px]"
                style={{ '--cat': c.color } as React.CSSProperties}
              >
                <span className="cat-chip" aria-hidden="true">{c.emoji}</span>
                <span className="block">
                  <span className="block text-lg font-extrabold leading-tight tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{c.label}</span>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider cat-sub mt-0.5">
                    {loading || error ? 'View recalls' : `${count} ${count === 1 ? 'recall' : 'recalls'}`} <span className="cat-arrow" aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      </section>

      {selected && (
        <RecallSheet
          recall={selected}
          isAdded={!!added[selected.id]}
          onToggle={() => toggle({ id: selected.id, title: selected.title, category: selected.category, severity: selected.severity, date: selected.dateFormatted, url: selected.url })}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
