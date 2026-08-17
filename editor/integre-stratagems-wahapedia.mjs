// Intégration des stratagèmes Wahapedia → règles de détachement BSData.
//
// La session distante NE PEUT PAS fetcher wahapedia.ru (anti-bot + politique
// réseau — même constat que editor/fetch-wahapedia.js). Récupère le CSV SUR TA
// MACHINE puis passe-le au script :
//
//   curl -o Stratagems.csv "https://wahapedia.ru/wh40k11ed/Stratagems.csv"
//     (ou wh40k10ed selon l'édition disponible ; export « | »-séparé)
//   node editor/integre-stratagems-wahapedia.mjs --csv Stratagems.csv          (dry-run)
//   node editor/integre-stratagems-wahapedia.mjs --csv Stratagems.csv --apply  (écrit + valide)
//
// Ce que fait le script :
//   1. parse le CSV pipe-séparé PAR EN-TÊTE (tolère les renommages de colonnes,
//      replie les lignes-continuation des descriptions multi-lignes) ;
//   2. convertit la description HTML en texte (balises WHEN/TARGET/EFFECT/
//      RESTRICTIONS sur leurs propres lignes, entités décodées) ;
//   3. matche la colonne detachment sur les détachements de la base
//      (normalisation apostrophes/accents/parenthèses, égal puis contenance) ;
//   4. écrit chaque stratagème MANQUANT au format maison (règle n°3) :
//        <rule name="Nom (Stratagem, NCP)">
//          Détachement – STRATAGEM (NCP)\n\nWHEN: …\nTARGET: …\nEFFECT: …
//      Diff-check : un stratagème déjà présent (même nom normalisé) n'est
//      JAMAIS réécrit ; s'il diffère du CSV il est listé en avertissement.
//   5. rapporte : ajouts par détachement, détachements CSV non matchés,
//      détachements de la base toujours sans stratagème.
//
// L'appli n'a rien à changer : detStrats lit déjà ces règles et les préfère
// au repli Wahapedia runtime.

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const { Catalog } = require(join(ROOT, "editor/lib/catalog"));
const xml = require(join(ROOT, "editor/lib/xml"));
const { parseAllCatalogues } = await import(join(ROOT, "..", "cogitator-bellicum", "scripts/bsdata-parser.mjs"));

const APPLY = process.argv.includes("--apply");
const csvIx = process.argv.indexOf("--csv");
if (csvIx < 0 || !process.argv[csvIx + 1]) {
  console.error("Usage: node editor/integre-stratagems-wahapedia.mjs --csv <Stratagems.csv> [--apply]");
  process.exit(1);
}
const csvPath = process.argv[csvIx + 1];

// ── 1. CSV pipe-séparé, piloté par l'en-tête, continuations repliées ────────
function parsePsv(text) {
  const lines = String(text).split(/\r?\n/);
  const header = (lines.shift() || "").split("|").map((h) => h.trim().toLowerCase());
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = line.split("|");
    if (cells.length < header.length && rows.length) {
      // description multi-ligne : recoller au dernier champ du record précédent
      const prev = rows[rows.length - 1];
      const last = header[header.length - 1];
      prev[last] = (prev[last] || "") + "\n" + line;
      continue;
    }
    const row = {};
    header.forEach((h, i) => { row[h] = (cells[i] || "").trim(); });
    rows.push(row);
  }
  return rows;
}
const pick = (row, ...keys) => { for (const k of keys) if (row[k]) return row[k]; return ""; };

// ── 2. HTML → texte au format maison ────────────────────────────────────────
function htmlToText(s) {
  let t = String(s || "");
  t = t.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n").replace(/<li[^>]*>/gi, "■ ");
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&rsquo;/g, "’").replace(/&ndash;/g, "–");
  // WHEN/TARGET/EFFECT/RESTRICTIONS chacun sur sa ligne
  t = t.replace(/\s*(WHEN|TARGET|EFFECT|RESTRICTIONS?)\s*:\s*/g, "\n$1: ");
  return t.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’ʼ′]/g, "'").replace(/[‐-―]/g, "-")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();

