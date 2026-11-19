'use client';
import type { Recall } from '@/types/recalls';

// One download of the full recall list per page view, shared by every part of the page
// (the homepage, search, categories, My Home). The browser also keeps a copy between
// visits; see the Cache-Control header in app/api/recalls/route.ts.
let pending: Promise<{ recalls: Recall[] }> | null = null;

export function loadRecallList(): Promise<{ recalls: Recall[] }> {
  if (!pending) {
    pending = fetch('/api/recalls')
      .then(r => { if (!r.ok) throw new Error('recalls unavailable'); return r.json(); })
      .catch(err => { pending = null; throw err; }); // a later call can try again
  }
  return pending;
}
