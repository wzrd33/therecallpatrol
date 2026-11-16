import type { Recall } from '@/types/recalls';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Split what someone typed into lowercase words, dropping single characters. */
export function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 1);
}

/**
 * Model numbers out of what someone typed: chunks with a digit in them, four or
 * more characters once spaces and dashes are removed. "DR-HSH015" -> "drhsh015".
 */
export function modelCodes(text: string): string[] {
  return text
    .split(/\s+/)
    .map(squash)
    .filter(isModelCode);
}

// Letters and digits together ("gtf7530"), or a long run of digits. A bare year is not a model.
const isModelCode = (t: string) => (t.length >= 4 && /\d/.test(t) && /[a-z]/.test(t)) || /^\d{6,}$/.test(t);

export interface OwnedMatch {
  recall: Recall;
  /** 'model': the model number typed appears in the recall. 'name': brand and product words match. */
  kind: 'model' | 'name';
  /** The model number that matched, as typed */
  model?: string;
}

/**
 * Recalls that plausibly cover a product someone owns.
 *
 * Plain words must each start a word in the recall's product name or headline, so
 * "fan" matches "fans" but not "infant". Model numbers are looked for everywhere,
 * description included, because that is usually the only place CPSC lists them.
 * A model number that is found is a strong match. One that is not found never hides
 * a recall that matches on name: the owner is asked to compare models instead.
 */
export function findOwnedMatchesDetailed(recalls: Recall[], name: string): OwnedMatch[] {
  const rawParts = name.trim().split(/\s+/).filter(Boolean);
  const models = rawParts.filter(p => isModelCode(squash(p)));
  const words = tokenize(rawParts.filter(p => !models.includes(p)).join(' '));
  if (models.length === 0 && words.length === 0) return [];

  const wordTests = words.map(t => new RegExp(`\\b${escapeRe(t)}`, 'i'));
  const out: OwnedMatch[] = [];

  for (const r of recalls) {
    const nameHay = `${r.products ?? ''} ${r.title}`;
    const model = models.find(m => squash(`${nameHay} ${r.description ?? ''}`).includes(squash(m)));
    if (model) { out.push({ recall: r, kind: 'model', model }); continue; }
    if (wordTests.length > 0 && wordTests.every(re => re.test(nameHay))) out.push({ recall: r, kind: 'name' });
  }
  // Model matches first
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'model' ? -1 : 1));
}

export function findOwnedMatches(recalls: Recall[], name: string): Recall[] {
  return findOwnedMatchesDetailed(recalls, name).map(m => m.recall);
}
