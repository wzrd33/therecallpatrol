'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Recall } from '@/types/recalls';
import { useLists } from '@/lib/lists';

const CATEGORIES = [
  { slug: 'kids',         label: 'Kids',      emoji: '🧸', bg: 'linear-gradient(145deg,#5B2BA8,#8B1FCC)' },
  { slug: 'pantry',       label: 'Pantry',    emoji: '🥫', bg: 'linear-gradient(145deg,#1A6B40,#2AAE68)' },
  { slug: 'refrigerator', label: 'Fridge',    emoji: '🧊', bg: 'linear-gradient(145deg,#1050A0,#2080D8)' },
  { slug: 'household',    label: 'Household', emoji: '🏠', bg: 'linear-gradient(145deg,#8B5000,#D07020)' },
  { slug: 'pets',         label: 'Pets',      emoji: '🐾', bg: 'linear-gradient(145deg,#9A1A1A,#D04040)' },
];

function recallEmoji(r: Recall): string {
  const t = r.title.toLowerCase();
  if (r.category === 'kids') {
    if (t.includes('stroller') || t.includes('car seat')) return '🚗';
    if (t.includes('toy') || t.includes('game')) return '🧸';
    return '🍼';
  }
  if (r.category === 'pantry') {
    if (t.includes('peanut')) return '🥜';
    if (t.includes('chicken') || t.includes('meat')) return '🍗';
    return '🥫';
  }
  if (r.category === 'refrigerator') return t.includes('refrigerat') ? '❄️' : '🧊';
  if (r.category === 'household') {
    if (t.includes('cable') || t.includes('charger')) return '🔌';
    if (t.includes('fan') || t.includes('heater')) return '🌡️';
    return '🏠';
  }
  if (r.category === 'pets') return '🐾';
  if (t.includes('fire') || t.includes('burn')) return '🔥';
  if (t.includes('food')) return '🍽️';
  return '⚠️';
}

const sevColor = { high: '#FF2B85', medium: '#FFDC28', low: '#00C9D7' };
const sevBg    = { high: 'linear-gradient(160deg,#5A001A,#300010)', medium: 'linear-gradient(160deg,#3A3000,#201800)', low: 'linear-gradient(160deg,#001A28,#000E18)' };

export default function HomePage() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { added, toggle } = useLists();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/recalls')
      .then(r => r.json())
      .then(d => { setRecalls(d.recalls ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy relative overflow-hidden py-12 px-4 text-center">
        {/* Memphis shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" aria-hidden="true">
          <polygon points="40,30 65,70 15,70" fill="#00C9D7"/>
          <polygon points="calc(100% - 40px),20 calc(100% - 15px),60 calc(100% - 65px),60" fill="#FF2B85"/>
          <circle cx="50%" cy="30" r="6" fill="#FFDC28"/>
          <circle cx="calc(50% + 20px)" cy="30" r="6" fill="#FFDC28"/>
          <circle cx="50%" cy="50" r="6" fill="#FFDC28"/>
          <circle cx="calc(50% + 20px)" cy="50" r="6" fill="#FFDC28"/>
        </svg>
        <div className="relative z-10 max-w-xl mx-auto">
          <Image
            src="/images/scout-full.webp"
            alt="Scout the Recall Patrol dog"
            width={220} height={220}
            className="mx-auto mb-5"
            style={{ width: 'min(220px, 55vw)', height: 'auto' }}
            priority
          />
          <p className="text-cyan text-xs font-bold uppercase tracking-widest mb-2">Your Home Safety Partner</p>
          <h1 className="text-white text-4xl font-extrabold leading-tight mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Scout the Recalls.<br />
            <span className="text-magenta">Guard Your Home.</span>
          </h1>
          <p className="text-white/70 mb-6 text-base max-w-md mx-auto">
            Real-time alerts on recalled products — food, toys, appliances, and more.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup" className="btn-primary">Start Patrolling Free</Link>
            <Link href="/categories" className="btn-secondary">Browse by Category</Link>
          </div>
        </div>
      </section>

      {/* Blockbuster Carousel */}
      <section className="bg-navy py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>📼 Now Recalled</h2>
              <span className="px-2 py-0.5 bg-magenta text-white text-xs font-bold rounded uppercase tracking-wide animate-pulse">Live</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white hover:bg-magenta hover:border-magenta transition-colors flex items-center justify-center">‹</button>
              <button onClick={() => scroll(1)}  className="w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white hover:bg-magenta hover:border-magenta transition-colors flex items-center justify-center">›</button>
            </div>
          </div>

          {loading && (
            <div className="px-4 flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-36 h-52 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="px-4 text-white/50 text-sm">Could not load recall data. Try refreshing.</p>
          )}

          {!loading && !error && (
            <div
              ref={trackRef}
              className="flex gap-3 overflow-x-auto pb-2 px-4"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {recalls.map(r => (
                <div
                  key={r.id}
                  className="flex-shrink-0 w-36 rounded-xl overflow-hidden border border-white/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 flex flex-col"
                  style={{ scrollSnapAlign: 'start', background: sevBg[r.severity] }}
                >
                  {/* VHS top */}
                  <div className="h-20 flex items-center justify-center text-4xl relative flex-shrink-0">
                    {recallEmoji(r)}
                    <span
                      className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-bold uppercase"
                      style={{ background: sevColor[r.severity], color: r.severity === 'medium' ? '#1A002D' : 'white' }}
                    >
                      {r.severity}
                    </span>
                  </div>
                  {/* VHS body */}
                  <div className="flex-1 p-2 flex flex-col gap-1">
                    <div className="text-cyan text-xs font-bold uppercase tracking-wide">{r.category}</div>
                    <div className="text-white text-xs font-bold leading-tight line-clamp-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{r.title}</div>
                    <div className="text-white/40 text-xs">{r.dateFormatted}</div>
                    <div className="mt-auto flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => toggle({ id: r.id, title: r.title, category: r.category, severity: r.severity, date: r.dateFormatted, url: r.url })}
                        className="w-full py-1 rounded text-xs font-semibold transition-colors"
                        style={{ background: added[r.id] ? '#259A36' : '#FF2B85', color: 'white' }}
                      >
                        {added[r.id] ? '✓ Added' : '+ Add'}
                      </button>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1 rounded text-xs text-center border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
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

      {/* Category grid */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Your Lists</p>
        <h2 className="text-2xl font-extrabold mb-5" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Scout's <span className="text-magenta">On Watch</span>
        </h2>
        <div className="grid grid-cols-5 gap-3 max-sm:grid-cols-3">
          {CATEGORIES.map(c => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="aspect-square rounded-2xl relative overflow-hidden hover:scale-105 transition-transform duration-200 shadow-md"
              style={{ background: c.bg }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-white text-xs font-bold text-center leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{c.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
