'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall } from '@/types/recalls';
import { useLists, type ListItem } from '@/lib/lists';
import { RecallSheet, recallEmoji } from '@/components/recall-sheet';
import { SearchLauncher } from '@/components/product-search';
import { PatrolReport } from '@/components/patrol-report';
import { MyHome } from '@/components/my-home';
import { RecallOfDay, pickRecallOfDay } from '@/components/recall-of-day';
import { usePatrol } from '@/hooks/use-patrol';
import { useHomeItems } from '@/hooks/use-home-items';
import { findOwnedMatchesDetailed, type OwnedMatch } from '@/utils/recall-match';
import { recallName, hazardTag, recallSource, recallPath } from '@/utils/recall-name';

const CATEGORIES = [
  { slug: 'kids',         label: 'Kids',      emoji: '🧸', color: '#B026FF' },
  { slug: 'pantry',       label: 'Pantry',    emoji: '🥫', color: '#19E57A' },
  { slug: 'refrigerator', label: 'Fridge',    emoji: '🥛', color: '#00C9D7' },
  { slug: 'household',    label: 'Household', emoji: '🏠', color: '#FF9A1A' },
  { slug: 'pets',         label: 'Pets',      emoji: '🐶', color: '#FF2B85' },
  // The feed files sports, vehicles and outdoor gear under 'other'
  { slug: 'outdoors',     label: 'Outdoors',  emoji: '⛺', color: '#FFDC28', dataCategory: 'other' },
];

const CAROUSEL_LIMIT = 30;

/**
 * `initial` is today's carousel line-up and `counts` the size of each aisle, both rendered
 * on the server so the page has real content before the full list arrives in the browser.
 */
