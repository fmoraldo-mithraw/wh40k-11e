#!/usr/bin/env node
// phase3.mjs — Phase 3 de l'intégration MFM : ÉCRITURE réelle des deltas.
// Reprend les décisions et les garde-fous d'apply.mjs (Phase 2) et les applique
// via editor/lib/catalog.js — jamais de sed/regex sur les .cat.
//   • coût de base           → editUnit(costs)
//   • paliers de taille      → editUnit(tiers)            [résidu ⑥, cf. COWORK_TASK §5bis]
//   • prix par répétition    → modifier increment natif   [résidu ⑦, idem]
//   • améliorations          → cost pts de l'entrée
// Usage : node phase3.mjs <repo> <dir-dump> [--write] [--slugs a,b,c]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const REPO = process.argv[2];
const MFM_DIR = process.argv[3];
const WRITE = process.argv.includes("--write");
const slugArg = (process.argv.find((a) => a.startsWith("--slugs=")) || "").split("=")[1];
const MAP_DIR = path.join(REPO, "editor", "mfm", "map");
const COST_PTS = "51b2-306e-1021-d207";
const xml = require(path.join(REPO, "editor", "lib", "xml.js"));
const { Catalog } = require(path.join(REPO, "editor", "lib", "catalog.js"));
const cat = new Catalog(REPO); cat.load();

const MAX_PTS = 3000, MAX_DELTA = 200;
function safePts(raw, ctx) {
  const n = Number(raw);
  if (raw == null || !Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > MAX_PTS)
    throw new Error(`valeur MFM non sûre (${JSON.stringify(raw)}) — ${ctx}`);
  return n;
}
const saneDelta = (d) => Number.isInteger(d) && Math.abs(d) <= MAX_DELTA;
const sizeModels = (s) => { const m = String(s || "").match(/^(\d+)\s+model/i); return m ? Number(m[1]) : null; };

// identique à apply.mjs, + extraction du SEUIL de répétition (K = « YOUR Kth + »)
function mfmUnitCosts(u) {
  const profs = Array.isArray(u.profiles) ? u.profiles : [];
  const compPriced = profs.some((p) => p.size && sizeModels(p.size) == null && !/^per\b/i.test(p.size));
  if (compPriced) return { skip: "composition" };
  const isRepeatTier = (t) => /\d+(ST|ND|RD|TH)/.test(t || "");
  const repeat = profs.some((p) => isRepeatTier(p.tier));
  const byTier = new Map();
  for (const p of profs) {
    const n = sizeModels(p.size);
    if (n == null) continue;
    const pts = safePts(p.points, `${u.name} / ${p.tier} / ${p.size}`);
    if (!byTier.has(p.tier)) byTier.set(p.tier, []);
    byTier.get(p.tier).push({ models: n, pts });
  }
  if (byTier.size === 0) return { skip: "aucun profil à taille modèle" };
  const tierNames = [...byTier.keys()];
  const tiers = [...byTier.values()].map((arr) => arr.sort((a, b) => a.models - b.models));
  const first = tiers[0];
  const basePts = first[0].pts;
  const sizeTiers = first.slice(1);                       // [{models, pts}]
  let repeatDelta = null, repeatAt = null;
  if (repeat && tiers.length >= 2) {
    const later = tiers[1];
    const a = first.find((x) => x.models === later[0].models) || first[0];
    repeatDelta = later[0].pts - a.pts;
    // seuil : « YOUR 3RD + UNIT COSTS » → condition atLeast value=3
    const mLater = /(\d+)(?:ST|ND|RD|TH)\s*\+/i.exec(tierNames[1] || "");
    const mFirst = /TO\s+(\d+)(?:ST|ND|RD|TH)/i.exec(tierNames[0] || "")
                || /YOUR\s+(1)ST\s+UNIT/i.exec(tierNames[0] || "");
    const k1 = mLater ? Number(mLater[1]) : null;
    const k2 = mFirst ? Number(mFirst[1]) + 1 : null;
    if (k1 && k2 && k1 !== k2) return { basePts, sizeTiers, repeatDelta: null, repeatAt: null, warn: `seuils incohérents (${tierNames[0]} / ${tierNames[1]})` };
    repeatAt = k1 || k2 || null;
  }
  return { basePts, sizeTiers, repeatDelta, repeatAt };
}

