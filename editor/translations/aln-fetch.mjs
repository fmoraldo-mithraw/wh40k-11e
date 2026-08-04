#!/usr/bin/env node
// aln-fetch.mjs — récupère la base bilingue d'Army List Network.
//
// ALN stocke chaque entité dans les DEUX langues, côte à côte :
//
//   options (armes, capacités, mots-clefs), champ caché `option_data` :
//     value="Pistolet bolter|1|1968|0|14049|Bolt pistol|Armes de Tir"
//            └── FR ────────┘ │  │    │  └id┘ └── VO ──┘ └ catégorie ┘
//                          type figure
//     type : 1=arme/équipement · 2=capacité · 3=mot-clef · 4=faction
//   figurines    : f_fig_libelle[id] + f_fig_vo[id]
//   profils      : f_profil_libelle[i]        (FR seul — modèles et armes)
//   détachements : {"libelle":…, "libelleVO":…, "stratagemes": HTML}
//
// TOUT n'a PAS de version anglaise. C'est pour cela que la sortie conserve le
// GROUPEMENT PAR FICHE : une fiche ALN s'apparie à une datasheet du dépôt (via
// les couples qu'on a déjà), et à l'intérieur de cette paire les libellés FR
// orphelins s'apparient aux chaînes anglaises orphelines. Un sac de libellés à
// plat perd cette information et plafonne la couverture.
//
// ENDPOINTS (relevés en espionnant le site) — tous en GET, avec
// X-Requested-With: XMLHttpRequest et Referer /form/unite.php :
//   /form/unite.php                                        page porteuse des
//                                                          listes déroulantes
//   /form/ajax_select_unite.php?f_id_section=S&f_id_codex=C liste d'une section
//   /form/ajax_set_unite.php?f_id_codexunite=<id>           fiche d'une unité
//   /form/ajax_set_detachement.php?f_id_codexdetachement=<id>
//
// On LIT les identifiants de codex et de section dans la page plutôt que de les
// deviner : une plage devinée trop courte ampute silencieusement la récolte.
//
// USAGE (depuis le dossier où ./aln-profile a été créé par aln-dump.mjs)
//   node aln-fetch.mjs
//   node aln-fetch.mjs --raw brut/           garde aussi les réponses brutes
//   node aln-fetch.mjs --codex 1-150 --sections 1-25   (repli si la page ne
//                                            livre pas ses listes déroulantes)
//
// REPRISE : aln-state.json ; Ctrl+C puis relance repart où ça s'était arrêté.
// POLITESSE : 3 requêtes en parallèle, pause entre chaque. C'est le site d'un
// bénévole. Travaille sur une liste bidon que tu ne sauvegardes pas.
//
// SORTIE :
//   aln-pairs.json  couples EN→FR directement attestés   ← à renvoyer
//   aln-units.json  fiches groupées, avec leurs libellés ← à renvoyer
// (ni les réponses brutes, ni ./aln-profile qui contient ta session)

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const rg = (s, d) => { const [a, b] = String(val(s, d)).split("-").map(Number); return { a, b: b ?? a }; };

const BASE = val("--base", "https://40k.armylistnetwork.com");
const PROFILE = val("--profile", "aln-profile");
const RAW = val("--raw", "");
const CODEX = rg("--codex", "1-150");
const SECTIONS = rg("--sections", "1-25");
const DET = rg("--detachements", "1-800");
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

const S = existsSync("aln-state.json")
  ? JSON.parse(await readFile("aln-state.json", "utf8"))
  : {};
S.listes ??= {}; S.unites ??= {}; S.detachements ??= {};
S.pairs ??= {}; S.fiches ??= {}; S.detFR ??= {}; S.codex ??= {}; S.sections ??= {};

const dec = (s) => String(s)
  .replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&eacute;/g, "é").replace(/&egrave;/g, "è")
  .replace(/&ecirc;/g, "ê").replace(/&agrave;/g, "à").replace(/&ccedil;/g, "ç").replace(/&ucirc;/g, "û")
  .replace(/&icirc;/g, "î").replace(/&ocirc;/g, "ô").replace(/&euml;/g, "ë").replace(/&iuml;/g, "ï")
  .replace(/&Eacute;/g, "É").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const TYPES = { 1: "arme", 2: "capacité", 3: "mot-clef", 4: "faction" };
const addPair = (en, fr, ty) => {
  en = dec(en); fr = dec(fr);
  if (!en || !fr || en === fr) return;
  S.pairs[en] ??= { fr, type: TYPES[ty] || String(ty) };
};

// ── réseau ──────────────────────────────────────────────────────────────────
const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, locale: "fr-FR" });
const api = ctx.request;
const HDRS = { "X-Requested-With": "XMLHttpRequest", Referer: `${BASE}/form/unite.php` };
const dodo = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => { const r = await api.get(url, { timeout: 30000, headers: HDRS }); return { st: r.status(), body: await r.text() }; };

