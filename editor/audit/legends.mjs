// legends.mjs — garde-fou : RIEN de Legends dans la base (décision utilisateur du 2026-10-29 : « Tout ce qui a
// trait à des fiches Legends n'a pas sa place dans l'appli ni la base »).
//
// Référence : editor/mfm/legends.json (section LEGENDS du MFM, `mfm_parser.py legends`). Une fiche est
// « Legends-only » si son nom y figure et n'est au barème d'AUCUNE faction (dump editor/mfm/dump/en, fichiers
// « _… » exclus) : Venerable Dreadnought est Legends chez les Space Marines mais au barème des Grey Knights →
// fiche valide. Les mots-clefs homonymes portés par des fiches au barème (« Predator Annihilator »,
// « Dreadnought ») restent. Comparaison : NFKD sans accents, minuscules, tirets et apostrophes typographiques
// pliés, espaces réduits ; « compact » = mêmes lettres et chiffres, sans espaces, tirets ni apostrophes.
//
// Contrôles (sortie 1 s'il y a un écart, 1 ligne par écart) :
//   · nom « … [Legends] » (fiche, lien, catégorie) ou catalogue au nom « … Legends » ;
//   · fiche EXPOSÉE (entryLink racine visible) dont le nom est une fiche Legends ;
//   · marqueur `leader-kw:` qui nomme une fiche Legends ;
//   · prose Leader / Support dont une puce nomme une fiche Legends (l'appli l'affiche et en tire des liens) ;
//   · commentaire-marqueur « Legends » / « HIDDEN UNTIL LEGENDS » / « HIDDEN IN CASE OF LEGENDS » ;
//   · (1) RENVOI : tout texte de la base (description, characteristic, règle, commentaire) ou nom qui contient
//     « (see Legends » ou « Legends: » (« With the exception of Kill Team Cassius (see Legends: Agents of the
//     Imperium) ») ;
//   · (2) CATÉGORIE MORTE : categoryEntry à 0 référence — ni par id (tout attribut ≠ id, tous fichiers), ni par
//     nom dans un marqueur `leader-kw:` — dont le nom désigne une fiche Legends. Factions d'un fichier = celles
//     dont la matrice editor/mfm/map/<slug>.json y range des fiches ; « Legends de la faction » = Legends du
//     slug, hors barème de ce slug. Une catégorie homonyme d'une fiche au barème de SA faction n'est jamais
//     visée. Règles, dans l'ordre :
//       R1  nom compact ÉGAL à une Legends-only, ou à une Legends de sa faction (« Fortis Kill Team » chez les
//           Agents, au barème des seuls Deathwatch) ;
//       R2  nom = suite de MOTS ENTIERS (≥ 5 lettres compactes) d'une Legends-only de sa faction
//           (« Karamazov » ⊂ Inquisitor Karamazov, « Tycho » ⊂ Captain Tycho, « Pack Leader » ⊂ Wolf Guard
//           Pack Leader, « Tomb Sentinel » ⊂ Canoptek Tomb Sentinel) ;
//       R3  toute faction : monture d'une Legends-only « … on <X> » (« Disc of Tzeentch ») ou <X> d'une
//           Legends-only « Chaos <X> » (« Deimos Predator ») ;
//       R4  abréviation : 1er mot (≥ 5 lettres) préfixe strict du 1er mot d'une Legends de sa faction
//           (« Indom JP Int » ← Indomitor Kill Team).
//     R2-R4 exigent en plus (a) un mot DISTINCTIF : présent dans au plus 2 noms du barème (toutes factions) —
//     sans lui, « Assault Squad » (⊂ Centurion Assault Squad) ou « Command Squad » (⊂ Deathwing Command
//     Squad), faits de mots courants du barème, seraient pris pour des restes Legends : ce sont des catégories
//     mortes HORS MFM v1.6 (ménage des orphelins à trancher par l'utilisateur, pas du Legends prouvé) ; (b) que
//     le nom ne soit pas aussi une partie (mots entiers) d'un nom du barème de SA faction : « Skyrunner »
//     (Farseer Skyrunner), « Stalker » des Necrons (Triarch Stalker), « Disc of Tzeentch » des Thousand Sons
//     (Exalted Sorcerer on Disc of Tzeentch) peuvent être le reste d'une fiche au barème ou [Crucible].
//     Le garde-fou préfère manquer un cas ambigu que bloquer la CI sur un faux positif ;
//   · (3) CLÉ FR MORTE : clé de translations/fr.json que l'appli ne peut plus chercher (src/lib/dataNames.js :
//     ni chaîne exacte de la base, ni base d'un paramètre « X D6+3 », ni nom d'un effectif « 5-10 X ») et qui
//     nomme une fiche Legends-only (mots entiers, au pluriel ou au singulier : « Long Fang w/ lascannon »).
//     Dans chaque clé, les noms VIVANTS (base et barème) qui contiennent un nom Legends sans l'être sont
//     masqués d'abord : « Striking Scorpion », « Vertus Praetor », « Exalted Sorcerer on Disc of Tzeentch »
//     ne font pas d'une clé un reste Legends, « Scorpion pulsar » si. Ne comptent pas les noms de moins de
//     6 lettres (Lord, Lynx, Cobra, Aleya : trop de collisions) ni la liste GENERIQUES ci-dessous.
//
// Usage : node editor/audit/legends.mjs [--root <dossier>]   (enchaîné par editor/audit/valider.mjs)
//   --root : dossier des .cat/.gst et de translations/fr.json à auditer (défaut : la racine du dépôt), pour
//            tester une copie (git show HEAD:<fichier> > copie/<fichier>). Les références (legends.json, dump,
//            matrices) sont toujours lues dans editor/mfm du dépôt.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const ri = argv.indexOf("--root");
if (ri >= 0 && !argv[ri + 1]) { console.log("✗ --root attend un dossier"); process.exit(2); }
const DATA = ri >= 0 ? path.resolve(argv[ri + 1]) : ROOT;
const MFM = path.join(ROOT, "editor/mfm");