// — lectures bdd (mêmes règles que build-map.readCurrentCosts) —
function nodeOf(bsId) { const r = cat.byId.get(bsId); if (!r) throw new Error(`bsId ${bsId} introuvable`); return r; }
function readBase(node) {
  const costs = xml.child(node, "costs");
  if (!costs) return null;
  for (const c of costs.children) if (c.tag === "cost" && xml.getAttr(c, "name") === "pts") return Number(xml.getAttr(c, "value"));
  return null;
}
// paliers de TAILLE (set pts conditionné par un décompte de modèles, hors chapitre),
// avec l'index applyTiers (= rang parmi TOUS les modifiers set sur pts).
function readSizeTiers(node) {
  const out = []; let idx = 0;
  xml.walk(node, (m) => {
    if (m.tag !== "modifier" || xml.getAttr(m, "field") !== COST_PTS || xml.getAttr(m, "type") !== "set") return;
    const i = idx++;
    let atModels = null, hasCount = false, hasInstance = false;
    xml.walk(m, (c) => {
      if (c.tag !== "condition") return;
      const cf = xml.getAttr(c, "field"), ct = xml.getAttr(c, "type"), sc = xml.getAttr(c, "scope");
      if (cf === "selections" && ["atLeast", "greaterThan", "equalTo"].includes(ct)) { hasCount = true; atModels = Number(xml.getAttr(c, "value")); }
      if (ct === "instanceOf" || ct === "notInstanceOf" || sc === "primary-catalogue") hasInstance = true;
    });
    if (hasCount && !hasInstance) out.push({ idx: i, atModels, pts: Number(xml.getAttr(m, "value")), node: m });
  });
  return out.sort((a, b) => a.atModels - b.atModels);
}
function readRepeat(node) {
  let hit = null;
  xml.walk(node, (m) => {
    if (m.tag !== "modifier" || xml.getAttr(m, "type") !== "increment" || xml.getAttr(m, "field") !== COST_PTS) return;
    xml.walk(m, (c) => {
      if (c.tag !== "condition" || xml.getAttr(c, "type") !== "atLeast" || xml.getAttr(c, "scope") !== "roster") return;
      const k = Number(xml.getAttr(c, "value")) || 0;
      if (k >= 2) hit = { at: k, delta: Number(xml.getAttr(m, "value")) || 0, mod: m, cond: c };
    });
  });
  return hit;
}
function addRepeat(node, bsId, delta, at) {
  const mods = xml.ensureChild(node, "modifiers");
  const cond = xml.elem("condition", {
    type: "atLeast", value: String(at), field: "selections", scope: "roster",
    childId: bsId, shared: "true", includeChildSelections: "true", includeChildForces: "true",
  });
  const mod = xml.elem("modifier", { type: "increment", field: COST_PTS, value: String(delta) },
    [xml.elem("conditions", {}, [cond])]);
  mods.selfClose = false;
  mods.children.push(mod);
}

