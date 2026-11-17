#!/usr/bin/env node
// Converts a hand-saved copy of USDA's recall list into the data file the site reads.
//
//   node scripts/import-usda.mjs           convert the newest file in ~/RecallPatrol/usda
//   node scripts/import-usda.mjs --ship    convert, then commit, push and deploy
//   node scripts/import-usda.mjs <file>    convert a specific file
//
// USDA refuses automated downloads, so the list is saved from a browser by a person.
// See ~/RecallPatrol/README.txt.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = join(homedir(), 'RecallPatrol', 'usda');
const OUT = join(ROOT, 'data', 'usda-recalls.json');
const KEEP_MONTHS = 18;

const args = process.argv.slice(2);
const ship = args.includes('--ship');
const explicit = args.find(a => !a.startsWith('--'));

function fail(msg) { console.error(`\nStopped: ${msg}\n`); process.exit(1); }

function newestFile() {
  if (!existsSync(INBOX)) fail(`The folder ${INBOX} does not exist.`);
  const files = readdirSync(INBOX)
    .filter(f => !f.startsWith('.'))
    .map(f => join(INBOX, f))
    .filter(f => statSync(f).isFile())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (files.length === 0) fail(`No saved file in ${INBOX}. See ~/RecallPatrol/README.txt.`);
  return files[0];
}

const decode = s => String(s ?? '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&ndash;|&mdash;/g, '-').replace(/&[lr]squo;/g, "'").replace(/&[lr]dquo;/g, '"').replace(/&reg;|&trade;/g, '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const text = html => decode(String(html ?? '').replace(/<\/(p|li|h\d|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''))
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
const list = v => (Array.isArray(v) ? v : v ? [v] : []).map(x => decode(x).trim()).filter(Boolean);

function parse(file) {
  if (/\.pdf$/i.test(file)) {
    fail(`${basename(file)} is a PDF of the USDA recalls web page. The import needs the data file instead:\n` +
      '  open https://www.fsis.usda.gov/fsis/api/recall/v/1 (a page of plain text), then File > Save As,\n' +
      '  format "Page Source", into ~/RecallPatrol/usda. See ~/RecallPatrol/README.txt.');
  }
  const raw = readFileSync(file, 'utf8');
  // A browser may wrap the saved JSON in a little HTML; take the outermost array
  const start = raw.indexOf('[{');
  const end = raw.lastIndexOf('}]');
  if (start < 0 || end < 0) fail(`${basename(file)} does not look like the USDA recall list. Was the sign-in or error page saved instead?`);
  let rows;
  try { rows = JSON.parse(decodeIfEscaped(raw.slice(start, end + 2))); }
  catch (e) { fail(`${basename(file)} could not be read as data (${e.message}).`); }
  if (!Array.isArray(rows) || rows.length < 20) fail(`${basename(file)} holds only ${rows?.length ?? 0} records; expected a few thousand.`);
  return rows;
}
// "Save as web page" can HTML-escape the text inside a <pre>
function decodeIfEscaped(s) { return s.includes('&quot;') && !s.includes('"field_title"') ? decode(s) : s; }

function severity(row) {
  const c = `${row.field_recall_classification ?? ''} ${row.field_risk_level ?? ''}`;
  if (/Class III/i.test(c)) return 'low';
  if (/Class II\b/i.test(c)) return 'medium';
  return 'high'; // Class I and Public Health Alerts
}

function toRecall(row) {
  const number = String(row.field_recall_number ?? '').trim();
  const date = String(row.field_recall_date ?? '').trim();
  const title = decode(row.field_title).replace(/\s+/g, ' ').trim();
  if (!number || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) return null;

  let url = String(row.field_recall_url ?? '').trim().replace(/^http:\/\//i, 'https://');
  try { if (!/(^|\.)fsis\.usda\.gov$/i.test(new URL(url).hostname)) throw 0; }
  catch { url = 'https://www.fsis.usda.gov/recalls'; }

  const items = list(row.field_product_items);
  const states = list(row.field_states);
  const reasons = list(row.field_recall_reason);
  const processing = list(row.field_processing).join(' ');
  const afterDue = title.split(/\s+Due\s+to\s+/i)[1];
  const iso = `${date}T00:00:00`;

  const description = [
    text(row.field_summary).slice(0, 1400),
    items.length ? `Products: ${items.slice(0, 12).join('; ')}` : '',
    states.length ? `Where it was sold: ${states.join(', ')}` : '',
    `USDA recall number ${number} (${decode(row.field_recall_classification) || 'not classified'}, ${decode(row.field_recall_type || 'status unknown').toLowerCase()}).`,
  ].filter(Boolean).join('\n\n').slice(0, 2200);

  return {
    id: `usda-${number}`,
    title,
    hazard: afterDue ? afterDue.replace(/[.\s]+$/, '') : (reasons.join(', ') || 'See the USDA notice'),
    date: iso,
    dateFormatted: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
    severity: severity(row),
    category: /shelf stable/i.test(processing) && !/not shelf stable/i.test(processing) ? 'pantry' : 'refrigerator',
    url,
    description,
    products: items.slice(0, 8).join('; ') || list(row.field_establishment).join(', '),
  };
}

const file = explicit ?? newestFile();
const rows = parse(file);
const cutoff = new Date();
cutoff.setMonth(cutoff.getMonth() - KEEP_MONTHS);
const cutoffIso = cutoff.toISOString().slice(0, 10);

const seen = new Set();
const recalls = [];
for (const row of rows) {
  // The list carries Spanish copies of some notices
  const lang = String(row.langcode ?? row.field_translation_language ?? '').toLowerCase();
  if (lang && !/^(en|english)/.test(lang)) continue;
  const r = toRecall(row);
  if (!r || r.date.slice(0, 10) < cutoffIso || seen.has(r.id)) continue;
  seen.add(r.id);
  recalls.push(r);
}
recalls.sort((a, b) => b.date.localeCompare(a.date));
if (recalls.length === 0) fail('No recalls from the last 18 months were found in that file.');

const asOf = new Date(statSync(file).mtimeMs).toISOString().slice(0, 10);
writeFileSync(OUT, `${JSON.stringify({ asOf, sourceFile: basename(file), recalls }, null, 1)}\n`);

console.log(`\nRead ${rows.length} USDA records from ${basename(file)} (saved ${asOf}).`);
console.log(`Kept ${recalls.length} recalls from the last ${KEEP_MONTHS} months.`);
console.log('Newest:');
recalls.slice(0, 5).forEach(r => console.log(`  ${r.dateFormatted}  ${r.title.slice(0, 90)}`));

if (!ship) {
  console.log('\nNothing is live yet. Run "npm run usda:ship" to commit and deploy.\n');
  process.exit(0);
}

const run = (cmd, a) => execFileSync(cmd, a, { cwd: ROOT, stdio: 'inherit' });
const changed = execFileSync('git', ['status', '--porcelain', 'data/usda-recalls.json'], { cwd: ROOT }).toString().trim();
if (!changed) { console.log('\nThe site already has this data. Nothing to deploy.\n'); process.exit(0); }
// Only the data file is committed, so unrelated work in progress is left alone
run('git', ['add', 'data/usda-recalls.json']);
run('git', ['commit', '-m', `Update USDA recall data (as of ${asOf})`, '--', 'data/usda-recalls.json']);
run('git', ['push', 'origin', 'main']);
run('npx', ['vercel', '--prod', '--yes']);
console.log('\nDeployed.\n');
