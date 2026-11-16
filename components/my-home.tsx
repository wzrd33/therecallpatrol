'use client';

import { useState } from 'react';
import type { Recall } from '@/types/recalls';
import type { HomeItem } from '@/hooks/use-home-items';
import type { OwnedMatch } from '@/utils/recall-match';
import { recallName } from '@/utils/recall-name';

const EXAMPLES = ['Space heater', 'Air fryer', 'Power bank', 'Peanut butter'];

export function MyHome({ items, matches, loading, coverage, onAdd, onRemove, onOpen }: {
  items: HomeItem[];
  matches: Record<string, OwnedMatch[]>;
  loading: boolean;
  /** What was searched, e.g. "981 CPSC recalls, Nov 2024 to Nov 2026" */
  coverage: string;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onOpen: (r: Recall) => void;
}) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const alerts = items.filter(i => (matches[i.id]?.length ?? 0) > 0).length;

  const summary = loading
    ? 'Scout is checking your list…'
    : items.length === 0
      ? 'List the things you own, with the model number if you have it. Scout checks them each time you visit.'
      : alerts > 0
        ? `${alerts} of your ${items.length} ${items.length === 1 ? 'thing' : 'things'} may be affected. Tap to compare the details.`
        : `Scout checked ${items.length} ${items.length === 1 ? 'thing' : 'things'}. No matching recalls found in our current records.`;

  return (
    <section id="my-home" className="panel scroll-mt-20" aria-labelledby="my-home-title">
      <p className="panel-eyebrow">My Home</p>
      <h2 id="my-home-title" className="panel-title">What's in <span className="text-magenta">your house?</span></h2>
      <p className="text-white/70 text-sm mb-4" aria-live="polite">{summary}</p>

      <form
        className="flex gap-2 mb-3"
        onSubmit={e => { e.preventDefault(); onAdd(draft); setDraft(''); }}
      >
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="e.g. Gourmia air fryer GTF7530"
          aria-label="A product you own"
          maxLength={60}
          autoComplete="off"
          enterKeyHint="done"
          className="field flex-1 min-w-0"
        />
        <button type="submit" disabled={!draft.trim()} className="tap add-btn px-5 rounded-xl text-sm disabled:opacity-40">Add</button>
      </form>

      {items.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-white/50 text-xs self-center">Try:</span>
          {EXAMPLES.map(x => (
            <button key={x} type="button" onClick={() => onAdd(x)} className="tap !min-h-[36px] px-3 rounded-full text-xs text-white/80 bg-white/10 hover:bg-white/15">+ {x}</button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-white/10">
          {items.map(item => {
            const hits = matches[item.id] ?? [];
            const open = expanded === item.id;
            return (
              <li key={item.id} className="py-1">
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 truncate text-white text-sm font-semibold">{item.name}</span>
                  {loading ? (
                    <span className="text-white/40 text-xs">Checking…</span>
                  ) : hits.length > 0 ? (
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpanded(open ? null : item.id)}
                      className="tap px-3 rounded-full text-xs bg-magenta text-white"
                    >
                      ⚠ {hits.length} {hits.length === 1 ? 'recall' : 'recalls'} {open ? '▴' : '▾'}
                    </button>
                  ) : (
                    <span className="text-white/60 text-xs font-bold whitespace-nowrap">No match found</span>
                  )}
                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)} className="tap w-11 h-11 rounded-full text-white/50 text-xl hover:bg-white/10 hover:text-white flex-shrink-0">×</button>
                </div>
                {open && hits.length > 0 && (
                  <ul className="pb-2 pl-1 space-y-1">
                    {hits.slice(0, 8).map(({ recall: r, kind, model }) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => onOpen(r)} className="search-hit !min-h-[44px] !py-2">
                          <span className="block flex-1 min-w-0">
                            <span className="block text-white text-[13px] font-semibold leading-snug line-clamp-2">{[recallName(r).brand, recallName(r).product].filter(Boolean).join(' ')}</span>
                            <span className={`block text-xs mt-0.5 ${kind === 'model' ? 'text-magenta font-bold' : 'text-white/55'}`}>
                              {kind === 'model'
                                ? `${model} appears in this recall. Confirm the lot, serial or date range.`
                                : 'Same name. Compare the model or lot code on the notice.'}
                            </span>
                            <span className="block text-white/45 text-xs mt-0.5">{r.dateFormatted}</span>
                          </span>
                          <span className="text-yellow text-lg flex-shrink-0" aria-hidden="true">›</span>
                        </button>
                      </li>
                    ))}
                    {hits.length > 8 && <li className="px-3 text-white/50 text-xs">and {hits.length - 8} more. Use search to see them all.</li>}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-white/45 text-xs mt-3">
        {coverage ? `Checked against ${coverage}. ` : ''}Older recalls, meat and poultry, medicine and vehicles are not covered, so no match is not a guarantee that a product is safe. Your list is saved on this device only.
      </p>
    </section>
  );
}
