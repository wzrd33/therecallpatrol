'use client';
import { useState, useEffect, useCallback } from 'react';

const KEY = 'rp_watchlist';

export interface ListItem {
  id: string;
  title: string;
  category: string;
  severity: string;
  date: string;
  url: string;
}

export function useLists() {
  const [added, setAdded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const items: ListItem[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      const map: Record<string, boolean> = {};
      items.forEach(i => { map[i.id] = true; });
      setAdded(map);
    } catch {}
  }, []);

  const toggle = useCallback((item: ListItem) => {
    setAdded(prev => {
      const next = { ...prev, [item.id]: !prev[item.id] };
      if (!next[item.id]) delete next[item.id];
      try {
        let items: ListItem[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
        // Remove first so a repeated call can never store the same recall twice
        items = items.filter(i => i.id !== item.id);
        if (next[item.id]) items.push(item);
        localStorage.setItem(KEY, JSON.stringify(items));
      } catch {}
      return next;
    });
  }, []);

  const getAll = useCallback((): ListItem[] => {
    try {
      const items: ListItem[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      // Lists saved before the fix above may hold repeats
      return items.filter((x, i) => items.findIndex(y => y.id === x.id) === i);
    } catch { return []; }
  }, []);

  const getByCategory = useCallback((cat: string): ListItem[] => {
    return getAll().filter(i => i.category === cat);
  }, [getAll]);

  const countByCategory = useCallback((cat: string): number => {
    return getAll().filter(i => i.category === cat).length;
  }, [getAll]);

  return { added, toggle, getAll, getByCategory, countByCategory };
}
