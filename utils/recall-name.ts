import type { Recall } from '@/types/recalls';

export interface RecallName {
  /** Short product name, e.g. "Pressure Washers" */
  product: string;
  /** Brand or company behind it, e.g. "QIOMALA". Empty when the headline names none. */
  brand: string;
  /** The danger in a word or two, e.g. "Fire and Burn". Empty when it can't be read. */
  hazard: string;
}

const COUNT = /^(?:(?:about|over|nearly|more than|almost|approximately)\s+)?(?:[\d.,]+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:million|thousand|billion)\s+/i;
const FILLER = /^(?:(?:all|certain|select|multiple|additional|various)\s+)+/i;
const MODEL_YEAR = /^model\s+years?\s+[\d\-–, and]+\s+/i;

function tidyProduct(raw: string): string {
  let p = raw.trim().replace(/[,;.]+$/, '');
  let prev = '';
  while (prev !== p) {
    prev = p;
    p = p.replace(COUNT, '').replace(FILLER, '').replace(MODEL_YEAR, '');
  }
  // Drop trailing detail: "Ladders with Rapid Locks" -> "Ladders"
  const cut = p.search(/\s+(?:with|for use with|included (?:with|in)|sold (?:with|at|by|on|exclusively)|equipped with)\s/i);
  if (cut > 8) p = p.slice(0, cut);
  p = p.replace(/\s*\([^)]*\)\s*$/, '').replace(/[®™]/g, '').trim();
  return p;
}

function tidyHazard(raw: string): string {
  let h = raw.split(/[;.]/)[0];
  const from = h.toLowerCase().lastIndexOf(' from ');
  if (from >= 0) h = h.slice(from + 6);
  h = h
    .replace(/^(?:serious\s+)?risk of\s+/i, '')
    .replace(/^serious\s+/i, '')
    .replace(/\s+to\s+children\b/i, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,?\s+and\s+/gi, ' and ')
    .replace(/\s+hazards?\b/gi, '')
    .replace(/^an?\s+/i, '')
    .trim();
  return h.length > 0 && h.length <= 44 ? h : '';
}

const firstWord = (s: string) => s.split(/\s+/)[0]?.replace(/[^A-Za-z0-9]/g, '').toLowerCase() ?? '';

/**
 * CPSC headlines follow two shapes:
 *   "Acme Recalls Widgets Due to Fire Hazard"
 *   "ACME Widgets Recalled Due to Fire Hazard"
 * This pulls out the parts a person scanning the page cares about.
 */
export function recallName(r: Pick<Recall, 'title' | 'products'>): RecallName {
  const title = r.title.replace(/\s+/g, ' ').trim();
  const [subject, ...rest] = title.split(/\s+(?:Expanded\s+)?Due\s*\??\s*(?:to\s+)?/i);
  const hazard = tidyHazard(rest.join(' '));

  let brand = '';
  let product = '';

  const a = subject.match(/^(.*?)\s+(?:Reannounces\s+and\s+Expands\s+|Reannounces\s+|Expands\s+)?Recalls?\s+(?:of\s+)?(.+)$/i);
  if (a && a[1] && !/^recall$/i.test(a[1])) {
    brand = a[1].replace(/,?\s+of\s+USA$/i, '').replace(/\s*\([^)]*\)/g, '').trim();
    product = tidyProduct(a[2]);
  } else {
    const b = subject.replace(/^Recall\s+of\s+/i, '').match(/^(.*?)(?:\s+Recalled(?:\s+by\s+(.+))?)?$/i);
    product = tidyProduct(b?.[1] ?? subject);
    brand = b?.[2]?.trim() ?? '';
  }

  if (brand && product.toLowerCase().startsWith(brand.toLowerCase() + ' ') && product.length > brand.length + 4) {
    product = product.slice(brand.length + 1);
  }

  // "PACEARTH Swing Seats" recalled by "Pacearth Direct": say the brand once
  const words = product.split(' ');
  if (words.length > 1) {
    const lead = words[0];
    const sameAsBrand = brand && firstWord(brand) === firstWord(lead);
    const shouty = !brand && /^[A-Z0-9][A-Z0-9.\-&']{2,}$/.test(lead) && /[A-Z]{3}/.test(lead) && !/^(LED|USB|ATV|ROV|BMX|RGB|CO|AC|DC)$/.test(lead);
    if ((sameAsBrand || shouty) && !/^(and|&)$/i.test(words[1])) {
      if (!brand) brand = lead;
      product = words.slice(1).join(' ').replace(/^(?:brand|branded|-brand)\s+/i, '');
    }
  }

  if (!product) product = r.products || title;
  // Keep company suffixes out of the eyebrow
  brand = brand.replace(/,?\s+(?:Inc\.?|LLC|Corp\.?|Corporation|Company|Co\.|Ltd\.?|Limited|Group|Enterprises|International|Industries|Stores|USA|U\.S\.|America|North America|Americas)$/gi, '').trim();
  if (brand.length > 34) brand = '';

  return { product, brand, hazard };
}

/**
 * Daily line-up for the carousel. The newest recalls always lead; the rest of the
 * shelf is a different draw from recent months each calendar day, so a return visit
 * shows something new even when CPSC has published nothing overnight.
 */
export function dailyLineup(recalls: Recall[], limit: number, fresh = 8, day = new Date()): Recall[] {
  const sorted = [...recalls].sort((a, b) => b.date.localeCompare(a.date));
  const lead = sorted.slice(0, fresh);
  const pool = sorted.slice(fresh, fresh + 240);

  // Small seeded generator: same order all day on every device, new order tomorrow
  let seed = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) >>> 0;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [...lead, ...pool.slice(0, Math.max(0, limit - lead.length))];
}
