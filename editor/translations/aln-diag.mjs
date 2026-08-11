#!/usr/bin/env node
// aln-diag.mjs — que contient VRAIMENT la récolte ALN ?
//
// À lancer depuis la racine du dépôt, là où aln-fetch.mjs a écrit ses fichiers :
//
//   node editor/translations/aln-diag.mjs                 # état général
//   node editor/translations/aln-diag.mjs --terme véroleux  # chercher un nom
//   node editor/translations/aln-diag.mjs --codex "Death Guard"
//
// Pourquoi ce script plutôt qu'un grep : aln-units.json n'est PAS une table
// plate mais { codex, sections, fiches, detachements }. Un
// `Object.entries(u).filter(([,v]) => v.fr)` parcourt donc les quatre clefs de
// tête, dont aucune n'a de champ `fr`, et rend [] quoi qu'il y ait dedans — un
// faux négatif garanti. Les fiches sont sous `u.fiches`, indexées par id.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const TERME = val("--terme", "");
const CODEX = val("--codex", "");

const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const lire = async (f) => { const p = join(ROOT, f); return existsSync(p) ? JSON.parse(await readFile(p, "utf-8")) : null; };

const units = await lire("aln-units.json");
const pairs = await lire("aln-pairs.json");
const state = await lire("aln-state.json");
if (!units) { console.error(`\n  aln-units.json introuvable à la racine du dépôt (${ROOT}).\n`); process.exit(1); }

const fiches = units.fiches || {};
const codex = units.codex || {};
const sections = units.sections || {};
const rows = Object.entries(fiches).map(([id, f]) => ({ id, ...f }));

console.log(`\n── Récolte ALN ────────────────────────────────────────────────`);
console.log(`  fiches         : ${rows.length}`);
console.log(`  codex déclarés : ${Object.keys(codex).length}`);
console.log(`  sections       : ${Object.keys(sections).length}`);
console.log(`  couples EN→FR  : ${pairs ? Object.keys(pairs.strings || pairs).length : "aln-pairs.json absent"}`);
console.log(`  détachements   : ${Object.keys(units.detachements || {}).length}`);

// Couverture par codex : c'est là qu'un trou de balayage se voit.
const parCodex = new Map();
for (const r of rows) parCodex.set(String(r.codex), (parCodex.get(String(r.codex)) || 0) + 1);
console.log(`\n── Fiches par codex (les codex ABSENTS de cette liste n'ont rien rendu) ──`);
const tous = new Set([...Object.values(codex).map(String), ...parCodex.keys()]);
const lignes = [...tous].map((c) => ({ c, n: parCodex.get(c) || 0 })).sort((a, b) => a.n - b.n);
for (const { c, n } of lignes) console.log(`  ${String(n).padStart(4)}  ${c}`);
const vides = lignes.filter((l) => !l.n);
if (vides.length) console.log(`\n  ⚠ ${vides.length} codex sans AUCUNE fiche — balayage incomplet.`);

// État du balayage : combien de couples codex×section ont rendu 0.
if (state && state.listes) {
  const vals = Object.values(state.listes);
  const zero = vals.filter((v) => !v).length;
  console.log(`\n── Balayage (aln-state.json) ──`);
  console.log(`  couples codex×section interrogés : ${vals.length}`);
  console.log(`  ayant rendu 0 fiche              : ${zero} (${Math.round(100 * zero / (vals.length || 1))}%)`);
  console.log(`  fiches détaillées lues           : ${Object.keys(state.unites || {}).length}`);
}

if (TERME) {
  const t = norm(TERME);
  console.log(`\n── Recherche « ${TERME} » ──`);
  const dansFiches = rows.filter((r) => norm(r.fr).includes(t));
  console.log(`  dans les NOMS de fiche : ${dansFiches.length}`);
  for (const r of dansFiches.slice(0, 20)) console.log(`     [${r.id}] ${r.fr}   (codex ${r.codex} · section ${r.section} · ${(r.labels || []).length} libellés)`);
  const dansLabels = rows.filter((r) => (r.labels || []).some((l) => norm(l && l.fr).includes(t)));
  console.log(`  dans les LIBELLÉS      : ${dansLabels.length}`);
  for (const r of dansLabels.slice(0, 10)) console.log(`     [${r.id}] ${r.fr} → ${(r.labels || []).filter((l) => norm(l && l.fr).includes(t)).map((l) => l.fr).join(", ")}`);
  if (pairs) {
    const st = pairs.strings || pairs;
    const hits = Object.entries(st).filter(([k, v]) => norm(k).includes(t) || norm(v).includes(t));
    console.log(`  dans les COUPLES       : ${hits.length}`);
    for (const [k, v] of hits.slice(0, 10)) console.log(`     ${JSON.stringify(k)} → ${JSON.stringify(v)}`);
  }
  if (!dansFiches.length) console.log(`\n  ⇒ Aucune fiche de ce nom n'a été récoltée : c'est le BALAYAGE qui l'a manquée,\n    pas l'appariement. Regarde ci-dessus si son codex a rendu 0 fiche.`);
}

if (CODEX) {
  const c = norm(CODEX);
  console.log(`\n── Codex « ${CODEX} » ──`);
  const ids = Object.entries(codex).filter(([, nom]) => norm(nom).includes(c));
  console.log(`  identifiants correspondants : ${ids.map(([id, nom]) => `${id}=${nom}`).join(" · ") || "aucun déclaré"}`);
  const f = rows.filter((r) => norm(r.codex).includes(c));
  console.log(`  fiches récoltées            : ${f.length}`);
  for (const r of f.slice(0, 40)) console.log(`     ${r.fr}`);
  if (!f.length) console.log(`  ⇒ ce codex n'a rendu aucune fiche : le balayage ne l'a pas atteint.`);
}
console.log("");
