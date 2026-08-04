#!/usr/bin/env node
// aln-fetch.mjs — extrait la base BILINGUE d'Army List Network en couples EN→FR.
//
// ALN stocke chaque entité dans les DEUX langues, côte à côte :
//
//   options / armes / capacités / mots-clefs, champ caché `option_data` :
//     value="Pistolet bolter|1|1968|0|14049|Bolt pistol|Armes de Tir"
//            └── FR ────────┘ │  │    │  └id┘ └── VO ──┘ └ catégorie ┘
//                          type figure
//     type : 1=arme/équipement · 2=capacité · 3=mot-clef · 4=faction
//
//   figurines    : f_fig_libelle[id]="…" + f_fig_vo[id]="…"
//   détachements : {"libelle":"Armée de la Foi","libelleVO":"Army of Faith"}
//
// L'alignement anglais→français est DONNÉ par la source : aucun rapprochement
// approximatif n'est nécessaire.
//
// ENDPOINTS RÉELS (relevés en espionnant le site avec aln-probe.mjs) :
//   GET /form/ajax_select_unite.php?f_id_section=<S>&f_id_codex=<C>
//         → la liste des unités d'une section d'un codex (donc les identifiants)
//   GET /form/ajax_set_unite.php?f_id_codexunite=<id>
//         → la fiche complète d'une unité (armes, capacités, mots-clefs)
//   GET /form/ajax_set_detachement.php?f_id_codexdetachement=<id>
//         → un détachement (libellé FR + libelleVO + stratagèmes)
//   Tous exigent  X-Requested-With: XMLHttpRequest  et un Referer /form/unite.php
//
// On ne tire donc PAS 6000 identifiants au hasard : on parcourt les codex, on
// relève les identifiants réels, et on ne demande que ceux-là.
//
// USAGE (depuis le dossier où ./aln-profile a été créé par aln-dump.mjs)
//   node aln-fetch.mjs
//   node aln-fetch.mjs --codex 1-60 --sections 1-10
//   node aln-fetch.mjs --raw brut/          # garde aussi les réponses brutes
//
// REPRISE : aln-state.json ; Ctrl+C puis relance repart où ça s'était arrêté.
// POLITESSE : 3 requêtes en parallèle, pause entre chaque. C'est le site d'un
// bénévole. Fais-le sur une liste bidon que tu ne sauvegardes pas.
//
// SORTIE : aln-pairs.json — c'est CE fichier qu'il faut renvoyer (ni les
// réponses brutes, ni ./aln-profile qui contient ta session).

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const range = (s, d) => {
  const [a, b] = String(val(s, d)).split("-").map(Number);
  return { a, b: b ?? a };
};

const BASE = val("--base", "https://40k.armylistnetwork.com");
const PROFILE = val("--profile", "aln-profile");
const OUT = val("--out", "aln-pairs.json");
const STATE = val("--state", "aln-state.json");
const RAW = val("--raw", "");
const CODEX = range("--codex", "1-60");
const SECTIONS = range("--sections", "1-10");
const DET = range("--detachements", "1-600");
const PAR = Number(val("--parallele", "3"));
const PAUSE = Number(val("--pause", "120"));

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { console.error("\n  Playwright manquant :  npm i playwright\n"); process.exit(1); }
if (!existsSync(PROFILE)) {
  console.error(`\n  Session absente (${PROFILE}/). Lance d'abord  node aln-dump.mjs  et connecte-toi.\n`);
  process.exit(1);
}
if (RAW) await mkdir(RAW, { recursive: true });

const state = existsSync(STATE)
  ? JSON.parse(await readFile(STATE, "utf8"))
  : { listes: {}, unites: {}, detachements: {}, pairs: {}, sansVo: {}, ids: [] };
state.ids = state.ids || [];

const decode = (s) =>
  String(s)
    .replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è").replace(/&ecirc;/g, "ê").replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç").replace(/&ucirc;/g, "û").replace(/&icirc;/g, "î")
    .replace(/&ocirc;/g, "ô").replace(/&euml;/g, "ë").replace(/&iuml;/g, "ï")
    .replace(/&Eacute;/g, "É").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const TYPES = { 1: "arme/équipement", 2: "capacité", 3: "mot-clef", 4: "faction" };