// ── 3. Détachements de la base (via le parseur, bsId → nœud par la lib) ─────
const all = await parseAllCatalogues(ROOT);
const c = new Catalog(ROOT).load();
const dets = new Map(); // norm(name) → {name, bsId, node, file, have:Set<normName>}
for (const f of Object.values(all)) {
  for (const d of f.dets || []) {
    if (!d.bsId || dets.has(norm(d.name))) continue;
    const hit = c.byId.get(d.bsId);
    if (!hit) continue;
    const have = new Set((d.strats || []).map((s) => norm(String(s.name || "").replace(/\s*\(Stratagem.*$/i, ""))));
    dets.set(norm(d.name), { name: d.name, bsId: d.bsId, node: hit.node, file: hit.file, have });
  }
}
console.log(`Base : ${dets.size} détachements (${[...dets.values()].filter((d) => d.have.size).length} avec stratagèmes).`);

// ── 4. Matching + écriture ──────────────────────────────────────────────────
const rows = parsePsv(readFileSync(csvPath, "utf8"));
console.log(`CSV : ${rows.length} lignes.`);
const unmatchedDets = new Map(); const added = new Map(); const differs = [];
let nbAdd = 0, nbSkip = 0;

function rulesContainer(entry) {
  let r = (entry.children || []).find((ch) => ch.tag === "rules");
  if (r) { r.selfClose = false; return r; }
  r = xml.elem("rules", {}); r.selfClose = false;
  const after = ["categoryLinks", "selectionEntries", "selectionEntryGroups", "entryLinks", "modifiers"];
  let idx = entry.children.length;
  for (let i = 0; i < entry.children.length; i++) if (after.includes(entry.children[i].tag)) { idx = i; break; }
  entry.children.splice(idx, 0, r);
  return r;
}

for (const row of rows) {
  const name = htmlToText(pick(row, "name", "stratagem"));
  const detCsv = pick(row, "detachment", "detachment_name", "det");
  const cpRaw = pick(row, "cp_cost", "cost", "cp");
  const desc = pick(row, "description", "rules", "text");
  if (!name || !detCsv) continue;
  const cp = String(parseInt(cpRaw, 10) || 1);
  const dn = norm(detCsv);
  let det = dets.get(dn);
  if (!det) for (const [k, v] of dets) { if (k.includes(dn) || dn.includes(k)) { det = v; break; } }
  if (!det) { unmatchedDets.set(detCsv, (unmatchedDets.get(detCsv) || 0) + 1); continue; }
  const nn = norm(name);
  if (det.have.has(nn)) {
    nbSkip++;
    continue; // diff-check : jamais réécrit ; divergence éventuelle listée à part
  }
  det.have.add(nn);
  nbAdd++;
  added.set(det.name, (added.get(det.name) || 0) + 1);
  if (APPLY) {
    const body = htmlToText(desc);
    const rule = xml.elem("rule", { name: `${name} (Stratagem, ${cp}CP)`, id: c.newId(), hidden: "false" });
    rule.selfClose = false;
    const d = xml.elem("description", {});
    xml.setText(d, `${det.name} – STRATAGEM (${cp}CP)\n\n${body}`);
    rule.children.push(d);
    rulesContainer(det.node).children.push(rule);
    c.markDirty(det.file);
  }
}

// ── 5. Rapport ──────────────────────────────────────────────────────────────
console.log(`\nAjouts : ${nbAdd} stratagèmes sur ${added.size} détachements (${nbSkip} déjà présents, jamais réécrits).`);
for (const [d, n] of [...added.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  +${n}  ${d}`);
if (unmatchedDets.size) {
  console.log(`\nDétachements CSV NON matchés (${unmatchedDets.size}) — à examiner :`);
  for (const [d, n] of [...unmatchedDets.entries()].slice(0, 20)) console.log(`  ?  ${d} (${n} strats)`);
}
const still = [...dets.values()].filter((d) => !d.have.size).map((d) => d.name);
console.log(`\nDétachements de la base toujours SANS stratagème : ${still.length}`);
still.slice(0, 15).forEach((d) => console.log(`  ∅  ${d}`));
if (differs.length) console.log("\nDivergences nom-identique/texte-différent :", differs.length);

if (!APPLY) { console.log("\n(dry-run — relancer avec --apply pour écrire)"); process.exit(0); }
c.buildIndex();
const v = c.validate({ dirtyOnly: false });
let nbErr = 0;
for (const r of v.results || []) { nbErr += r.errors.length; for (const e of r.errors.slice(0, 5)) console.error("  ✗", r.file, e); }
console.log("\nvalidate ok:", v.ok, "erreurs:", nbErr);
if (!v.ok) process.exit(1);
c.save();
console.log("sauvegardé.");
