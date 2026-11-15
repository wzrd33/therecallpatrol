import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ProductSearch } from '@/components/product-search';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://therecallpatrol.com'),
  title: 'Recall Patrol | Guard Your Home',
  description: 'Real-time alerts on recalled products: food, toys, appliances, and more. Free household safety tracking.',
  openGraph: {
    title: 'Recall Patrol | Guard Your Home',
    description: 'Real-time alerts on recalled products for your household.',
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
            <Link
              href="/signup"
              className="ml-1 px-4 py-3 bg-yellow text-navy text-sm font-bold rounded-full flex-shrink-0 hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Sign Up
            </Link>
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
            <span>© {new Date().getFullYear()} therecallpatrol.com</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