let nPairs = 0;

function addPair(en, fr, type) {
  en = decode(en); fr = decode(fr);
  if (!fr) return;
  if (!en) { state.sansVo[fr] ??= TYPES[type] || String(type); return; }
  if (en === fr) return;
  if (!state.pairs[en]) { state.pairs[en] = { fr, type: TYPES[type] || String(type) }; nPairs++; }
}

// ── extraction ──────────────────────────────────────────────────────────────
function harvestUnite(json) {
  const html = [
    ...Object.values(json.tpl_option || {}),
    json.tpl_profil || "", json.selecteur_fig || "",
  ].join("\n");

  for (const m of html.matchAll(/name="f_select_option_data\[\d+\]"\s*value="([^"]*)"/g)) {
    const p = m[1].split("|");
    if (p.length >= 6) addPair(p[5], p[0], Number(p[1]));
  }
  const libs = {}, vos = {};
  for (const m of html.matchAll(/name="f_fig_libelle\[(\d+)\]"\s*value="([^"]*)"/g)) libs[m[1]] = m[2];
  for (const m of html.matchAll(/name="f_fig_vo\[(\d+)\]"\s*value="([^"]*)"/g)) vos[m[1]] = m[2];
  for (const id of Object.keys(libs)) {
    if (vos[id]) addPair(vos[id], libs[id], 1);
    else if (libs[id]) state.sansVo[decode(libs[id])] ??= "figurine";
  }
  for (const m of html.matchAll(/id="data_profil_\d+">(\[.*?\])<\/span>/g)) {
    try { for (const p of JSON.parse(m[1].replace(/&quot;/g, '"'))) if (p.lib) state.sansVo[decode(p.lib)] ??= "profil"; }
    catch { /* profil malformé */ }
  }
}

function harvestDetachement(json) {
  if (json.libelleVO && json.libelle) addPair(json.libelleVO, json.libelle, 2);
  for (const m of String(json.stratagemes || "").matchAll(/<b>(.*?)<\/b>/g)) state.sansVo[decode(m[1])] ??= "stratagème";
  if (json.disposition) state.sansVo[decode(json.disposition)] ??= "disposition";
}

