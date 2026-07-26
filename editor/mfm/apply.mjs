#!/usr/bin/env node
// apply.mjs — Phase 2 de l'intégration continue MFM (dry-run par défaut).
// Compare, pour chaque unité/amélioration MATCHÉE dans la matrice
// (editor/mfm/map/<slug>.json), les points MFM aux points ACTUELS de la bdd
// (champ `current` de la matrice), et imprime les DELTAS à appliquer. N'ÉCRIT
// RIEN : --dry est le seul mode implémenté ici (l'écriture réelle = phase 3,
// via editor/lib/catalog.js après ce diff validé).
//
// Garde-fous « ne rien insérer de douteux » — une proposition de changement
// n'est émise QUE si TOUTES ces conditions tiennent, sinon la ligne part en
// SKIP/REVIEW (jamais en delta appliquable) :
//   • chaque valeur MFM est un entier fini 0 < p ≤ 3000 ;
//   • le delta reste dans une fourchette plausible (|Δ| ≤ 200) ;
//   • la cible bdd a bien un coût du type attendu (base présente pour une base,
//     etc.) — un « nouveau coût » (cat sans base, MFM avec) part en REVIEW ;
//   • les unités à composition (tailles hors « N model ») et le dual-cost Agents
//     sont détectés et exclus de l'auto (REVIEW).
//
// Usage : node editor/mfm/apply.mjs <dir-json-mfm> [slug] [--changed-only]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const MAP_DIR = path.join(HERE, "map");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const pos = args.filter((a) => !a.startsWith("--"));
const mfmDir = pos[0];
const onlySlug = pos[1] || null;
const changedOnly = flags.has("--changed-only");
if (!mfmDir || !fs.existsSync(mfmDir)) {
  console.error("usage: node editor/mfm/apply.mjs <dir-json-mfm> [slug] [--changed-only]");
  process.exit(1);
}

const MAX_PTS = 3000, MAX_DELTA = 200;
// Valide un point MFM → entier sûr, ou lève (capté → REVIEW, jamais appliqué).
function safePts(raw, ctx) {
  const n = Number(raw);
  if (raw == null || !Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > MAX_PTS)
    throw new Error(`valeur MFM non sûre (${JSON.stringify(raw)}) — ${ctx}`);
  return n;
}
const sizeModels = (s) => { const m = String(s || "").match(/^(\d+)\s+model/i); return m ? Number(m[1]) : null; };

// Extrait de l'unité MFM une structure de coûts NORMALISÉE, ou signale pourquoi
// elle n'est pas automatisable (composition, dual-cost, valeur douteuse).
function mfmUnitCosts(u) {
  const profs = Array.isArray(u.profiles) ? u.profiles : [];
  // Toute taille non « N model(s) » (Gretchin « 1 Runtherd, 20 Gretchin », etc.)
  // → prix à composition : hors périmètre auto.
  const compPriced = profs.some((p) => p.size && sizeModels(p.size) == null && !/^per\b/i.test(p.size));
  if (compPriced) return { skip: "composition (taille non « N model »)" };
  const isRepeatTier = (t) => /\d+(ST|ND|RD|TH)/.test(t || "");
  const repeat = profs.some((p) => isRepeatTier(p.tier));
  // Regroupe (tier→[{models,pts}]). On ne garde que les profils à taille modèle.
  const byTier = new Map();
  for (const p of profs) {
    const n = sizeModels(p.size);
    if (n == null) continue;
    const pts = safePts(p.points, `${u.name} / ${p.tier} / ${p.size}`);
    if (!byTier.has(p.tier)) byTier.set(p.tier, []);
    byTier.get(p.tier).push({ models: n, pts });
  }
  if (byTier.size === 0) return { skip: "aucun profil à taille modèle" };
  const tiers = [...byTier.values()].map((arr) => arr.sort((a, b) => a.models - b.models));
  const first = tiers[0];                                   // 1er palier (ou l'unique)
  const basePts = first[0].pts;                             // plus petite taille
  const sizeTierPts = first.slice(1).map((x) => x.pts);     // tailles supérieures
  let repeatDelta = null;
  if (repeat && tiers.length >= 2) {
    // Δ répétition = prix (4TH+) − prix (1ST) à la MÊME (plus petite) taille.
    const later = tiers[1];
    const a = first.find((x) => x.models === later[0].models) || first[0];
    repeatDelta = later[0].pts - a.pts;
  }
  return { basePts, sizeTierPts, repeatDelta };
}

// Un delta plausible ? (garde-fou contre une extraction aberrante)
const saneDelta = (d) => Number.isInteger(d) && Math.abs(d) <= MAX_DELTA;

