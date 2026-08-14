#!/usr/bin/env node
// dup-ids.mjs — le CLIQUET des identifiants dupliqués.
//
// L'état des lieux du 2026-08-06 a compté 785 ids distincts dupliqués répartis
// dans 27 des 47 fichiers — un héritage d'avant la règle maison « 0 id dupliqué
// INTRODUIT vs HEAD ». Les résorber d'un coup est exclu : réécrire un id casse
// toutes les références qui le visent. Ce script fige donc le stock par fichier
// dans une BASELINE commitée et impose deux choses :
//
//   1. le compte d'un fichier ne doit JAMAIS dépasser sa baseline (échec CI) ;
//   2. quand il descend, la baseline doit être re-figée au niveau atteint
//      (--fige), pour que le progrès soit lui aussi irréversible.
//
// Un fichier absent de la baseline (nouveau .cat) doit partir à zéro.
//
// Usage :
//   node editor/audit/dup-ids.mjs           # contrôle (code 1 si dépassement)
//   node editor/audit/dup-ids.mjs --fige    # (re)écrit la baseline aux comptes actuels

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = join(dirname(fileURLToPath(import.meta.url)), "dup-ids.baseline.json");
const FIGE = process.argv.includes("--fige");

// Ids distincts ayant AU MOINS deux définitions dans le fichier. On compte les
// ids distincts (pas les occurrences) : c'est la mesure stable quand une
// entrée dupliquée est elle-même copiée.
async function compte(file) {
  const txt = await readFile(join(ROOT, file), "utf-8");
  const seen = new Set(), dup = new Set();
  for (const m of txt.matchAll(/\sid="([^"]+)"/g)) (seen.has(m[1]) ? dup : seen).add(m[1]);
  return dup.size;
}

const files = (await readdir(ROOT)).filter((f) => /\.(cat|gst)$/.test(f)).sort();
// Plancher : un checkout tronqué (0 ou peu de fichiers) donnait 0 dépassement →
// exit 0, un faux feu vert. Le dépôt a ~47 fichiers de données.
if (files.length < 45) { console.error(`[dup-ids] seulement ${files.length} fichiers .cat/.gst (attendu ≥45) — checkout tronqué ?`); process.exit(1); }
const actuel = {};
for (const f of files) actuel[f] = await compte(f);

if (FIGE) {
  await writeFile(BASE, JSON.stringify(actuel, null, 1) + "\n");
  const tot = Object.values(actuel).reduce((a, b) => a + b, 0);
  console.log(`baseline figée : ${tot} ids dupliqués sur ${files.length} fichiers → ${BASE}`);
  process.exit(0);
}

let base = {};
try { base = JSON.parse(await readFile(BASE, "utf-8")); }
catch { console.error("baseline absente — lancer d'abord : node editor/audit/dup-ids.mjs --fige"); process.exit(1); }

let depassements = 0, ameliorations = 0;
for (const f of files) {
  const b = base[f] ?? 0;                       // fichier nouveau → doit être à 0
  if (actuel[f] > b) { depassements++; console.error(`  ✗ ${f} : ${actuel[f]} ids dupliqués (baseline ${b}) — ${actuel[f] - b} INTRODUIT(S)`); }
  else if (actuel[f] < b) { ameliorations++; console.log(`  ↓ ${f} : ${actuel[f]} (baseline ${b}) — re-figer avec --fige`); }
}
for (const f of Object.keys(base)) if (!(f in actuel)) console.log(`  (baseline orpheline : ${f} n'existe plus)`);

const tot = Object.values(actuel).reduce((a, b) => a + b, 0);
console.log(`\n${files.length} fichiers, ${tot} ids dupliqués au total — ${depassements} dépassement(s), ${ameliorations} amélioration(s) à re-figer`);
if (ameliorations && !depassements) console.log("→ le stock a baissé : committer la baseline re-figée pour rendre la baisse irréversible.");
process.exit(depassements ? 1 : 0);
