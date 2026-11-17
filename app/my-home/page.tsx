import type { Metadata } from 'next';
import { MyHomePage } from '@/components/my-home-page';

// A personal page built from what is saved in the visitor's browser: nothing to index
export const metadata: Metadata = { title: 'My Home', robots: { index: false } };

export default function Page() {
  return <MyHomePage />;
}
