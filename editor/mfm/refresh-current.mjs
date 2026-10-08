#!/usr/bin/env node
// refresh-current.mjs — REPLI quand le parser de l'app (cogitator-bellicum)
// est indisponible : relit les coûts ACTUELS de la bdd (editor/lib/catalog.js,
// même lecture que readCurrentCosts() de build-map) et rafraîchit le champ
// `current` des matrices déjà construites.
//
// ⚠ Ce n'est PAS un substitut à build-map.mjs : l'appariement nom MFM ↔
// datasheet (clôture d'import) n'est PAS recalculé. Les cibles disparues de la
// bdd sont signalées « GONE » mais restent dans la matrice — une matrice qui en
// contient DOIT être régénérée par build-map avant tout diff. À n'utiliser que
// pour dé-périmer le cache de coûts de matrices dont l'appariement est intact.
//
// Le coût de base EFFECTIF (champ `basePts`) vient normalement du parser ; ici
// on prend le coût du nœud quand il existe et n'est pas 0, sinon on conserve la
// valeur précédente (base 0/absente = coût porté par un modèle imbriqué).
//
// Usage : node refresh-current.mjs <repo> [--write]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const REPO = process.argv[2];
const WRITE = process.argv.includes("--write");
const MAP_DIR = path.join(REPO, "editor", "mfm", "map");
const COST_PTS = "51b2-306e-1021-d207";
const xml = require(path.join(REPO, "editor", "lib", "xml.js"));
const { Catalog } = require(path.join(REPO, "editor", "lib", "catalog.js"));
const cat = new Catalog(REPO); cat.load();

