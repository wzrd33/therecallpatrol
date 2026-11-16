'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Recall } from '@/types/recalls';
import { useLists } from '@/lib/lists';
import { RecallSheet, recallEmoji } from '@/components/recall-sheet';

const MAX_RESULTS = 25;
const sevRisk = { high: 'High risk', medium: 'Medium risk', low: 'Low risk' };

export function ProductSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recalls, setRecalls] = useState<Recall[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Recall | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { added, toggle } = useLists();

  // Load the recall list the first time the search opens
  useEffect(() => {
    if (!open || recalls) return;
    let cancelled = false;
    setFailed(false);
    fetch('/api/recalls')
      .then(r => { if (!r.ok) throw new Error('recalls unavailable'); return r.json(); })
      .then(d => { if (!cancelled) setRecalls(d.recalls ?? []); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [open, recalls]);

  // Lock page scroll, focus the field, close on Escape (the detail sheet handles its own Escape)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selected]);

  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);

  const matches = useMemo(() => {
    if (!recalls || terms.length === 0) return [];
    return recalls
      .map(r => {
        const title = r.title.toLowerCase();
        const products = (r.products ?? '').toLowerCase();
        const rest = `${r.description ?? ''} ${r.hazard ?? ''}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (products.includes(t)) score += 3;
          else if (title.includes(t)) score += 2;
          else if (rest.includes(t)) score += 1;
          else return null; // every word must match somewhere
        }
        return { r, score };
      })
      .filter((m): m is { r: Recall; score: number } => m !== null)
      .sort((a, b) => b.score - a.score || b.r.date.localeCompare(a.r.date));
  }, [recalls, terms]);

  const shown = matches.slice(0, MAX_RESULTS);

  return (
    <>
      <button
        type="button"
        aria-label="Search for a product"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="tap w-11 h-11 rounded-full text-white/80 hover:text-white hover:bg-white/10 flex-shrink-0"
      >
        <Search size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>

      {open && (
        <div className="search-backdrop" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Search recalled products" className="search-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 p-3 border-b border-white/10">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan pointer-events-none" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search a product or brand…"
                  aria-label="Product or brand name"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="field w-full !pl-10"
                />
              </div>
              <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="tap w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex-shrink-0">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="search-results" aria-live="polite">
              {failed && <p className="search-note">Could not load recall data. Close and try again.</p>}
              {!failed && !recalls && <p className="search-note">Scout is fetching the recall list…</p>}
              {!failed && recalls && terms.length === 0 && (
                <p className="search-note">
                  <span className="block text-3xl mb-2" aria-hidden="true">🔎</span>
                  Type a product or brand name to check it against {recalls.length.toLocaleString()} recent recalls.
                </p>
              )}
              {!failed && recalls && terms.length > 0 && matches.length === 0 && (
                <p className="search-note">
                  <span className="block text-3xl mb-2" aria-hidden="true">🐶</span>
                  No recalls found for “{query.trim()}”. Good news, but check the spelling or try the brand name.
                </p>
              )}
              {shown.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-cyan-light">
                    {matches.length} {matches.length === 1 ? 'recall' : 'recalls'} found
                    {matches.length > MAX_RESULTS && ` · showing first ${MAX_RESULTS}`}
                  </p>
                  <ul className="p-2 pt-1">
                    {shown.map(({ r }) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => setSelected(r)} className="search-hit">
                          <span className="text-2xl flex-shrink-0" aria-hidden="true">{recallEmoji(r)}</span>
                          <span className="block flex-1 min-w-0">
                            <span className="block text-white text-sm font-bold leading-snug line-clamp-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{r.products || r.title}</span>
                            <span className="flex items-center gap-2 flex-wrap mt-1.5">
                              <span className="sev-badge" data-sev={r.severity}>{sevRisk[r.severity]}</span>
                              <span className="text-white/60 text-xs">{r.dateFormatted}</span>
                            </span>
                          </span>
                          <span className="text-yellow text-lg flex-shrink-0" aria-hidden="true">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
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
