'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Welcome to the Patrol!</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">Scout is on the job. We'll alert you the moment a recalled product matches your lists.</p>
        <Link href="/" className="btn-primary">Go to Feed</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <Image src="/images/scout-logo.webp" alt="Scout" width={110} height={110} className="mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          Join the <span className="text-magenta">Patrol</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Scout watches recalled products for your household — free forever.</p>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); setSubmitted(true); }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1" htmlFor="nick">Nickname</label>
          <input id="nick" type="text" required placeholder="What should Scout call you?" autoComplete="nickname"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" required placeholder="you@email.com" autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Date of Birth</label>
          <div className="flex gap-2">
            <select required autoComplete="bday-month"
              className="flex-1 px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all">
              <option value="">Month</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input type="number" required placeholder="Day" min={1} max={31} autoComplete="bday-day"
              className="w-20 px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all" />
            <input type="number" required placeholder="Year" min={1920} max={2010} autoComplete="bday-year"
              className="w-24 px-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1" htmlFor="zip">Zip Code</label>
          <input id="zip" type="text" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="12345" autoComplete="postal-code"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all" />
          <p className="text-xs text-muted-foreground mt-1">Used to show recalls near you</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1" htmlFor="pass">Password</label>
          <input id="pass" type="password" required placeholder="Create a password" autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/20 transition-all" />
        </div>

        <button type="submit" className="w-full py-4 bg-magenta text-white font-extrabold rounded-full hover:opacity-90 active:scale-98 transition-all mt-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          🐾 Start Patrolling
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <button className="text-magenta font-semibold hover:underline" onClick={() => alert('Sign-in coming soon!')}>Sign in</button>
      </p>
    </div>
  );
}
