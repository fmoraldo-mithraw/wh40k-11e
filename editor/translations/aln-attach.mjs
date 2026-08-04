#!/usr/bin/env node
// aln-attach.mjs — rattacher les fiches ALN à leur datasheet anglaise.
//
// ⚠ VERDICT MESURÉ : cette piste ne comble PAS le trou des noms d'unité.
// Sur la récolte réelle (1 468 fiches), l'appariement rend une dizaine de noms
// nouveaux, dont plusieurs faux, pour un taux d'accord de 64 % seulement là où
// la traduction est déjà connue. Le script est conservé parce qu'il ÉTABLIT ce
// résultat et évite de rouvrir la piste — pas parce qu'il faut fusionner sa
// sortie. `--merge` refuse d'ailleurs de le faire sous le seuil d'accord.
// Détail du raisonnement et des chiffres : editor/translations/README.md.
//
// ─── CE QU'ALN DONNE VRAIMENT ──────────────────────────────────────────────
// Mesuré sur la fiche [2931] « Véroleux », qui est le cas d'école :
//
//     {"fr":"Chaos","type":"mot-clef"}          ← mots-clefs en ANGLAIS
//     {"fr":"Nurgle","type":"mot-clef"}
//     {"fr":"Poxwalkers","type":"mot-clef"}     ← le nom anglais est LÀ
//     {"fr":"Death Guard","type":"faction"}
//     {"fr":"Véroleux","type":"profil"}         ← le nom français
//     {"fr":"Arme improvisée","type":"profil"}
//     {"fr":"Armes de Mêlée","type":"groupe"}   ← taxonomie interne d'ALN
//
// Deux enseignements. D'abord, ALN laisse les MOTS-CLEFS en anglais : on n'a
// donc pas besoin des couples attestés pour rapprocher une fiche d'une
// datasheet, ses mots-clefs suffisent. Ensuite, l'appariement par recouvrement
// d'ARMES est condamné : ALN écrit « Arme improvisée » au singulier là où la
// base a « Improvised weapons » au pluriel, et ce genre d'écart est la règle.
//
// ─── POURQUOI ÇA NE SUFFIT QUAND MÊME PAS ──────────────────────────────────
// Les mots-clefs d'une variante contiennent ceux du modèle générique : la fiche
// « Land Raider des Grey Knights » porte le mot-clef « Land Raider », et se
// rattache donc au mauvais datasheet. On pondère les mots-clefs par leur rareté
// (un mot-clef porté par une seule datasheet pèse bien plus que « Infantry »)
// et on exige une marge nette, ce qui écarte l'essentiel — mais pas tout.
//
// ─── GARDE-FOU ─────────────────────────────────────────────────────────────
// Le script se NOTE lui-même : là où le pack connaît déjà la traduction, il
// compare la sienne. Ce taux d'accord est affiché à chaque exécution, et
// `--merge` refuse de fusionner en dessous de --seuil (90 % par défaut).
// « Un pack faux est pire qu'un pack partiel » — README.
//
// ─── USAGE ─────────────────────────────────────────────────────────────────
//   node editor/translations/aln-attach.mjs                  # mesure + aln-names.json
//   node editor/translations/aln-attach.mjs --terme véroleux # tracer UNE fiche
//   node editor/translations/aln-attach.mjs --merge          # refusé sous le seuil
//
// Options : --seuil 90 · --marge 1.15 · --out aln-names.json
// Entrées attendues à la racine du dépôt : aln-units.json, translations/fr.json.

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
const SEUIL = Number(val("--seuil", "90"));
const MARGE = Number(val("--marge", "1.15"));
const OUT = val("--out", join(ROOT, "aln-names.json"));
const TRACE = val("--terme", "");

const log = (...a) => console.log(...a);
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[’'`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
// ALN préfixe ses noms de balises de collection : « [Legends] [SW] Gardes Loups ».
const TAGS = /(\[[^\]]*\]\s*)+/g;
const sansTags = (s) => String(s || "").replace(TAGS, " ").replace(/\s+/g, " ").trim();

const units = existsSync(join(ROOT, "aln-units.json"))
  ? JSON.parse(await readFile(join(ROOT, "aln-units.json"), "utf-8")) : null;
if (!units) { console.error(`\n  aln-units.json attendu à la racine du dépôt (${ROOT}).\n`); process.exit(1); }
const fiches = units.fiches || {};

// ── Datasheets du dépôt et leurs mots-clefs ────────────────────────────────
// Toujours via la lib de l'éditeur (règle maison : jamais de regex sur les .cat).
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js"));
const cat = new Catalog(ROOT);
cat.load();
const nomOf = (x) => (typeof x === "string" ? x : (x && (x.name || x.n)) || "");
const ds = new Map();
for (const f of cat.listFactions()) {
  if (f.type !== "catalogue") continue;
  for (const u of (cat.listFactionContents(f.file) || {}).units || []) {
    const d = cat.getUnit(f.file, u.id);
    if (!d || !d.name) continue;
    if (!ds.has(d.name)) ds.set(d.name, new Set([norm(d.name)]));
    for (const k of d.keywords || []) { const n = norm(nomOf(k)); if (n) ds.get(d.name).add(n); }
  }
}
const cibles = [...ds].map(([name, kw]) => ({ name, kw }));
// Rareté d'un mot-clef : « Poxwalkers » n'est porté que par une datasheet et
// vaut donc énormément ; « Infantry » ne départage rien.
const df = new Map();
for (const c of cibles) for (const k of c.kw) df.set(k, (df.get(k) || 0) + 1);
const poids = (k) => Math.log(cibles.length / (df.get(k) || cibles.length));

