#!/usr/bin/env node
// corrige-terme.mjs — appliquer une correction de traduction PAR TERME, avec
// les deux garde-fous que les corrections manuelles ont rendus nécessaires.
//
// ─── POURQUOI « PAR TERME » ────────────────────────────────────────────────
// Corriger la seule clef ne suffit presque jamais : quand « Deadly Demise »
// devient « Destruction Néfaste », l'ancien choix (« Fin Fatale ») reste dans
// des dizaines de chaînes de PROSE (descriptions, stratagèmes, règles) qui
// parlent de la même capacité. Une clef juste au-dessus d'une prose qui la
// contredit est pire qu'une traduction absente. Ce script fait donc les deux :
// la clef, ET le remplacement de l'ancien terme français dans toutes les
// valeurs (correspondance de chaîne exacte, jamais de flou).
//
// ─── LES DEUX GARDE-FOUS ───────────────────────────────────────────────────
// 1. ATTESTATION (atteste-conserve.mjs) : si la prose du pack prouve que le
//    terme anglais est CONSERVÉ en français (« Signum Array » → « Panoplie de
//    Signums »), proposer une traduction le contredit — refus, sauf --force.
// 2. IDENTITÉ : une « traduction » égale à l'anglais est écartée (règle du
//    pack : dataName() retombe déjà sur la chaîne source).
//
// ─── USAGE ─────────────────────────────────────────────────────────────────
//   node editor/translations/corrige-terme.mjs --en "Deadly Demise" --fr "Destruction Néfaste"
//   … --ancien "Fin Fatale"     # remplace aussi l'ancien terme dans la prose
//   … --sec                     # montre tout, n'écrit rien
//   … --force                   # outrepasse le refus d'attestation (à justifier au README)
//
// Écrit translations/fr.json en JSON.stringify(j, null, 1), ordre des clefs
// préservé (le re-tri a déjà produit un diff de 7 460 lignes — ne jamais trier).

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : ""; };
const EN = val("--en"), FR = val("--fr"), ANCIEN = val("--ancien");
const SEC = args.includes("--sec"), FORCE = args.includes("--force");
if (!EN || !FR) { console.error("\n  usage : corrige-terme.mjs --en \"Terme Anglais\" --fr \"Terme Français\" [--ancien \"Ancien Français\"] [--sec] [--force]\n"); process.exit(1); }

const packPath = join(ROOT, "translations", "fr.json");
const j = JSON.parse(await readFile(packPath, "utf-8"));
const s = j.strings;

// ── garde-fou 2 : identité ────────────────────────────────────────────────
if (EN === FR) { console.error(`\n  ✗ REFUS : « ${FR} » est identique à l'anglais — le pack écarte ces entrées par construction (dataName() retombe déjà sur la source).\n`); process.exit(2); }

// ── garde-fou 1 : attestation par la prose du pack ────────────────────────
const { atteste } = await import("./atteste-conserve.mjs");
const a = atteste(EN);
console.log(`\n  attestation de « ${EN} » : ${a.verdict.toUpperCase()} (${a.preuves} preuve${a.preuves > 1 ? "s" : ""})`);
for (const e of a.garde.slice(0, 3)) console.log(`     + conservé : ${JSON.stringify(e.k).slice(0, 90)} → ${JSON.stringify(e.v).slice(0, 90)}`);
for (const e of a.perdu.slice(0, 3)) console.log(`     ! traduit  : ${JSON.stringify(e.k).slice(0, 90)} → ${JSON.stringify(e.v).slice(0, 90)}`);
if (a.verdict === "conservé" && !FORCE) {
  console.error(`\n  ✗ REFUS : la prose du pack atteste que « ${EN} » est CONSERVÉ en français — la traduction proposée la contredirait. Relire les preuves ci-dessus ; --force si elles sont toutes fausses (et le documenter au README).\n`);
  process.exit(2);
}

// ── application ───────────────────────────────────────────────────────────
const rapport = [];
// 1. la clef elle-même
if (s[EN] === FR) rapport.push(`clef « ${EN} » : déjà à jour`);
else { rapport.push(`clef « ${EN} » : ${s[EN] !== undefined ? JSON.stringify(s[EN]) + " → " : "+ "}${JSON.stringify(FR)}`); if (!SEC) s[EN] = FR; }

// 2. l'ancien terme français dans les valeurs (chaîne exacte)
let prose = 0;
if (ANCIEN) {
  for (const [k, v] of Object.entries(s)) {
    if (typeof v !== "string" || !v.includes(ANCIEN)) continue;
    prose++;
    if (!SEC) s[k] = v.split(ANCIEN).join(FR);
  }
  rapport.push(`prose : ${prose} valeur(s) contenant « ${ANCIEN} » ${SEC ? "seraient" : ""} remplacée(s)`);
}

// 3. le terme ANGLAIS resté dans des valeurs françaises — signalé, jamais
//    remplacé d'office : dans une valeur, l'anglais peut être un nom d'unité
//    volontairement conservé (le piège Infiltrators).
const restes = Object.entries(s).filter(([, v]) => typeof v === "string" && v.includes(EN));
if (restes.length) {
  rapport.push(`à relire À LA MAIN : ${restes.length} valeur(s) françaises contiennent encore « ${EN} » :`);
  for (const [k] of restes.slice(0, 8)) rapport.push(`     ${JSON.stringify(k).slice(0, 110)}`);
}

for (const l of rapport) console.log("  " + l);
if (SEC) { console.log("\n  (--sec : rien n'a été écrit)\n"); process.exit(0); }
j.meta.totalStrings = Object.keys(s).length;
await writeFile(packPath, JSON.stringify(j, null, 1));
console.log(`\n  → translations/fr.json écrit (${j.meta.totalStrings} chaînes)\n`);
