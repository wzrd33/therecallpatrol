'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { readProfile, saveProfile } from '@/hooks/use-patrol';

export default function NicknamePage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');
  const [existing, setExisting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fill in whatever this device already has, so the page works as "change nickname"
  useEffect(() => {
    const p = readProfile();
    if (!p?.nickname) return;
    setExisting(true);
    setNickname(p.nickname);
    setEmail(p.email ?? '');
    setZip(p.zip ?? '');
  }, []);

  if (saved) {
    return (
      <div className="bg-navy text-white flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🐶</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Saved. Hi, {nickname.trim()}!</h1>
        <p className="text-white/70 mb-6 max-w-sm">Your nickname is saved on this device. Tell Scout what's in your house so it can check it every time you visit.</p>
        <Link href="/#my-home" className="btn-primary">Go to My Home</Link>
        <button type="button" onClick={() => { setExisting(true); setSaved(false); }} className="mt-4 text-sm text-white/60 underline underline-offset-4 hover:text-white">
          Change it again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-navy text-white flex-1">
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6">
        <Image src="/images/scout-logo.webp" alt="Scout" width={110} height={110} className="mx-auto mb-4 rounded-2xl -rotate-2" style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 0 40px -6px rgba(255,43,133,0.6)' }} />
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          {existing ? 'Change your ' : 'Pick a '}<span className="text-magenta">nickname</span>
        </h1>
        <p className="text-white/70 text-sm mt-1">It's what Scout calls you. No account and no password, just saved on this device.</p>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          saveProfile({ nickname: nickname.trim(), email: email.trim(), zip: zip.trim() });
          setSaved(true);
        }}
        className="signup-card space-y-4"
      >
        <div>
          <label className="field-label" htmlFor="nick">Nickname</label>
          <input id="nick" type="text" required pattern=".*\S.*" title="Enter a nickname" maxLength={30} value={nickname} onChange={e => setNickname(e.target.value)}
            placeholder="What should Scout call you?" autoComplete="nickname" className="field w-full" />
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email <span className="normal-case tracking-normal font-normal text-white/50">(optional)</span></label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com" autoComplete="email" className="field w-full" />
          <p className="text-xs text-white/55 mt-1">For daily alerts once they launch. Kept on this device until then.</p>
        </div>

        <div>
          <label className="field-label" htmlFor="zip">Zip Code <span className="normal-case tracking-normal font-normal text-white/50">(optional)</span></label>
          <input id="zip" type="text" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={e => setZip(e.target.value)}
            placeholder="12345" autoComplete="postal-code" className="field w-full" />
        </div>

        <button type="submit" className="btn-primary w-full !mt-6" style={{ minHeight: 56 }}>
          Save
        </button>
      </form>
    </div>
    </div>
  );
}
