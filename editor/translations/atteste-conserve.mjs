#!/usr/bin/env node
// atteste-conserve.mjs — le pack se relit lui-même.
//
// ─── LE PROBLÈME ───────────────────────────────────────────────────────────
// Une chaîne absente du pack est ambiguë. Deux causes très différentes :
//
//   • Games Workshop GARDE le terme en français (Rhino, Impulsor, Praesidius,
//     Fusillade…). L'omission est alors CORRECTE — `dataName()` retombe sur la
//     chaîne source et l'affichage est déjà juste. Rien à faire.
//   • Le terme se traduit, et le pack l'a simplement raté. C'est un vrai trou.
//
// Compter les deux ensemble donne un chiffre de couverture faux et envoie
// chercher sur le web des noms qui n'ont jamais eu de traduction à trouver.
//
// ─── LA PREUVE ─────────────────────────────────────────────────────────────
// Le pack contient des dizaines de milliers de chaînes de PROSE traduites. Un
// terme absent en tant que clef y apparaît souvent à l'intérieur d'une autre
// clef traduite — et la valeur française tranche :
//
//   "Signum Array"        → "Panoplie de Signums"       ⇒ Signum est CONSERVÉ
//   "Voidraven Bomber"    → "Bombardier Korvide"        ⇒ Voidraven se TRADUIT
//   "Faction: Blood Legions" → "Faction : Légions du Sang"  ⇒ idem
//
// C'est une preuve interne, gratuite, et bien plus fiable qu'une recherche web.
//
// ─── TROIS VERDICTS ────────────────────────────────────────────────────────
//   CONSERVÉ        toutes les preuves gardent le terme tel quel → omission
//                   correcte, à sortir du décompte des trous.
//   TRADUIT AILLEURS  aucune preuve ne le garde → une forme française existe
//                   dans le pack : c'est un vrai trou, et on a le candidat.
//   MIXTE / INCONNU aucune preuve, ou preuves contradictoires → indécidable
//                   ici ; c'est là, et seulement là, qu'une source externe sert.
//
// ─── LA FUSION EST INTERDITE ───────────────────────────────────────────────
// Ce script ne modifie JAMAIS le pack, même pour un verdict net. Le piège est
// réel et mesuré : le mot-clef **Stormlord** des Genestealer Cults est un char
// (variante de Baneblade), mais la seule preuve du pack est « Imotekh the
// Stormlord » → « Imotekh le Seigneur des Tempêtes », qui parle du Necron. Une
// fusion automatique aurait renommé le char. Le script propose, un humain
// tranche, et le README garde la trace de ce qui a été retenu.
//
// ─── USAGE ─────────────────────────────────────────────────────────────────
//   node editor/translations/atteste-conserve.mjs             # rapport + JSON
//   node editor/translations/atteste-conserve.mjs --terme Signum
//   node editor/translations/atteste-conserve.mjs --out atteste.json
//
// Sortie : atteste.json (les candidats à relire) et un résumé chiffré.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = val("--out", join(ROOT, "atteste.json"));
const TERME = val("--terme", "");

const packPath = join(ROOT, "translations", "fr.json");
if (!existsSync(packPath)) { console.error(`\n  translations/fr.json introuvable (${packPath}).\n`); process.exit(1); }
const pack = JSON.parse(await readFile(packPath, "utf-8")).strings || {};
const entrees = Object.entries(pack).filter(([k, v]) => typeof v === "string" && v !== k);

// ── Occurrence en MOT ENTIER, casse comprise ───────────────────────────────
// « Signum » ne doit pas se reconnaître dans « Signums » pour le test de la
// clef, mais doit s'y reconnaître dans la valeur : c'est justement le pluriel
// français qui prouve la conservation. On accepte donc une lettre finale
// collée côté VALEUR (pluriel, accord) et pas côté clef.
const LETTRE = /[A-Za-zÀ-ÿ0-9]/;
function occurrence(botte, aiguille, souple) {
  let i = 0;
  while ((i = botte.indexOf(aiguille, i)) !== -1) {
    const av = i > 0 ? botte[i - 1] : "";
    const ap = i + aiguille.length < botte.length ? botte[i + aiguille.length] : "";
    if (!LETTRE.test(av) && (souple ? !/[A-Za-zÀ-ÿ]/.test(ap) || /^[sx]$/i.test(ap) : !LETTRE.test(ap))) return true;
    i += aiguille.length;
  }
  return false;
}

const preuvesDe = (terme) => {
  const garde = [], perdu = [];
  for (const [k, v] of entrees) {
    if (k === terme) continue;
    if (!occurrence(k, terme, false)) continue;
    (occurrence(v, terme, true) ? garde : perdu).push({ k, v });
  }
  return { garde, perdu };
};
// L'autre nombre porte la même décision : « Aggressors » n'apparaît que dans
// « Optimised Aggressors » → « Agresseurs Optimisés », ce qui donnerait un
// verdict TRADUIT net et faux — le pack rend ailleurs « Aggressor Squad » par
// « Escouade Aggressor ». On interroge donc aussi le singulier/pluriel et on
// rétrograde en MIXTE dès qu'il contredit. Une preuve unique ne suffit jamais.
const nombreFrere = (s) => (/s$/.test(s) ? s.replace(/ies$/, "y").replace(/([^s])s$/, "$1") : s + "s");