const packPath = join(ROOT, "translations", "fr.json");
const pack = existsSync(packPath) ? JSON.parse(await readFile(packPath, "utf-8")) : { meta: {}, strings: {} };

log(`\n  datasheets du dépôt : ${cibles.length}`);
log(`  fiches ALN          : ${Object.keys(fiches).length}`);

// ── Appariement ────────────────────────────────────────────────────────────
const propositions = [], conflits = [], rejets = [];
let accord = 0, desaccord = 0;
for (const [id, f] of Object.entries(fiches)) {
  const kws = (f.labels || []).filter((l) => l && (l.type === "mot-clef" || l.type === "faction")).map((l) => norm(l.fr)).filter(Boolean);
  const trace = TRACE && norm(f.fr).includes(norm(TRACE));
  if (kws.length < 2) { rejets.push({ id, fr: f.fr, etat: "moins de 2 mots-clefs" }); continue; }
  let best = null, second = 0;
  for (const c of cibles) {
    let s = 0;
    for (const k of kws) if (c.kw.has(k)) s += poids(k);
    if (!best || s > best.s) { second = best ? best.s : 0; best = { c, s }; }
    else if (s > second) second = s;
  }
  if (trace) log(`\n  ── trace « ${f.fr} » [${id}] ──\n     mots-clefs : ${kws.join(" · ")}\n     meilleur : ${best && best.c.name} (${best ? best.s.toFixed(2) : 0}) — second : ${second.toFixed(2)}`);
  if (!best || best.s <= 0 || best.s < second * MARGE) { rejets.push({ id, fr: f.fr, etat: "pas de candidat net" }); continue; }
  const en = best.c.name, fr = sansTags(f.fr);
  // Un « nom français » qui, une fois les balises retirées, EST le nom anglais
  // n'est pas une traduction : c'est ce piège qui remplissait 60 des 82 lignes
  // de la version précédente (« Urien Rakarth [Legends] » → « [Legends] Urien
  // Rakarth »).
  if (!fr || norm(fr) === norm(sansTags(en))) { rejets.push({ id, fr: f.fr, en, etat: "identique à l'anglais" }); continue; }
  if (pack[en] !== undefined || pack.strings[en] !== undefined) {
    // VÉRITÉ TERRAIN : la traduction est connue, on note la nôtre.
    const ref = (pack.strings || pack)[en];
    if (norm(sansTags(ref)) === norm(fr)) accord++;
    else { desaccord++; conflits.push({ en, pack: ref, aln: fr }); }
  } else propositions.push({ en, fr, id });
}

const testes = accord + desaccord;
const taux = testes ? Math.round((100 * accord) / testes) : 0;
log(`\n  propositions nouvelles : ${propositions.length}`);
log(`  rejetées               : ${rejets.length}`);
log(`\n── AUTO-NOTATION (${testes} cas où le pack connaît déjà la traduction) ──`);
log(`  d'accord   : ${accord}  (${taux} %)`);
log(`  en conflit : ${desaccord}`);
for (const c of conflits.slice(0, 10)) log(`     ! ${c.en} : pack="${c.pack}"  aln="${c.aln}"`);

const strings = {};
for (const p of propositions) strings[p.en] = p.fr;
await writeFile(OUT, JSON.stringify({
  meta: { source: "Army List Network — appariement par mots-clefs pondérés", marge: MARGE, accord: taux, testes, propositions: propositions.length },
  strings,
  conflits: conflits.slice(0, 200),
  rejets: rejets.slice(0, 200),
}, null, 1) + "\n");
log(`\n  → ${OUT}`);

if (has("--merge")) {
  if (taux < SEUIL) {
    log(`\n  ✗ FUSION REFUSÉE : ${taux} % d'accord, seuil ${SEUIL} %.`);
    log(`    À ce niveau, fusionner injecterait des faux. C'est la règle du dépôt :`);
    log(`    un pack faux est pire qu'un pack partiel. Force avec --seuil si tu as`);
    log(`    relu aln-names.json ligne à ligne.\n`);
    process.exit(2);
  }
  let n = 0;
  for (const [k, v] of Object.entries(strings)) if (pack.strings[k] === undefined) { pack.strings[k] = v; n++; }
  pack.meta.totalStrings = Object.keys(pack.strings).length;
  await writeFile(packPath, JSON.stringify(pack, null, 1));
  log(`  → translations/fr.json : +${n} noms (total ${pack.meta.totalStrings})`);
}
log("");
