import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ProductSearch } from '@/components/product-search';
import { AccountButton } from '@/components/account-button';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://therecallpatrol.com'),
  title: 'Recall Patrol | Guard Your Home',
  description: 'Check what you own against U.S. consumer product recalls: toys, appliances, furniture, and more. Free household safety tracking.',
  openGraph: {
    title: 'Recall Patrol | Guard Your Home',
    description: 'Check what you own against U.S. consumer product recalls.',
    url: 'https://therecallpatrol.com',
    siteName: 'Recall Patrol',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Nav */}
        <header className="sticky top-0 z-50 bg-navy border-b-2 border-magenta">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 py-1">
              <Image src="/images/scout-logo.webp" alt="Scout" width={36} height={36} className="rounded-md" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: 'white', lineHeight: 1.1 }}>
                RECALL<br /><span className="text-yellow">PATROL</span>
              </span>
            </Link>
            <nav className="flex gap-1 ml-auto">
              <Link href="/" className="max-sm:hidden px-3 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                Feed
              </Link>
              <Link href="/categories" className="px-2 sm:px-3 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                Categories
              </Link>
            </nav>
            <ProductSearch />
            <AccountButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="bg-navy border-t border-white/10 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/50 text-sm">
            <div className="flex items-center gap-2">
              <Image src="/images/scout-logo.webp" alt="Scout" width={28} height={28} className="rounded-md opacity-70" />
              <span>Recall Patrol. Keeping households safe.</span>
            </div>
            <nav aria-label="Site information" className="flex gap-1">
              <Link href="/about" className="px-3 py-3 hover:text-white">About</Link>
              <Link href="/privacy" className="px-3 py-3 hover:text-white">Privacy</Link>
              <a href="mailto:team@therecallpatrol.com" className="px-3 py-3 hover:text-white">Contact</a>
            </nav>
            <span className="text-center sm:text-right">
              Recall data from the U.S. Consumer Product Safety Commission, last two years.<br />
              © {new Date().getFullYear()} therecallpatrol.com
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