export function HomeClient({ initial, counts }: { initial: Recall[]; counts: Record<string, number> }) {
  const [recalls, setRecalls] = useState<Recall[]>(initial);
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

  // A short confirmation with an undo, since the card disappears the moment it is watched
  const [moved, setMoved] = useState<{ item: ListItem; name: string } | null>(null);
  useEffect(() => {
    if (!moved) return;
    const t = setTimeout(() => setMoved(null), 6000);
    return () => clearTimeout(t);
  }, [moved]);

  const patrol = usePatrol(recalls);

  // Carousel. The server sends a pool (the newest recalls plus today's draw from recent
  // months) in date order. Each page load then deals its own shelf from that pool, so a
  // refresh shows a different mix even on days when the agencies publish nothing.
  const [order, setOrder] = useState<string[] | null>(null);
  useEffect(() => {
    const ids = initial.map(r => String(r.id));
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setOrder(ids);
  }, [initial]);

  const latest = useMemo(() => {
    const byId = new Map<string, Recall>();
    initial.forEach(r => byId.set(String(r.id), r));
    recalls.forEach(r => byId.set(String(r.id), r));
    const dealt = order ? order.map(id => byId.get(id)).filter((r): r is Recall => !!r) : initial;
    return dealt
      // Watched recalls leave the shelf (they live in My Home) and the next ones move up
      .filter(r => !added[r.id])
      // Anything published since this visitor's last visit stays at the front
      .map((r, i) => ({ r, i, fresh: patrol.newIds.has(r.id) }))
      .sort((x, y) => Number(y.fresh) - Number(x.fresh) || x.i - y.i)
      .slice(0, CAROUSEL_LIMIT)
      .map(({ r }) => ({ r, name: recallName(r) }));
  }, [initial, recalls, order, added, patrol.newIds]);
  const { items: homeItems, addItem, removeItem } = useHomeItems();
  const homeMatches = useMemo(() => {
    const out: Record<string, OwnedMatch[]> = {};
    homeItems.forEach(i => { out[i.id] = findOwnedMatchesDetailed(recalls, i.name); });
    return out;
  }, [homeItems, recalls]);
  // What the household check actually covered, shown beside every result
  const coverage = useMemo(() => {
    if (recalls.length === 0) return '';
    const dates = recalls.map(r => r.date).filter(Boolean).sort();
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const food = recalls.filter(r => String(r.id).startsWith('fda-')).length;
    const meat = recalls.filter(r => String(r.id).startsWith('usda-')).length;
    const parts = [`${recalls.length - food - meat} CPSC product recalls`];
    if (food > 0) parts.push(`${food} FDA food recalls`);
    if (meat > 0) parts.push(`${meat} USDA meat and poultry recalls`);
    const joined = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
    return `${joined}, ${fmt(dates[0])} to ${fmt(dates[dates.length - 1])}`;
  }, [recalls]);
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
              className="absolute -right-3 -bottom-2 rotate-6 rounded-full bg-yellow text-navy text-[13px] font-extrabold uppercase tracking-wide px-2.5 py-1 shadow-lg"
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
            Find out if something you own has been recalled: food, toys, appliances, furniture, and more.
          </p>
          {/* One obvious first step; the other two ways in are quieter links below it */}
          <SearchLauncher className="max-w-md mx-auto" />
          <p className="mt-4 text-sm text-white/70">
            or <Link href="/my-home" className="text-white font-bold underline underline-offset-4 decoration-magenta decoration-2 hover:text-yellow">check your home</Link>
            {' · '}
            <Link href="/categories" className="text-white font-bold underline underline-offset-4 decoration-cyan decoration-2 hover:text-yellow">browse categories</Link>
          </p>
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
              newName={patrol.newName}
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
              <span className="text-white/50 text-xs max-sm:hidden">Shuffled every visit</span>
              {patrol.newIds.size > 0 && (
                <span className="px-2 py-0.5 bg-yellow text-navy text-xs font-bold rounded uppercase tracking-wide">{patrol.newIds.size} new</span>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label="Scroll recalls left" onClick={() => scroll(-1)} className="tap w-11 h-11 rounded-full border border-white/20 bg-white/5 text-white text-xl hover:bg-magenta hover:border-magenta">‹</button>
              <button type="button" aria-label="Scroll recalls right" onClick={() => scroll(1)} className="tap w-11 h-11 rounded-full border border-white/20 bg-white/5 text-white text-xl hover:bg-magenta hover:border-magenta">›</button>
            </div>
          </div>

          {loading && latest.length === 0 && (
            <div className="px-4 py-3 flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 h-72 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {error && latest.length === 0 && (
            <p className="px-4 text-white/50 text-sm">Could not load recall data. Try refreshing.</p>
          )}

          {latest.length > 0 && (
            <div
              ref={trackRef}
              // Held back for a moment until this visit's shelf is dealt, so cards don't visibly swap
              className={`vhs-track flex gap-3 overflow-x-auto px-4 pt-3 pb-5 scroll-px-4 ${order ? 'shelf-ready' : 'shelf-wait'}`}
            >
              {latest.map(({ r, name }) => (
                <div
                  key={r.id}
                  data-sev={r.severity}
                  className="vhs-card flex-shrink-0 w-40 rounded-xl overflow-hidden flex flex-col"
                >
                  {/* Tapping the artwork or title opens the detail sheet */}
                  {/* A real link for search engines and new tabs; a plain tap opens the sheet */}
                  <a
                    href={recallPath(r)}
                    onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); setSelected(r); }}
                    aria-label={`More info: ${r.title}`}
                    className="vhs-open flex-1 flex flex-col text-left"
                  >
                    {/* Label on the top row, picture below it, so the two never overlap */}
                    <span className="h-24 w-full flex items-end justify-center pb-1.5 text-4xl leading-none relative flex-shrink-0">
                      {recallEmoji(r)}
                      {patrol.newIds.has(r.id) && <span className="new-flag absolute top-3 left-2">New</span>}
                      <span className="sev-badge absolute top-3 right-2" data-sev={r.severity}>
                        ⚠ {hazardTag(r.title)}
                      </span>
                    </span>
                    <span className="flex-1 w-full px-2.5 flex flex-col gap-1">
                      <span className="text-cyan-light text-[13px] font-bold uppercase tracking-wider truncate">{name.brand || `${recallSource(r).short} recall`}</span>
                      <span className="text-white text-base font-extrabold leading-tight tracking-tight line-clamp-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{name.product}</span>
                      {name.hazard && <span className="vhs-hazard line-clamp-2">{name.hazard}</span>}
                      <span className="text-white/60 text-xs">{r.dateFormatted}</span>
                      <span className="mt-auto pt-1 text-yellow text-xs font-bold">More info <span aria-hidden="true">›</span></span>
                    </span>
                  </a>
                  <div className="px-2.5 pb-2.5 flex flex-col gap-1">
                    <div className="mt-auto flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        aria-pressed={!!added[r.id]}
                        onClick={() => {
                          const item = { id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url };
                          toggle(item);
                          setMoved({ item, name: [name.brand, name.product].filter(Boolean).join(' ') });
                        }}
                        data-added={!!added[r.id]}
                        className="tap add-btn w-full rounded-lg text-sm"
                      >
                        {added[r.id] ? '✓ Watching' : '+ Watch'}
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
            <MyHome items={homeItems} matches={homeMatches} loading={loading} coverage={coverage} onAdd={addItem} onRemove={removeItem} onOpen={setSelected} compact watching={Object.keys(added).length} />
          </div>
        </section>
      )}

      {/* Category grid */}
      <section className="bg-navy border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">Scout&apos;s on watch</p>
        <h2 className="text-white text-2xl font-extrabold mb-5" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Browse <span className="text-magenta">Categories</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(c => {
            const count = loading || error ? (counts[c.dataCategory ?? c.slug] ?? 0) : recalls.filter(r => r.category === (c.dataCategory ?? c.slug)).length;
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
                  <span className="block text-[13px] font-semibold uppercase tracking-wider cat-sub mt-0.5">
                    {count === 0 ? 'View recalls' : `${count} ${count === 1 ? 'recall' : 'recalls'}`} <span className="cat-arrow" aria-hidden="true">→</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      </section>

      {moved && (
        <div role="status" className="fixed z-40 left-1/2 -translate-x-1/2 bottom-4 w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white text-navy shadow-2xl px-4 py-3 flex items-center gap-3">
          <span className="flex-1 min-w-0 text-sm leading-snug">
            <span className="font-bold">Saved to My Home.</span> <span className="line-clamp-1">{moved.name}</span>
          </span>
          <button type="button" onClick={() => { toggle(moved.item); setMoved(null); }} className="tap px-3 rounded-full text-sm font-bold text-navy underline underline-offset-4 flex-shrink-0">Undo</button>
          <Link href="/my-home" className="tap px-4 rounded-full text-sm font-bold bg-magenta text-white flex-shrink-0">View</Link>
        </div>
      )}

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
