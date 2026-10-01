#!/usr/bin/env node
// dp-fix.mjs — applique les écarts DP / Force Disposition / UNIQUE relevés par
// dp-audit.mjs, via editor/lib/catalog.js (round-trip XML fidèle).
// Usage : node dp-fix.mjs <repo> <dir-dump> [--write]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const REPO = process.argv[2], DUMP = process.argv[3], WRITE = process.argv.includes("--write");
const xml = require(path.join(REPO, "editor", "lib", "xml.js"));
const { Catalog } = require(path.join(REPO, "editor", "lib", "catalog.js"));
const c = new Catalog(REPO); c.load();

const DP_TYPE_ID = "0d99-4ee2-7b3c-1f5a";
const SLUG2CAT = {
  "black-templars": "36d3-36bc-68dd-40ac", "blood-angels": "4ef9-15ce-e3e6-36de",
  "deathwatch": "f89b-84e0-6e3b-f1e2", "dark-angels": "470a-6daa-9014-12df",
  "space-wolves": "94bb-3284-ee14-57a1",
};
const norm = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
const bag = (s) => norm(s).split(" ").sort().join(" ");
const FD_CANON = ["Take and Hold", "Priority Assets", "Purge the Foe", "Disruption", "Reconnaissance"];
const fdCanon = (s) => FD_CANON.find((x) => norm(x) === norm(s)) || null;

// index des détachements bdd (même critère que dp-audit : selectionEntry upgrade à coût DP)
const byName = new Map(), byBag = new Map();
for (const [file, doc] of c.docs) {
  xml.walk(doc.root, (n) => {
    if (n.tag !== "selectionEntry" || xml.getAttr(n, "type") !== "upgrade") return;
    const costs = (n.children || []).find((k) => k.tag === "costs");
    const dp = costs && (costs.children || []).find((k) => k.tag === "cost" && xml.getAttr(k, "name") === "DP");
    if (!dp) return;
    const nm = xml.getAttrDecoded(n, "name") || "";
    let fdChar = null;
    const profs = (n.children || []).find((k) => k.tag === "profiles");
    if (profs) for (const p of profs.children || []) {
      if (p.tag === "profile" && xml.getAttrDecoded(p, "name") === "Force Disposition")
        xml.walk(p, (k) => { if (k.tag === "characteristic" && !fdChar) fdChar = k; });
    }
    const over = {};
    const mods = (n.children || []).find((k) => k.tag === "modifiers");
    if (mods) for (const m of mods.children || []) {
      if (m.tag !== "modifier" || xml.getAttr(m, "type") !== "set" || xml.getAttr(m, "field") !== DP_TYPE_ID) continue;
      xml.walk(m, (k) => { if (k.tag === "condition" && xml.getAttr(k, "scope") === "primary-catalogue") over[xml.getAttr(k, "childId")] = parseInt(xml.getAttr(m, "value"), 10); });
    }
    const rec = { file, node: n, nm, dpNode: dp, fdChar, over };
    for (const [map, key] of [[byName, norm(nm)], [byBag, bag(nm)]]) {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(rec);
    }
  });
}
// catégories UNIQUE existantes, par fichier
function uniqueCatId(file, label) {          // label = « TERMINATOR »
  const want = "UNIQUE " + label.toUpperCase();
  let id = null;
  const doc = c.docs.get(file);
  xml.walk(doc.root, (n) => { if (!id && n.tag === "categoryEntry" && (xml.getAttrDecoded(n, "name") || "").toUpperCase() === want) id = xml.getAttr(n, "id"); });
  return id;
}
function ensureUniqueCat(file, label) {
  let id = uniqueCatId(file, label);
  if (id) return id;
  const doc = c.docs.get(file);
  const entries = xml.child(doc.root, "categoryEntries");
  if (!entries) throw new Error(`pas de <categoryEntries> dans ${file}`);
  id = c.newId();
  const ce = xml.elem("categoryEntry", { id, name: "UNIQUE " + label.toUpperCase(), hidden: "false" }, [
    xml.elem("comment", {}),
    xml.elem("constraints", {}, [xml.elem("constraint", {
      type: "max", value: "1", field: "selections", scope: "roster", shared: "true",
      includeChildSelections: "true", includeChildForces: "true", id: c.newId(),
    })]),
  ]);
  xml.setText(ce.children[0], `Exclusivite mutuelle des detachements UNIQUE: ${label.toUpperCase()} — contrainte native max=1 scope=roster; voir editor/UNIQUE_DETACHMENT_APP_PROMPT.md`);
  entries.children.push(ce);
  entries.selfClose = false;
  return id;
}

