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

  // Limit to 2 years to avoid downloading the full 37MB response (10k+ records)
  const since = new Date();
  since.setFullYear(since.getFullYear() - 2);
  const dateParam = since.toISOString().split('T')[0];
  const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${dateParam}`;

  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`CPSC API ${res.status}`);

  const data: any[] = await res.json();
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

  _cache = { data: recalls, ts: Date.now() };
  return recalls;
}
