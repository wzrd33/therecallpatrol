import type { Recall } from '@/types/recalls';

const FOOD_EMOJI: [RegExp, string][] = [
  [/chicken|poultry|turkey|wings?\b/, '🍗'],
  [/beef|pork|sausage|\bham\b|bacon|jerky|\bmeat|burger|hot dog|\bfrank/, '🥩'],
  [/seasoning|spices?\b|\bsalt\b/, '🧂'],
  [/\bseeds?\b/, '🌱'],
  [/ice cream|gelato/, '🍨'],
  [/cheese|queso/, '🧀'],
  [/milk|yogurt|dairy/, '🥛'],
  [/popcorn/, '🍿'],
  [/chips|crisps|snack/, '🥨'],
  [/cookie|brownie|cake|muffin|pastry|donut/, '🍪'],
  [/chocolate|candy|gumm/, '🍫'],
  [/bread|bagel|tortilla|bun\b/, '🍞'],
  [/salad|sprouts|lettuce|spinach|cucumber|vegetable/, '🥗'],
  [/noodle|ramen|pasta/, '🍜'],
  [/peanut|nut\b|nuts\b|almond|pistachio/, '🥜'],
  [/\beggs?\b/, '🥚'],
  [/salmon\b|shrimp|fish|seafood|oyster|tuna/, '🐟'],
  [/juice|drink|beverage|tea\b|coffee|water/, '🧃'],
  [/honey|jelly|\bjam\b|syrup/, '🍯'],
  [/sauce|salsa|hummus|\bdip\b|dressing|ranch/, '🫙'],
  [/supplement|vitamin|capsule|tablet/, '💊'],
];

const PRODUCT_EMOJI: [RegExp, string][] = [
  [/toy|doll|plush|playset|game/, '🧸'],
  [/power bank|battery|batteries|charger/, '🔋'],
  [/fire pit|fireplace|lighter|torch|candle/, '🔥'],
  [/heater|boiler|furnace/, '🌡️'],
  [/dresser|chest|nightstand/, '🗄️'],
  [/mattress|bed rail|\bbeds?\b|pillow|lounger|sleeper|crib|bassinet/, '🛏️'],
  [/chair|recliner|stool|sofa/, '🪑'],
  [/pajama|sleepwear|loungewear|nightgown|robe|jacket|hoodie|sweat|costume/, '👕'],
  [/helmet/, '⛑️'],
  [/e-bike|bicycle|\bbikes?\b|trike/, '🚴'],
  [/scooter/, '🛴'],
  [/motorcycle|atv|off-road|off-highway|golf car|vehicle|snowmobile/, '🏍️'],
  [/stroller|car seat/, '🚼'],
  [/magnet/, '🧲'],
  [/pressure washer|faucet|shower|pool|spa\b/, '💦'],
  [/lamp|light|lantern|luminaire|chandelier/, '💡'],
  [/coffee|espresso|kettle|mug|tumbler|cup|bottle/, '☕'],
  [/fryer|cooker|oven|range|grill|microwave|toaster|pan\b/, '🍳'],
  [/refrigerator|fridge|freezer|cooler/, '🧊'],
  [/hair dryer|hair|beard/, '💇'],
  [/ladder/, '🪜'],
  [/mower|trimmer|chainsaw|blower|saw\b|drill|tool/, '🛠️'],
  [/fan\b|fans\b|air conditioner/, '🌀'],
  [/smoke|alarm|detector/, '🚨'],
  [/speaker|headphone|amplifier/, '🔊'],
];

export function recallEmoji(r: Recall): string {
  const t = r.title.toLowerCase();
  if (/^(fda|usda)-/.test(String(r.id))) {
    // Picture the food, not the reason: "Seasoning ... Due to Undeclared Milk" is not milk
    const food = t.split(/ due to /)[0].replace(/^.*? recalls /, '');
    for (const [re, emoji] of FOOD_EMOJI) if (re.test(food)) return emoji;
    return r.category === 'refrigerator' ? '🥛' : '🥫';
  }
  // Picture the product itself where the name makes it obvious
  const subject = t.split(/ due | recalled /)[0];
  for (const [re, emoji] of PRODUCT_EMOJI) if (re.test(subject)) return emoji;
  if (r.category === 'kids') {
    if (t.includes('stroller') || t.includes('car seat')) return '🚗';
    if (t.includes('toy') || t.includes('game')) return '🧸';
    return '🍼';
  }
  if (r.category === 'pantry') {
    if (t.includes('peanut')) return '🥜';
    if (t.includes('chicken') || t.includes('meat')) return '🍗';
    return '🥫';
  }
  if (r.category === 'refrigerator') return t.includes('refrigerat') ? '❄️' : '🥛';
  if (r.category === 'household') {
    if (t.includes('cable') || t.includes('charger')) return '🔌';
    if (t.includes('fan') || t.includes('heater')) return '🌡️';
    return '🏠';
  }
  if (r.category === 'pets') return '🐶';
  if (r.category === 'other') return '🏕️';
  if (t.includes('fire') || t.includes('burn')) return '🔥';
  if (t.includes('food')) return '🍽️';
  return '⚠️';
}
