import type { Recall, Severity, Category } from '@/types/recalls';

// In-memory cache: Next.js data cache can't handle the 37MB CPSC response
let _cache: { data: Recall[]; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

const HIGH = ['death', 'fatal', 'fire', 'burn', 'explosion', 'electrocution', 'suffocation', 'strangulation', 'drowning'];
const MED  = ['injury', 'fall', 'choking', 'laceration', 'fracture', 'salmonella', 'listeria', 'contamination', 'lead', 'hazard'];

function severity(hazard: string, desc: string): Severity {
  const t = `${hazard} ${desc}`.toLowerCase();
  if (HIGH.some(w => t.includes(w))) return 'high';
  if (MED.some(w => t.includes(w))) return 'medium';
  return 'low';
}

function category(type: string, title: string, desc: string): Category {
  const t = `${type} ${title} ${desc}`.toLowerCase();
  if (/child|infant|toddler|baby|nursery|juvenile|youth|toy|game|stroller|car seat|crib|bassinet|playpen|diaper/.test(t)) return 'kids';
  if (/\bpet\b|dog food|cat food|bird food|fish food|veterinary|kennel|aquarium|flea/.test(t)) return 'pets';
  if (/refrigerat|freezer|frozen food|deli meat|raw meat|raw poultry|raw fish|fresh produce|dairy|cheese|yogurt/.test(t)) return 'refrigerator';
  if (/\bfood\b|cereal|snack|candy|flour|sauce|pasta|rice|bread|beverage|drink|supplement|granola|cookie|cracker|peanut butter|salsa/.test(t)) return 'pantry';
  if (/furniture|appliance|fan|heater|lamp|lighting|tool|hardware|ladder|cleaning|garden|outdoor|home furnish|power/.test(t)) return 'household';
  return 'other';
}

function formatDate(s: string): string {
  if (!s) return 'Unknown';
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return s; }
}

export async function fetchRecalls(): Promise<Recall[]> {
  if (_cache && Date.now() - _cache.ts < TTL) return _cache.data;

  try {
    const [primary, fallback] = sinceDates();
    // A query CPSC has not seen before takes close to a minute; one it has seen answers
    // in under a second. So wait a long time on the main query, then fall back to last
    // month's query, which CPSC has usually already computed.
    const fresh = await fetchFromCpsc(primary, 50_000).catch(() => fetchFromCpsc(fallback, 8_000));
    _cache = { data: fresh, ts: Date.now() };
    return fresh;
  } catch (err) {
    // CPSC is slow or down: keep serving the last good list rather than nothing
    if (_cache) {
      console.error('CPSC fetch failed, serving last good list:', err);
      return _cache.data;
    }
    throw err;
  }
}

/**
 * Start dates for the query: the 1st of the month two years back, and the month before.
 * CPSC caches each distinct query (errors included), so a date that changed every day
 * meant a slow, uncached query every day. Pinning to the month keeps the query the same.
 */
function sinceDates(): [string, string] {
  const now = new Date();
  const iso = (monthsBack: number) =>
    new Date(Date.UTC(now.getUTCFullYear() - 2, now.getUTCMonth() - monthsBack, 1)).toISOString().split('T')[0];
  return [iso(0), iso(1)];
}

async function fetchFromCpsc(dateParam: string, timeoutMs: number): Promise<Recall[]> {
  // Limit to about 2 years to avoid downloading the full 37MB response (10k+ records)
  const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${dateParam}`;

  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`CPSC API ${res.status}`);

  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) throw new Error('CPSC API returned a non-list response');

  // When its database is down, CPSC answers 200 with a single pseudo-record whose
  // title is the error message. Real recalls always carry a RecallID and a date.
  const data: any[] = raw.filter(item => item && item.RecallID && item.RecallDate);
  if (data.length === 0) {
    throw new Error(`CPSC API returned no valid recalls: ${String(raw[0]?.Title ?? 'empty list').slice(0, 120)}`);
  }

  const slice = data.slice(0, 1000);

  const recalls = slice.map((item: any, i: number) => {
    const productType = item.Products?.[0]?.Type ?? '';
    const productName = item.Products?.[0]?.Name ?? '';
    const hazard      = item.Hazards?.[0]?.Name ?? item.Hazards?.[0]?.Type ?? 'Safety Hazard';
    const description = item.Description ?? '';
    const title       = item.Title ?? productName ?? 'CPSC Recall';

    return {
      id:            item.RecallID ?? `cpsc-${i}`,
      title,
      hazard,
      date:          item.RecallDate ?? '',
      dateFormatted: formatDate(item.RecallDate ?? ''),
      severity:      severity(hazard, description),
      category:      category(productType, title, description),
      url:           item.URL ?? 'https://www.cpsc.gov/Recalls',
      description,
      products:      productName,
    };
  });

  return recalls;
}
