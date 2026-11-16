import type { Recall, Severity, Category } from '@/types/recalls';

// In-memory cache: Next.js data cache can't handle the 37MB CPSC response
let _cache: { data: Recall[]; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

const HIGH = ['death', 'fatal', 'fire', 'burn', 'explosion', 'electrocution', 'suffocation', 'strangulation', 'drowning'];
const MED  = ['injury', 'fall', 'choking', 'laceration', 'fracture', 'salmonella', 'listeria', 'contamination', 'lead', 'hazard'];

// The headline is where CPSC states the risk ("Risk of Serious Injury or Death from..."),
// so it is graded along with the hazard text. The hazard text alone is sometimes just
// "None reported" or a note about which rule the product breaks.
function severity(title: string, hazard: string, desc: string): Severity {
  const t = `${title} ${hazard} ${desc}`.toLowerCase();
  if (HIGH.some(w => t.includes(w))) return 'high';
  if (MED.some(w => t.includes(w))) return 'medium';
  return 'low';
}

// Category rules read the product part of the headline plus the product name only.
// The hazard text is left out on purpose: phrases like "child poisoning", "fire" or
// "pet" in a hazard or description used to drag unrelated products into the wrong aisle.
const PETS = /\b(pets?|puppy|puppies|kittens?|canine|feline|equine|horses?|saddles?|dog (food|treats?|toys?|beds?|crates?|collars?|leash(es)?|harness(es)?|chews?)|cat (food|treats?|toys?|trees?|litter)|leash(es)?|aquariums?|litter box(es)?|bird cages?|hamsters?|reptiles?|terrariums?)\b/;
const KIDS = /\b(child(ren)?(['’]s)?|kids?(['’]s?)?|infants?|toddlers?|bab(y|ies)|newborns?|nursery|nursing pillows?|juvenile|youth|boys(['’])?|girls(['’])?|toys?|dolls?|plush|stuffed animals?|bears|play ?sets?|play ?yards?|playpens?|play mats?|play purse|playground|strollers?|car seats?|cribs?|bassinets?|bedside sleepers?|sleepsuits?|sleep sacks?|swaddles?|high ?chairs?|booster seats?|diapers?|teethers?|teething|rattles?|pacifiers?|soothers?|sippy|bibs?|sling carriers?|bath seats?|bouncers?|safety gates?|tip restraint kits?|water beads?|water balloons?|squish(y|ies)|surprise eggs?|building (blocks|cubes|sets?|sticks)|magnetic (balls?|blocks?|cubes?|tiles?|stick figure|building|chess|speed cubes?|fidget)|magnet (balls?|sets?|chess)|speed cubes?|fidget|montessori|busy boards?|pounding games?|board games?|chess games?|slot cars?|jewelry kits?|costumes?|trampolines?|swing sets?|ride-ons?|balance bikes?|tricycles?|pajamas?|sleepwear|loungewear|nightgowns?|onesies?|bunk beds?|slime|crayons?|coloring|highlighters|dive sticks?|prank)\b/;
// Sports, vehicles and outdoor gear have no aisle of their own yet
const OUTDOORS = /\b(bicycles?|bikes?|e-bikes?|e-trikes?|trikes?|scooters?|kickscooters?|motorcycles?|snowmobiles?|atvs?|rovs?|utvs?|all-terrain|off-road|off-highway|utility vehicles?|golf cars?|golf carts?|vehicles?|tractors?|helmets?|visors?|climbing|carabiners?|harness(es)?|ice axes?|belays?|via ferrata|avalanche|ski|skis|snowboards?|scuba|diving|regulators?|kayaks?|paddles?|ziplines?|fireworks?|rockets?|rifles?|pistols?|firearms?|ammo|treadmills?|rowing machines?|training cycles?|fitness machines?|resistance bands?|dumbbells?|exercise|sweaters?|sweatshirts?|hoodies?|jackets?|boots|socks|sandals)\b/;
const COLD = /\b(refrigerators?|fridges?|mini ?fridges?|freezers?|ice makers?|ice machines?|ice crushers?|coolers?|wine chillers?|beverage centers?)\b/;
const KITCHEN = /\b(air fryers?|fryers?|pressure cookers?|multi-?cookers?|slow cookers?|rice cookers?|cookers?|blenders?|juicers?|mixers?|food processors?|toasters?|microwaves?|ovens?|ranges|cooktops?|kettles?|coffee ?makers?|coffee|espresso|french press|carafes?|tumblers?|mugs?|cups?|drinkware|(water|carbonation|blender|sparkling water|candy) bottles?|food jars?|thermos|lunch box(es)?|cookware|(saut[ée]|frying|fry|sauce|sheet|baking|roasting) pans?|skillets?|dutch ovens?|bakeware|kitchen (knives|knife|scales?)|garlic press(es)?|cutting boards?|plates|bowls?|utensils?|dishwashers?|grill brush(es)?|cotton candy|candy|popcorn|waffle|griddles?|sous vide|can openers?|supplements?|multivitamins?|prosecco|wine|vinegar|straws?|glassware|dinnerware|flatware)\b/;
// Household items whose names would otherwise trip the outdoors rules
const HOME_FIRST = /\b(power banks?|safes?|fuel (containers?|cans?|bottles?)|power stations?|generators?)\b/;

function category(_type: string, title: string, product: string): Category {
  // "Acme Recalls Widgets Due to Fire Hazard" -> "Acme Recalls Widgets"
  const subject = title.split(/\s+(?:Recalled\b|Expanded\s+Due\b|Due\s*\??\s*to\b)/i)[0];
  const t = `${subject} ${product}`.toLowerCase();

  const forKids = KIDS.test(t) && !/\badults?\b/.test(t);
  const forPets = /\bpets?\b/.test(t) && !/play ?sets?|child/.test(t);
  if (forPets || (PETS.test(t) && !forKids)) return 'pets';
  if (forKids) return 'kids';
  if (COLD.test(t)) return 'refrigerator';
  if (KITCHEN.test(t)) return 'pantry';
  if (OUTDOORS.test(t) && !HOME_FIRST.test(t)) return 'other';
  // Everything left is something that lives around the house: furniture, heaters,
  // power banks, lighting, tools, cleaners, personal care.
  return 'household';
}

/** CPSC occasionally sends a link with a slash missing ("https:/www.cpsc.gov/..."). */
function officialUrl(raw: unknown): string {
  const fallback = 'https://www.cpsc.gov/Recalls';
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const fixed = raw.trim().replace(/^https?:\/+/i, 'https://');
  try {
    const u = new URL(fixed);
    return /(^|\.)cpsc\.gov$/i.test(u.hostname) || /(^|\.)saferproducts\.gov$/i.test(u.hostname) ? u.toString() : fallback;
  } catch { return fallback; }
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
      severity:      severity(title, hazard, description),
      category:      category(productType, title, productName),
      url:           officialUrl(item.URL),
      description,
      products:      productName,
    };
  });

  return recalls;
}