const slugs = fs.readdirSync(MAP_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .filter((s) => !onlySlug || s === onlySlug);

let tot = { units: 0, deltas: 0, review: 0, enhDeltas: 0 };
const lines = [];

// Détection de conflit sur datasheet PARTAGÉE : un même bsId (le tronc Space
// Marines importé par plusieurs chapitres) peut recevoir un prix DIFFÉRENT
// selon la faction — c'est un coût spécifique de chapitre
// (MARINE_CHAPTER_COST_APP_PROMPT), à encoder par modifier conditionné
// primary-catalogue, JAMAIS par une écriture brute sur l'entrée partagée qui
// écraserait les autres factions. Pré-passe : on collecte toutes les valeurs
// cibles proposées par (bsId, champ) à travers TOUTES les factions ; celles qui
// divergent sont marquées conflictuelles → REVIEW pour tout le monde.
const proposalsByKey = new Map();                          // `${bsId}|${field}` → Set(valeurs cibles)
function recordProposal(bsId, field, to) {
  const k = bsId + "|" + field;
  if (!proposalsByKey.has(k)) proposalsByKey.set(k, new Set());
  proposalsByKey.get(k).add(JSON.stringify(to));
}
function isConflicted(bsId, field) {
  const s = proposalsByKey.get(bsId + "|" + field);
  return s && s.size > 1;
}

// Pré-passe : collecte des valeurs cibles par (bsId, champ), toutes factions.
for (const slug of slugs) {
  const map = JSON.parse(fs.readFileSync(path.join(MAP_DIR, slug + ".json"), "utf8"));
  const mfmPath = path.join(mfmDir, slug + ".json");
  if (!fs.existsSync(mfmPath)) continue;
  const mfm = JSON.parse(fs.readFileSync(mfmPath, "utf8"));
  const seen = new Set();
  for (const mu of mfm.units) {
    const entry = map.matched[mu.name];
    if (!entry || seen.has(mu.name)) continue; seen.add(mu.name);
    let costs; try { costs = mfmUnitCosts(mu); } catch { continue; }
    if (costs.skip) continue;
    for (const tgt of entry.targets) {
      if (costs.basePts != null && tgt.current.basePts) recordProposal(tgt.bsId, "base", costs.basePts);
      const mfmTierPts = [...(costs.sizeTierPts || [])].sort((a, b) => a - b);
      if (mfmTierPts.length) recordProposal(tgt.bsId, "tiers", mfmTierPts);
      if (costs.repeatDelta != null) recordProposal(tgt.bsId, "repeat", costs.repeatDelta);
    }
  }
}

// Passe principale : émission (dédup les écritures identiques d'un même bsId
// vue depuis plusieurs factions ; met en REVIEW les bsId conflictuels).
const emittedWrite = new Set();                            // `${bsId}|${field}` déjà émis en Δ
for (const slug of slugs) {
  const map = JSON.parse(fs.readFileSync(path.join(MAP_DIR, slug + ".json"), "utf8"));
  const mfmPath = path.join(mfmDir, slug + ".json");
  if (!fs.existsSync(mfmPath)) continue;
  const mfm = JSON.parse(fs.readFileSync(mfmPath, "utf8"));

  const facLines = [];
  // ── unités ────────────────────────────────────────────────────────────────
  const seen = new Set();                                   // dédup dual-cost (nom vu 1×)
  for (const mu of mfm.units) {
    const entry = map.matched[mu.name];
    if (!entry) continue;                                   // non-mappé (déjà en review Phase 1)
    if (seen.has(mu.name)) continue; seen.add(mu.name);
    if (changedOnly && !mu.changed) continue;
    tot.units++;
    let costs;
    try { costs = mfmUnitCosts(mu); }
    catch (e) { facLines.push(`  ⚠ REVIEW ${mu.name}: ${e.message}`); tot.review++; continue; }
    if (costs.skip) { facLines.push(`  ⚠ REVIEW ${mu.name}: ${costs.skip}`); tot.review++; continue; }

    for (const tgt of entry.targets) {
      const cur = tgt.current;
      const tag = entry.targets.length > 1 ? ` [${tgt.catName}]` : "";
      // base — un coût bdd 0 (ou absent) alors que le MFM en a un signifie
      // presque toujours un coût PORTÉ PAR LES MODÈLES (Ironstrider, Mek Gunz,
      // Firestrike, Lokhust… : l'entrée unité est à 0, chaque modèle price).
      // Écrire la valeur sur l'unité serait FAUX → REVIEW, jamais auto.
      if (cur.basePts == null || cur.basePts === 0) {
        if (costs.basePts != null) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag}: coût bdd ${cur.basePts == null ? "absent" : "0"} (probablement porté par les modèles), MFM=${costs.basePts} — manuel`); tot.review++; }
      } else if (costs.basePts !== cur.basePts) {
        const d = costs.basePts - cur.basePts;
        if (isConflicted(tgt.bsId, "base")) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} BASE: datasheet partagée, prix divergent entre factions (coût de chapitre → modifier primary-catalogue, manuel)`); tot.review++; }
        else if (!saneDelta(d)) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} BASE Δ${d} hors bornes`); tot.review++; }
        else if (emittedWrite.has(tgt.bsId + "|base")) { /* déjà émis via une autre faction — même écriture partagée */ }
        else { facLines.push(`  Δ ${mu.name}${tag} BASE: ${cur.basePts} → ${costs.basePts} (${d > 0 ? "+" : ""}${d})`); emittedWrite.add(tgt.bsId + "|base"); tot.deltas++; }
      }
      // paliers de taille (compare l'ensemble trié des prix)
      const curTierPts = (cur.tiers || []).map((x) => x.pts).sort((a, b) => a - b);
      const mfmTierPts = [...(costs.sizeTierPts || [])].sort((a, b) => a - b);
      if (JSON.stringify(curTierPts) !== JSON.stringify(mfmTierPts)) {
        if (isConflicted(tgt.bsId, "tiers")) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} PALIERS: datasheet partagée, prix divergent entre factions (manuel)`); tot.review++; }
        else if (curTierPts.length !== mfmTierPts.length) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} PALIERS: structure différente (bdd ${JSON.stringify(curTierPts)} vs MFM ${JSON.stringify(mfmTierPts)})`); tot.review++; }
        else if (emittedWrite.has(tgt.bsId + "|tiers")) { /* écriture partagée déjà émise */ }
        else { facLines.push(`  Δ ${mu.name}${tag} PALIERS: ${JSON.stringify(curTierPts)} → ${JSON.stringify(mfmTierPts)}`); emittedWrite.add(tgt.bsId + "|tiers"); tot.deltas++; }
      }
      // prix par répétition
      if (costs.repeatDelta != null) {
        const curD = cur.repeat ? cur.repeat.delta : null;
        if (curD == null) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} RÉPÉTITION: bdd sans repeat-cost, MFM Δ=${costs.repeatDelta} (manuel)`); tot.review++; }
        else if (curD !== costs.repeatDelta) {
          if (isConflicted(tgt.bsId, "repeat")) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} RÉPÉTITION: datasheet partagée, prix divergent entre factions (manuel)`); tot.review++; }
          else if (!saneDelta(costs.repeatDelta)) { facLines.push(`  ⚠ REVIEW ${mu.name}${tag} RÉPÉTITION Δ${costs.repeatDelta} hors bornes`); tot.review++; }
          else if (emittedWrite.has(tgt.bsId + "|repeat")) { /* écriture partagée déjà émise */ }
          else { facLines.push(`  Δ ${mu.name}${tag} RÉPÉTITION: Δ${curD} → Δ${costs.repeatDelta}`); emittedWrite.add(tgt.bsId + "|repeat"); tot.deltas++; }
        }
      }
    }
  }
  // ── améliorations ───────────────────────────────────────────────────────────
  for (const det of (Array.isArray(mfm.detachments) ? mfm.detachments : [])) {
    for (const me of (det.enhancements || [])) {
      const em = map.enhancements && map.enhancements[me.name];
      if (!em) continue;
      let p; try { p = safePts(me.points, `enh ${me.name}`); } catch (e) { facLines.push(`  ⚠ REVIEW enh ${me.name}: ${e.message}`); tot.review++; continue; }
      if (em.currentPts == null) { facLines.push(`  ⚠ REVIEW enh ${me.name}: coût bdd absent, MFM=${p}`); tot.review++; continue; }
      if (p !== em.currentPts) {
        const d = p - em.currentPts;
        if (saneDelta(d)) { facLines.push(`  Δ enh ${me.name} (${em.det}): ${em.currentPts} → ${p} (${d > 0 ? "+" : ""}${d})`); tot.enhDeltas++; }
        else { facLines.push(`  ⚠ REVIEW enh ${me.name} Δ${d} hors bornes`); tot.review++; }
      }
    }
  }

  if (facLines.length) lines.push(`\n═══ ${map.faction} ═══\n` + facLines.join("\n"));
}

console.log(lines.length ? lines.join("\n") : "Aucun écart : la bdd est alignée sur ce MFM.");
console.log(`\n════ DRY-RUN ════`);
console.log(`Unités examinées: ${tot.units} · deltas points: ${tot.deltas} · deltas améliorations: ${tot.enhDeltas} · à revoir (manuel): ${tot.review}`);
console.log(`Aucune écriture effectuée (dry-run). Phase 3 appliquera ces deltas via editor/lib/catalog.js + gauntlet.`);
