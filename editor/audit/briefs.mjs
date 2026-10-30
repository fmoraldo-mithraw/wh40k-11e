// briefs.mjs — audit des résumés « initiation » (briefs/<lang>.json).
// Pour chaque capacité de chaque .cat : résumé présent en en ET fr, et empreinte
// `src` égale à celle du texte courant (sinon PÉRIMÉ : la prose a changé).
// Sortie : une ligne par fichier (total / manquants / périmés), liste des périmés
// et des entrées orphelines (nom absent de toute base). Code 1 si périmé ou
// orphelin — les manquants sont un rapport (couverture en cours), pas une erreur.
// Usage : node editor/audit/briefs.mjs [--manquants] (liste aussi les manquants)
import path from "node:path";
import { ROOT, LANGS, catFiles, abilitiesOf, loadBriefs, homonymsOf, keyOf, parsedAbilitiesByFaction, entryOf } from "../briefs/lib.mjs";
const H = await homonymsOf();
const listMissing = process.argv.includes("--manquants");
const packs = Object.fromEntries(LANGS.map((l) => [l, loadBriefs(l).strings]));
const seen = new Set();
let total = 0, missing = 0, stale = 0;
for (const f of catFiles()) {
  const list = abilitiesOf(path.join(ROOT, f));
  let m = 0, s = 0;
  for (const a of list) {
    const k = keyOf(a, H); seen.add(k); seen.add(a.name + "#" + a.src); if (entryOf(packs.en, a) === packs.en[a.name] || entryOf(packs.fr, a) === packs.fr[a.name]) seen.add(a.name);
    const miss = LANGS.filter((l) => !entryOf(packs[l], a));
    const st = LANGS.filter((l) => !entryOf(packs[l], a) && packs[l][k] && packs[l][k].src !== a.src);
    // PÉRIMÉ d'abord : un résumé dont l'empreinte diffère n'est pas trouvé par
    // entryOf (donc aussi dans `miss`) — tester `miss` en premier le classait à
    // tort « manquant » (non bloquant) et valider.mjs ne voyait jamais de périmé.
    if (st.length) { s++; console.log(`  PÉRIMÉ (${st.join(",")}) : ${a.name} — ${f}`); }
    else if (miss.length) { m++; if (listMissing) console.log(`  manquant (${miss.join(",")}) : ${a.name}`); }
  }
  total += list.length; missing += m; stale += s;
  console.log(`${f.padEnd(44)} ${String(list.length).padStart(4)} capacités · ${String(m).padStart(4)} manquantes · ${s} périmées`);
}
// Capacités vues par le parseur de l'appli (règles d'unité, sections) qui ne sont
// pas des profils : comptées à part, par faction.
console.log("\n— capacités du parseur hors profils (règles d'unité liées, sections) —");
for (const [fac, list] of await parsedAbilitiesByFaction()) {
  const extra = list.filter((a) => !seen.has(keyOf(a, H)));
  let m = 0, s = 0;
  for (const a of extra) {
    const k = keyOf(a, H); seen.add(k); seen.add(a.name + "#" + a.src); if (entryOf(packs.en, a) === packs.en[a.name] || entryOf(packs.fr, a) === packs.fr[a.name]) seen.add(a.name);
    const miss = LANGS.filter((l) => !entryOf(packs[l], a));
    const st = LANGS.filter((l) => !entryOf(packs[l], a) && packs[l][k] && packs[l][k].src !== a.src);
    if (st.length) { s++; console.log(`  PÉRIMÉ (${st.join(",")}) : ${a.name} — ${fac}`); }
    else if (miss.length) { m++; if (listMissing) console.log(`  manquant (${miss.join(",")}) : ${a.name}`); }
  }
  total += extra.length; missing += m; stale += s;
  if (extra.length) console.log(`${("faction:" + fac).padEnd(44)} ${String(extra.length).padStart(4)} capacités · ${String(m).padStart(4)} manquantes · ${s} périmées`);
}
let orphans = 0;
for (const l of LANGS) for (const k of Object.keys(packs[l])) if (!seen.has(k)) { orphans++; console.log(`  ORPHELIN (${l}) : ${k}`); }
console.log(`\nbriefs : ${total} capacités, ${total - missing} résumées (${((100 * (total - missing)) / Math.max(1, total)).toFixed(1)} %), ${missing} manquantes, ${stale} périmées, ${orphans} orphelines`);
process.exit(stale || orphans ? 1 : 0);
