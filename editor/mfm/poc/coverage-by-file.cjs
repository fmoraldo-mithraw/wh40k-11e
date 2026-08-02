#!/usr/bin/env node
// mfm-poc.cjs — Proof of concept: matrice nom↔id + diff de points MFM.
// Charge le dump MFM (JSON par faction) + la bdd .cat, construit la matrice de
// correspondance (nom MFM normalisé → bsId datasheet), et calcule les DELTAS de
// points (base + paliers) sans rien écrire (dry-run). Sort un rapport de
// couverture par faction : matchés / non-mappés MFM / datasheets .cat orphelines.
const fs = require("fs");
const path = require("path");
const { Catalog } = require("/home/user/wh40k-11e/editor/lib/catalog.js");
const xml = require("/home/user/wh40k-11e/editor/lib/xml.js");

const MFM_DIR = "/tmp/claude-0/-home-user/e6808ee9-9a31-5363-bc21-7bf61aad50fb/scratchpad/mfm-drop/en/json";
const CAT_DIR = "/home/user/wh40k-11e";

// ── normalisation de nom : la clef commune bdd ↔ MFM ────────────────────────
// Majuscules, sans accents, apostrophes/tirets unifiés, « w/ »→« with »,
// ponctuation et espaces réduits. La même des deux côtés = clef de jointure.
function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // diacritiques
    .replace(/[’‘`]/g, "'").replace(/[–—]/g, "-")
    .replace(/\bw\/\s*/gi, "with ")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ").trim();
}

// MFM faction slug → nom de fichier .cat (les cas non triviaux ; sinon heuristique).
const SLUG_TO_CAT = {
  "orks": "Orks.cat", "necrons": "Necrons.cat", "tyranids": "Tyranids.cat",
  "aeldari": "Aeldari - Craftworlds.cat", "drukhari": "Aeldari - Drukhari.cat",
  "space-marines": "Imperium - Space Marines.cat", "adeptus-mechanicus": "Imperium - Adeptus Mechanicus.cat",
  "adepta-sororitas": "Imperium - Adepta Sororitas.cat", "adeptus-custodes": "Imperium - Adeptus Custodes.cat",
  "astra-militarum": "Imperium - Astra Militarum.cat", "grey-knights": "Imperium - Grey Knights.cat",
  "imperial-agents": "Imperium - Agents of the Imperium.cat", "imperial-knights": "Imperium - Imperial Knights.cat",
  "blood-angels": "Imperium - Blood Angels.cat", "dark-angels": "Imperium - Dark Angels.cat",
  "black-templars": "Imperium - Black Templars.cat", "deathwatch": "Imperium - Deathwatch.cat",
  "space-wolves": "Imperium - Space Wolves.cat",
  "chaos-space-marines": "Chaos - Chaos Space Marines.cat", "death-guard": "Chaos - Death Guard.cat",
  "thousand-sons": "Chaos - Thousand Sons.cat", "world-eaters": "Chaos - World Eaters.cat",
  "chaos-daemons": "Chaos - Chaos Daemons.cat", "chaos-knights": "Chaos - Chaos Knights.cat",
  "emperors-children": "Chaos - Emperor's Children.cat",
  "genestealer-cults": "Genestealer Cults.cat", "leagues-of-votann": "Leagues of Votann.cat",
  "tau-empire": "T'au Empire.cat",
};

// ── lecture bdd : datasheets d'un fichier .cat (id, nom, pts de base, paliers) ─
function catUnits(cat, file) {
  const doc = cat.docs.get(file);
  if (!doc) return [];
  const out = [];
  xml.walk(doc.root, (n) => {
    if (n.tag !== "selectionEntry") return;
    const t = xml.getAttr(n, "type");
    if (t !== "unit" && t !== "model") return;
    // pts propres à l'entrée (enfant direct <costs>), pas un coût imbriqué.
    const costs = xml.child(n, "costs");
    let pts = null;
    if (costs) for (const c of costs.children) if (c.tag === "cost" && xml.getAttr(c, "name") === "pts") pts = Number(xml.getAttr(c, "value"));
    // paliers de taille : modifiers set sur pts conditionnés par un décompte.
    const tiers = [];
    xml.walk(n, (m) => {
      if (m.tag !== "modifier" || xml.getAttr(m, "type") !== "set") return;
      if (xml.getAttr(m, "field") !== "51b2-306e-1021-d207") return;
      let at = null, cmp = null;
      xml.walk(m, (c) => { if (c.tag === "condition" && xml.getAttr(c, "field") === "selections") { at = Number(xml.getAttr(c, "value")); cmp = xml.getAttr(c, "type"); } });
      tiers.push({ at, cmp, pts: Number(xml.getAttr(m, "value")) });
    });
    // ne garder que les entrées « datasheet » : celles qui ont un profil Unit
    // (statline) OU un pts de base non nul — écarte les variantes de modèle.
    const hasUnitProfile = (() => { let f = false; xml.walk(n, (p) => { if (p.tag === "profile" && xml.getAttr(p, "typeName") === "Unit") f = true; }); return f; })();
    if (!hasUnitProfile && pts == null) return;
    out.push({ id: xml.getAttr(n, "id"), name: xml.getAttrDecoded(n, "name"), pts, tiers, hasUnitProfile });
  });
  return out;
}

// ── MFM : coût de base + paliers de taille d'une unité ──────────────────────
// On ne traite ici que le cas « standard » : profils tier "YOUR UNIT COSTS"
// (ou "1ST..."/"4TH+" pour la répétition) avec size "N model(s)". Les cas à
// composition (Gretchin "1 Runtherd, 20 Gretchin") sont signalés à part.
function mfmCosts(u) {
  const std = u.profiles.filter((p) => /YOUR .*UNIT|YOUR UNIT/.test(p.tier || "") || p.tier == null);
  const sizeN = (s) => { const m = String(s || "").match(/^(\d+)\s+model/i); return m ? Number(m[1]) : null; };
  const compPriced = u.profiles.some((p) => p.size && !/^\d+\s+model/i.test(p.size) && !/^per\b/i.test(p.size));
  const repeat = u.profiles.some((p) => /\d+(ST|ND|RD|TH)/.test(p.tier || ""));
  // base = plus petite taille du 1er palier de répétition (ou l'unique).
  const base = u.profiles.find((p) => sizeN(p.size) != null) || u.profiles[0];
  return { basePts: base ? base.points : null, baseSize: base ? sizeN(base.size) : null, compPriced, repeat, profiles: u.profiles };
}

// ── run ─────────────────────────────────────────────────────────────────────
const cat = new Catalog(CAT_DIR);
cat.load();

const slugs = fs.readdirSync(MFM_DIR).filter((f) => f.endsWith(".json") && f !== "all.json").map((f) => f.replace(/\.json$/, ""));
let tot = { mfm: 0, matched: 0, changedApplicable: 0, unmapped: 0, orphanCat: 0, compPriced: 0, deltas: 0 };
const report = [];

for (const slug of slugs) {
  const file = SLUG_TO_CAT[slug];
  if (!file || !cat.docs.get(file)) { report.push(`SKIP ${slug} (pas de .cat mappé)`); continue; }
  const mfm = JSON.parse(fs.readFileSync(path.join(MFM_DIR, slug + ".json"), "utf8"));
  const units = catUnits(cat, file);
  const byNorm = new Map();
  for (const u of units) { const k = norm(u.name); if (!byNorm.has(k)) byNorm.set(k, u); }

  const unmapped = [], deltas = [], compP = [];
  const matchedCatIds = new Set();
  for (const mu of mfm.units) {
    tot.mfm++;
    const k = norm(mu.name);
    const hit = byNorm.get(k);
    if (!hit) { unmapped.push(mu.name); tot.unmapped++; continue; }
    tot.matched++; matchedCatIds.add(hit.id);
    const mc = mfmCosts(mu);
    if (mc.compPriced) { compP.push(mu.name); tot.compPriced++; }
    // diff base cost (cas simple, non-repeat, non-comp)
    if (!mc.repeat && !mc.compPriced && mc.basePts != null && hit.pts != null && mc.basePts !== hit.pts) {
      deltas.push(`${mu.name}: cat ${hit.pts} → MFM ${mc.basePts}`);
      tot.deltas++;
    }
    if (mu.changed) tot.changedApplicable++;
  }
  const orphans = units.filter((u) => u.hasUnitProfile && !matchedCatIds.has(u.id)).map((u) => u.name);
  tot.orphanCat += orphans.length;
  report.push(
    `\n=== ${mfm.faction} (${slug}) ===\n` +
    `  MFM units: ${mfm.units.length} | matchés: ${mfm.units.length - unmapped.length} | non-mappés: ${unmapped.length}\n` +
    (unmapped.length ? `  NON-MAPPÉS MFM: ${unmapped.slice(0, 12).join(", ")}${unmapped.length > 12 ? "…" : ""}\n` : "") +
    (compP.length ? `  À COMPOSITION (traitement spécial): ${compP.join(", ")}\n` : "") +
    (deltas.length ? `  DELTAS base pts (${deltas.length}): ${deltas.join(" | ")}\n` : "  (aucun delta de base à appliquer)\n") +
    (orphans.length ? `  .cat sans équivalent MFM (${orphans.length}): ${orphans.slice(0, 10).join(", ")}${orphans.length > 10 ? "…" : ""}\n` : "")
  );
}

console.log(report.join(""));
console.log("\n════ TOTAUX ════");
console.log(`MFM units: ${tot.mfm} | matchés: ${tot.matched} (${(100 * tot.matched / tot.mfm).toFixed(1)}%) | non-mappés: ${tot.unmapped}`);
console.log(`À composition (spécial): ${tot.compPriced} | deltas base pts détectés: ${tot.deltas} | .cat orphelines: ${tot.orphanCat}`);
