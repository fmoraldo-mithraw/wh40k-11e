#!/usr/bin/env node
// aln-fetch.mjs — extrait la base BILINGUE d'Army List Network en couples EN→FR.
//
// CE QU'ON A DÉCOUVERT dans la capture de aln-dump.mjs : ALN stocke chaque
// entité dans les DEUX langues, côte à côte.
//
//   options / armes / capacités / mots-clefs, champ caché `option_data` :
//     value="Pistolet bolter|1|1968|0|14049|Bolt pistol|Armes de Tir"
//            └── FR ────────┘ │  │    │  └id┘ └── VO ──┘ └ catégorie ┘
//                          type figure
//     type : 1=arme/équipement · 2=capacité · 3=mot-clef · 4=faction
//
//   figurines : f_fig_libelle[id]="Ephrael Stern" + f_fig_vo[id]="…"
//   détachements : {"libelle":"Armée de la Foi","libelleVO":"Army of Faith"}
//
// L'alignement anglais→français est donc DONNÉ par la source : aucune
// correspondance approximative n'est nécessaire.
//
// USAGE (depuis le dossier où tu as lancé aln-dump.mjs, la session y est déjà)
//   node aln-fetch.mjs                      # unités 1→6000 + détachements 1→600
//   node aln-fetch.mjs --from 1 --to 2000   # par tranches
//   node aln-fetch.mjs --detachements-only
//   node aln-fetch.mjs --profile aln-profile --out aln-pairs.json
//
// REPRISE : le script note les identifiants déjà vus dans aln-state.json ; tu
// peux l'interrompre (Ctrl+C) et le relancer, il repart où il s'était arrêté.
//
// POLITESSE : 3 requêtes en parallèle et une pause entre chaque — c'est le site
// d'un bénévole, on ne le matraque pas. Fais tourner ça sur une liste bidon que
// tu ne sauvegardes pas : `set_unite.php` sert normalement à configurer l'unité
// en cours d'édition.
//
// SORTIE : aln-pairs.json — quelques centaines de ko, c'est ce fichier qu'il
// faut me renvoyer (pas les réponses brutes, ni ./aln-profile qui contient TA
// session de connexion).

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const BASE = val("--base", "https://40k.armylistnetwork.com");
const PROFILE = val("--profile", "aln-profile");
const OUT = val("--out", "aln-pairs.json");
const STATE = val("--state", "aln-state.json");
const RAW = val("--raw", "");                       // dossier optionnel de sauvegarde brute
const FROM = Number(val("--from", "1"));
const TO = Number(val("--to", "6000"));
const DET_TO = Number(val("--detachements", "600"));
const PAR = Number(val("--parallele", "3"));
const PAUSE = Number(val("--pause", "120"));        // ms entre deux requêtes d'un même worker
const UNITS_ONLY = flag("--unites-only");
const DET_ONLY = flag("--detachements-only");

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { console.error("\n  Playwright manquant :  npm i playwright\n"); process.exit(1); }

if (!existsSync(PROFILE)) {
  console.error(`\n  Session absente (${PROFILE}/). Lance d'abord :\n    node aln-dump.mjs\n  et connecte-toi dans la fenêtre.\n`);
  process.exit(1);
}
if (RAW) await mkdir(RAW, { recursive: true });

// ── état de reprise ─────────────────────────────────────────────────────────
const state = existsSync(STATE)
  ? JSON.parse(await readFile(STATE, "utf8"))
  : { unites: {}, detachements: {}, pairs: {}, sansVo: {}, figures: {} };
const seen = (kind, id) => state[kind][id] !== undefined;

const decode = (s) =>
  String(s)
    .replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è").replace(/&ecirc;/g, "ê").replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç").replace(/&ucirc;/g, "û").replace(/&icirc;/g, "î")
    .replace(/&ocirc;/g, "ô").replace(/&euml;/g, "ë").replace(/&iuml;/g, "ï")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .trim();

const TYPES = { 1: "arme/équipement", 2: "capacité", 3: "mot-clef", 4: "faction" };

let nPairs = 0, nSansVo = 0;
function addPair(en, fr, type) {
  en = decode(en); fr = decode(fr);
  if (!fr) return;
  if (!en) { state.sansVo[fr] = TYPES[type] || String(type); nSansVo++; return; }
  if (en === fr) return;                             // rien à traduire
  if (!state.pairs[en]) { state.pairs[en] = { fr, type: TYPES[type] || String(type) }; nPairs++; }
}

