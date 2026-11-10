#!/usr/bin/env node
// versions.mjs — écarts de points entre les ANCIENNES versions du MFM et la
// version actuelle, pour le choix du MFM dans l'appli (construire une liste
// « au MFM v1.5 »).
//
// La bdd ne porte que les points du MFM courant. Les versions passées vivent
// dans l'historique git de editor/mfm/dump/en/<slug>.json (une extraction
// complète par version, cron-mfm.sh). Pour chaque version passée V, on compare
// son extraction à l'extraction courante, unité par unité (via la matrice
// editor/mfm/map/<slug>.json : nom MFM → bsId de la fiche), et on écrit des
// ÉCARTS (V − courant) que l'appli ajoute à ses prix actuels :
//
//   editor/mfm/versions/<V>.json = {
//     version, base (version courante), sources { slug: commit },
//     factions: { "<faction appli>": {
//       units: { "<bsId>": { sizes: [[nbFigurines, Δ], …], repeat?: {threshold, delta} | null } },
//       enh:   { "<détachement>|<amélioration>": Δ },   (noms normalisés : normName)
//       dets:  { "<détachement>": DP de V } } },
//     notes: { "<faction>": { missing: [...], unsupported: [...] } } }
//
// Seuls les écarts NON NULS sont écrits. `missing` = unité absente de V
// (fiche apparue depuis) ; `unsupported` = coûts non comparables (composition
// « 1 Runtherd, 20 Gretchin », tailles proposées différentes) —
// l'appli garde alors le prix courant et le signale.
//
// Usage : node editor/mfm/versions.mjs            (toutes les versions passées)
//         node editor/mfm/versions.mjs --check    (n'écrit rien, dit si à jour)
// Nécessite l'historique git complet (git fetch --unshallow sur un clone court).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mfmUnitCosts, sizeModels } from "./costs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const DUMP_REL = "editor/mfm/dump/en";
const MAP_DIR = path.join(HERE, "map");
const OUT_DIR = path.join(HERE, "versions");
const CHECK = process.argv.includes("--check");

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });

