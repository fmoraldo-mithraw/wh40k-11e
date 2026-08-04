#!/usr/bin/env node
// aln-attach.mjs — rattacher les fiches ALN à leur datasheet anglaise.
//
// C'EST L'ÉTAPE QUI MANQUAIT. Le diagnostic l'a montré sur les Véroleux : la
// fiche [2931] « Véroleux » a bien été récoltée, avec 9 libellés — mais aucun
// couple « Poxwalkers → Véroleux » n'est arrivé dans le pack. Le balayage n'est
// pas en cause : c'est le rattachement, qui n'avait jamais été écrit comme un
// script reproductible.
//
// ─── POURQUOI C'EST NÉCESSAIRE ─────────────────────────────────────────────
// ALN ne donne JAMAIS le nom anglais d'une unité. Sa page ne montre que
// « Véroleux » ; l'anglais n'existe que dans le champ bilingue `option_data`,
// qui ne couvre que l'ÉQUIPEMENT, les APTITUDES et les MOTS-CLEFS. Le nom de la
// datasheet doit donc être déduit — d'où la couverture d'ALN qui plafonne à
// 32 % sur les unités contre 52 % sur les capacités.
//
// ─── COMMENT ───────────────────────────────────────────────────────────────
// Les libellés d'une fiche, EUX, sont bilingues. On traduit donc les libellés
// FR de la fiche en anglais grâce aux couples attestés, puis on cherche la
// datasheet du dépôt dont les libellés anglais recouvrent le mieux ce jeu. Le
// rapprochement se fait donc ENTRE CHAÎNES ANGLAISES : on ne compare jamais du
// français à de l'anglais, ce que le README interdit explicitement (c'est ce
// qui avait produit « Wraithcannon → Armes de mêlée »).
//
// Une fiche n'est rattachée que si son meilleur candidat est NET : au moins
// deux libellés partagés, et strictement plus que le deuxième candidat. Tout
// le reste est laissé de côté et listé — un pack faux est pire qu'un partiel.
//
// ─── USAGE ─────────────────────────────────────────────────────────────────
//   node editor/translations/aln-attach.mjs            # → aln-names.json + rapport
//   node editor/translations/aln-attach.mjs --merge    # applique dans translations/fr.json
//   node editor/translations/aln-attach.mjs --terme véroleux   # tracer UNE fiche
//
// Options : --min 2 (libellés partagés exigés) · --out aln-names.json

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const has = (n) => args.includes(n);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const MIN = Number(val("--min", "2")) || 2;
const OUT = val("--out", join(ROOT, "aln-names.json"));
const TRACE = val("--terme", "");

