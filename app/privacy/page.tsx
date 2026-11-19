import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy',
  alternates: { canonical: '/privacy' },
  description: 'What Recall Patrol stores, and where.',
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-white text-xl font-extrabold tracking-tight mt-8 mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{children}</h2>
);

export default function PrivacyPage() {
  return (
    <div className="bg-navy text-white flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-white/80 leading-relaxed">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">Privacy</p>
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          What we <span className="text-magenta">store</span>
        </h1>
        <p>Short version: what you type into Recall Patrol stays in your own browser.</p>

        <H2>What stays on your device</H2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your nickname, plus your email address and zip code if you choose to add them.</li>
          <li>The products you add to My Home.</li>
          <li>Recalls you add to your watchlist.</li>
          <li>The date of your last visit and your patrol streak.</li>
        </ul>
        <p className="mt-3">
          These are saved in your browser&apos;s local storage. They are not sent to Recall Patrol and we cannot see
          them. That also means they do not follow you to another phone or computer.
        </p>

        <H2>How to delete it</H2>
        <p>
          Clear this site&apos;s data in your browser settings and everything above is gone. You can also remove
          single items with the × button beside them.
        </p>

        <H2>What our host can see</H2>
        <p>
          Like any website, our hosting provider keeps standard server logs, such as IP address and browser
          type, to run and protect the service. We also use our host&apos;s built-in analytics to count visits
          and see which pages are used, so we can keep the site running well. It does not use cookies and does
          not identify you. We do not use advertising trackers or sell data.
        </p>

        <H2>When this changes</H2>
        <p>
          When email alerts launch, we will need to store your email address on our servers to send them. We
          will ask you first, and this page will be updated before that happens.
        </p>

        <H2>Contact</H2>
        <p>
          Email{' '}
          <a href="mailto:team@therecallpatrol.com" className="text-yellow font-bold underline underline-offset-2">team@therecallpatrol.com</a>.
        </p>

        <p className="mt-8">
          <Link href="/about" className="text-cyan-light underline underline-offset-2">How Recall Patrol works</Link>
        </p>
      </div>
    </div>
  );
}