// Même normalisation que l'appli (src/lib/mfmVersions.js) : accents, apostrophes
// et ponctuation retirés, minuscules — « Targetin’ Gizmos (Upgrade) » ≡
// « Targetin' Gizmos Upgrade ».
export const normName = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/[’'‘`]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Premier palier d'une unité MFM : [[nbFigurines, pts], …] trié, ou null.
function firstTierSizes(u) {
  const profs = Array.isArray(u && u.profiles) ? u.profiles : [];
  const first = profs.find((p) => sizeModels(p.size) != null);
  if (!first) return null;
  return profs.filter((p) => p.tier === first.tier && sizeModels(p.size) != null)
    .map((p) => [sizeModels(p.size), Number(p.points)]).sort((a, b) => a[0] - b[0]);
}

// Surcoût de répétition d'une unité MFM : { threshold, delta } (les `threshold`
// premiers exemplaires au prix de base, + delta au-delà : « YOUR 3RD + UNIT
// COSTS » → threshold 2), ou null. Même forme que `repeatCost` dans l'appli.
function repeatOf(u, repeatDelta) {
  if (repeatDelta == null) return null;
  const later = (u.profiles || []).map((p) => /(\d+)(?:ST|ND|RD|TH)\s*\+/i.exec(p.tier || "")).find(Boolean);
  return later ? { threshold: Number(later[1]) - 1, delta: repeatDelta } : null;
}

// Coûts comparables d'une unité : { sizes, repeat } ou { skip }.
function unitCosts(u) {
  let c;
  try { c = mfmUnitCosts(u); } catch (e) { return { skip: e.message }; }
  if (c.skip) return { skip: c.skip };
  return { sizes: firstTierSizes(u), repeat: repeatOf(u, c.repeatDelta) };
}

// Écart d'une unité entre l'ancienne version (o) et la courante (c) :
// { sizes: [[nbFigurines, Δ]…], repeat? } — `repeat` = surcoût de répétition
// ABSOLU de l'ancienne version ({threshold, delta} ou null = aucun), présent
// seulement s'il diffère du courant —, null si rien ne change, ou une raison
// de non-comparabilité.
function unitDelta(o, c) {
  const oc = unitCosts(o), cc = unitCosts(c);
  if (oc.skip || cc.skip) {
    if (JSON.stringify(o.profiles) === JSON.stringify(c.profiles)) return null; // identiques
    return { unsupported: oc.skip || cc.skip };
  }
  const om = new Map(oc.sizes);
  if (cc.sizes.length !== oc.sizes.length || cc.sizes.some(([m]) => !om.has(m))) return { unsupported: "tailles différentes" };
  const sizes = cc.sizes.map(([m, p]) => [m, om.get(m) - p]);
  const repeatChanged = JSON.stringify(oc.repeat) !== JSON.stringify(cc.repeat);
  if (sizes.every(([, d]) => d === 0) && !repeatChanged) return null;
  return { sizes, ...(repeatChanged ? { repeat: oc.repeat } : {}) };
}

// Améliorations et DP d'une extraction, indexées par noms normalisés.
function detIndex(dump) {
  const enh = new Map(), dp = new Map();
  for (const d of dump.detachments || []) {
    const dn = normName(d.name);
    if (Number.isFinite(d.dp)) dp.set(dn, d.dp);
    for (const e of d.enhancements || []) if (Number.isFinite(e.points)) enh.set(dn + "|" + normName(e.name), e.points);
  }
  return { enh, dp };
}

// Pour chaque fichier d'extraction : version → dernier commit qui la porte.
function versionCommits(file) {
  const out = new Map();
  const commits = git("log", "--format=%H", "--", `${DUMP_REL}/${file}`).split("\n").filter(Boolean);
  for (const h of commits) {
    let v;
    try { v = JSON.parse(git("show", `${h}:${DUMP_REL}/${file}`)).version; } catch { continue; }
    if (v && !out.has(v)) out.set(v, h); // log = plus récent d'abord
  }
  return out;
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const dumpFiles = fs.readdirSync(path.join(ROOT, DUMP_REL)).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
const current = Object.fromEntries(dumpFiles.map((f) => [f, readJson(path.join(ROOT, DUMP_REL, f))]));
const base = current["orks.json"] ? current["orks.json"].version : Object.values(current)[0].version;
if (git("rev-parse", "--is-shallow-repository").trim() === "true") {
  console.error("✗ clone court : git fetch --unshallow origin main, puis relancer");
  process.exit(1);
}

const byFile = Object.fromEntries(dumpFiles.map((f) => [f, versionCommits(f)]));
// Une version n'est proposée que si (presque) toutes les factions ont son
// extraction : v1.2 n'existe que pour une faction (antérieure au cron) — la
// proposer ferait croire que les 29 autres n'avaient pas bougé.
const MIN_COVERAGE = 0.9;
const allVersions = [...new Set(Object.values(byFile).flatMap((m) => [...m.keys()]))]
  .filter((v) => v !== base).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const versions = allVersions.filter((v) => {
  const n = dumpFiles.filter((f) => byFile[f].has(v)).length;
  if (n / dumpFiles.length >= MIN_COVERAGE) return true;
  console.log(`· ${v} ignorée : extraction pour ${n}/${dumpFiles.length} factions seulement`);
  return false;
});

let stale = 0;
for (const v of versions) {
  const out = { version: v, base, sources: {}, factions: {}, notes: {} };
  const fac = (name) => out.factions[name] || (out.factions[name] = { units: {}, enh: {}, dets: {} });
  const note = (name, kind, what) => { const n = out.notes[name] || (out.notes[name] = {}); (n[kind] || (n[kind] = [])).push(what); };
  for (const f of dumpFiles) {
    const h = byFile[f].get(v);
    const mapPath = path.join(MAP_DIR, f);
    if (!h || !fs.existsSync(mapPath)) continue;
    const old = JSON.parse(git("show", `${h}:${DUMP_REL}/${f}`));
    const cur = current[f];
    const map = readJson(mapPath);
    out.sources[f.replace(/\.json$/, "")] = h.slice(0, 10);
    const oldU = new Map((old.units || []).map((u) => [u.name, u]));
    const curU = new Map((cur.units || []).map((u) => [u.name, u]));
    for (const [name, m] of Object.entries(map.matched || {})) {
      const c = curU.get(name), o = oldU.get(name);
      if (!c) continue;
      for (const t of m.targets || []) {
        if (!o) { note(t.faction, "missing", name); continue; }
        const d = unitDelta(o, c);
        if (!d) continue;
        if (d.unsupported) note(t.faction, "unsupported", `${name} (${d.unsupported})`);
        else fac(t.faction).units[t.bsId] = d;
      }
    }
    const oi = detIndex(old), ci = detIndex(cur);
    for (const [k, p] of ci.enh) if (oi.enh.has(k) && oi.enh.get(k) !== p) fac(map.faction).enh[k] = oi.enh.get(k) - p;
    for (const [k, p] of ci.dp) if (oi.dp.has(k) && oi.dp.get(k) !== p) fac(map.faction).dets[k] = oi.dp.get(k);
  }
  // Factions sans aucun écart : retirées (fichier plus court, lecture plus nette).
  for (const [k, x] of Object.entries(out.factions)) if (!Object.keys(x.units).length && !Object.keys(x.enh).length && !Object.keys(x.dets).length) delete out.factions[k];
  for (const n of Object.values(out.notes)) for (const k of Object.keys(n)) n[k] = [...new Set(n[k])].sort();
  const file = path.join(OUT_DIR, `${v}.json`);
  const text = JSON.stringify(out, null, 1) + "\n";
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const nU = Object.values(out.factions).reduce((s, x) => s + Object.keys(x.units).length, 0);
  const nE = Object.values(out.factions).reduce((s, x) => s + Object.keys(x.enh).length, 0);
  const nD = Object.values(out.factions).reduce((s, x) => s + Object.keys(x.dets).length, 0);
  const nN = Object.values(out.notes).reduce((s, x) => s + (x.unsupported || []).length, 0);
  if (prev === text) { console.log(`= ${v} (vs ${base}) : à jour — ${nU} fiches, ${nE} améliorations, ${nD} DP, ${nN} non comparables`); continue; }
  stale++;
  if (CHECK) { console.log(`✗ ${v} : périmé (relancer sans --check)`); continue; }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`✓ ${v} (vs ${base}) : ${nU} fiches, ${nE} améliorations, ${nD} DP modifiés, ${nN} non comparables`);
}
// Une version devenue courante n'a plus de fichier d'écarts.
for (const f of fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR) : []) {
  if (f.endsWith(".json") && !versions.includes(f.replace(/\.json$/, ""))) {
    stale++;
    if (CHECK) console.log(`✗ ${f} : version courante ou inconnue (à retirer)`);
    else { fs.unlinkSync(path.join(OUT_DIR, f)); console.log(`− ${f} retiré (plus une version passée)`); }
  }
}
if (CHECK && stale) process.exit(1);
