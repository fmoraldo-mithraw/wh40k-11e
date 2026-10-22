// fusionne.mjs — verse un lot de résumés dans briefs/en.json + briefs/fr.json.
// Usage : node editor/briefs/fusionne.mjs <lot.json> "<fichier.cat>"
//   lot.json : { "<clef>": { "en": "…", "fr": "…" }, … } (produit par le rédacteur ;
//   clef = champ `key` d'extrait.mjs).
// Contrôles : le nom existe dans le .cat (clef exacte), résumés non vides, longueur
// ≤ 220 caractères, pas de flèche « → » (polices PDF WinAnsi). Sortie : 1 ligne par
// refus, bilan. Les entrées valides sont écrites avec l'empreinte `src` courante.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, LANGS, abilitiesOf, loadBriefs, saveBriefs, homonymsOf, keyOf } from "./lib.mjs";
const [lot, file] = process.argv.slice(2);
if (!lot || !file) { console.error("usage: fusionne.mjs <lot.json> <fichier.cat>"); process.exit(2); }
const MAX = 220;
const batch = JSON.parse(readFileSync(lot, "utf8"));
const H = homonymsOf();
const byName = new Map(abilitiesOf(path.isAbsolute(file) ? file : path.join(ROOT, file)).map((a) => [keyOf(a, H), a]));
const packs = Object.fromEntries(LANGS.map((l) => [l, loadBriefs(l)]));
let ok = 0, bad = 0;
for (const [name, v] of Object.entries(batch)) {
  const a = byName.get(name); // name = clef (nom, ou nom#empreinte pour un homonyme)
  if (!a) { console.log(`✗ inconnu dans ${path.basename(file)} : ${name}`); bad++; continue; }
  const errs = [];
  for (const l of LANGS) {
    const b = typeof v[l] === "string" ? v[l].replace(/\s+/g, " ").trim() : "";
    if (!b) errs.push(`${l} vide`);
    else if (b.length > MAX) errs.push(`${l} trop long (${b.length} > ${MAX})`);
    else if (/→|←|⇒/.test(b)) errs.push(`${l} contient une flèche`);
  }
  if (errs.length) { console.log(`✗ ${name} : ${errs.join(", ")}`); bad++; continue; }
  for (const l of LANGS) packs[l].strings[name] = { src: a.src, brief: v[l].replace(/\s+/g, " ").trim() };
  ok++;
}
for (const l of LANGS) saveBriefs(l, packs[l]);
console.log(`${ok} résumé(s) fusionné(s), ${bad} refusé(s) — ${path.basename(file)}`);
process.exit(bad ? 1 : 0);
