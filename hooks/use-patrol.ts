'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Recall } from '@/types/recalls';

const SEEN_KEY = 'rp_seen_through';        // newest recall date this browser has been shown
const LAST_VISIT_KEY = 'rp_last_visit';    // when this browser last opened the site
const SESSION_BASE_KEY = 'rp_session_base';   // snapshot of SEEN_KEY taken when this tab session began
const SESSION_LAST_KEY = 'rp_session_last';   // snapshot of LAST_VISIT_KEY taken when this tab session began
const STREAK_KEY = 'rp_streak';
const PROFILE_KEY = 'rp_profile';

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface Profile { nickname: string; email?: string; zip?: string }

export function readProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null'); } catch { return null; }
}
export function saveProfile(p: Profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

/**
 * Tracks what is new since the previous visit, and a gentle day streak.
 * "New" is fixed for the whole tab session, so badges do not vanish on a refresh.
 */
export function usePatrol(recalls: Recall[]) {
  const [baseline, setBaseline] = useState<string | null>(null); // null = not ready, '' = first ever visit
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  const [streak, setStreak] = useState(0);
  const [nickname, setNickname] = useState('');

  // Day streak: +1 if the last visit was yesterday, unchanged if today, otherwise start again at 1
  useEffect(() => {
    try {
      const today = dayKey(new Date());
      const y = new Date(); y.setDate(y.getDate() - 1);
      const saved = JSON.parse(localStorage.getItem(STREAK_KEY) ?? 'null') as { count: number; day: string } | null;
      let count = 1;
      if (saved?.day === today) count = saved.count;
      else if (saved?.day === dayKey(y)) count = saved.count + 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count, day: today }));
      setStreak(count);
      setNickname(readProfile()?.nickname ?? '');
    } catch { setStreak(1); }
  }, []);

  useEffect(() => {
    if (recalls.length === 0) return;
    const newest = recalls.reduce((m, r) => (r.date > m ? r.date : m), '');
    try {
      let base = sessionStorage.getItem(SESSION_BASE_KEY);
      let last = sessionStorage.getItem(SESSION_LAST_KEY);
      if (base === null) {
        base = localStorage.getItem(SEEN_KEY) ?? '';
        last = localStorage.getItem(LAST_VISIT_KEY) ?? '';
        sessionStorage.setItem(SESSION_BASE_KEY, base);
        sessionStorage.setItem(SESSION_LAST_KEY, last);
      }
      localStorage.setItem(SEEN_KEY, newest);
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      setBaseline(base);
      setLastVisit(last ? new Date(last) : null);
    } catch { setBaseline(''); }
  }, [recalls]);

  const newIds = useMemo(() => {
    const ids = new Set<string>();
    if (baseline) recalls.forEach(r => { if (r.date > baseline) ids.add(r.id); });
    return ids;
  }, [recalls, baseline]);

  return { ready: baseline !== null, firstVisit: baseline === '', newIds, lastVisit, streak, nickname };
}
