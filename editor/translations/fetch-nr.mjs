#!/usr/bin/env node
// fetch-nr.mjs — récupère les traductions communautaires New Recruit (nrdata.org)
// pour les données BSData et les dépose dans translations/<lang>.json (racine du
// dépôt), au format canonique consommé par l'appli (cogitator-bellicum) :
//
//   { "meta": { system, language, fetchedAt, source, totalStrings },
//     "strings": { "<chaîne anglaise>": "<traduction>", ... } }
//
// Les clefs sont les chaînes ANGLAISES exactes des .cat (noms d'unités, d'armes,
// de groupes d'options, mots-clefs…) — c'est la convention de nrdata : la
// traduction s'applique par correspondance de chaîne, aucune correspondance
// d'identifiants n'est nécessaire.
//
// Sources, dans l'ordre :
//   1. API nrdata.org (la base vivante de l'outil collaboratif New Recruit) :
//      POST https://nrdata.org/api/translations {systemId, languageCode}
//      (lecture publique — l'Authorization n'est requise que pour SOUMETTRE).
//   2. --github : repli sur le miroir GitHub NewRecruitEU/translations
//      (BSData/<system>/<lang>/translations.json) — accessible partout mais
//      potentiellement en retard sur la base vivante.
//
// Usage :
//   node editor/translations/fetch-nr.mjs                 # fr (défaut)
//   node editor/translations/fetch-nr.mjs fr es de it     # plusieurs langues
//   node editor/translations/fetch-nr.mjs --github fr     # via le miroir GitHub
//   node editor/translations/fetch-nr.mjs --system BSData/wh40k-10e fr
//
// NOTE réseau : nrdata.org peut être inaccessible depuis certains environnements
// (proxy d'egress) — lance alors ce script depuis ta machine ; le repli --github
// passe par api.github.com, généralement ouvert.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = join(ROOT, "translations");
const NRDATA_API = "https://nrdata.org/api";
const GH_RAW = "https://raw.githubusercontent.com/NewRecruitEU/translations/main";

const args = process.argv.slice(2);
const useGithub = args.includes("--github");
let system = "BSData/wh40k-10e";
const sysIdx = args.indexOf("--system");
if (sysIdx >= 0 && args[sysIdx + 1]) system = args[sysIdx + 1];
const langs = args.filter((a) => !a.startsWith("--") && a !== system);
if (!langs.length) langs.push("fr");

async function fetchFromNrdata(lang) {
  const r = await fetch(`${NRDATA_API}/translations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemId: system, languageCode: lang }),
  });
  if (!r.ok) throw new Error(`nrdata ${r.status} ${r.statusText}`);
  const data = await r.json();
  // Formats tolérés : tableau direct, {translations:[...]}, ou déjà en map.
  const list = Array.isArray(data) ? data : Array.isArray(data.translations) ? data.translations : null;
  if (!list) throw new Error("nrdata: réponse inattendue " + JSON.stringify(data).slice(0, 200));
  return list;
}

async function fetchFromGithub(lang) {
  const url = `${GH_RAW}/${system}/${lang}/translations.json`;
  const r = await fetch(url);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`github ${r.status} ${r.statusText}`);
  const data = await r.json();
  return Array.isArray(data.translations) ? data.translations : [];
}

// Fusionne dans translations/<lang>.json EXISTANT (les corrections locales
// commitées gagnent sur une chaîne re-téléchargée identique non traduite ;
// une traduction fraîche non vide remplace l'ancienne).
async function mergeAndWrite(lang, list, source) {
  const outPath = join(OUT_DIR, `${lang}.json`);
  let existing = {};
  try { existing = JSON.parse(await readFile(outPath, "utf8")).strings || {}; } catch { /* première fois */ }
  let added = 0, updated = 0, kept = Object.keys(existing).length;
  const strings = { ...existing };
  for (const t of list) {
    const key = t.key || t.original;
    const val = (t.translation || "").trim();
    if (!key || !val || val === key) continue;           // vide / identique → inutile
    if (t.translated === false) continue;                 // non validée côté NR
    if (!(key in strings)) { strings[key] = val; added++; }
    else if (strings[key] !== val) { strings[key] = val; updated++; }
  }
  const sorted = Object.fromEntries(Object.entries(strings).sort(([a], [b]) => a.localeCompare(b)));
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(outPath, JSON.stringify({
    meta: { system, language: lang, fetchedAt: new Date().toISOString(), source, totalStrings: Object.keys(sorted).length },
    strings: sorted,
  }, null, 2) + "\n", "utf8");
  console.log(`[${lang}] ${Object.keys(sorted).length} chaînes (` +
    `${added} ajoutées, ${updated} mises à jour, ${kept} existantes) → translations/${lang}.json (${source})`);
}

for (const lang of langs) {
  try {
    let list, source;
    if (useGithub) { list = await fetchFromGithub(lang); source = "github:NewRecruitEU/translations"; }
    else {
      try { list = await fetchFromNrdata(lang); source = "nrdata.org"; }
      catch (e) {
        console.warn(`[${lang}] nrdata.org inaccessible (${e.message}) — repli sur le miroir GitHub…`);
        list = await fetchFromGithub(lang); source = "github:NewRecruitEU/translations (repli)";
      }
    }
    await mergeAndWrite(lang, list, source);
  } catch (e) {
    console.error(`[${lang}] ÉCHEC : ${e.message}`);
    process.exitCode = 1;
  }
}
