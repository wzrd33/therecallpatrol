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
  // Stop at a semicolon or the end of a sentence, but not inside "E. coli"
  let h = raw.split(/;|\.(?=\s+[A-Z]|\s*$)/)[0];
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
const SUFFIX = /,?\s+(?:Inc\.?|LLC|L\.L\.C\.|Corp\.?|Corporation|Company|Co\.|Ltd\.?|Limited|Group|Enterprises|International|Industries|Stores|USA|U\.S\.|America|North America|Americas)$/gi;
const word = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

export function recallName(r: Pick<Recall, 'title' | 'products'> & { description?: string }): RecallName {
  const title = r.title.replace(/\s+/g, ' ').trim()
    // USDA alert headlines: "FSIS Issues Public Health Alert for X Due to Y"
    .replace(/^FSIS\s+Issues\s+Public\s+Health\s+Alert\s+(?:for|on|regarding)\s+/i, '');
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

  // Company suffixes stay out of the eyebrow, and out of the comparison below
  brand = brand.replace(SUFFIX, '').replace(SUFFIX, '').trim();

  // "WinCo Foods, LLC" recalls "WinCo Foods Hoagie Rolls": drop every leading word the two share
  if (brand) {
    const bw = brand.split(/\s+/).map(word);
    const pw = product.split(/\s+/);
    let k = 0;
    while (k < bw.length && k < pw.length - 1 && word(pw[k]) === bw[k]) k++;
    if (k > 0) {
      const rest = pw.slice(k).join(' ').replace(/^(?:(?:LLC|Inc\.?|Corp\.?|Co\.?|-?brand(?:ed)?)[,\s]+)+/i, '').replace(/^[,\s]+/, '');
      if (rest.length > 3) product = rest;
    }
  }
  // "Gardners Basics brand Waltham 29 Broccoli Sprouting Seeds": the label names its own brand
  const own = product.match(/^((?:\S+\s+){1,4}?)-?brand(?:ed)?\s+(\S.{3,})$/i);
  if (own) {
    if (!brand) brand = own[1].trim();
    product = own[2];
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
  brand = brand.replace(SUFFIX, '').replace(/[\s,&]+$/, '').trim();
  if (brand.length > 34) brand = '';

  // No usable brand in the headline: CPSC descriptions say "involves Steelite-branded pressure washers"
  if (!brand && r.description) {
    const named = r.description.match(/\b((?:[A-Z][\w'’&.]*)(?:\s+[A-Z][\w'’&.]*){0,2})[- ]brand(?:ed)?\b/);
    if (named && !/^(?:This|The|These|Recalled|All)$/.test(named[1])) {
      brand = named[1];
      const lead = product.split(/\s+/);
      if (lead.length > 1 && word(lead[0]) === word(brand.split(/\s+/)[0])) product = lead.slice(brand.split(/\s+/).length).join(' ') || product;
    }
  }

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
  // Today's picks are shown newest first, so the shelf reads in date order
  const picks = pool.slice(0, Math.max(0, limit - lead.length)).sort((a, b) => b.date.localeCompare(a.date));
  return [...lead, ...picks];
}

const HAZARD_TAGS: [RegExp, string][] = [
  [/salmonella/, 'Salmonella'],
  [/listeria/, 'Listeria'],
  [/e\. ?coli/, 'E. coli'],
  [/botul/, 'Botulism'],
  [/hepatitis/, 'Hepatitis A'],
  [/undeclared drug/, 'Hidden drug'],
  [/undeclared (?:ingredient|sugar|color|dye)/, 'Labeling'],
  [/undeclared|allergen/, 'Allergen'],
  [/foreign material|foreign matter|extraneous/, 'Foreign object'],
  [/without (?:the )?benefit of (?:import )?inspection|not inspected|uninspected/, 'Uninspected'],
  [/misbrand|mislabel/, 'Labeling'],
  [/heavy metals/, 'Heavy metals'],
  [/spoilage/, 'Spoilage'],
  [/unsafe processing/, 'Processing'],
  [/labeling error/, 'Labeling'],
  [/safety concern/, 'Safety'],
  [/fire|flame|flammab|overheat|ignit/, 'Fire'],
  [/burn|scald/, 'Burn'],
  [/explo/, 'Explosion'],
  [/electrocution|shock/, 'Shock'],
  [/carbon monoxide/, 'CO gas'],
  [/suffocat|asphyx/, 'Suffocation'],
  [/strangul/, 'Strangulation'],
  [/drown/, 'Drowning'],
  [/chok/, 'Choking'],
  [/ingest|swallow/, 'Ingestion'],
  [/tip-?over/, 'Tip-over'],
  [/entrap/, 'Entrapment'],
  [/poison/, 'Poisoning'],
  [/\blead\b|phthalate|chemical/, 'Chemical'],
  [/bacteria|mold|contamina/, 'Bacteria'],
  [/crash|collision/, 'Crash'],
  [/fall/, 'Fall'],
  [/lacerat|\bcut\b|amputat/, 'Laceration'],
  [/impact|projectile/, 'Impact'],
];

/**
 * One-word hazard for a badge: "Fire", "Choking", "Tip-over". Taken from the part of
 * the CPSC headline after "Due to", using whichever hazard the headline names first.
 */
export function hazardTag(title: string): string {
  const parts = title.split(/\s+Due\s*\??\s*(?:to\s+)?/i);
  const text = (parts.length > 1 ? parts.slice(1).join(' ') : title).toLowerCase();
  let best = '';
  let at = Infinity;
  for (const [re, label] of HAZARD_TAGS) {
    const i = text.search(re);
    if (i >= 0 && i < at) { at = i; best = label; }
  }
  // "Serious injury" appears in most headlines, so it only counts when nothing more specific does
  return best || (/injur/.test(text) ? 'Injury' : 'Recall');
}

/** Which agency a recall came from. FDA recalls carry an "fda-" id. */
export function recallSource(r: Pick<Recall, 'id'>): { short: 'FDA' | 'USDA' | 'CPSC'; name: string } {
  const id = String(r.id);
  if (id.startsWith('fda-')) return { short: 'FDA', name: 'U.S. Food and Drug Administration' };
  if (id.startsWith('usda-')) return { short: 'USDA', name: 'USDA Food Safety and Inspection Service' };
  return { short: 'CPSC', name: 'U.S. Consumer Product Safety Commission' };
}

/** Readable, stable address for a recall page: "huffy-buzz-bicycles-cerana-t2-e-trikes-10961". */
export function recallSlug(r: Pick<Recall, 'id' | 'title' | 'products'> & { description?: string }): string {
  const n = recallName(r);
  const words = `${n.brand} ${n.product}`.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
  return words ? `${words}-${r.id}` : String(r.id);
}

export const recallPath = (r: Parameters<typeof recallSlug>[0]) => `/recalls/${recallSlug(r)}`;

/** "Huffy Buzz Bicycles Cerana T2 E-Trikes": brand and product as one readable name. */
export function recallFullName(r: Parameters<typeof recallName>[0]): string {
  const n = recallName(r);
  return [n.brand, n.product].filter(Boolean).join(' ');
}
