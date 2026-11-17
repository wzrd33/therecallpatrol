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

// Says so on the label: always the fridge
const KEEP_COLD = /refrigerat|frozen|keep cold|perishable|ice cream|gelato|sorbet|popsicle/i;
// Foods that normally live in the fridge
const COLD = /cheese|yogurt|\bmilk\b(?!\s+chocolate)|\beggs\b|\bdeli\b|\bsalads?\b|sandwich|sushi|salmon|shrimp|oysters?|seafood|\bsprouts\b|lettuce|spinach|cucumbers?|hummus|tofu|kombucha|fresh[- ]cut/i;
// Shelf-stable foods that merely mention a cold word: "cheddar cheese seasoning", "milk powder"
const SHELF = /chips|crisps|crackers?|seasoning|spice|powder|candy|gumm|chocolate|cookies?|granola|cereal|\bbars?\b|\bmix\b|flour|dried|canned|jerky|supplement|capsules?|tablets?|seeds\b|\bnuts?\b|snack|puffs|popcorn|pretzel/i;

const isCold = (label: string) => KEEP_COLD.test(label) || (COLD.test(label) && !SHELF.test(label));

// Sexual-enhancement products recalled for hidden prescription drugs. Their names are
// explicit, and this is a family site, so these events are left out of the feed.
const ADULT = /sildenafil|tadalafil|vardenafil|sexual|male enhancement|\b(?:boner|dtf|erect\w*|libido|aphrodisiac|horny|viagra|cialis|rhino)\b/i;

const titleCase = (s: string) =>
  /[a-z]/.test(s) ? s : s.toLowerCase().replace(/(^|[\s\-/(&])[a-z]/g, c => c.toUpperCase());

/** "Zapp's Brand Bayou Blackened Ranch Potato Chips" out of a long label transcription. */
function shortProduct(raw: string): string {
  let p = raw.trim().replace(/\s+/g, ' ').replace(/^UPC\s*[\d\s-]+/i, '');
  // A label that opens with its size: "28 oz. Gatorade Lemon Lime"
  p = p.replace(/^(?:[\d./]+\s*-?\s*(?:oz|ounces?|lbs?|g|kg|ct|ml|fl\.? ?oz)\b\.?[\s,]*)+/i, '');
  // A numbered list of products: "1. TNVitamins Moringa Capsules 2. ..."
  p = p.replace(/^(?:\d\.|\.\d+)\s+/, '').split(/\s+2\.\s+/)[0];
  const cut = p.split(/[,;]?\s+(?:Net\s*(?:Wt|Weight)\b|UPC\b|Ingredients?\s*:|intended use\s*:|Packaged\b|Packed\b|Distributed\b|Sold in\b|Product is\b|Serving size\b|Dosage\b)/i)[0];
  // "Bulk packaged Seitan Cubes": keep going when the cut leaves no real name
  if (cut.length >= 6) p = cut;
  // End at the first sentence break, but not after an initial or abbreviation ("J. Higgs", "D.O.P.")
  const parts = p.split(/;\s+|(?<=[A-Za-z0-9)]{3})\.\s+/);
  p = parts.shift() ?? '';
  // "THE HAMPTON GROCER brand; Lacnola": a brand on its own is not a product name yet
  while (parts.length > 0 && (p.length < 6 || /\bbrand(?:ed)?$/i.test(p))) p = `${p} ${parts.shift()}`;
  // Drop a trailing size: ", 14 oz" or " 1.5 oz."
  p = p.replace(/[,\s-]+[\d./]+\s*-?\s*(?:oz|ounces?|lbs?|pounds?|g|kg|ct|count|ml|l|fl\.? ?oz|pack)\b.*$/i, '').replace(/[,.;\s]+$/, '');
  // Cut mid-phrase by the rules above: "ParaBien Al Grano with", "Express Tray is"
  p = p.replace(/(?:[\s,]+(?:with|in|is|are|and|of|for|by|the|a|an|-|&))+$/i, '');
  p = titleCase(p);
  return p.length > 70 ? `${p.slice(0, 67).trimEnd()}…` : p;
}

