'use client';

import { useEffect, useRef } from 'react';
import type { Recall } from '@/types/recalls';
import { recallName, hazardTag } from '@/utils/recall-name';


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
  if (r.category === 'refrigerator') return t.includes('refrigerat') ? '❄️' : '🧊';
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

export function RecallSheet({ recall, isAdded, onToggle, onClose }: {
  recall: Recall;
  isAdded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const name = recallName(recall);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Lock page scroll, close on Escape, move focus into the sheet
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <div className="sheet-backdrop" onClick={() => onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recall-sheet-title"
        data-sev={recall.severity}
        className="sheet"
        onClick={e => e.stopPropagation()}
      >
        <div className="sheet-head">
          <span className="text-5xl" aria-hidden="true">{recallEmoji(recall)}</span>
          <button ref={closeRef} type="button" aria-label="Close" onClick={() => onClose()} className="tap w-11 h-11 rounded-full bg-white/10 text-white text-2xl hover:bg-white/20">×</button>
        </div>
        <div className="sheet-body">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="sev-pill" data-sev={recall.severity} data-on-dark="">{name.hazard || hazardTag(recall.title)}</span>
            <span className="text-cyan-light text-xs font-bold uppercase tracking-wider">{recall.category === 'other' ? 'outdoors' : recall.category}</span>
            <span className="text-white/60 text-xs">· {recall.dateFormatted}</span>
          </div>
          {name.brand && <p className="text-cyan-light text-xs font-bold uppercase tracking-wider mb-1">{name.brand}</p>}
          <h3 id="recall-sheet-title" className="text-white text-2xl font-extrabold leading-tight tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            {name.product}
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-4">{recall.title}</p>
          {recall.hazard && (
            <div className="sheet-hazard mb-4">
              <p className="sheet-label">⚠ The hazard</p>
              <p className="text-white text-sm leading-relaxed">{recall.hazard}</p>
            </div>
          )}
          {recall.products && (
            <div className="mb-4">
              <p className="sheet-label">Products affected</p>
              <p className="text-white/90 text-sm leading-relaxed">{recall.products}</p>
            </div>
          )}
          {recall.description && (
            <div className="mb-2">
              <p className="sheet-label">How to identify it</p>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{recall.description}</p>
            </div>
          )}
        </div>
        <div className="sheet-foot">
          <button
            type="button"
            aria-pressed={isAdded}
            onClick={onToggle}
            data-added={isAdded}
            className="tap add-btn flex-1 rounded-full text-sm px-4"
          >
            {isAdded ? '✓ On my watchlist' : '+ Add to watchlist'}
          </button>
          <a href={recall.url} target="_blank" rel="noopener noreferrer" className="tap flex-1 rounded-full text-sm px-4 border border-white/30 text-white hover:bg-white/10">
            Official notice ↗
          </a>
        </div>
      </div>
    </div>
  );
}
