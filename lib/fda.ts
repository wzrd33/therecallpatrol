import type { Recall, Severity, Category } from '@/types/recalls';

/**
 * FDA food recalls from openFDA's enforcement reports.
 *
 * FDA publishes these weekly, after it has classified each recall, so a recall can be
 * in the news a few days before it shows up here. One recall "event" is published as
 * one record per product, so records are grouped by event before they reach the site.
 */
const ENDPOINT = 'https://api.fda.gov/food/enforcement.json?sort=report_date:desc&limit=1000';
// FDA's own enforcement report page for one recall event
const officialUrl = (eventId: string) => `https://www.accessdata.fda.gov/scripts/ires/index.cfm?Event=${encodeURIComponent(eventId)}`;
const ALLERGENS = /milk|egg|soy|wheat|gluten|peanut|nut|almond|walnut|pecan|cashew|pistachio|hazelnut|coconut|fish|shellfish|shrimp|crab|sesame|sulfite|allergen/i;
const TTL = 30 * 60 * 1000;

let _cache: { data: Recall[]; ts: number } | null = null;

interface FdaRecord {
  event_id?: string;
  recall_number?: string;
  recalling_firm?: string;
  product_description?: string;
  reason_for_recall?: string;
  classification?: string;
  status?: string;
  report_date?: string;
  code_info?: string;
  distribution_pattern?: string;
  product_quantity?: string;
}

const CLASS_SEVERITY: Record<string, Severity> = { 'Class I': 'high', 'Class II': 'medium', 'Class III': 'low' };

const COLD = /refrigerat|frozen|keep cold|perishable|ice cream|gelato|cheese|yogurt|\bmilk\b|\beggs\b|\bdeli\b|\bsalads?\b|sandwich|sushi|salmon|shrimp|oysters?|seafood|sprouts|lettuce|spinach|cucumbers?|hummus|tofu|kombucha|fresh[- ]cut/i;

