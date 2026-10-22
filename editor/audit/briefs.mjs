// briefs.mjs — audit des résumés « initiation » (briefs/<lang>.json).
// Pour chaque capacité de chaque .cat : résumé présent en en ET fr, et empreinte
// `src` égale à celle du texte courant (sinon PÉRIMÉ : la prose a changé).
// Sortie : une ligne par fichier (total / manquants / périmés), liste des périmés
// et des entrées orphelines (nom absent de toute base). Code 1 si périmé ou
// orphelin — les manquants sont un rapport (couverture en cours), pas une erreur.
// Usage : node editor/audit/briefs.mjs [--manquants] (liste aussi les manquants)
import path from "node:path";
import { ROOT, LANGS, catFiles, abilitiesOf, loadBriefs, homonymsOf, keyOf } from "../briefs/lib.mjs";
const H = homonymsOf();
const listMissing = process.argv.includes("--manquants");
const packs = Object.fromEntries(LANGS.map((l) => [l, loadBriefs(l).strings]));
const seen = new Set();
let total = 0, missing = 0, stale = 0;
for (const f of catFiles()) {
  const list = abilitiesOf(path.join(ROOT, f));
  let m = 0, s = 0;
  for (const a of list) {
    const k = keyOf(a, H); seen.add(k);
    const miss = LANGS.filter((l) => !packs[l][k] || !packs[l][k].brief);
    const st = LANGS.filter((l) => packs[l][k] && packs[l][k].src !== a.src);
    if (miss.length) { m++; if (listMissing) console.log(`  manquant (${miss.join(",")}) : ${a.name}`); }
    else if (st.length) { s++; console.log(`  PÉRIMÉ (${st.join(",")}) : ${a.name} — ${f}`); }
  }
  total += list.length; missing += m; stale += s;
  console.log(`${f.padEnd(44)} ${String(list.length).padStart(4)} capacités · ${String(m).padStart(4)} manquantes · ${s} périmées`);
}
let orphans = 0;
for (const l of LANGS) for (const k of Object.keys(packs[l])) if (!seen.has(k)) { orphans++; console.log(`  ORPHELIN (${l}) : ${k}`); }
console.log(`\nbriefs : ${total} capacités, ${total - missing} résumées (${((100 * (total - missing)) / Math.max(1, total)).toFixed(1)} %), ${missing} manquantes, ${stale} périmées, ${orphans} orphelines`);
process.exit(stale || orphans ? 1 : 0);
