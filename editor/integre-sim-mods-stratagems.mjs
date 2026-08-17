// Intégration des marqueurs sim-mod: sur les règles de stratagème.
//
// Entrée : un JSON { "<ruleId>": ["sim-mod: …", …], … } produit par l'analyse
// des 1 359 stratagèmes (bonus OFFENSIFS que le simulateur de dégâts de
// l'appli consommatrice peut proposer en bascule — grammaire de parseSimMod,
// voir editor/SIM_MOD_APP_PROMPT.md).
//
//   node editor/integre-sim-mods-stratagems.mjs --json merged.json          (dry-run)
//   node editor/integre-sim-mods-stratagems.mjs --json merged.json --apply  (écrit + valide)
//
// Canal : le <comment> premier enfant de la <rule> du stratagème — le même
// que strat-timing:. Règles d'écriture :
//   - les lignes existantes (strat-timing:…) ne sont JAMAIS réécrites ;
//   - les lignes sim-mod: existantes ne sont JAMAIS dupliquées ni modifiées
//     (relance idempotente ; pour changer un marqueur, l'éditer à la main) ;
//   - les nouvelles lignes s'ajoutent À LA FIN du commentaire.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const { Catalog } = require(join(ROOT, "editor/lib/catalog"));
const xml = require(join(ROOT, "editor/lib/xml"));

const APPLY = process.argv.includes("--apply");
const jsonIx = process.argv.indexOf("--json");
if (jsonIx < 0 || !process.argv[jsonIx + 1]) {
  console.error("Usage: node editor/integre-sim-mods-stratagems.mjs --json <merged.json> [--apply]");
  process.exit(1);
}
const wanted = JSON.parse(readFileSync(process.argv[jsonIx + 1], "utf8"));

const c = new Catalog(ROOT).load();
let nbRules = 0, nbLines = 0, nbSkip = 0, nbAlready = 0;
const missing = [];
const perFile = new Map();

for (const [id, lines] of Object.entries(wanted)) {
  const hit = c.byId.get(id);
  if (!hit || hit.node.tag !== "rule") { missing.push(id); continue; }
  const rule = hit.node;
  let com = (rule.children || []).find((ch) => ch.tag === "comment");
  const cur = com ? (xml.getText(com) || "") : "";
  const have = new Set(cur.split("\n").map((l) => l.trim()).filter(Boolean));
  const add = lines.filter((l) => !have.has(l.trim()));
  nbAlready += lines.length - add.length;
  if (!add.length) { nbSkip++; continue; }
  nbRules++; nbLines += add.length;
  perFile.set(hit.file, (perFile.get(hit.file) || 0) + add.length);
  if (APPLY) {
    const next = (cur ? cur + "\n" : "") + add.join("\n");
    if (com) xml.setText(com, next);
    else { com = xml.elem("comment", {}); xml.setText(com, next); rule.children.unshift(com); }
    c.markDirty(hit.file);
  }
}

console.log(`Règles enrichies : ${nbRules} (+${nbLines} lignes sim-mod) ; ${nbSkip} déjà à jour (${nbAlready} lignes identiques ignorées).`);
for (const [f, n] of [...perFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`  +${String(n).padStart(3)}  ${f}`);
if (missing.length) { console.log(`\nruleId INTROUVABLES (${missing.length}) :`); missing.slice(0, 10).forEach((x) => console.log("  ✗", x)); }

if (!APPLY) { console.log("\n(dry-run — relancer avec --apply pour écrire)"); process.exit(0); }
c.buildIndex();
const v = c.validate({ dirtyOnly: false });
let nbErr = 0;
for (const r of v.results || []) { nbErr += r.errors.length; for (const e of r.errors.slice(0, 5)) console.error("  ✗", r.file, e); }
console.log("\nvalidate ok:", v.ok, "erreurs:", nbErr);
if (!v.ok) process.exit(1);
c.save();
console.log("sauvegardé.");