/** The reason in a few words, so the site's headline reads "... Due to Salmonella". */
function shortReason(raw: string): string {
  // "Yellow No. 5" -> "Yellow #5", so the sentence does not end at "No."
  const r = raw.replace(/\s+/g, ' ').replace(/\bNo\.\s*(\d)/gi, '#$1').trim();
  if (/salmonella/i.test(r)) return 'Salmonella';
  if (/listeria/i.test(r)) return 'Listeria';
  if (/e\.? ?coli/i.test(r)) return 'E. coli';
  if (/botulinum|botulism/i.test(r)) return 'Botulism Risk';
  if (/hepatitis/i.test(r)) return 'Hepatitis A';
  if (/sildenafil|tadalafil|sibutramine|undeclared (?:drug|pharmaceutical|active)|prescription drug/i.test(r)) return 'Undeclared Drug';
  const undeclared = r.match(/(?:undeclared|does not declare|not declared?|fails? to declare)\s*:?\s*(?:allergens?\s*)?(?:ingredients?\s*)?\(?([A-Za-z0-9 ,&/#]+?)\)?(?:\.|;|$| in | on | due | allergen)/i);
  if (undeclared) {
    const what = undeclared[1].trim().replace(/^(?:the|an?)\s+/i, '').replace(/\s+as\s+an?\b.*$/i, '');
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

/** One product's codes as a short list, without "lot:" prefixes or placeholder values. */
function cleanCodes(raw = ''): string[] {
  return raw.replace(/\s+/g, ' ').split(/\s*;\s*|\s*\|\s*/)
    .map(c => c.replace(/^(?:lot|batch)\s*(?:codes?|numbers?|#|no\.?)?\s*:?\s*/i, '').trim())
    .filter(c => c && !/^(?:none|n\/?a|tbd|no (?:lot|code)\b.*|not (?:available|applicable|coded))\.?$/i.test(c));
}

const MAX_LISTED = 12;

/** "How to check yours": one line per product for big recalls, one line per code otherwise. */
function codeLines(recs: FdaRecord[]): string {
  const none = 'No lot code is listed. Use the brand, size and dates on the official notice.';
  if (recs.length === 1) {
    const codes = cleanCodes(recs[0].code_info);
    if (codes.length === 0) return none;
    return codes.length === 1 ? `Lot codes and dates: ${codes[0]}` : `Lot codes and dates:\n${codes.slice(0, MAX_LISTED).map(c => `• ${c}`).join('\n')}${codes.length > MAX_LISTED ? `\n…and ${codes.length - MAX_LISTED} more on the official notice.` : ''}`;
  }
  const lines = recs.slice(0, MAX_LISTED).map(r => {
    const codes = cleanCodes(r.code_info);
    return `• ${shortProduct(r.product_description ?? '')}: ${codes.length ? codes.join(', ') : 'no lot code listed'}`;
  });
  return `Lot codes and dates, by product:\n${lines.join('\n')}${recs.length > MAX_LISTED ? `\n…and ${recs.length - MAX_LISTED} more products on the official notice.` : ''}`;
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
    if (recs.some(r => ADULT.test(`${r.product_description} ${r.reason_for_recall}`))) return;
    const names = unique(recs.map(r => shortProduct(r.product_description ?? '')));
    if (names.length === 0) return;

    const firm = titleCase((first.recalling_firm ?? '').replace(/^.*\bdba\s+/i, '').replace(/\s+/g, ' ').trim());
    const reason = (first.reason_for_recall ?? '').replace(/\s+/g, ' ').trim();
    const date = isoDate(first.report_date);
    // The most serious class in the event decides the colour
    const severity = recs
      .map(r => CLASS_SEVERITY[r.classification ?? ''] ?? 'medium')
      .sort((a, b) => 'high medium low'.indexOf(a) - 'high medium low'.indexOf(b))[0];
    // The aisle most of the products belong in, so one cold item does not move 60 dry ones
    const cold = recs.filter(r => isCold(r.product_description ?? '')).length;
    const category: Category = cold * 2 > recs.length ? 'refrigerator' : 'pantry';

    const description = [
      names.length > 1 ? `${names.length} products are part of this recall.` : '',
      (first.product_description ?? '').replace(/\s+/g, ' ').trim(),
      codeLines(recs),
      first.distribution_pattern ? `Where it was sold: ${first.distribution_pattern.replace(/\s+/g, ' ').trim()}` : '',
      first.product_quantity ? `Amount recalled: ${first.product_quantity}` : '',
      `FDA recall number ${first.recall_number ?? 'not listed'} (${first.classification ?? 'not yet classified'}, ${(first.status ?? 'status unknown').toLowerCase()}).`,
    ].filter(Boolean).join('\n\n').slice(0, 3200);

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
    const get = () => fetch(ENDPOINT, { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
    // One retry: openFDA occasionally drops a connection
    const res = await get().catch(() => get());
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
