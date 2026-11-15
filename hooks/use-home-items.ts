'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'rp_home_items';
const MAX_ITEMS = 100;

export interface HomeItem { id: string; name: string }

/** The products someone says they own. Saved in this browser only. */
export function useHomeItems() {
  const [items, setItems] = useState<HomeItem[]>([]);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch {}
  }, []);

  const persist = (next: HomeItem[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  };

  const addItem = useCallback((raw: string) => {
    const name = raw.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!name) return;
    setItems(prev => {
      if (prev.length >= MAX_ITEMS || prev.some(i => i.name.toLowerCase() === name.toLowerCase())) return prev;
      return persist([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name }, ...prev]);
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => persist(prev.filter(i => i.id !== id)));
  }, []);

  return { items, addItem, removeItem };
}