// ── extraction depuis une réponse d'unité ───────────────────────────────────
function harvestUnite(json) {
  const html = [
    ...Object.values(json.tpl_option || {}),
    json.tpl_profil || "", json.selecteur_fig || "",
  ].join("\n");

  // options : FR|type|fig|?|id|VO|catégorie
  for (const m of html.matchAll(/name="f_select_option_data\[\d+\]"\s*value="([^"]*)"/g)) {
    const p = m[1].split("|");
    if (p.length >= 6) addPair(p[5], p[0], Number(p[1]));
    if (p[6]) addPair("", p[6], 1);                  // libellé de sous-type (« Armes de Tir »)
  }
  // figurines : libellé FR + VO, appariés par identifiant
  const libs = {}, vos = {};
  for (const m of html.matchAll(/name="f_fig_libelle\[(\d+)\]"\s*value="([^"]*)"/g)) libs[m[1]] = m[2];
  for (const m of html.matchAll(/name="f_fig_vo\[(\d+)\]"\s*value="([^"]*)"/g)) vos[m[1]] = m[2];
  for (const id of Object.keys(libs)) {
    if (vos[id]) addPair(vos[id], libs[id], 1);
    else if (libs[id]) state.figures[decode(libs[id])] = true;
  }
  // profils d'armes : le libellé français seul (utile pour recouper)
  for (const m of html.matchAll(/id="data_profil_\d+">(\[.*?\])<\/span>/g)) {
    try { for (const p of JSON.parse(decode(m[1]))) if (p.lib) state.sansVo[decode(p.lib)] ??= "profil"; }
    catch { /* profil malformé, on passe */ }
  }
}

function harvestDetachement(json) {
  if (json.libelleVO && json.libelle) addPair(json.libelleVO, json.libelle, 2);
  // Les stratagèmes n'ont que leur version française dans cette réponse : on les
  // collecte à part, ils serviront à recouper avec les noms anglais de la base.
  for (const m of String(json.stratagemes || "").matchAll(/<b>(.*?)<\/b>/g)) state.sansVo[decode(m[1])] ??= "stratagème";
  if (json.disposition) state.sansVo[decode(json.disposition)] ??= "disposition";
}

// ── boucle de récupération ──────────────────────────────────────────────────
const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, locale: "fr-FR" });
const api = ctx.request;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, vide = 0, err = 0, fait = 0;
async function fetchOne(kind, id) {
  const url = kind === "unites"
    ? `${BASE}/form/ajax/set_unite.php?f_id_codexunite=${id}`
    : `${BASE}/form/ajax/set_detachement.php?f_id_codexdetachement=${id}`;
  try {
    const r = await api.get(url, { timeout: 30000 });
    if (!r.ok()) { state[kind][id] = 0; err++; return; }
    const body = await r.text();
    if (body.length < 40) { state[kind][id] = 0; vide++; return; }
    let json;
    try { json = JSON.parse(body); } catch { state[kind][id] = 0; vide++; return; }
    if (RAW) await writeFile(`${RAW}/${kind}-${id}.json`, body, "utf8");
    if (kind === "unites") harvestUnite(json); else harvestDetachement(json);
    state[kind][id] = 1; ok++;
  } catch { state[kind][id] = 0; err++; }
  finally { fait++; }
}

async function run(kind, from, to) {
  const ids = [];
  for (let i = from; i <= to; i++) if (!seen(kind, i)) ids.push(i);
  console.log(`\n  ${kind} : ${ids.length} identifiants à interroger (${from}→${to})`);
  let curseur = 0;
  const worker = async () => {
    while (curseur < ids.length) {
      const id = ids[curseur++];
      await fetchOne(kind, id);
      if (fait % 50 === 0) {
        process.stdout.write(`\r  ${fait}/${ids.length} · ${ok} utiles · ${vide} vides · ${err} erreurs · ${nPairs} couples EN→FR`);
        await writeFile(STATE, JSON.stringify(state), "utf8");
      }
      await sleep(PAUSE);
    }
  };
  await Promise.all(Array.from({ length: PAR }, worker));
  await writeFile(STATE, JSON.stringify(state), "utf8");
  console.log(`\r  ${kind} terminé : ${ok} réponses utiles, ${nPairs} couples EN→FR au total          `);
}

const sortie = async () => {
  const strings = {};
  for (const [en, v] of Object.entries(state.pairs)) strings[en] = v.fr;
  await writeFile(OUT, JSON.stringify({
    meta: {
      source: "Army List Network (40k.armylistnetwork.com) — base bilingue FR/VO",
      recupereLe: new Date().toISOString().slice(0, 10),
      couples: Object.keys(strings).length,
      sansVersionAnglaise: Object.keys(state.sansVo).length,
    },
    strings,
    types: Object.fromEntries(Object.entries(state.pairs).map(([en, v]) => [en, v.type])),
    // Libellés vus en français SANS équivalent anglais dans la source : ils
    // seront recoupés côté dépôt avec les noms anglais de la base.
    sansVersionAnglaise: state.sansVo,
  }, null, 1) + "\n", "utf8");
  console.log(`\n  → ${OUT} : ${Object.keys(strings).length} couples EN→FR, ` +
    `${Object.keys(state.sansVo).length} libellés FR sans VO.\n` +
    `     Renvoie CE fichier (ni les réponses brutes, ni ./${PROFILE} qui contient ta session).\n`);
  await ctx.close().catch(() => {});
};

process.on("SIGINT", async () => { await writeFile(STATE, JSON.stringify(state), "utf8"); await sortie(); process.exit(0); });

if (!DET_ONLY) await run("unites", FROM, TO);
if (!UNITS_ONLY) { ok = 0; vide = 0; err = 0; fait = 0; await run("detachements", 1, DET_TO); }
await sortie();
