import { loadRecalls } from '@/lib/cpsc';
import { CATEGORY_META, CATEGORY_SLUGS, SITE_URL } from '@/lib/categories';
import { recallFullName, recallPath, hazardTag, recallSource } from '@/utils/recall-name';

// A plain-text guide to the site for AI assistants and AI search (the llms.txt convention)
export const revalidate = 3600;
export const dynamic = 'force-static';

export async function GET() {
  const recalls = await loadRecalls().catch(() => []);
  const lines = [
    '# Recall Patrol',
    '',
    '> Free U.S. recall lookup for households. Recall Patrol lists recent product recalls from the Consumer Product Safety Commission (CPSC) and food recalls from the FDA and USDA, in plain language, and lets people check the items they own against them.',
    '',
    'Each recall has its own page with the hazard, the products affected, how to tell if yours is affected (model numbers, lot codes, dates), what to do, and a link to the official government notice. The official notice is always the authority.',
    '',
    `Coverage: about the last two years of recalls${recalls.length ? `, ${recalls.length.toLocaleString('en-US')} at present` : ''}. Not covered: vehicles, medicines and medical devices.`,
    '',
    '## Browse by category',
    ...CATEGORY_SLUGS.map(s => `- [${CATEGORY_META[s].label} recalls](${SITE_URL}/categories/${s}): ${CATEGORY_META[s].desc}`),
    '',
    '## Latest recalls',
    ...recalls.slice(0, 60).map(r => `- [${recallFullName(r)}](${SITE_URL}${recallPath(r)}): ${hazardTag(r.title)}, recalled ${r.dateFormatted} (${recallSource(r).short})`),
    '',
    '## More',
    `- [All recall pages (sitemap)](${SITE_URL}/sitemap.xml)`,
    `- [About and data sources](${SITE_URL}/about)`,
    `- [Privacy](${SITE_URL}/privacy)`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
