// dp-audit.mjs — audit DP + Force Disposition des détachements vs le dump MFM.
//
// Comble le trou constaté à l'intégration v1.3 : apply.mjs ne compare que les
// POINTS (unités/améliorations) alors que le dump porte aussi, par détachement,
// `dp` et `force_disposition` (avec drapeaux `changed`) — le passage de Lions
// of the Emperor à 3 DP était passé inaperçu.
//
// Usage :  node editor/mfm/dp-audit.mjs [dir-dump]     (défaut: editor/mfm/dump/en)
// Sortie : les écarts réels (« ✗ »), les détachements MFM non appariés (« ? »),
// et les écarts Orks ignorés tant que le MFM est ≤ v1.3 (codex plus récent).
// Lecture seule — les corrections se font via editor/lib/catalog.js.
//
// Évalue les overrides de DP par chapitre (modifier `set` sur le coût DP
// conditionné `primary-catalogue`, à la MARINE_CHAPTER_COST) avant de signaler.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DUMP = process.argv[2] || path.join(HERE, "dump/en");
const DP_TYPE_ID = "0d99-4ee2-7b3c-1f5a";
// slug MFM → id de catalogue (pour évaluer les overrides primary-catalogue)
const SLUG2CAT = {
  "black-templars": "36d3-36bc-68dd-40ac",
  "blood-angels": "4ef9-15ce-e3e6-36de",
  "deathwatch": "f89b-84e0-6e3b-f1e2",
  "dark-angels": "470a-6daa-9014-12df",
  "space-wolves": "94bb-3284-ee14-57a1",
};

const norm = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
// Clef tolérante à l'ordre des mots : « ORDO XENOS, ALIEN HUNTERS » ↔
// « Alien Hunters (Ordo Xenos) » partagent le même sac de mots.
const bag = (s) => norm(s).split(" ").sort().join(" ");

const c = new Catalog(ROOT);
await c.load();

// bdd : toute selectionEntry upgrade portant un coût DP direct = un détachement.
const byName = new Map(), byBag = new Map();
for (const [file, doc] of c.docs) {
  xml.walk(doc.root, (n) => {
    if (n.tag !== "selectionEntry" || xml.getAttr(n, "type") !== "upgrade") return;
    const costs = (n.children || []).find((k) => k.tag === "costs");
    const dp = costs && (costs.children || []).find((k) => k.tag === "cost" && xml.getAttr(k, "name") === "DP");
    if (!dp) return;
    const nm = xml.getAttrDecoded(n, "name") || "";
    let fd = null;
    const profs = (n.children || []).find((k) => k.tag === "profiles");
    if (profs) for (const p of profs.children || []) {
      if (p.tag === "profile" && xml.getAttrDecoded(p, "name") === "Force Disposition")
        xml.walk(p, (k) => { if (k.tag === "characteristic" && !fd) fd = xml.getText(k).trim(); });
    }
    const over = {};
    const mods = (n.children || []).find((k) => k.tag === "modifiers");
    if (mods) for (const m of mods.children || []) {
      if (m.tag !== "modifier" || xml.getAttr(m, "type") !== "set" || xml.getAttr(m, "field") !== DP_TYPE_ID) continue;
      xml.walk(m, (k) => {
        if (k.tag === "condition" && xml.getAttr(k, "scope") === "primary-catalogue")
          over[xml.getAttr(k, "childId")] = parseInt(xml.getAttr(m, "value"), 10);
      });
    }
    const rec = { file, nm, dp: parseInt(xml.getAttr(dp, "value"), 10), fd, over };
    (byName.get(norm(nm)) || byName.set(norm(nm), []).get(norm(nm))).push(rec);
    (byBag.get(bag(nm)) || byBag.set(bag(nm), []).get(bag(nm))).push(rec);
  });
}

const issues = [], orksSkipped = [], notFound = [];
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8"));
  const vnum = parseFloat(String(d.version || "").replace(/^v/i, "")) || 0;
  for (const det of d.detachments || []) {
    const cands = byName.get(norm(det.name)) || byBag.get(bag(det.name));
    if (!cands) { notFound.push(`${d.slug} :: ${det.name}`); continue; }
    for (const b of cands) {
      const eff = (SLUG2CAT[d.slug] && b.over[SLUG2CAT[d.slug]] != null) ? b.over[SLUG2CAT[d.slug]] : b.dp;
      const bad = [];
      if (det.dp != null && eff !== det.dp) bad.push(`DP ${eff}→${det.dp}`);
      const fdm = (det.force_disposition || "").trim();
      if (fdm && b.fd && norm(b.fd) !== norm(fdm)) bad.push(`FD «${b.fd}»→«${fdm}»`);
      if (fdm && !b.fd) bad.push(`FD ABSENT→«${fdm}»`);
      if (!bad.length) continue;
      const line = `[${d.slug}] ${b.nm} (${b.file}) : ${bad.join("; ")}`;
      // Exception Orks : le codex en base est plus récent qu'un MFM ≤ v1.3.
      if (d.slug === "orks" && vnum <= 1.3) orksSkipped.push(line);
      else issues.push(line);
    }
  }
}

if (notFound.length) {
  console.log(`? détachements MFM non appariés (${notFound.length}) — nouveaux dets ou renommages à examiner :`);
  for (const x of notFound) console.log("  ?", x);
}
if (orksSkipped.length) {
  console.log(`~ écarts Orks ignorés (MFM ≤ v1.3, codex plus récent) : ${orksSkipped.length}`);
}
if (issues.length) {
  console.log(`✗ ÉCARTS DP/FD (${issues.length}) — à corriger via editor/lib/catalog.js :`);
  for (const x of [...new Set(issues)]) console.log("  ✗", x);
  process.exitCode = 1;
} else {
  console.log("✓ DP et Force Dispositions alignés sur le MFM.");
}
