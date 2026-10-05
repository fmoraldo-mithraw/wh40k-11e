#!/usr/bin/env node
// aln-extract.mjs — relit HORS LIGNE un dossier de réponses brutes ALN (créé
// par `aln-fetch.mjs --raw brut/`) et en tire, fiche par fiche, tout le
// contenu exploitable : caractéristiques, profils d'armes avec leurs valeurs,
// points, et TEXTE COMPLET des capacités ; pour les détachements, règle,
// stratagèmes et améliorations avec leur texte.
//
// Aucune requête vers le site : utile pour retraiter une récolte existante
// sans la refaire.
//
// USAGE
//   node editor/translations/aln-extract.mjs brut/              → aln-fiches.json
//   node editor/translations/aln-extract.mjs brut/ --out x.json
//   node editor/translations/aln-extract.mjs brut/ --codex 90   (un seul codex)
//
// SORTIE  aln-fiches.json
//   { meta, fiches: { <id>: { fr, codex, section, points, modeles[], armes[],
//                             capacites[{fr,vo,texte}], options[] } },
//     detachements: { <id>: { fr, vo, pd, dispositions[], regle,
//                             strats[{fr,cp,texte}], ameliorations[{fr,texte}] } } }
// Les textes sont en français (ALN ne fournit en VO que les noms).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dec, parseUnite, parseDetachement } from "./aln-parse.mjs";

const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DIR = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--out" && args[args.indexOf(a) - 1] !== "--codex") || "brut";
const OUT = val("--out", "aln-fiches.json");
const CODEX = val("--codex", "");

const files = await readdir(DIR);
// Noms FR des fiches : dans les listes « liste-<codex>-<section>.html ».
const noms = {};
for (const f of files.filter((f) => /^liste-\d+-\d+\.html$/.test(f))) {
  const [, cx, sec] = f.match(/liste-(\d+)-(\d+)/);
  const h = await readFile(join(DIR, f), "utf8");
  for (const m of h.matchAll(/<option[^>]*value=["'](\d+)["'][^>]*>([^<]+)</g)) {
    if (m[1] !== "0") noms[m[1]] = { fr: dec(m[2]).replace(/\s*\(\+?\s*\d+\s*pts?\)\s*$/i, "").trim(), codex: +cx, section: +sec };
  }
}

const fiches = {}, detachements = {};
let ko = 0;
for (const f of files) {
  const mu = f.match(/^unite-(\d+)\.json$/), md = f.match(/^det-(\d+)\.json$/);
  if (!mu && !md) continue;
  let j; try { j = JSON.parse(await readFile(join(DIR, f), "utf8")); } catch { ko++; continue; }
  if (mu) {
    const n = noms[mu[1]] || { fr: "?", codex: 0, section: 0 };
    if (CODEX && String(n.codex) !== CODEX) continue;
    fiches[mu[1]] = { ...n, ...parseUnite(j) };
  } else detachements[md[1]] = parseDetachement(j);
}

const nCap = Object.values(fiches).reduce((s, f) => s + f.capacites.length, 0);
const nTxt = Object.values(fiches).reduce((s, f) => s + f.capacites.filter((c) => c.texte).length, 0);
await writeFile(OUT, JSON.stringify({
  meta: { source: "Army List Network (40k.armylistnetwork.com)", dossier: DIR, extraitLe: new Date().toISOString().slice(0, 10),
    fiches: Object.keys(fiches).length, capacites: nCap, capacitesAvecTexte: nTxt, detachements: Object.keys(detachements).length },
  fiches, detachements,
}, null, 1) + "\n", "utf8");
console.log(`${Object.keys(fiches).length} fiches (${nTxt}/${nCap} capacités avec texte), ${Object.keys(detachements).length} détachements → ${OUT}` + (ko ? ` — ${ko} fichier(s) illisible(s)` : ""));
