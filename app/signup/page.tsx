'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { saveProfile } from '@/hooks/use-patrol';

export default function SignupPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [zip, setZip] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-navy text-white flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🐾</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>You're on patrol, {nickname.trim()}!</h1>
        <p className="text-white/70 mb-2 max-w-sm">Your details are saved on this device. Next, tell Scout what's in your house so it can check it every time you visit.</p>
        <p className="text-white/50 text-sm mb-6 max-w-sm">Daily email alerts aren't switched on yet. You'll be able to turn them on here when they are.</p>
        <Link href="/#my-home" className="btn-primary">Set up My Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-navy text-white flex-1">
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-6">
        <Image src="/images/scout-logo.webp" alt="Scout" width={110} height={110} className="mx-auto mb-4 rounded-2xl -rotate-2" style={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.08), 0 0 40px -6px rgba(255,43,133,0.6)' }} />
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Join the <span className="text-magenta">Patrol</span>
        </h1>
        <p className="text-white/70 text-sm mt-1">Scout watches recalled products for your household. Free, and no password to remember.</p>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          saveProfile({ nickname: nickname.trim(), email: email.trim(), zip: zip.trim() });
          setSubmitted(true);
        }}
        className="signup-card space-y-4"
      >
        <div>
          <label className="field-label" htmlFor="nick">Nickname</label>
          <input id="nick" type="text" required maxLength={30} value={nickname} onChange={e => setNickname(e.target.value)}
            placeholder="What should Scout call you?" autoComplete="nickname" className="field w-full" />
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com" autoComplete="email" className="field w-full" />
          <p className="text-xs text-white/55 mt-1">For daily alerts once they launch. Kept on this device until then.</p>
        </div>

        <div>
          <label className="field-label" htmlFor="zip">Zip Code <span className="normal-case tracking-normal font-normal text-white/50">(optional)</span></label>
          <input id="zip" type="text" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={zip} onChange={e => setZip(e.target.value)}
            placeholder="12345" autoComplete="postal-code" className="field w-full" />
        </div>

        <button type="submit" className="btn-primary w-full !mt-6" style={{ minHeight: 56 }}>
          Start Patrolling
        </button>
      </form>
    </div>
    </div>
  );
}
