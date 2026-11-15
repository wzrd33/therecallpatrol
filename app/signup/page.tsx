'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="bg-navy text-white flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Welcome to the Patrol!</h1>
        <p className="text-white/70 mb-6 max-w-sm">Scout is on the job. We'll alert you the moment a recalled product matches your lists.</p>
        <Link href="/" className="btn-primary">Go to Feed</Link>
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
        <p className="text-white/70 text-sm mt-1">Scout watches recalled products for your household — free forever.</p>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
        className="signup-card space-y-4"
      >
        <div>
          <label className="field-label" htmlFor="nick">Nickname</label>
          <input id="nick" type="text" required placeholder="What should Scout call you?" autoComplete="nickname"
            className="field w-full" />
        </div>

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" required placeholder="you@email.com" autoComplete="email"
            className="field w-full" />
        </div>

        <div>
          <label className="field-label">Date of Birth</label>
          <div className="flex gap-2">
            <select required autoComplete="bday-month"
              className="field flex-1 min-w-0">
              <option value="">Month</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input type="number" required placeholder="Day" min={1} max={31} autoComplete="bday-day"
              className="field w-20" />
            <input type="number" required placeholder="Year" min={1920} max={2010} autoComplete="bday-year"
              className="field w-24" />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="zip">Zip Code</label>
          <input id="zip" type="text" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="12345" autoComplete="postal-code"
            className="field w-full" />
          <p className="text-xs text-white/55 mt-1">Used to show recalls near you</p>
        </div>

        <div>
          <label className="field-label" htmlFor="pass">Password</label>
          <input id="pass" type="password" required placeholder="Create a password" autoComplete="new-password"
            className="field w-full" />
        </div>

        <button type="submit" className="btn-primary w-full !mt-6" style={{ minHeight: 56 }}>
          🐾 Start Patrolling
        </button>
      </form>

      <p className="text-center text-sm text-white/60 mt-3">
        Already have an account?{' '}
        <button type="button" className="tap px-2 text-yellow hover:underline" onClick={() => alert('Sign-in coming soon!')}>Sign in</button>
      </p>
    </div>
    </div>
  );
}
