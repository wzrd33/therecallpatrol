import type { Metadata } from 'next';

// A settings form, not something to find in search results
export const metadata: Metadata = { title: 'Your nickname', robots: { index: false } };

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
