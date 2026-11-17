'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readProfile, PROFILE_EVENT } from '@/hooks/use-patrol';

/**
 * Header button. Shows "Add Nickname" until this device has a saved nickname, then
 * the nickname itself. Either way it opens the nickname page, where it can be set
 * or changed. The profile lives in this browser only, so a new device or cleared
 * browser data shows "Add Nickname" again.
 */
export function AccountButton() {
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const sync = () => setNickname(readProfile()?.nickname?.trim() ?? '');
    sync();
    window.addEventListener(PROFILE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PROFILE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (nickname) {
    return (
      <Link
        href="/signup"
        aria-label={`Change nickname, currently ${nickname}`}
        title="Change nickname"
        className="ml-1 px-3 py-3 max-w-[6.25rem] sm:max-w-[9.5rem] rounded-full flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-white border border-white/25 hover:bg-white/10 transition-colors"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <span aria-hidden="true">🐶</span>
        <span className="truncate">{nickname}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/signup"
      aria-label="Add a nickname"
      className="ml-1 px-3 sm:px-4 py-3 bg-yellow text-navy text-sm font-bold rounded-full flex-shrink-0 hover:opacity-90 transition-opacity"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <span className="max-sm:hidden">Add&nbsp;</span>Nickname
    </Link>
  );
}
