#!/usr/bin/env node
// montre.mjs — plan COMPACT d'une entrée (fiche, détachement, catégorie, groupe…)
// au lieu du XML brut : coûts, catégories, contraintes, modifiers avec leurs
// conditions (ids résolus en noms), règles/profils tronqués, commentaires-marqueurs.
// Un sed -n sur une fiche coûte 5 à 20× plus de contexte que ce plan.
//
//   node editor/bin/montre.mjs 69e5-13c7-06bf-d454             # par id
//   node editor/bin/montre.mjs "Tallyband Summoners"           # par nom exact (insensible à la casse)
//   node editor/bin/montre.mjs "Great Unclean One" --file "Death Guard" --depth 2
//   options : --full (textes complets) · --depth N (défaut 6) · --xml (XML sérialisé brut)
//             --no-profiles (masque profils/armes) · --all (liste tous les homonymes)
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js"));
const xml = require(join(ROOT, "editor", "lib", "xml.js"));

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const key = args.find((a, i) => !a.startsWith("--") && !["--file", "--depth"].includes(args[i - 1]));
if (!key) { console.log("usage: montre.mjs <id|nom> [--file x] [--depth N] [--full] [--xml] [--no-profiles] [--all]"); process.exit(2); }
const FULL = has("--full"), DEPTH = Number(opt("--depth", 6)), fileF = opt("--file");

const c = new Catalog(ROOT).load();
const A = (n, k) => xml.getAttrDecoded(n, k) || "";
const nameOf = (id) => { const e = c.byId.get(id); if (!e) return ""; if (e.node.tag === "constraint") return `contrainte ${A(e.node, "type")} ${A(e.node, "value")}`; return A(e.node, "name"); };
const cut = (s, n) => (FULL || s.length <= n ? s : s.slice(0, n - 1) + "…");
const one = (s) => String(s || "").replace(/\s+/g, " ").trim();

// ── résolution de la cible ────────────────────────────────────────────────
let hits = [];
if (/^[0-9a-f]{1,4}(-[0-9a-f]{1,4}){3}$/i.test(key)) { const e = c.byId.get(key); if (e) hits.push({ ...e }); }
else {
  const k = key.toLowerCase();
  for (const [file, doc] of c.docs) {
    if (fileF && !file.toLowerCase().includes(fileF.toLowerCase())) continue;
    xml.walk(doc.root, (n) => { if (A(n, "name").toLowerCase() === k && !["categoryLink", "infoLink", "characteristic", "cost"].includes(n.tag)) hits.push({ node: n, file }); });
  }
  // une définition plutôt que ses liens, s'il y en a
  const defs = hits.filter((h) => h.node.tag !== "entryLink");
  if (defs.length) hits = defs;
  // homonymes fiche / profil / catégorie : la sélection l'emporte
  const ses = hits.filter((h) => /^selectionEntry/.test(h.node.tag));
  if (ses.length === 1) hits = ses;
}
if (!hits.length) { console.log(`introuvable : ${key} (essayer editor/bin/trouve.mjs)`); process.exit(1); }
if (hits.length > 1 && !has("--all")) {
  console.log(`${hits.length} homonymes — préciser par id (ou --all) :`);
  for (const h of hits.slice(0, 15)) console.log(`  ${h.file}  <${h.node.tag} ${A(h.node, "type")}> id=${A(h.node, "id")}`);
  process.exit(0);
}

const lineOf = (file, id) => { const t = readFileSync(join(ROOT, file), "utf8"); const i = t.indexOf(`id="${id}"`); return i < 0 ? "?" : t.slice(0, i).split("\n").length; };

