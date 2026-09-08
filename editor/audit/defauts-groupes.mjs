// defauts-groupes.mjs — audit des defaultSelectionEntryId CASSÉS.
//
// Un selectionEntryGroup peut présélectionner un enfant via
// defaultSelectionEntryId (id d'un selectionEntry / entryLink direct — ou
// targetId du lien — ou « none »). Quand l'entrée visée a été déplacée ou
// recréée, l'id ne correspond plus à rien : BattleScribe ne présélectionne
// rien et une appli consommatrice retombe sur le premier choix (symptôme vu :
// Commander T'au avec « Battlesuit support system » au lieu du Burst cannon ;
// 77 groupes concernés lors du premier passage).
//
// Usage : node editor/audit/defauts-groupes.mjs   → 0 = aucun défaut cassé,
//         1 = liste des groupes à corriger (via editor/lib/catalog.js).
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const c = new Catalog(ROOT); await c.load();
const kids = (n, t) => (n.children || []).filter((k) => k.tag === t);
const bad = [];
for (const [file, doc] of c.docs) {
  xml.walk(doc.root, (g, parent, ancestors) => {
    if (g.tag !== "selectionEntryGroup") return;
    const d = xml.getAttr(g, "defaultSelectionEntryId");
    if (!d || d === "none") return;
    const ids = new Set();
    for (const h of ["selectionEntries", "entryLinks", "selectionEntryGroups"]) for (const holder of kids(g, h)) for (const k of holder.children || []) {
      if (k.tag !== "selectionEntry" && k.tag !== "entryLink" && k.tag !== "selectionEntryGroup") continue;
      for (const a of ["id", "targetId"]) { const v = xml.getAttr(k, a); if (v) ids.add(v); }
    }
    if (ids.has(d)) return;
    let unit = "—";
    for (let i = (ancestors || []).length - 1; i >= 0; i--) if (ancestors[i].tag === "selectionEntry") { unit = xml.getAttrDecoded(ancestors[i], "name") || "—"; break; }
    bad.push(`${file} | ${unit} | «${xml.getAttrDecoded(g, "name")}» | défaut ${d} absent des enfants`);
  });
}
if (bad.length) {
  console.log(`✗ ${bad.length} groupe(s) au defaultSelectionEntryId cassé — à corriger (id d'un enfant direct, ou "none") :`);
  for (const l of bad) console.log("  ✗", l);
  process.exitCode = 1;
} else console.log("✓ aucun defaultSelectionEntryId cassé.");
