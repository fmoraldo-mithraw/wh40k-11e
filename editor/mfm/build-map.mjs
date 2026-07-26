#!/usr/bin/env node
// build-map.mjs — Phase 1 de l'intégration continue MFM.
// Construit la matrice nom↔id par faction : chaque nom MFM est apparié à une
// datasheet PARSÉE (clôture d'import résolue), puis on relit sur la bdd (lib
// catalog) ses coûts actuels ET **toutes ses options d'armes/wargear porteuses
// de coût** (id + pts courant), afin qu'un futur surcoût par arme puisse être
// adressé sans re-recherche. Écrit editor/mfm/map/<slug>.json
// { matched, unmapped, orphans, errors }. Lecture seule sur la bdd.
//
// Robustesse (« ne rien insérer de douteux ») : chaque unité est résolue dans
// un try/catch ; un bsId qui ne retombe pas sur un nœud de la bdd, un coût non
// numérique, un doublon de bsId → consignés dans `errors` et EXCLUS de
// `matched`. La matrice ne contient donc que des cibles sûres et adressables.
//
// Usage : node editor/mfm/build-map.mjs <dir-json-mfm> [slug]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");                    // wh40k-11e
const PARSER = path.resolve(REPO, "..", "cogitator-bellicum", "scripts", "bsdata-parser.mjs");
const MAP_DIR = path.join(HERE, "map");
const ALIASES = path.join(HERE, "aliases.json");

const mfmDir = process.argv[2];
const onlySlug = process.argv[3] || null;
if (!mfmDir || !fs.existsSync(mfmDir)) {
  console.error("usage: node editor/mfm/build-map.mjs <dir-json-mfm> [slug]");
  process.exit(1);
}