// ── rendu ────────────────────────────────────────────────────────────────
const CONTAINERS = new Set(["selectionEntries", "selectionEntryGroups", "entryLinks", "rules", "profiles", "infoLinks", "constraints", "modifiers", "modifierGroups", "conditions", "conditionGroups", "repeats", "characteristics", "associations", "sharedSelectionEntries", "sharedSelectionEntryGroups", "sharedRules", "sharedProfiles", "categoryEntries", "forceEntries"]);
const out = [];
const P = (d, s) => out.push("  ".repeat(d) + s);
const cond = (n) => {
  const cid = A(n, "childId"), nm = cid && !["model", "unit", "upgrade", "any"].includes(cid) ? nameOf(cid) : "";
  return `${A(n, "type")} ${A(n, "value")} ${A(n, "field") === "selections" ? "sél." : nameOf(A(n, "field")) || A(n, "field")} @${A(n, "scope")} ${cid}${nm ? ` «${nm}»` : ""}${A(n, "includeChildSelections") === "true" ? "" : " (direct)"}`;
};
function render(n, d) {
  if (d > DEPTH) return;
  const t = n.tag;
  if (CONTAINERS.has(t)) { for (const k of n.children || []) render(k, d); return; }
  const kids = n.children || [];
  switch (t) {
    case "comment": P(d, "# " + cut(xml.decodeEntities(xml.getText(n) || "").replace(/\n/g, " ⏎ "), 300)); return;
    case "costs": { const cs = kids.filter((k) => Number(A(k, "value"))).map((k) => `${A(k, "name")}=${A(k, "value")}`); if (cs.length) P(d, "coûts : " + cs.join(", ")); return; }
    case "categoryLinks": { if (kids.length) P(d, "catégories : " + kids.map((k) => A(k, "name") + (A(k, "primary") === "true" ? "*" : "")).join(", ")); return; }
    case "constraint": P(d, `contrainte ${A(n, "type")} ${A(n, "value")} ${A(n, "field") === "selections" ? "sél." : nameOf(A(n, "field")) || A(n, "field")} @${A(n, "scope")} id=${A(n, "id")}`); return;
    case "condition": P(d, "si " + cond(n)); return;
    case "conditionGroup": P(d, `groupe ${A(n, "type")} :`); for (const k of kids) render(k, d + 1); return;
    case "repeat": P(d, `répète ×${A(n, "value")} par ${cond(n)}`); return;
    case "modifier": {
      const f = A(n, "field"), fn = nameOf(f);
      P(d, `modifier ${A(n, "type")} ${f}${fn ? `(${fn})` : ""} = ${cut(one(A(n, "value")), 80)}`);
      for (const k of kids) render(k, d + 1); return;
    }
    case "rule": {
      P(d, `règle « ${A(n, "name")} » id=${A(n, "id")}${A(n, "hidden") === "true" ? " (hidden)" : ""}`);
      for (const k of kids) { if (k.tag === "description") P(d + 1, cut(one(xml.decodeEntities(xml.getText(k) || "")), 160)); else render(k, d + 1); }
      return;
    }
    case "profile": {
      if (has("--no-profiles")) return;
      const ch = [];
      xml.walk(n, (k) => { if (k.tag === "characteristic") ch.push(`${A(k, "name")}=${one(xml.decodeEntities(xml.getText(k) || ""))}`); });
      P(d, `profil[${A(n, "typeName")}] « ${A(n, "name")} » ${cut(ch.join(" | "), 200)}`);
      for (const k of kids.filter((k) => k.tag === "modifiers" || k.tag === "comment")) render(k, d + 1);
      return;
    }
    case "infoLink": P(d, `infoLink[${A(n, "type")}] « ${A(n, "name")} » → ${A(n, "targetId")}`); return;
    case "association": P(d, `association ${A(n, "scope")} ${A(n, "childId")} ${nameOf(A(n, "childId"))}`); return;
    default: {
      const tid = A(n, "targetId"), def = A(n, "defaultSelectionEntryId");
      const head = `${t}${A(n, "type") ? "[" + A(n, "type") + "]" : ""} « ${A(n, "name")} » id=${A(n, "id")}`
        + (tid ? ` → ${tid}${nameOf(tid) && nameOf(tid) !== A(n, "name") ? ` «${nameOf(tid)}»` : ""}` : "")
        + (A(n, "hidden") === "true" ? " (hidden)" : "")
        + (def && def !== "none" ? ` défaut=${def} «${nameOf(def)}»` : "");
      P(d, head);
      // ordre : marqueurs, coûts, catégories, contraintes, modifiers, puis le reste
      const order = ["comment", "costs", "categoryLinks", "constraints", "modifiers", "modifierGroups", "rules", "infoLinks", "profiles", "associations", "selectionEntryGroups", "selectionEntries", "entryLinks"];
      const sorted = [...kids].sort((a, b) => (order.indexOf(a.tag) + 1 || 99) - (order.indexOf(b.tag) + 1 || 99));
      for (const k of sorted) render(k, d + 1);
    }
  }
}

for (const h of hits) {
  const id = A(h.node, "id");
  console.log(`${h.file}:${lineOf(h.file, id)}`);
  if (has("--xml")) { console.log(xml.serialize({ decl: "", root: h.node }).trim()); continue; }
  render(h.node, 0);
  for (const l of out.splice(0)) console.log(l);
}