const log = [], skipped = [], seen = new Set();
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8"));
  for (const det of d.detachments || []) {
    const cands = byName.get(norm(det.name)) || byBag.get(bag(det.name));
    if (!cands) continue;
    for (const b of cands) {
      // DP
      if (det.dp != null) {
        const curDp = parseInt(xml.getAttr(b.dpNode, "value"), 10);
        const eff = (SLUG2CAT[d.slug] && b.over[SLUG2CAT[d.slug]] != null) ? b.over[SLUG2CAT[d.slug]] : curDp;
        if (eff !== det.dp) {
          const k = b.file + "|" + b.nm + "|dp";
          if (Object.keys(b.over).length) skipped.push(`[${d.slug}] ${b.nm} — DP ${eff}→${det.dp} mais override(s) par chapitre présent(s), correction manuelle`);
          else if (!seen.has(k)) {
            if (WRITE) { xml.setAttr(b.dpNode, "value", String(det.dp)); c.markDirty(b.file); }
            log.push(`[${b.file}] ${b.nm} : DP ${curDp} → ${det.dp}`); seen.add(k);
          }
        }
      }
      // Force Disposition
      const fdm = (det.force_disposition || "").trim();
      if (fdm) {
        const want = fdCanon(fdm);
        if (!want) skipped.push(`[${d.slug}] ${b.nm} — FD MFM « ${fdm} » hors vocabulaire connu`);
        else if (!b.fdChar) skipped.push(`[${d.slug}] ${b.nm} — profil Force Disposition absent, MFM « ${want} »`);
        else {
          const cur = xml.getText(b.fdChar).trim();
          const k = b.file + "|" + b.nm + "|fd";
          if (norm(cur) !== norm(want) && !seen.has(k)) {
            if (WRITE) { xml.setText(b.fdChar, want); c.markDirty(b.file); }
            log.push(`[${b.file}] ${b.nm} : FD « ${cur} » → « ${want} »`); seen.add(k);
          }
        }
      }
      // UNIQUE
      let uWant = String(det.unique || "").toUpperCase().replace(/\s+/g, " ").trim();
      if (/REMOVED/.test(uWant)) uWant = "";
      uWant = uWant.replace(/^UNIQUE:?\s*/, "");
      const links = xml.child(b.node, "categoryLinks");
      const cur = links ? links.children.filter((l) => /^UNIQUE\b/i.test(xml.getAttrDecoded(l, "name") || "")) : [];
      const curLabels = cur.map((l) => (xml.getAttrDecoded(l, "name") || "").toUpperCase().replace(/^UNIQUE\s*/, "").trim());
      const k = b.file + "|" + b.nm + "|uq";
      if (norm(curLabels.join(" ")) !== norm(uWant) && !seen.has(k)) {
        if (!uWant) {
          if (WRITE) { links.children = links.children.filter((l) => !/^UNIQUE\b/i.test(xml.getAttrDecoded(l, "name") || "")); c.markDirty(b.file); }
          log.push(`[${b.file}] ${b.nm} : UNIQUE « ${curLabels.join(" + ")} » retiré`);
        } else if (curLabels.length) {
          skipped.push(`[${d.slug}] ${b.nm} — UNIQUE « ${curLabels.join(" + ")} » → « ${uWant} » (remplacement, à vérifier)`);
          seen.add(k); continue;
        } else {
          if (WRITE) {
            const tid = ensureUniqueCat(b.file, uWant);
            const container = links || (() => { const e = xml.elem("categoryLinks", {}); e.selfClose = false; b.node.children.push(e); return e; })();
            container.selfClose = false;
            container.children.push(xml.elem("categoryLink", { id: c.newId(), name: "UNIQUE " + uWant, hidden: "false", targetId: tid, primary: "false" }));
            c.markDirty(b.file);
          }
          log.push(`[${b.file}] ${b.nm} : UNIQUE « ${uWant} » ajouté`);
        }
        seen.add(k);
      }
    }
  }
}
for (const l of log) console.log("Δ " + l);
if (skipped.length) { console.log("\n── manuel ──"); for (const s of [...new Set(skipped)]) console.log("? " + s); }
console.log(`\ncorrections: ${log.length} · manuel: ${new Set(skipped).size} · write=${WRITE}`);
if (WRITE) { const dirty = c.dirtyFiles(); c.save(); console.log("fichiers écrits: " + dirty.join(", ")); }
