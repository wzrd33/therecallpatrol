import type { Metadata } from 'next';
import Link from 'next/link';
import { usdaAsOf, usdaRecalls } from '@/lib/usda';

export const metadata: Metadata = {
  title: 'About',
  alternates: { canonical: '/about' },
  description: 'What Recall Patrol checks, where the data comes from, and what it does not cover.',
};

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-white text-xl font-extrabold tracking-tight mt-8 mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{children}</h2>
);

export default function AboutPage() {
  const hasUsda = usdaRecalls().length > 0;
  const usdaDate = usdaAsOf
    ? new Date(`${usdaAsOf}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : '';
  return (
    <div className="bg-navy text-white flex-1">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-white/80 leading-relaxed">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">About</p>
        <h1 className="text-white text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
          How Recall Patrol <span className="text-magenta">works</span>
        </h1>
        <p>
          Recall Patrol helps you find out whether something in your home has been recalled. Scout, our beagle,
          keeps an eye on new recall notices and checks them against the list of items you tell him you own.
        </p>

        <H2>Where the data comes from</H2>
        <p>
          Product recalls come from the U.S. Consumer Product Safety Commission (CPSC) public recall database,
          and each one links to its official CPSC notice. Food recalls come from the U.S. Food and Drug
          Administration (FDA) through its openFDA service, and each one links to its FDA enforcement report.{hasUsda ? ' Meat and poultry recalls come from the USDA Food Safety and Inspection Service and link to its notices.' : ''} The official
          notice is the final word on what is affected and what the remedy is. Recall Patrol is independent
          and is not affiliated with any of these agencies.
        </p>

        <H2>What is covered</H2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Consumer products: toys, baby gear, furniture, appliances, electronics, tools, and outdoor gear.</li>
          <li>Product recalls announced in roughly the last two years. The list refreshes several times an hour when CPSC is reachable.</li>
          <li>Food and dietary supplements regulated by FDA, from roughly the last eight months.</li>
          <li>FDA publishes its recall reports weekly, so a food recall can be in the news a few days before it appears here.</li>
          {hasUsda && (
            <li>
              Meat, poultry and egg products from the USDA Food Safety and Inspection Service, from roughly the last
              18 months. USDA does not allow automatic updates, so we add its list by hand about once a week.
              {usdaDate && ` USDA data was last updated ${usdaDate}.`}
            </li>
          )}
        </ul>

        <H2>What is not covered</H2>
        <ul className="list-disc pl-5 space-y-1">
          {!hasUsda && <li>Meat, poultry and egg products, which the USDA handles.</li>}
          <li>Medicine, medical devices, cosmetics, cars, car seats, and boats.</li>
          <li>Product recalls older than about two years, and food recalls older than about eight months.</li>
          <li>Recalls outside the United States.</li>
        </ul>

        <H2>How My Home matches your products</H2>
        <p>
          When you add a product, Scout compares the words you typed with each recall&apos;s product name and headline.
          If you include a model number or lot code, he also looks for it in the recall&apos;s description. A model match is
          a strong signal. A name match means the brand and product type line up, and you should compare the
          model number on the official notice.
        </p>
        <p className="mt-3">
          No match means nothing was found in the records above. It is not a guarantee that a product is safe.
        </p>

        <H2>How hazard labels work</H2>
        <p>
          The label on each recall, such as Fire, Choking, Salmonella or Allergen, is taken from the hazard the
          agency names. For products, the colour shows how serious CPSC&apos;s wording is. For food, it follows
          FDA&apos;s own rating: Class I is the most serious, Class III the least.
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
