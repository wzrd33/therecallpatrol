'use client';

import { useLists, type ListItem } from '@/lib/lists';

/** "Add to watchlist" for the recall page; the list lives in this browser. */
export function WatchButton({ item }: { item: ListItem }) {
  const { added, toggle } = useLists();
  const on = !!added[item.id];
  return (
    <button type="button" aria-pressed={on} data-added={on} onClick={() => toggle(item)} className="tap add-btn flex-1 rounded-full text-sm px-4">
      {on ? '✓ On my watchlist' : '+ Add to watchlist'}
    </button>
  );
}