// ── normalisation : la clef de jointure (identique côté MFM et bdd) ─────────
export function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`]/g, "'").replace(/[–—]/g, "-")
    .replace(/\bw\/\s*/gi, "with ")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ").trim();
}
// pts bdd → entier validé. null si absent ; ERREUR (throw) si présent mais non
// numérique — on refuse de bâtir une entrée de matrice sur une valeur pourrie.
function ptsInt(raw, ctx) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 3000)
    throw new Error(`coût non valide (${JSON.stringify(raw)}) sur ${ctx}`);
  return n;
}

const SM_CHAPTERS = ["Space Marines", "Ultramarines", "Imperial Fists", "Iron Hands", "Raven Guard", "Salamanders", "White Scars"];
const SLUG_TO_POOL = {
  "orks": ["Orks"], "necrons": ["Necrons"], "tyranids": ["Tyranids"],
  "space-marines": SM_CHAPTERS,
  "space-wolves": ["Space Wolves"], "blood-angels": ["Blood Angels"], "dark-angels": ["Dark Angels"],
  "black-templars": ["Black Templars"], "deathwatch": ["Deathwatch"],
  "imperial-knights": ["Imperial Knights"], "chaos-knights": ["Chaos Knights"],
  "adeptus-mechanicus": ["Adeptus Mechanicus"], "adepta-sororitas": ["Adepta Sororitas"],
  "adeptus-custodes": ["Adeptus Custodes"], "astra-militarum": ["Astra Militarum"],
  "grey-knights": ["Grey Knights"], "imperial-agents": ["Agents of the Imperium"],
  "chaos-space-marines": ["Chaos Space Marines"], "death-guard": ["Death Guard"],
  "thousand-sons": ["Thousand Sons"], "world-eaters": ["World Eaters"],
  "chaos-daemons": ["Chaos Daemons"], "emperors-children": ["Emperor's Children"],
  "genestealer-cults": ["Genestealer Cults"], "leagues-of-votann": ["Leagues of Votann"],
  "tau-empire": ["T'au Empire"], "aeldari": ["Craftworlds"], "drukhari": ["Drukhari"],
};

// ── chargement bdd (parser import-résolu + lib catalog pour les ids/coûts) ──
const { parseAllCatalogues } = await import(PARSER);
let all, cat;
try {
  all = await parseAllCatalogues(REPO);
} catch (e) {
  console.error("ÉCHEC parseAllCatalogues:", e.message); process.exit(2);
}
try {
  const { Catalog } = require(path.join(REPO, "editor", "lib", "catalog.js"));
  cat = new Catalog(REPO); cat.load();
} catch (e) {
  console.error("ÉCHEC chargement lib catalog:", e.message); process.exit(2);
}
if (!all || Object.keys(all).length === 0) { console.error("aucune faction parsée — abandon."); process.exit(2); }

const aliases = fs.existsSync(ALIASES) ? JSON.parse(fs.readFileSync(ALIASES, "utf8")) : {};
fs.mkdirSync(MAP_DIR, { recursive: true });

// Options d'armes/wargear porteuses de coût d'une datasheet, par bsId. Chaque
// choix = une cible adressable pour un surcoût (id + pts courant). throw si la
// lib échoue → capturé par unité.
function weaponOptionsOf(bsId) {
  const ref = cat.byId.get(bsId);
  if (!ref) throw new Error(`bsId ${bsId} introuvable dans la bdd (lib)`);
  const u = cat.getUnit(ref.file, bsId);
  const out = [];
  for (const g of (u.options || [])) {
    for (const c of (g.choices || [])) {
      out.push({
        group: g.name, owner: g.ownerName || null,
        id: c.id, name: c.name, kind: c.kind, targetId: c.targetId || null,
        pts: ptsInt(c.pts, `option ${c.name} (${bsId})`) ?? 0,
      });
    }
  }
  return { file: ref.file, options: out };
}

const slugs = fs.readdirSync(mfmDir)
  .filter((f) => f.endsWith(".json") && f !== "all.json")
  .map((f) => f.replace(/\.json$/, ""))
  .filter((s) => !onlySlug || s === onlySlug);

let tot = { mfm: 0, matched: 0, aliased: 0, unmapped: 0, orphans: 0, errors: 0, weaponOpts: 0, enh: 0, enhUnmapped: 0 };
const summary = [];

for (const slug of slugs) {
  const pool = SLUG_TO_POOL[slug];
  if (!pool) { summary.push(`SKIP ${slug} (pas de faction bdd)`); continue; }
  let mfm;
  try { mfm = JSON.parse(fs.readFileSync(path.join(mfmDir, slug + ".json"), "utf8")); }
  catch (e) { summary.push(`ERREUR ${slug}: JSON illisible (${e.message})`); tot.errors++; continue; }
  if (!Array.isArray(mfm.units)) { summary.push(`ERREUR ${slug}: pas de tableau units`); tot.errors++; continue; }

  // Index nom-normalisé → datasheet, et bsId → datasheet (1re faction gagne).
  const byNorm = new Map(), byBsId = new Map();
  const poolUnits = [];
  for (const facName of pool) {
    const fac = all[facName];
    if (!fac) continue;
    for (const u of fac.units) {
      if (u.isLegend) continue;
      const rec = { ...u, _fac: facName };
      poolUnits.push(rec);
      const k = norm(u.name);
      if (!byNorm.has(k)) byNorm.set(k, rec);
      if (u.bsId && !byBsId.has(u.bsId)) byBsId.set(u.bsId, rec);
    }
  }
  // Un élément d'alias/ auto → la datasheet parsée (par bsId direct, sinon nom).
  const resolveOne = (token) => byBsId.get(token) || byNorm.get(norm(token)) || null;

  const alias = aliases[slug] || {};
  const matched = {}, unmapped = [], errors = [];
  const matchedIds = new Set();

  for (const mu of mfm.units) {
    tot.mfm++;
    if (!mu || typeof mu.name !== "string" || !mu.name.trim()) { errors.push({ name: mu && mu.name, why: "nom MFM vide/invalide" }); tot.errors++; continue; }
    // Cibles bdd de ce nom MFM : auto (1), ou alias (string = 1, array = N pour
    // un nom MFM générique couvrant plusieurs datasheets, ex. SOUL GRINDER).
    let hits = [], via = "auto";
    const auto = byNorm.get(norm(mu.name));
    if (auto) hits = [auto];
    else if (alias[mu.name] != null) {
      via = "alias"; tot.aliased++;
      const av = alias[mu.name];
      hits = (Array.isArray(av) ? av : [av]).map(resolveOne).filter(Boolean);
    }
    if (!hits.length) { unmapped.push(mu.name); tot.unmapped++; continue; }

    // Chaque cible est résolue défensivement : bsId présent, non déjà mappé,
    // coûts numériques, options lisibles. Une cible fautive n'entre PAS dans la
    // matrice (consignée dans errors) — rien de douteux n'y transite.
    const targets = [];
    for (const hit of hits) {
      try {
        if (!hit.bsId) throw new Error(`datasheet « ${hit.name} » sans bsId`);
        if (matchedIds.has(hit.bsId)) { errors.push({ name: mu.name, bsId: hit.bsId, why: `bsId déjà mappé (${hit.name}) — occurrence ignorée` }); tot.errors++; continue; }
        const src = byBsId.get(hit.bsId) || hit;
        const basePts = ptsInt(src.pts, `base ${src.name}`);
        const wp = weaponOptionsOf(hit.bsId);
        tot.weaponOpts += wp.options.length;
        targets.push({
          bsId: hit.bsId, catName: hit.name, faction: hit._fac, file: wp.file,
          current: {
            basePts,
            tiers: Array.isArray(src.tiers) ? src.tiers.map(([atModels, pts]) => ({ atModels, pts })) : [],
            repeat: src.repeatCost ? { threshold: src.repeatCost.threshold, delta: src.repeatCost.delta } : null,
          },
          weaponOptions: wp.options,
        });
        matchedIds.add(hit.bsId);
      } catch (e) {
        errors.push({ name: mu.name, bsId: hit.bsId, why: e.message }); tot.errors++;
      }
    }
    if (!targets.length) continue;   // toutes les cibles ont échoué → non matché
    matched[mu.name] = { via, targets };
    tot.matched++;
  }

  // ── améliorations : nom MFM (par détachement) → entrée bdd (bsId + pts) ──
  // Indexé par mots-clef nom (distinctifs), dédup par bsId. Une amélioration MFM
  // sans équivalent bdd tombe en `enhUnmapped` (review), jamais devinée.
  const enhByNorm = new Map();
  for (const facName of pool) for (const e of (all[facName] || {}).enhs || []) {
    const k = norm(e.name);
    if (e.bsId && !enhByNorm.has(k)) enhByNorm.set(k, e);
  }
  const enhancements = {}, enhUnmapped = [];
  for (const det of (Array.isArray(mfm.detachments) ? mfm.detachments : [])) {
    for (const me of (det.enhancements || [])) {
      if (!me || typeof me.name !== "string") continue;
      const hit = enhByNorm.get(norm(me.name));
      if (!hit) { enhUnmapped.push(`${me.name} (${det.name})`); continue; }
      let cur = null;
      try { cur = ptsInt(hit.pts, `enh ${hit.name}`); } catch (e) { errors.push({ name: me.name, why: e.message }); tot.errors++; continue; }
      enhancements[me.name] = { bsId: hit.bsId, det: hit.det, catName: hit.name, currentPts: cur };
    }
  }

  const primary = all[pool[0]];
  const orphans = primary ? primary.units.filter((u) => !u.isLegend && !matchedIds.has(u.bsId)).map((u) => u.name) : [];
  tot.orphans += orphans.length;

  const out = {
    faction: pool[0], slug, mfmVersion: mfm.version || null,
    counts: { mfm: mfm.units.length, matched: Object.keys(matched).length, unmapped: unmapped.length, orphans: orphans.length, errors: errors.length, enh: Object.keys(enhancements).length, enhUnmapped: enhUnmapped.length },
    matched, unmapped, orphans, errors, enhancements, enhUnmapped,
  };
  fs.writeFileSync(path.join(MAP_DIR, slug + ".json"), JSON.stringify(out, null, 1) + "\n");
  tot.enh += Object.keys(enhancements).length; tot.enhUnmapped += enhUnmapped.length;
  summary.push(`${pool[0]}: ${Object.keys(matched).length}/${mfm.units.length} matchés · ${Object.keys(enhancements).length} amél.` +
    (unmapped.length ? ` · ${unmapped.length} NON-MAPPÉS: ${unmapped.slice(0, 6).join(", ")}${unmapped.length > 6 ? "…" : ""}` : "") +
    (enhUnmapped.length ? ` · ${enhUnmapped.length} amél. non-mappées` : "") +
    (errors.length ? ` · ⚠ ${errors.length} erreurs` : ""));
}

console.log(summary.join("\n"));
console.log(`\n════ ${tot.matched}/${tot.mfm} unités (${(100 * tot.matched / tot.mfm).toFixed(1)}%) dont ${tot.aliased} alias · ${tot.unmapped} non-mappées · ${tot.errors} erreurs`);
console.log(`     ${tot.enh} améliorations mappées (${tot.enhUnmapped} non-mappées) · ${tot.weaponOpts} options d'armes indexées · ${tot.orphans} orphelins bdd`);
console.log(`Matrices : ${path.relative(REPO, MAP_DIR)}/`);
if (tot.errors) console.log(`⚠ ${tot.errors} entrées écartées pour cause d'erreur (voir champ "errors" des matrices) — jamais appliquées.`);