export function atteste(terme) {
  const { garde, perdu } = preuvesDe(terme);
  const frere = nombreFrere(terme);
  const f = frere && frere !== terme ? preuvesDe(frere) : { garde: [], perdu: [] };
  const n = garde.length + perdu.length;
  let verdict = n === 0 ? "inconnu" : perdu.length === 0 ? "conservé" : garde.length === 0 ? "traduit-ailleurs" : "mixte";
  if (verdict === "traduit-ailleurs" && f.garde.length) verdict = "mixte";
  if (verdict === "conservé" && f.perdu.length && !garde.length) verdict = "mixte";
  if (verdict === "inconnu" && (f.garde.length || f.perdu.length)) verdict = "mixte";
  return { verdict, preuves: n, garde, perdu, frere: { terme: frere, garde: f.garde.length, perdu: f.perdu.length } };
}

const extrait = (p, max) => p.slice(0, max).map(({ k, v }) => ({ clef: k.length > 200 ? k.slice(0, 200) + "…" : k, fr: v.length > 200 ? v.slice(0, 200) + "…" : v }));

if (TERME) {
  const r = atteste(TERME);
  console.log(`\n  « ${TERME} » → ${r.verdict.toUpperCase()}  (${r.preuves} preuve${r.preuves > 1 ? "s" : ""}${r.frere.garde + r.frere.perdu ? `, autre nombre « ${r.frere.terme} » : ${r.frere.garde} conservent / ${r.frere.perdu} traduisent` : ""})\n`);
  for (const e of r.garde.slice(0, 6)) console.log(`   + conservé  ${JSON.stringify(e.k).slice(0, 110)}\n               ${JSON.stringify(e.v).slice(0, 110)}`);
  for (const e of r.perdu.slice(0, 6)) console.log(`   ! traduit   ${JSON.stringify(e.k).slice(0, 110)}\n               ${JSON.stringify(e.v).slice(0, 110)}`);
  console.log("");
  process.exit(0);
}

// ── Les termes à juger : ce que le catalogue affiche et que le pack ignore ──
// Toujours via la lib de l'éditeur (règle maison : jamais de regex sur les .cat).
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js"));
const cat = new Catalog(ROOT);
cat.load();
const nomOf = (x) => (typeof x === "string" ? x : (x && (x.name || x.n)) || "");
const termes = new Map();               // terme → catégorie
const ajoute = (c, s) => { const t = String(s || "").trim(); if (t && !termes.has(t) && pack[t] === undefined) termes.set(t, c); };
for (const f of cat.listFactions()) {
  if (f.type !== "catalogue") continue;
  const contenu = cat.listFactionContents(f.file) || {};
  for (const d of contenu.detachments || []) ajoute("détachement", nomOf(d));
  for (const u of contenu.units || []) {
    const d = cat.getUnit(f.file, u.id);
    if (!d) continue;
    ajoute("unité", d.name);
    for (const k of d.keywords || []) ajoute("mot-clef", nomOf(k));
    for (const w of d.weapons || []) ajoute("arme", nomOf(w));
    for (const a of d.abilities || []) ajoute("capacité", nomOf(a));
  }
}

const parVerdict = { "conservé": [], "traduit-ailleurs": [], "mixte": [], "inconnu": [] };
for (const [t, c] of termes) {
  const r = atteste(t);
  parVerdict[r.verdict].push({ terme: t, categorie: c, preuves: r.preuves, frere: r.frere, garde: extrait(r.garde, 3), perdu: extrait(r.perdu, 3) });
}

const total = termes.size;
const pc = (n) => `${String(n).padStart(5)}  (${String(Math.round((100 * n) / (total || 1))).padStart(3)} %)`;
console.log(`\n  pack               : ${Object.keys(pack).length} chaînes`);
console.log(`  termes sans entrée : ${total}\n`);
console.log(`  CONSERVÉS attestés : ${pc(parVerdict["conservé"].length)}   omission correcte, à sortir du décompte`);
console.log(`  TRADUITS ailleurs  : ${pc(parVerdict["traduit-ailleurs"].length)}   vrais trous, candidat français en main`);
console.log(`  mixtes             : ${pc(parVerdict["mixte"].length)}   preuves contradictoires, à trancher à la main`);
console.log(`  inconnus           : ${pc(parVerdict["inconnu"].length)}   aucune preuve interne, source externe requise`);

console.log(`\n── candidats à relire (traduits ailleurs) ──`);
for (const c of parVerdict["traduit-ailleurs"].slice(0, 40)) {
  console.log(`   [${c.categorie}] ${c.terme}`);
  for (const e of c.perdu.slice(0, 1)) console.log(`        ${JSON.stringify(e.clef).slice(0, 100)}\n     →  ${JSON.stringify(e.fr).slice(0, 100)}`);
}

await writeFile(OUT, JSON.stringify({
  meta: { note: "Le pack se relit lui-même. Aucune fusion automatique : voir le piège Stormlord en tête de script.", total, ...Object.fromEntries(Object.entries(parVerdict).map(([k, v]) => [k, v.length])) },
  traduitAilleurs: parVerdict["traduit-ailleurs"],
  mixte: parVerdict["mixte"],
  conserve: parVerdict["conservé"].map((c) => ({ terme: c.terme, categorie: c.categorie, preuves: c.preuves })),
}, null, 1) + "\n");
console.log(`\n  → ${OUT}\n`);
