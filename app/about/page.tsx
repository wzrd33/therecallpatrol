import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | Recall Patrol',
  description: 'What Recall Patrol checks, where the data comes from, and what it does not cover.',
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-white text-xl font-extrabold tracking-tight mt-8 mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{children}</h2>
);

export default function AboutPage() {
  return (
    <div className="bg-navy text-white flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-white/80 leading-relaxed">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">About</p>
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          How Recall Patrol <span className="text-magenta">works</span>
        </h1>
        <p>
          Recall Patrol helps you find out whether something in your home has been recalled. Scout, our beagle,
          keeps an eye on new recall notices and checks them against the list of things you tell him you own.
        </p>

        <H2>Where the data comes from</H2>
        <p>
          Every recall on this site comes from the U.S. Consumer Product Safety Commission (CPSC) public recall
          database. Each one links to the official CPSC notice, which is the final word on which models are
          affected and what the remedy is. Recall Patrol is independent and is not affiliated with CPSC.
        </p>

        <H2>What is covered</H2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Consumer products: toys, baby gear, furniture, appliances, electronics, tools, and outdoor gear.</li>
          <li>Recalls announced in roughly the last two years.</li>
          <li>The list refreshes several times an hour when CPSC is reachable.</li>
        </ul>

        <H2>What is not covered</H2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Food, medicine, cosmetics, cars, car seats, and boats. Other agencies run those recalls.</li>
          <li>Recalls older than about two years.</li>
          <li>Recalls outside the United States.</li>
        </ul>

        <H2>How My Home matches your products</H2>
        <p>
          When you add a product, Scout compares the words you typed with each recall&apos;s product name and headline.
          If you include a model number, he also looks for it in the recall&apos;s description. A model match is
          a strong signal. A name match means the brand and product type line up, and you should compare the
          model number on the official notice.
        </p>
        <p className="mt-3">
          No match means nothing was found in the records above. It is not a guarantee that a product is safe.
        </p>

        <H2>How hazard labels work</H2>
        <p>
          The label on each recall, such as Fire, Choking or Tip-over, is taken from the hazard CPSC names in its
          own headline. The colour shows how serious CPSC&apos;s wording is: most recalls mention a risk of
          serious injury or death and are marked accordingly.
        </p>

        <H2>Alerts</H2>
        <p>
          Email alerts are not switched on yet. For now, Scout checks your list each time you visit.
        </p>

        <H2>Contact</H2>
        <p>
          Questions, corrections, or a recall that looks wrong? Email{' '}
          <a href="mailto:team@therecallpatrol.com" className="text-yellow font-bold underline underline-offset-2">team@therecallpatrol.com</a>.
        </p>

        <p className="mt-8">
          <Link href="/privacy" className="text-cyan-light underline underline-offset-2">Read the privacy note</Link>
        </p>
      </div>
    </div>
  );
}
