'use client';

import { useState } from 'react';
import type { Recall } from '@/types/recalls';
import { recallEmoji } from '@/components/recall-sheet';
import { recallName } from '@/utils/recall-name';

// "Today" is the U.S. Eastern date for every visitor and for the server, so the pick and its
// label don't change with the visitor's time zone or the server's clock
const DAY_ZONE = 'America/New_York';

function easternDayNumber(now: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: DAY_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(now).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Same pick for everyone all day: rotates through recent high-risk recalls by Eastern calendar day. */
export function pickRecallOfDay(recalls: Recall[], now = new Date()): Recall | null {
  if (recalls.length === 0) return null;
  const recent = [...recalls].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
  const pool = recent.filter(r => r.severity === 'high');
  const from = pool.length > 0 ? pool : recent;
  return from[easternDayNumber(now) % from.length];
}

export function RecallOfDay({ recall, onOpen }: { recall: Recall | null; onOpen: (r: Recall) => void }) {
  const [copied, setCopied] = useState(false);

  if (!recall) return <div className="panel min-h-[260px] animate-pulse" aria-hidden="true" />;

  const share = async () => {
    const data = { title: recall.products || recall.title, text: recall.title, url: recall.url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(recall.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="panel" data-accent="yellow" aria-labelledby="rotd-title">
      <p className="panel-eyebrow">
        Recall of the day · {new Date().toLocaleDateString('en-US', { timeZone: DAY_ZONE, month: 'short', day: 'numeric' })}
      </p>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-4xl leading-none" aria-hidden="true">{recallEmoji(recall)}</span>
        <h2 id="rotd-title" className="panel-title !mb-0 line-clamp-3">{[recallName(recall).brand, recallName(recall).product].filter(Boolean).join(' ')}</h2>
      </div>
      <p className="text-white/75 text-sm leading-relaxed line-clamp-4 mb-3">{recall.hazard}</p>
      <p className="text-sm text-white mb-4">
        <span className="font-bold text-yellow">If you own one: </span>
        stop using it, then follow the official notice for the refund, repair or replacement.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onOpen(recall)} className="tap add-btn flex-1 rounded-full text-sm px-4">See details</button>
        <button type="button" onClick={share} className="tap flex-1 rounded-full text-sm px-4 text-white/80 hover:bg-white/10" aria-live="polite">
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>
    </section>
  );
}