// La liste d'une section : on en tire les identifiants d'unités ET, quand le
// balisage les porte, les libellés FR/VO. Le format exact étant inconnu, on
// ratisse large plutôt que de présumer d'une structure.
function harvestListe(body) {
  const ids = new Set();
  for (const m of body.matchAll(/f_id_codexunite[=:"']+(\d+)/g)) ids.add(Number(m[1]));
  for (const m of body.matchAll(/<option[^>]*value=["'](\d+)["'][^>]*>([^<]+)</g)) {
    ids.add(Number(m[1]));
    state.sansVo[decode(m[2]).replace(/\s*\(\+?\s*\d+\s*pts?\)\s*$/i, "")] ??= "unité";
  }
  for (const m of body.matchAll(/f_vo=["']([^"']+)["'][^>]*>([^<]+)</g)) addPair(m[1], m[2], 1);
  return [...ids];
}

// ── réseau ──────────────────────────────────────────────────────────────────
const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, locale: "fr-FR" });
const api = ctx.request;
const HDRS = { "X-Requested-With": "XMLHttpRequest", Referer: `${BASE}/form/unite.php` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, vide = 0, err = 0, fait = 0;

async function get(url) {
  const r = await api.get(url, { timeout: 30000, headers: HDRS });
  return { status: r.status(), body: await r.text() };
}

async function pool(items, worker) {
  let i = 0;
  await Promise.all(Array.from({ length: PAR }, async () => {
    while (i < items.length) {
      const it = items[i++];
      try { await worker(it); } catch { err++; }
      fait++;
      if (fait % 25 === 0) {
        process.stdout.write(`\r  ${fait}/${items.length} · ${ok} utiles · ${vide} vides · ${err} erreurs · ${nPairs} couples EN→FR   `);
        await writeFile(STATE, JSON.stringify(state), "utf8");
      }
      await sleep(PAUSE);
    }
  }));
  await writeFile(STATE, JSON.stringify(state), "utf8");
}

// 1) découverte : quels identifiants d'unités existent ?
const combos = [];
for (let c = CODEX.a; c <= CODEX.b; c++)
  for (let s = SECTIONS.a; s <= SECTIONS.b; s++)
    if (!state.listes[`${c}-${s}`]) combos.push([c, s]);

console.log(`\n  1/3 · découverte : ${combos.length} couples codex×section à explorer`);
let premierBrut = true;
await pool(combos, async ([c, s]) => {
  const { status, body } = await get(`${BASE}/form/ajax_select_unite.php?f_id_section=${s}&f_id_codex=${c}`);
  if (status !== 200 || body.length < 30) { state.listes[`${c}-${s}`] = 0; vide++; return; }
  if (RAW && premierBrut) { await writeFile(`${RAW}/liste-${c}-${s}.html`, body, "utf8"); premierBrut = false; }
  const ids = harvestListe(body);
  state.listes[`${c}-${s}`] = ids.length;
  for (const id of ids) if (!state.ids.includes(id)) state.ids.push(id);
  if (ids.length) ok++; else vide++;
});
console.log(`\r  1/3 · découverte terminée : ${state.ids.length} unités repérées                    `);

// 2) chaque unité
const aFaire = state.ids.filter((id) => !state.unites[id]);
ok = vide = err = fait = 0;
console.log(`\n  2/3 · fiches d'unités : ${aFaire.length} à récupérer`);
await pool(aFaire, async (id) => {
  const { status, body } = await get(`${BASE}/form/ajax_set_unite.php?f_id_codexunite=${id}`);
  if (status !== 200 || body.length < 40) { state.unites[id] = 0; vide++; return; }
  let json; try { json = JSON.parse(body); } catch { state.unites[id] = 0; vide++; return; }
  if (RAW) await writeFile(`${RAW}/unite-${id}.json`, body, "utf8");
  harvestUnite(json); state.unites[id] = 1; ok++;
});
console.log(`\r  2/3 · ${ok} fiches exploitées · ${nPairs} couples EN→FR                    `);

// 3) détachements
const dets = [];
for (let i = DET.a; i <= DET.b; i++) if (!state.detachements[i]) dets.push(i);
ok = vide = err = fait = 0;
console.log(`\n  3/3 · détachements : ${dets.length} identifiants`);
await pool(dets, async (id) => {
  const { status, body } = await get(`${BASE}/form/ajax_set_detachement.php?f_id_codexdetachement=${id}`);
  if (status !== 200 || body.length < 40) { state.detachements[id] = 0; vide++; return; }
  let json; try { json = JSON.parse(body); } catch { state.detachements[id] = 0; vide++; return; }
  if (RAW) await writeFile(`${RAW}/det-${id}.json`, body, "utf8");
  harvestDetachement(json); state.detachements[id] = 1; ok++;
});
console.log(`\r  3/3 · ${ok} détachements exploités                              `);

// ── sortie ──────────────────────────────────────────────────────────────────
async function sortie() {
  const strings = {};
  for (const [en, v] of Object.entries(state.pairs)) strings[en] = v.fr;
  await writeFile(OUT, JSON.stringify({
    meta: {
      source: "Army List Network (40k.armylistnetwork.com) — base bilingue FR/VO",
      recupereLe: new Date().toISOString().slice(0, 10),
      couples: Object.keys(strings).length,
      sansVersionAnglaise: Object.keys(state.sansVo).length,
      unites: Object.values(state.unites).filter(Boolean).length,
      detachements: Object.values(state.detachements).filter(Boolean).length,
    },
    strings,
    types: Object.fromEntries(Object.entries(state.pairs).map(([en, v]) => [en, v.type])),
    sansVersionAnglaise: state.sansVo,
  }, null, 1) + "\n", "utf8");
  console.log(`\n  → ${OUT} : ${Object.keys(strings).length} couples EN→FR, ` +
    `${Object.keys(state.sansVo).length} libellés FR sans version anglaise.\n`);
  await ctx.close().catch(() => {});
}
process.on("SIGINT", async () => { await writeFile(STATE, JSON.stringify(state), "utf8"); await sortie(); process.exit(0); });
await sortie();