const log = (...a) => console.log(...a);
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[’'`]/g, "'").replace(/\([^)]*\)/g, " ")
  .replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

const lire = async (f) => { const p = join(ROOT, f); return existsSync(p) ? JSON.parse(await readFile(p, "utf-8")) : null; };

const units = await lire("aln-units.json");
const pairsRaw = await lire("aln-pairs.json");
if (!units || !pairsRaw) {
  console.error(`\n  aln-units.json et aln-pairs.json doivent être à la racine du dépôt (${ROOT}).\n`);
  process.exit(1);
}
const pairs = pairsRaw.strings || pairsRaw;           // { EN: FR }
const fiches = units.fiches || {};

// FR → EN. Un libellé français qui correspond à PLUSIEURS anglais est ambigu :
// on le garde quand même mais il ne pourra jamais départager à lui seul.
const frToEn = new Map();
for (const [en, fr] of Object.entries(pairs)) {
  const k = norm(fr);
  if (!k) continue;
  if (!frToEn.has(k)) frToEn.set(k, new Set());
  frToEn.get(k).add(norm(en));
}

// ── Libellés anglais de chaque datasheet du dépôt ──────────────────────────
// Toujours via la lib de l'éditeur (règle maison : jamais de regex sur les .cat).
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js"));
const cat = new Catalog(ROOT);
cat.load();
const nomOf = (x) => (typeof x === "string" ? x : (x && (x.name || x.n)) || "");

const datasheets = [];
for (const f of cat.listFactions()) {
  if (f.type !== "catalogue") continue;
  const contenu = cat.listFactionContents(f.file);
  for (const u of (contenu && contenu.units) || []) {
    const d = cat.getUnit(f.file, u.id);
    if (!d) continue;
    const labels = new Set();
    for (const w of d.weapons || []) { const n = norm(nomOf(w)); if (n) labels.add(n); }
    for (const a of d.abilities || []) { const n = norm(nomOf(a)); if (n) labels.add(n); }
    for (const k of d.keywords || []) { const n = norm(nomOf(k)); if (n) labels.add(n); }
    if (labels.size) datasheets.push({ name: d.name, file: f.file, labels });
  }
}
// Une même datasheet est définie une fois mais importée par plusieurs
// catalogues : on ne garde qu'un exemplaire par NOM, avec l'union des libellés.
const parNom = new Map();
for (const d of datasheets) {
  if (!parNom.has(d.name)) parNom.set(d.name, { name: d.name, labels: new Set() });
  for (const l of d.labels) parNom.get(d.name).labels.add(l);
}
const cibles = [...parNom.values()];
log(`\n  datasheets du dépôt : ${cibles.length}`);
log(`  fiches ALN          : ${Object.keys(fiches).length}`);
log(`  couples attestés    : ${Object.keys(pairs).length}  (${frToEn.size} libellés FR distincts)`);

// ── Rattachement ───────────────────────────────────────────────────────────
const packPath = join(ROOT, "translations", "fr.json");
const pack = existsSync(packPath) ? JSON.parse(await readFile(packPath, "utf-8")) : { meta: {}, strings: {} };
const dejaTraduit = (n) => pack.strings[n] !== undefined;

const resultats = [];
for (const [id, f] of Object.entries(fiches)) {
  const frLabels = (f.labels || []).map((l) => norm(l && (l.fr || l))).filter(Boolean);
  // Libellés FR traduits en anglais grâce aux couples attestés.
  const enLabels = new Set();
  for (const fr of frLabels) for (const en of frToEn.get(fr) || []) enLabels.add(en);
  const trace = TRACE && norm(f.fr).includes(norm(TRACE));
  if (!enLabels.size) { resultats.push({ id, fr: f.fr, etat: "sans libellé traduisible", n: frLabels.length }); continue; }

  let best = null, second = 0;
  for (const d of cibles) {
    let score = 0;
    for (const l of enLabels) if (d.labels.has(l)) score++;
    if (!best || score > best.score) { second = best ? best.score : 0; best = { d, score }; }
    else if (score > second) second = score;
  }
  if (trace) {
    log(`\n  ── trace « ${f.fr} » [${id}] ──`);
    log(`     libellés FR : ${frLabels.length}, traduits en anglais : ${enLabels.size}`);
    log(`     ${[...enLabels].slice(0, 10).join(" · ")}`);
    log(`     meilleur : ${best.d.name} (${best.score} partagés) — second : ${second}`);
  }
  if (best.score >= MIN && best.score > second) resultats.push({ id, fr: f.fr, etat: "rattaché", en: best.d.name, score: best.score, second });
  else if (best.score >= MIN) resultats.push({ id, fr: f.fr, etat: "ambigu", en: best.d.name, score: best.score, second });
  else resultats.push({ id, fr: f.fr, etat: "trop peu de recouvrement", score: best.score });
}

const rattaches = resultats.filter((r) => r.etat === "rattaché");
const strings = {};
let comble = 0, deja = 0, identique = 0;
for (const r of rattaches) {
  if (norm(r.en) === norm(r.fr)) { identique++; continue; }   // rien à traduire
  if (dejaTraduit(r.en)) { deja++; continue; }                // décision déjà prise
  strings[r.en] = r.fr; comble++;
}
const compte = (e) => resultats.filter((r) => r.etat === e).length;
log(`\n  rattachées            : ${rattaches.length}`);
log(`    → comblent un trou  : ${comble}`);
log(`    → déjà traduites    : ${deja} (laissées intactes)`);
log(`    → identiques à l'EN : ${identique} (écartées, l'appli retombe sur la source)`);
log(`  ambiguës              : ${compte("ambigu")}`);
log(`  recouvrement < ${MIN}     : ${compte("trop peu de recouvrement")}`);
log(`  sans libellé traduisible : ${compte("sans libellé traduisible")}`);

await writeFile(OUT, JSON.stringify({
  meta: { source: "Army List Network — rattachement par recouvrement de libellés anglais", min: MIN, rattachees: rattaches.length, comblees: comble },
  strings,
  rejets: resultats.filter((r) => r.etat !== "rattaché").slice(0, 400),
}, null, 1) + "\n");
log(`\n  → ${OUT}`);

if (has("--merge")) {
  let n = 0;
  for (const [k, v] of Object.entries(strings)) if (pack.strings[k] === undefined) { pack.strings[k] = v; n++; }
  pack.meta.totalStrings = Object.keys(pack.strings).length;
  await writeFile(packPath, JSON.stringify(pack, null, 1));
  log(`  → translations/fr.json : +${n} noms (total ${pack.meta.totalStrings})`);
}
log(`\n  Relis aln-names.json avant de fusionner : c'est le moment où une erreur\n  de rattachement se rattrape facilement.\n`);
