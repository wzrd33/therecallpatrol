'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Recall } from '@/types/recalls';
import { loadRecallList } from '@/lib/recall-list';
import { useLists, type ListItem } from '@/lib/lists';
import { useHomeItems } from '@/hooks/use-home-items';
import { readProfile } from '@/hooks/use-patrol';
import { findOwnedMatchesDetailed, type OwnedMatch } from '@/utils/recall-match';
import { recallFullName, recallPath, hazardTag } from '@/utils/recall-name';
import { MyHome } from '@/components/my-home';
import { RecallSheet } from '@/components/recall-sheet';
import { SearchLauncher } from '@/components/product-search';

/** Everything this visitor is tracking: the items they own, and the recalls they chose to watch. */
export function MyHomePage() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Recall | null>(null);
  const [nickname, setNickname] = useState('');
  const [watched, setWatched] = useState<ListItem[]>([]);
  const { added, toggle, getAll } = useLists();
  const { items, addItem, removeItem } = useHomeItems();

  useEffect(() => {
    setNickname(readProfile()?.nickname?.trim() ?? '');
    loadRecallList()
      .then(d => { setRecalls(d.recalls ?? []); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
  }, []);

  // The saved list is the source of truth; `added` changes whenever something is watched or removed
  useEffect(() => { setWatched(getAll().slice().reverse()); }, [added, getAll]);

  const byId = useMemo(() => new Map(recalls.map(r => [String(r.id), r])), [recalls]);
  const matches = useMemo(() => {
    const out: Record<string, OwnedMatch[]> = {};
    items.forEach(i => { out[i.id] = findOwnedMatchesDetailed(recalls, i.name); });
    return out;
  }, [items, recalls]);

  const coverage = recalls.length > 0 ? `${recalls.length.toLocaleString('en-US')} recent U.S. product and food recalls` : '';

  return (
    <div className="bg-navy text-white flex-1">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <p className="text-cyan text-[13px] font-bold uppercase tracking-widest mb-1">{nickname ? `${nickname}'s patrol` : 'Your patrol'}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          My <span className="text-magenta">Home</span>
        </h1>
        <p className="text-white/70 mb-6">
          The items you own and the recalls you&apos;re watching, in one place. Saved on this device only.{' '}
          <Link href="/signup" className="underline underline-offset-4 hover:text-white">{nickname ? 'Change nickname' : 'Add a nickname'}</Link>
        </p>

        {failed && <p className="text-yellow text-sm mb-4">Scout could not reach the recall list just now, so your items are not being checked. Try again in a few minutes.</p>}

        <div className="space-y-6">
          <MyHome items={items} matches={matches} loading={loading} coverage={coverage} onAdd={addItem} onRemove={removeItem} onOpen={setSelected} />

          <section className="panel" data-accent="yellow" aria-labelledby="watching-title">
            <p className="panel-eyebrow">Recalls I&apos;m watching</p>
            <h2 id="watching-title" className="panel-title">
              {watched.length === 0 ? 'Nothing watched yet' : `${watched.length} ${watched.length === 1 ? 'recall' : 'recalls'} saved`}
            </h2>

            {watched.length === 0 ? (
              <>
                <p className="text-white/70 text-sm mb-4">
                  Tap <strong className="text-white">+ Watch</strong> on any recall to keep it here, so you can come back to it without searching again.
                </p>
                <SearchLauncher />
              </>
            ) : (
              <ul className="divide-y divide-white/10">
                {watched.map(item => {
                  const r = byId.get(String(item.id));
                  // Recalls saved a while ago may have left the two-year list; the official link still works
                  const name = r ? recallFullName(r) : item.title;
                  return (
                    <li key={item.id} className="py-2 flex items-center gap-2">
                      <a
                        href={r ? recallPath(r) : item.url}
                        {...(r ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                        onClick={e => { if (!r || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); setSelected(r); }}
                        className="flex-1 min-w-0 py-1 rounded-lg hover:bg-white/5"
                      >
                        <span className="block text-white text-sm font-semibold leading-snug line-clamp-2">{name}</span>
                        <span className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="sev-pill" data-on-dark="" data-sev={item.severity}>{hazardTag(item.title)}</span>
                          <span className="text-white/60 text-xs">{item.date}{!r && !loading ? ' · official notice ↗' : ''}</span>
                        </span>
                      </a>
                      <button
                        type="button"
                        aria-label={`Stop watching ${name}`}
                        onClick={() => toggle(item)}
                        className="tap w-11 h-11 rounded-full text-white/50 text-xl hover:bg-white/10 hover:text-white flex-shrink-0"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
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
