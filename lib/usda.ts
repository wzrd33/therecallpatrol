import type { Recall } from '@/types/recalls';
import data from '@/data/usda-recalls.json';

/**
 * USDA meat, poultry and egg product recalls.
 *
 * USDA's site refuses automated requests, so this list is not fetched live. A person
 * saves it from a browser and scripts/import-usda.mjs converts it into
 * data/usda-recalls.json, which ships with the site. It is as fresh as the last import.
 */
export const usdaAsOf: string = data.asOf ?? '';

export function usdaRecalls(): Recall[] {
  return (data.recalls ?? []) as Recall[];
}