const SM = new Set(["space-marines", "black-templars", "blood-angels", "dark-angels", "deathwatch", "space-wolves"]);
const slugs = (slugArg ? slugArg.split(",") : fs.readdirSync(MAP_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")))
  .filter((s) => slugArg || !SM.has(s));

const done = new Set();                                   // bsId|champ déjà écrit (datasheets partagées)
const log = [], review = [];
let nBase = 0, nTier = 0, nRep = 0, nRepNew = 0, nEnh = 0;

for (const slug of slugs) {
  const mapPath = path.join(MAP_DIR, slug + ".json"), mfmPath = path.join(MFM_DIR, slug + ".json");
  if (!fs.existsSync(mapPath) || !fs.existsSync(mfmPath)) continue;
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const mfm = JSON.parse(fs.readFileSync(mfmPath, "utf8"));
  const fac = map.faction || slug;
  const seen = new Set();
  for (const mu of mfm.units || []) {
    const entry = map.matched[mu.name];
    if (!entry || seen.has(mu.name)) continue; seen.add(mu.name);
    let costs; try { costs = mfmUnitCosts(mu); } catch (e) { review.push(`[${fac}] ${mu.name} — ${e.message}`); continue; }
    if (costs.skip) continue;
    if (costs.warn) review.push(`[${fac}] ${mu.name} — ${costs.warn}`);
    for (const tgt of entry.targets) {
      let ref; try { ref = nodeOf(tgt.bsId); } catch (e) { review.push(`[${fac}] ${mu.name} — ${e.message}`); continue; }
      const node = ref.node, file = ref.file;
      // ── base ──
      const curBase = readBase(node);
      if (costs.basePts != null && curBase != null && curBase !== 0 && costs.basePts !== curBase) {
        const d = costs.basePts - curBase;
        if (!saneDelta(d)) review.push(`[${fac}] ${mu.name} — BASE Δ${d} implausible`);
        else if (!done.has(tgt.bsId + "|base")) {
          if (WRITE) cat.editUnit(file, tgt.bsId, { costs: [{ typeId: COST_PTS, value: String(costs.basePts) }] });
          log.push(`[${fac}] ${mu.name} BASE ${curBase} → ${costs.basePts}`);
          done.add(tgt.bsId + "|base"); nBase++;
        }
      }
      // ── paliers de taille ──
      const base = costs.basePts;
      const dbTiers = readSizeTiers(node);
      const wanted = costs.sizeTiers || [];
      if (wanted.length && base) {
        const achievable = new Set([base, ...dbTiers.map((t) => t.pts)]);
        const missing = wanted.map((w) => w.pts).filter((p) => !achievable.has(p));
        if (missing.length) {
          if (dbTiers.length !== wanted.length) {
            review.push(`[${fac}] ${mu.name} — paliers: bdd ${JSON.stringify(dbTiers.map((t) => [t.atModels, t.pts]))} vs MFM ${JSON.stringify(wanted.map((w) => [w.models, w.pts]))} (nombre différent)`);
          } else if (!done.has(tgt.bsId + "|tiers")) {
            const patch = [];
            for (let i = 0; i < wanted.length; i++) {
              if (!saneDelta(wanted[i].pts - dbTiers[i].pts)) { patch.length = 0; review.push(`[${fac}] ${mu.name} — palier Δ implausible`); break; }
              if (dbTiers[i].pts !== wanted[i].pts) patch.push({ idx: dbTiers[i].idx, pts: wanted[i].pts });
            }
            if (patch.length) {
              if (WRITE) cat.editUnit(file, tgt.bsId, { tiers: patch });
              log.push(`[${fac}] ${mu.name} PALIERS ${JSON.stringify(dbTiers.map((t) => t.pts))} → ${JSON.stringify(wanted.map((w) => w.pts))}`);
              done.add(tgt.bsId + "|tiers"); nTier++;
            }
          }
        }
      }
      // ── prix par répétition ──
      if (costs.repeatDelta != null && costs.repeatAt != null) {
        const cur = readRepeat(node);
        if (!saneDelta(costs.repeatDelta) || costs.repeatDelta <= 0) {
          review.push(`[${fac}] ${mu.name} — répétition Δ${costs.repeatDelta} non écrite`);
        } else if (!cur) {
          if (!done.has(tgt.bsId + "|repeat")) {
            if (WRITE) { addRepeat(node, tgt.bsId, costs.repeatDelta, costs.repeatAt); cat.markDirty(file); }
            log.push(`[${fac}] ${mu.name} RÉPÉTITION (nouveau) Δ${costs.repeatDelta} à partir du ${costs.repeatAt}e`);
            done.add(tgt.bsId + "|repeat"); nRepNew++;
          }
        } else if (cur.delta !== costs.repeatDelta || cur.at !== costs.repeatAt) {
          if (!done.has(tgt.bsId + "|repeat")) {
            if (WRITE) {
              xml.setAttr(cur.mod, "value", String(costs.repeatDelta));
              xml.setAttr(cur.cond, "value", String(costs.repeatAt));
              cat.markDirty(file);
            }
            log.push(`[${fac}] ${mu.name} RÉPÉTITION Δ${cur.delta}@${cur.at} → Δ${costs.repeatDelta}@${costs.repeatAt}`);
            done.add(tgt.bsId + "|repeat"); nRep++;
          }
        }
      }
    }
  }
  // ── améliorations ──
  for (const det of (Array.isArray(mfm.detachments) ? mfm.detachments : [])) {
    for (const me of (det.enhancements || [])) {
      const em = map.enhancements && (map.enhancements[det.name + " / " + me.name] || map.enhancements[me.name]);
      if (!em) continue;
      let p; try { p = safePts(me.points, `enh ${me.name}`); } catch (e) { review.push(`[${fac}] enh ${me.name} — ${e.message}`); continue; }
      let ref; try { ref = nodeOf(em.bsId); } catch (e) { review.push(`[${fac}] enh ${me.name} — ${e.message}`); continue; }
      const cur = readBase(ref.node);
      if (cur == null) { review.push(`[${fac}] enh ${me.name} (${em.det}) — coût bdd absent, MFM=${p}`); continue; }
      if (cur === p || !saneDelta(p - cur)) { if (cur !== p) review.push(`[${fac}] enh ${me.name} — Δ${p - cur} implausible`); continue; }
      if (done.has(em.bsId + "|base")) continue;
      if (WRITE) cat.editUnit(ref.file, em.bsId, { costs: [{ typeId: COST_PTS, value: String(p) }] });
      log.push(`[${fac}] enh ${me.name} (${em.det}) ${cur} → ${p}`);
      done.add(em.bsId + "|base"); nEnh++;
    }
  }
}

for (const l of log) console.log("Δ " + l);
if (review.length) { console.log("\n── à vérifier à la main ──"); for (const r of review) console.log("? " + r); }
console.log(`\nbase:${nBase} paliers:${nTier} répétition:${nRep} répétition-nouvelle:${nRepNew} améliorations:${nEnh} · review:${review.length} · write=${WRITE}`);
if (WRITE) { const dirty = cat.dirtyFiles(); cat.save(); console.log("fichiers écrits: " + dirty.length + "\n  " + dirty.join("\n  ")); }