const titleCase = (s: string) =>
  /[a-z]/.test(s) ? s : s.toLowerCase().replace(/(^|[\s\-/(&])[a-z]/g, c => c.toUpperCase());

/** "Zapp's Brand Bayou Blackened Ranch Potato Chips" out of a long label transcription. */
function shortProduct(raw: string): string {
  let p = raw.trim().replace(/^UPC\s*[\d\s-]+/i, '');
  p = p.split(/\s{2,}|[.;]\s|\s+(?:Net\s*Wt|UPC|Ingredients?:|Packaged|Packed|Distributed|Sold in|Product is)\b/i)[0];
  p = p.replace(/\s+/g, ' ').replace(/^(?:[\d.]+\s*(?:oz|lbs?|g|kg|ct|ml|fl\.? ?oz)\.?\s*,\s*)+/i, '');
  // Drop a trailing size: ", 14 oz" or " 1.5 oz."
  p = p.replace(/[,\s-]+[\d./]+\s*-?\s*(?:oz|ounces?|lbs?|pounds?|g|kg|ct|count|ml|l|fl\.? ?oz|pack)\b.*$/i, '').replace(/[,.\s]+$/, '');
  p = titleCase(p);
  return p.length > 70 ? `${p.slice(0, 67).trimEnd()}…` : p;
}

/** The reason in a few words, so the site's headline reads "... Due to Salmonella". */
function shortReason(raw: string): string {
  const r = raw.replace(/\s+/g, ' ').trim();
  if (/salmonella/i.test(r)) return 'Salmonella';
  if (/listeria/i.test(r)) return 'Listeria';
  if (/e\.? ?coli/i.test(r)) return 'E. coli';
  if (/botulinum|botulism/i.test(r)) return 'Botulism Risk';
  if (/hepatitis/i.test(r)) return 'Hepatitis A';
  if (/sildenafil|tadalafil|sibutramine|undeclared (?:drug|pharmaceutical|active)|prescription drug/i.test(r)) return 'Undeclared Drug';
  const undeclared = r.match(/(?:undeclared|does not declare|not declared?|fails? to declare)\s*:?\s*(?:allergens?\s*)?(?:ingredients?\s*)?\(?([A-Za-z ,&/]+?)\)?(?:\.|;|$| in | on | due | allergen)/i);
  if (undeclared) {
    const what = undeclared[1].trim().replace(/^(?:the|an?)\s+/i, '');
    const named = what && what.length <= 30 && !/allergen|label|product|ingredient|statement|declared/i.test(what);
    if (named) return `Undeclared ${titleCase(what.toUpperCase())}`;
  }
  if (/undeclared|not declare|allergen/i.test(r)) return ALLERGENS.test(r) ? 'Undeclared Allergen' : 'Undeclared Ingredient';
  if (/foreign (?:object|material|matter)|metal|plastic|glass|stone|rubber/i.test(r)) return 'Foreign Material';
  if (/\blead\b|cadmium|arsenic|heavy metal/i.test(r)) return 'Lead or Heavy Metals';
  if (/mold|yeast|spoil/i.test(r)) return 'Mold or Spoilage';
  if (/pasteuriz|under-?processed|temperature/i.test(r)) return 'Unsafe Processing';
  if (/subpotent|superpotent|nutrient|mislabel|misbrand|label/i.test(r)) return 'Labeling Error';
  const first = r.replace(/^products?\s+(?:is|are|was|were)\s+(?:being\s+)?recalled\s+(?:due to|because of)\s+/i, '').split(/[.;]/)[0];
  return first.length <= 44 ? first : 'Safety Concern';
}

const unique = (list: string[]) => list.filter((v, i) => v && list.indexOf(v) === i);

const isoDate = (d = '') => (/^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00` : '');

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function toRecalls(records: FdaRecord[]): Recall[] {
  const events = new Map<string, FdaRecord[]>();
  for (const rec of records) {
    if (!rec.event_id || !rec.product_description || !rec.report_date) continue;
    const list = events.get(rec.event_id);
    if (list) list.push(rec); else events.set(rec.event_id, [rec]);
  }

  const out: Recall[] = [];
  events.forEach((recs, eventId) => {
    const first = recs[0];
    const names = unique(recs.map(r => shortProduct(r.product_description ?? '')));
    if (names.length === 0) return;

    const firm = titleCase((first.recalling_firm ?? '').replace(/^.*\bdba\s+/i, '').replace(/\s+/g, ' ').trim());
    const reason = (first.reason_for_recall ?? '').replace(/\s+/g, ' ').trim();
    const date = isoDate(first.report_date);
    // The most serious class in the event decides the colour
    const severity = recs
      .map(r => CLASS_SEVERITY[r.classification ?? ''] ?? 'medium')
      .sort((a, b) => 'high medium low'.indexOf(a) - 'high medium low'.indexOf(b))[0];
    const allText = recs.map(r => r.product_description).join(' ');
    const category: Category = COLD.test(allText) ? 'refrigerator' : 'pantry';

    const codes = unique(recs.map(r => (r.code_info ?? '').replace(/\s+/g, ' ').trim())).join(' | ');
    const description = [
      names.length > 1 ? `${names.length} products are part of this recall.` : '',
      (first.product_description ?? '').replace(/\s+/g, ' ').trim(),
      codes ? `Lot codes and dates: ${codes}` : '',
      first.distribution_pattern ? `Where it was sold: ${first.distribution_pattern.replace(/\s+/g, ' ').trim()}` : '',
      first.product_quantity ? `Amount recalled: ${first.product_quantity}` : '',
      `FDA recall number ${first.recall_number ?? 'not listed'} (${first.classification ?? 'not yet classified'}, ${(first.status ?? 'status unknown').toLowerCase()}).`,
    ].filter(Boolean).join('\n\n').slice(0, 1800);

    out.push({
      id:            `fda-${eventId}`,
      title:         `${firm || 'FDA'} Recalls ${names[0]}${names.length > 1 ? ` and ${names.length - 1} More` : ''} Due to ${shortReason(reason)}`,
      hazard:        reason || 'See the FDA notice',
      date,
      dateFormatted: formatDate(date),
      severity,
      category,
      url:           officialUrl(eventId),
      description,
      products:      names.slice(0, 8).join('; '),
    });
  });
  return out;
}

/** Never throws: food recalls are an addition, so a problem at FDA must not take the site's feed down. */
export async function fetchFdaFoodRecalls(): Promise<Recall[]> {
  if (_cache && Date.now() - _cache.ts < TTL) return _cache.data;
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`openFDA ${res.status}`);
    const body: unknown = await res.json();
    const results = (body as { results?: unknown })?.results;
    if (!Array.isArray(results) || results.length === 0) throw new Error('openFDA returned no results');
    const data = toRecalls(results as FdaRecord[]);
    if (data.length === 0) throw new Error('openFDA returned no usable recalls');
    _cache = { data, ts: Date.now() };
    return data;
  } catch (err) {
    console.error('FDA food fetch failed:', err);
    return _cache?.data ?? [];
  }
}