let ok = 0, vide = 0, err = 0, fait = 0, total = 0;
async function pool(items, worker, titre) {
  total = items.length; ok = vide = err = fait = 0;
  let i = 0;
  await Promise.all(Array.from({ length: PAR }, async () => {
    while (i < items.length) {
      const it = items[i++];
      try { await worker(it); } catch { err++; }
      fait++;
      if (fait % 25 === 0) {
        process.stdout.write(`\r  ${titre} ${fait}/${total} · ${ok} utiles · ${vide} vides · ${err} err · ${Object.keys(S.pairs).length} couples   `);
        await writeFile("aln-state.json", JSON.stringify(S), "utf8");
      }
      await dodo(PAUSE);
    }
  }));
  await writeFile("aln-state.json", JSON.stringify(S), "utf8");
  process.stdout.write(`\r  ${titre} terminé : ${ok} utiles sur ${total}` + " ".repeat(40) + "\n");
}

// ── 0. les listes déroulantes de la page, plutôt qu'une plage devinée ───────
console.log("\n  0/4 · lecture des codex et sections déclarés par le site");
try {
  const { body } = await get(`${BASE}/form/unite.php`);
  if (RAW) await writeFile(`${RAW}/unite-page.html`, body, "utf8");
  for (const m of body.matchAll(/<select[^>]*name=["']?f_id_(codex|section)["']?[^>]*>([\s\S]*?)<\/select>/gi)) {
    const quoi = m[1] === "codex" ? S.codex : S.sections;
    for (const o of m[2].matchAll(/<option[^>]*value=["']?(\d+)["']?[^>]*>([^<]*)</g)) quoi[o[1]] = dec(o[2]);
  }
  console.log(`        ${Object.keys(S.codex).length} codex · ${Object.keys(S.sections).length} sections`);
} catch (e) { console.log("        échec :", e.message.split("\n")[0]); }

const codexIds = Object.keys(S.codex).length ? Object.keys(S.codex).map(Number)
  : Array.from({ length: CODEX.b - CODEX.a + 1 }, (_, i) => CODEX.a + i);
const sectionIds = Object.keys(S.sections).length ? Object.keys(S.sections).map(Number)
  : Array.from({ length: SECTIONS.b - SECTIONS.a + 1 }, (_, i) => SECTIONS.a + i);
if (!Object.keys(S.codex).length) console.log(`        listes absentes → repli sur les plages ${CODEX.a}-${CODEX.b} × ${SECTIONS.a}-${SECTIONS.b}`);

// ── 1. les listes de section : identifiants ET noms FR des unités ───────────
const combos = [];
for (const c of codexIds) for (const s of sectionIds) if (!S.listes[`${c}-${s}`]) combos.push([c, s]);
await pool(combos, async ([c, s]) => {
  const { st, body } = await get(`${BASE}/form/ajax_select_unite.php?f_id_section=${s}&f_id_codex=${c}`);
  if (st !== 200 || body.length < 30) { S.listes[`${c}-${s}`] = 0; vide++; return; }
  if (RAW) await writeFile(`${RAW}/liste-${c}-${s}.html`, body, "utf8");
  let n = 0;
  // Le nom FR de l'unité vit dans la liste ; l'identifiant sert de clef de fiche.
  for (const m of body.matchAll(/f_id_codexunite[=:"']+(\d+)[^>]*>([^<]*)</g)) {
    const id = m[1], nom = dec(m[2]).replace(/\s*\(\+?\s*\d+\s*pts?\)\s*$/i, "");
    S.fiches[id] ??= { fr: nom, codex: S.codex[c] || c, section: S.sections[s] || s, labels: [] };
    n++;
  }
  for (const m of body.matchAll(/<option[^>]*value=["'](\d+)["'][^>]*>([^<]+)</g)) {
    const id = m[1], nom = dec(m[2]).replace(/\s*\(\+?\s*\d+\s*pts?\)\s*$/i, "");
    if (!/^\d+$/.test(nom)) { S.fiches[id] ??= { fr: nom, codex: S.codex[c] || c, section: S.sections[s] || s, labels: [] }; n++; }
  }
  S.listes[`${c}-${s}`] = n;
  if (n) ok++; else vide++;
}, "1/4 listes");
console.log(`        ${Object.keys(S.fiches).length} fiches repérées`);

// ── 2. chaque fiche : ses libellés, groupés ────────────────────────────────
const aFaire = Object.keys(S.fiches).filter((id) => !S.unites[id]);
await pool(aFaire, async (id) => {
  const { st, body } = await get(`${BASE}/form/ajax_set_unite.php?f_id_codexunite=${id}`);
  if (st !== 200 || body.length < 40) { S.unites[id] = 0; vide++; return; }
  let j; try { j = JSON.parse(body); } catch { S.unites[id] = 0; vide++; return; }
  if (RAW) await writeFile(`${RAW}/unite-${id}.json`, body, "utf8");
  const html = [...Object.values(j.tpl_option || {}), j.tpl_profil || "", j.selecteur_fig || ""].join("\n");
  const f = S.fiches[id];

  for (const m of html.matchAll(/name="f_select_option_data\[\d+\]"\s*value="([^"]*)"/g)) {
    const p = m[1].split("|");
    const fr = dec(p[0]), vo = dec(p[5] || ""), ty = TYPES[Number(p[1])] || "?";
    if (vo) addPair(vo, fr, Number(p[1]));
    else if (fr) f.labels.push({ fr, type: ty });          // orphelin : à apparier
  }
  const libs = {}, vos = {};
  for (const m of html.matchAll(/name="f_fig_libelle\[(\d+)\]"\s*value="([^"]*)"/g)) libs[m[1]] = m[2];
  for (const m of html.matchAll(/name="f_fig_vo\[(\d+)\]"\s*value="([^"]*)"/g)) vos[m[1]] = m[2];
  for (const k of Object.keys(libs)) {
    if (vos[k]) addPair(vos[k], libs[k], 1);
    else if (dec(libs[k])) f.labels.push({ fr: dec(libs[k]), type: "figurine" });
  }
  // Noms de profils : modèles et armes, en français seul.
  for (const m of html.matchAll(/name="f_profil_libelle\[\d+\]"\s*value="([^"]*)"/g)) {
    const fr = dec(m[1]); if (fr) f.labels.push({ fr, type: "profil" });
  }
  // Intertitres de groupe d'options (« Armes de Tir », « Équipement »).
  for (const m of html.matchAll(/class="soustype">([^<]+)</g)) {
    const fr = dec(m[1]); if (fr) f.labels.push({ fr, type: "groupe" });
  }
  // dédoublonnage interne à la fiche
  const vus = new Set();
  f.labels = f.labels.filter((l) => { const k = l.type + "|" + l.fr; if (vus.has(k)) return false; vus.add(k); return true; });
  S.unites[id] = 1; ok++;
}, "2/4 fiches ");

// ── 3. détachements ────────────────────────────────────────────────────────
const dets = [];
for (let i = DET.a; i <= DET.b; i++) if (!S.detachements[i]) dets.push(i);
await pool(dets, async (id) => {
  const { st, body } = await get(`${BASE}/form/ajax_set_detachement.php?f_id_codexdetachement=${id}`);
  if (st !== 200 || body.length < 40) { S.detachements[id] = 0; vide++; return; }
  let j; try { j = JSON.parse(body); } catch { S.detachements[id] = 0; vide++; return; }
  if (RAW) await writeFile(`${RAW}/det-${id}.json`, body, "utf8");
  if (j.libelleVO && j.libelle) addPair(j.libelleVO, j.libelle, 2);
  // Stratagèmes : français seul, mais rattachés à LEUR détachement — ce qui
  // permettra de les apparier aux stratagèmes anglais du même détachement.
  const strats = [...String(j.stratagemes || "").matchAll(/<b>(.*?)<\/b>\s*\(?([^<)]*)\)?/g)]
    .map((m) => ({ fr: dec(m[1]), cp: (m[2] || "").trim() }));
  S.detFR[id] = { fr: dec(j.libelle || ""), vo: dec(j.libelleVO || ""), strats };
  S.detachements[id] = 1; ok++;
}, "3/4 détach.");

// ── 4. sorties ─────────────────────────────────────────────────────────────
async function sortie() {
  const strings = {};
  for (const [en, v] of Object.entries(S.pairs)) strings[en] = v.fr;
  await writeFile("aln-pairs.json", JSON.stringify({
    meta: {
      source: "Army List Network (40k.armylistnetwork.com) — base bilingue FR/VO",
      recupereLe: new Date().toISOString().slice(0, 10),
      couples: Object.keys(strings).length,
      fiches: Object.keys(S.fiches).length,
      detachements: Object.keys(S.detFR).length,
    },
    strings,
    types: Object.fromEntries(Object.entries(S.pairs).map(([en, v]) => [en, v.type])),
  }, null, 1) + "\n", "utf8");

  await writeFile("aln-units.json", JSON.stringify({
    codex: S.codex, sections: S.sections,
    fiches: S.fiches,        // id → { fr, codex, section, labels: [{fr,type}] }
    detachements: S.detFR,   // id → { fr, vo, strats: [{fr,cp}] }
  }, null, 1) + "\n", "utf8");

  const orphelins = Object.values(S.fiches).reduce((n, f) => n + f.labels.length, 0);
  console.log(`\n  → aln-pairs.json : ${Object.keys(strings).length} couples EN→FR attestés`);
  console.log(`  → aln-units.json : ${Object.keys(S.fiches).length} fiches, ${orphelins} libellés FR à apparier, ` +
    `${Object.keys(S.detFR).length} détachements`);
  console.log(`\n     Renvoie ces DEUX fichiers (ni brut/, ni ./${PROFILE} qui contient ta session).\n`);
  await ctx.close().catch(() => {});
}
process.on("SIGINT", async () => { await writeFile("aln-state.json", JSON.stringify(S), "utf8"); await sortie(); process.exit(0); });
await sortie();
