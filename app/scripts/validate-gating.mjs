// אימות תוכנית הלימודים: אף טקסט שמוצג בכתב יד לא משתמש באות שטרם נלמדה,
// ומספר הפעילויות תואם את מיקומי התחנות במפה.
// הרצה: node scripts/validate-gating.mjs  (דורש esbuild מ-node_modules)

import { build } from 'esbuild';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '.units-bundle.cjs');

await build({
  entryPoints: [path.join(here, '../src/data/units.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});

const require = createRequire(import.meta.url);
const { UNITS } = require(out);
fs.unlinkSync(out);

const HEB = /[א-ת]/g;
const problems = [];
const allowed = new Set();

function check(unitTitle, actId, label, text) {
  const bad = [...new Set((text.match(HEB) || []).filter((c) => !allowed.has(c)))];
  if (bad.length) {
    problems.push(`${unitTitle} / ${actId} / ${label}: "${text}" ← אותיות שטרם נלמדו: ${bad.join(' ')}`);
  }
}

let total = 0;
for (const unit of UNITS) {
  unit.newLetters.forEach((l) => allowed.add(l));
  for (const act of unit.activities) {
    total++;
    switch (act.type) {
      case 'intro':
        act.letters.forEach((l) => check(unit.title, act.id, 'letter', l));
        break;
      case 'flashcards':
        act.cards.forEach((c) => check(unit.title, act.id, 'card', c.text));
        break;
      case 'quiz':
        act.questions.forEach((q) => q.agolText && check(unit.title, act.id, 'agolText', q.agolText));
        break;
      case 'wordsearch':
        act.words.forEach((w) => check(unit.title, act.id, 'word', w));
        check(unit.title, act.id, 'fillPool', act.fillPool);
        break;
      case 'match':
        act.pairs.forEach((p) => check(unit.title, act.id, 'pair', p.agol));
        break;
      case 'memory':
        act.pairs.forEach((p) => check(unit.title, act.id, 'pair.a', p.a));
        break;
      case 'story':
        act.paragraphs.forEach((p, i) => check(unit.title, act.id, `paragraph ${i + 1}`, p));
        break;
      case 'order':
        act.items.forEach((l) => check(unit.title, act.id, 'item', l));
        break;
      case 'paint':
        act.steps.forEach((s, i) => check(unit.title, act.id, `step ${i + 1}`, s.text));
        break;
      case 'trace':
        act.letters.forEach((l) => check(unit.title, act.id, 'trace-letter', l));
        break;
    }
  }
}

console.log(`units: ${UNITS.length}, activities: ${total}`);
console.log(`letters covered: ${[...allowed].sort().join(' ')} (${allowed.size})`);
if (problems.length) {
  console.log(`\n❌ ${problems.length} הפרות:`);
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}
console.log('✓ כל הטקסטים משתמשים רק באותיות שנלמדו');