function ptsInt(raw, ctx) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 3000) throw new Error(`coût non valide (${JSON.stringify(raw)}) sur ${ctx}`);
  return n;
}
function readCurrentCosts(bsId) {
  const ref = cat.byId.get(bsId);
  if (!ref) throw new Error(`bsId ${bsId} introuvable`);
  const node = ref.node;
  let basePts = null;
  const costs = xml.child(node, "costs");
  if (costs) for (const cc of costs.children) if (cc.tag === "cost" && xml.getAttr(cc, "name") === "pts") basePts = ptsInt(xml.getAttr(cc, "value"), `base ${bsId}`);
  const tiers = []; let chapterCost = false;
  xml.walk(node, (m) => {
    if (m.tag !== "modifier" || xml.getAttr(m, "field") !== COST_PTS) return;
    let atModels = null, hasCount = false, hasInstance = false;
    xml.walk(m, (c2) => {
      if (c2.tag !== "condition") return;
      const cf = xml.getAttr(c2, "field"), ct = xml.getAttr(c2, "type"), sc = xml.getAttr(c2, "scope");
      if (cf === "selections" && ["atLeast", "greaterThan", "equalTo"].includes(ct)) { hasCount = true; atModels = Number(xml.getAttr(c2, "value")); }
      if (ct === "instanceOf" || ct === "notInstanceOf" || sc === "primary-catalogue") hasInstance = true;
    });
    if (hasInstance) chapterCost = true;
    if (xml.getAttr(m, "type") === "set" && hasCount && !hasInstance) {
      const pts = ptsInt(xml.getAttr(m, "value"), `palier ${bsId}`);
      if (pts != null) tiers.push({ atModels, pts });
    }
  });
  let repeat = null;
  xml.walk(node, (mod) => {
    if (mod.tag !== "modifier" || xml.getAttr(mod, "type") !== "increment") return;
    if (xml.getAttr(mod, "field") !== COST_PTS) return;
    xml.walk(mod, (c2) => {
      if (c2.tag !== "condition" || xml.getAttr(c2, "type") !== "atLeast" || xml.getAttr(c2, "scope") !== "roster") return;
      const k = Number(xml.getAttr(c2, "value")) || 0;
      if (k >= 2) repeat = { threshold: k - 1, delta: Number(xml.getAttr(mod, "value")) || 0 };
    });
  });
  const u = cat.getUnit(ref.file, bsId);
  const options = [];
  for (const g of (u.options || [])) for (const c of (g.choices || [])) options.push({
    group: g.name, owner: g.ownerName || null, id: c.id, name: c.name, kind: c.kind,
    targetId: c.targetId || null, pts: ptsInt(c.pts, `option ${c.name} (${bsId})`) ?? 0,
  });
  return { file: ref.file, basePts, tiers, repeat, chapterCost, options };
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let nDiff = 0, nGone = 0, nTot = 0;
for (const f of fs.readdirSync(MAP_DIR).filter(f => f.endsWith(".json"))) {
  const slug = f.replace(/\.json$/, "");
  const m = JSON.parse(fs.readFileSync(path.join(MAP_DIR, f), "utf8"));
  let changed = false;
  for (const [name, entry] of Object.entries(m.matched || {})) {
    for (const t of entry.targets) {
      nTot++;
      let cc;
      try { cc = readCurrentCosts(t.bsId); }
      catch (e) { console.log(`GONE  ${slug} :: ${name} (${t.bsId}) — ${e.message}`); nGone++; continue; }
      const cur = t.current;
      const newTierPrices = [...new Set([...cc.tiers.map(x => x.pts), ...(cur.tierPrices || []).filter(p => !(cur.tiers||[]).some(x=>x.pts===p))])].sort((a,b)=>a-b);
      const diffs = [];
      if (cc.basePts != null && cur.baseOnNode !== cc.basePts) diffs.push(`baseOnNode ${cur.baseOnNode}→${cc.basePts}`);
      if (cc.basePts == null && cur.baseOnNode != null) diffs.push(`baseOnNode ${cur.baseOnNode}→null`);
      if (!eq(cur.tiers, cc.tiers)) diffs.push(`tiers ${JSON.stringify(cur.tiers)}→${JSON.stringify(cc.tiers)}`);
      if (!eq(cur.repeat, cc.repeat)) diffs.push(`repeat ${JSON.stringify(cur.repeat)}→${JSON.stringify(cc.repeat)}`);
      if (cur.chapterCost !== cc.chapterCost) diffs.push(`chapterCost ${cur.chapterCost}→${cc.chapterCost}`);
      if (!eq(t.weaponOptions, cc.options)) diffs.push(`weaponOptions(${(t.weaponOptions||[]).length}→${cc.options.length})`);
      if (diffs.length) { nDiff++; console.log(`DIFF  ${slug} :: ${name} (${t.bsId}) — ${diffs.join(" | ")}`); }
      if (WRITE) {
        const effBase = (cc.basePts != null && cc.basePts !== 0) ? cc.basePts : cur.basePts;  // base 0/absente sur le nœud = coût porté ailleurs : on garde la valeur effective
        t.file = cc.file;
        t.current = { basePts: effBase, baseOnNode: cc.basePts, tiers: cc.tiers, tierPrices: newTierPrices, repeat: cc.repeat, chapterCost: cc.chapterCost };
        t.weaponOptions = cc.options;
        changed = true;
      }
    }
  }
  // améliorations
  for (const [k, e] of Object.entries(m.enhancements || {})) {
    const ref = cat.byId.get(e.bsId);
    if (!ref) { console.log(`GONE-ENH ${slug} :: ${k} (${e.bsId})`); nGone++; continue; }
    let pts = null;
    const costs = xml.child(ref.node, "costs");
    if (costs) for (const cc of costs.children) if (cc.tag === "cost" && xml.getAttr(cc, "name") === "pts") pts = ptsInt(xml.getAttr(cc, "value"), `enh ${e.bsId}`);
    if (pts !== e.currentPts) { console.log(`DIFF-ENH ${slug} :: ${k} ${e.currentPts}→${pts}`); nDiff++; if (WRITE) { e.currentPts = pts; changed = true; } }
  }
  if (WRITE && changed) fs.writeFileSync(path.join(MAP_DIR, f), JSON.stringify(m, null, 1) + "\n");
}
console.log(`\n=== cibles: ${nTot} | diffs: ${nDiff} | disparues: ${nGone} | write=${WRITE}`);