const N = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[\u2010-\u2015]/g, "-").replace(/[\u2018\u2019\u02bc'`]/g, "'").replace(/\*\*|\^\^/g, "").replace(/\s+/g, " ").trim();
const C = (s) => N(s).replace(/[^a-z0-9]/g, "");                      // compact
const W = (s) => N(s).replace(/[^a-z0-9]+/g, " ").trim();               // mots
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WB = "(?<![a-z0-9-])", WE = "(?![a-z0-9-])";                      // bornes de mot (le tiret lie : UR-025)
const altRe = (names, flags = "") => names.length ? new RegExp(WB + "(" + names.map(esc).join("|") + ")" + WE, flags) : null;
// Noms Legends-only ignorés dans les clés FR : termes qui nomment AUSSI autre chose qu'une fiche Legends —
// détachement ou améliorations retirés (« Firestorm Assault Force », « Decimator Protocols »), capacités
// (« Whirlwind of Rage », « Reaper of Souls », « Unsubtle Crusader », « The Scorpion's Bite »), mot-clef
// courant (DREADNOUGHT), catégorie vivante au pluriel (« Phoenix Lords »). Le garde-fou préfère manquer un
// reste que bloquer la CI sur un faux positif ; leurs armes Legends ont été élaguées à la main le 2026-10-29.
const GENERIQUES = new Set(["firestorm", "decimator", "whirlwind", "reaper", "crusader", "crusaders", "dreadnought", "phoenix", "scorpion"]);

let LEG;
try { LEG = JSON.parse(fs.readFileSync(path.join(MFM, "legends.json"), "utf8")); }
catch { console.log("✗ editor/mfm/legends.json introuvable (python3 editor/mfm/mfm_parser.py legends -o editor/mfm/legends.json)"); process.exit(1); }

// ── barème (dump) et Legends ───────────────────────────────────────────────────────────────────────────────
const DUMP = path.join(MFM, "dump/en");
const barBySlug = new Map(), barWBySlug = new Map(), barN = new Map(); // slug → Set(compact), slug → [mots] ; compact → nom
for (const f of fs.readdirSync(DUMP)) if (f.endsWith(".json") && f[0] !== "_") {
  const set = new Set(), ws = [];
  for (const u of JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8")).units || []) { set.add(C(u.name)); ws.push(W(u.name)); barN.set(C(u.name), N(u.name)); }
  barBySlug.set(f.replace(/\.json$/, ""), set); barWBySlug.set(f.replace(/\.json$/, ""), ws);
}
const legends = new Set();                                              // Legends-only (N)
const legOfSlug = new Map();                                            // slug → { all: Set(N) hors barème du slug, only: [N] Legends-only }
for (const [slug, names] of Object.entries(LEG.factions || {})) {
  const bar = barBySlug.get(slug) || new Set(); const all = new Set(), only = [];
  for (const n of names) { if (!bar.has(C(n))) all.add(N(n)); if (!barN.has(C(n))) { legends.add(N(n)); only.push(N(n)); } }
  legOfSlug.set(slug, { all, only });
}
const isLeg = (s) => legends.has(N(s));
const legOnly = [...legends];
// fréquence d'un mot dans les noms du barème (toutes factions) : « squad » 59, « assault » 4, « possessed » 1
const wordFreq = new Map();
for (const n of new Set([...barN.values()].map(W))) for (const w of new Set(n.split(" "))) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
const distinctive = (words) => words.some((w) => (wordFreq.get(w) || 0) <= 2);
// factions d'un fichier : les matrices editor/mfm/map/<slug>.json y rangent des fiches
const fileSlugs = new Map();
const MAP = path.join(MFM, "map");
if (fs.existsSync(MAP)) for (const f of fs.readdirSync(MAP)) if (f.endsWith(".json")) {
  let j; try { j = JSON.parse(fs.readFileSync(path.join(MAP, f), "utf8")); } catch { continue; }
  const slug = j.slug || f.replace(/\.json$/, "");
  for (const v of Object.values(j.matched || {})) for (const t of (v && v.targets) || []) if (t && t.file) {
    if (!fileSlugs.has(t.file)) fileSlugs.set(t.file, new Set()); fileSlugs.get(t.file).add(slug); }
}

// ── chargement ─────────────────────────────────────────────────────────────────────────────────────────────
const c = new Catalog(DATA); c.load();
if (!c.docs.size) { console.log(`✗ aucun .cat/.gst dans ${DATA}`); process.exit(1); }
const bad = [];
const refs = new Set();                                                 // ids cités par un attribut ≠ id
const lkNames = new Set();                                              // noms (compacts) cités par leader-kw:
const texts = [];                                                       // noms et textes vivants (décodés)
const RENVOI = /\(\s*see\s+legends?\b|\blegends\s*:/i;
for (const [f, d] of c.docs) {
  if (/legends/i.test(nm(d.root))) bad.push(`${f} : catalogue « ${nm(d.root)} »`);
  const el = xml.child(d.root, "entryLinks");
  if (el) for (const k of el.children) if (k.tag === "entryLink" && xml.getAttr(k, "hidden") !== "true") {
    const t = c.byId.get(xml.getAttr(k, "targetId")); const n = t ? nm(t.node) : nm(k);
    if (isLeg(n)) bad.push(`${f} : fiche exposée « ${n} » — Legends au MFM`); }
  xml.walk(d.root, (n) => {
    for (const a of n.attrs || []) if (a.name !== "id") refs.add(a.value);
    const name = nm(n), txt = xml.getText(n) || "";
    if (name) texts.push(name);
    if (txt) texts.push(txt);
    if (/\[legends\]/i.test(name)) bad.push(`${f} : ${n.tag} « ${name} »`);
    for (const s of [name, txt]) { const m = s && s.match(RENVOI);
      if (m) { const i = m.index; bad.push(`${f} : ${n.tag}${name && s !== name ? ` « ${name} »` : ""} renvoie aux Legends : « …${s.slice(Math.max(0, i - 40), i + 50).replace(/\s+/g, " ")}… »`); } }
    if (n.tag === "comment") {
      for (const l of txt.split("\n")) {
        if (/^\s*(legends|hidden (until|in case of) legends)\s*$/i.test(l)) bad.push(`${f} : commentaire « ${l.trim()} »`);
        const m = l.match(/^\s*leader-kw:\s*(.+)$/i);
        if (m) for (const g of m[1].split("|")) {
          for (const p of g.split("&")) if (C(p)) lkNames.add(C(p));
          if (!g.includes("&") && isLeg(g)) bad.push(`${f} : leader-kw « ${g.trim()} » — fiche Legends`); } } }
    if (n.tag === "profile" && /^(leader|support)$/i.test(name.trim())) {
      let t = ""; xml.walk(n, (q) => { if (q.tag === "characteristic") t = xml.getText(q) || ""; });
      for (const l of t.split("\n")) { const b = l.match(/^\s*(?:■|•|-)\s+(.+?)\s*$/); if (b && isLeg(b[1].replace(/[.;]\s*$/, ""))) bad.push(`${f} : prose « ${name} » cite la fiche Legends « ${b[1].trim()} »`); } }
  });
}

// ── (2) catégories mortes au nom d'une fiche Legends ───────────────────────────────────────────────────────
const inWords = (part, whole) => (" " + whole + " ").includes(" " + part + " ");
function legendsCategory(file, name) {
  const cc = C(name), cw = W(name); if (!cc) return null;
  const slugs = [...(fileSlugs.get(file) || [])];
  if (slugs.some((s) => barBySlug.get(s)?.has(cc))) return null;     // homonyme d'une fiche au barème de SA faction
  for (const l of legOnly) if (C(l) === cc) return `R1 = ${l}`;
  for (const s of slugs) for (const l of legOfSlug.get(s)?.all || []) if (C(l) === cc) return `R1 = ${l} [${s}]`;
  const words = cw.split(" ");
  if (!distinctive(words)) return null;
  if (slugs.some((s) => (barWBySlug.get(s) || []).some((b) => inWords(cw, b)))) return null; // partie d'un nom du barème de SA faction : ambigu
  if (cc.length >= 5) for (const s of slugs) for (const l of legOfSlug.get(s)?.only || []) if (inWords(cw, W(l))) return `R2 ⊂ ${l} [${s}]`;
  for (const l of legOnly) { const lw = W(l); const m = lw.match(/ on (.+)$/); if ((m && m[1] === cw) || lw === "chaos " + cw) return `R3 ← ${l}`; }
  if (words[0].length >= 5) for (const s of slugs) for (const l of legOfSlug.get(s)?.all || []) {
    const lw0 = W(l).split(" ")[0]; if (lw0 !== words[0] && lw0.startsWith(words[0])) return `R4 ← ${l} [${s}]`; }
  return null;
}
for (const [f, d] of c.docs) xml.walk(d.root, (n) => {
  if (n.tag !== "categoryEntry") return;
  const id = xml.getAttr(n, "id"), name = nm(n);
  if (refs.has(id) || lkNames.has(C(name))) return;
  const why = legendsCategory(f, name);
  if (why) bad.push(`${f} : categoryEntry « ${name} » (${id}) à 0 référence — reste de fiche Legends (${why})`);
});

// ── (3) clés FR mortes qui nomment une fiche Legends ───────────────────────────────────────────────────────
const FR = path.join(DATA, "translations/fr.json");
let frNote = "";
if (fs.existsSync(FR)) {
  const frRaw = fs.readFileSync(FR, "utf8");
  const strings = (JSON.parse(frRaw) || {}).strings || {};
  const ligne = (k) => { const i = frRaw.indexOf(JSON.stringify(k) + ":"); return i < 0 ? "" : ":" + (frRaw.slice(0, i).split("\n").length); };
  // noms du barème qui CONTIENNENT un nom Legends-only : masqués avant la recherche
  // clés VIVANTES : celles que l'appli peut chercher (src/lib/dataNames.js) — chaîne exacte de la base, base d'un
  // paramètre (« Deadly Demise » de « Deadly Demise D6+3 »), nom d'un effectif (« 5-10 X », « X (3-6) »)
  const PARAM = /^(.*\S)\s+(\d*D\d+(?:\+\d+)?|\d+\+|\d+"|\d+)$/, PRE = /^(\d+(?:\s*-\s*\d+)?)\s+(.+)$/, SUF = /^(.+?)\s*\((\d+(?:\s*-\s*\d+)?)\)$/;
  const live = new Set();
  for (const t of texts) for (const v of [t, t.trim()]) { live.add(v); let m;
    if ((m = PARAM.exec(v))) live.add(m[1]); if ((m = PRE.exec(v))) live.add(m[2]); if ((m = SUF.exec(v))) live.add(m[1]); }
  // noms Legends-only visés : ≥ 6 lettres, hors GENERIQUES, au pluriel comme au singulier (« Long Fang w/ … »)
  const actifs = [...new Set(legOnly.filter((l) => l.replace(/[^a-z0-9]/g, "").length >= 6)
    .flatMap((l) => (/[a-z]s$/.test(l) && l.replace(/[^a-z0-9]/g, "").length >= 7 ? [l, l.slice(0, -1)] : [l])).filter((l) => !GENERIQUES.has(l)))]
    .sort((a, b) => b.length - a.length);
  const legRe = altRe(actifs, "g");
  // noms VIVANTS (base et barème) qui contiennent un nom visé sans l'être (« Striking Scorpion », « Vertus
  // Praetor », « Exalted Sorcerer on Disc of Tzeentch ») : masqués dans chaque clé avant la recherche
  const vivants = new Set([...barN.values()]);
  for (const [, d] of c.docs) xml.walk(d.root, (q) => { const v = nm(q); if (v && v.length < 80) vivants.add(N(v)); });
  const shadows = legRe ? [...vivants].filter((b) => { const m = b.match(legRe); return m && m.some((x) => x !== b); }).sort((a, b) => b.length - a.length) : [];
  const shadowRe = shadows.length ? new RegExp(WB + "(" + shadows.map(esc).join("|") + ")s?" + WE, "g") : null; // « Phoenix Lord(s) »
  const mask = (s) => (shadowRe ? s.replace(shadowRe, " § ") : s);
  let n = 0;
  if (legRe) for (const k of Object.keys(strings)) {
    if (live.has(k) || live.has(k.trim())) continue;
    const m = mask(N(k)).match(legRe); if (!m) continue;
    n++; bad.push(`translations/fr.json${ligne(k)} : clé morte qui nomme ${[...new Set(m)].join(", ")} (Legends) : « ${k.slice(0, 90).replace(/\s+/g, " ")}${k.length > 90 ? "…" : ""} »`);
  }
  frNote = `, ${Object.keys(strings).length} clés FR`;
} else frNote = ", translations/fr.json absent (contrôle des clés FR sauté)";

const tag = DATA === ROOT ? "" : ` [${DATA}]`;
if (!bad.length) { console.log(`✓ rien de Legends dans la base${tag} (${legends.size} fiches Legends du MFM ${LEG.version || ""}${frNote}).`); process.exit(0); }
const uniq = [...new Set(bad)];
console.log(`✗ ${uniq.length} élément(s) Legends dans la base${tag} (décision du 2026-10-29 : rien de Legends) :`);
for (const b of uniq) console.log("  ✗ " + b);
process.exit(1);
