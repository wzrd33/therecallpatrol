import type { Recall } from '@/types/recalls';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Split what someone typed into lowercase words, dropping single characters. */
export function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 1);
}

/**
 * Recalls that plausibly cover a product someone owns.
 * Every word must start a word in the recall's product name or title, so
 * "fan" matches "fans" but not "infant". Description text is ignored on purpose:
 * it mentions too many unrelated things to be a reliable ownership match.
 */
export function findOwnedMatches(recalls: Recall[], name: string): Recall[] {
  const terms = tokenize(name);
  if (terms.length === 0) return [];
  const tests = terms.map(t => new RegExp(`\\b${escapeRe(t)}`, 'i'));
  return recalls.filter(r => {
    const hay = `${r.products ?? ''} ${r.title}`;
    return tests.every(re => re.test(hay));
  });
}
