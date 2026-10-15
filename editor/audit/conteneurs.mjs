// conteneurs.mjs — audit des ÉLÉMENTS MAL RANGÉS dans les conteneurs BattleScribe.
//
// Chaque conteneur n'admet qu'un type d'enfant : <entryLinks> → entryLink,
// <selectionEntries> → selectionEntry, <selectionEntryGroups> → selectionEntryGroup,
// <profiles> → profile, etc. Un élément au mauvais endroit reste du XML bien
// formé (xmllint et catalog.validate passent) mais BattleScribe et l'appli
// l'IGNORENT : l'arme ou l'option disparaît sans bruit. Cas d'origine (2026-10-15) :
// gdc-apply-weapons.cjs remplaçait un entryLink d'arme partagée par sa copie
// locale (selectionEntry) DANS <entryLinks> — 43 armes perdues (storm bolter des
// Brotherhood Librarian/Chaplain, plasma pistol de Mephiston, Ceramite Fists…).
//
// Usage : node editor/audit/conteneurs.mjs            → 0 = rien de mal rangé, 1 = liste
//         node editor/audit/conteneurs.mjs --repair   → déplace selectionEntry /
//           selectionEntryGroup / entryLink vers le conteneur frère attendu (créé au
//           besoin), retire le conteneur vidé, valide et sauve.
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REPAIR = process.argv.includes("--repair");
const c = new Catalog(ROOT); await c.load();
const ALLOWED = {
  entryLinks: ["entryLink"], selectionEntries: ["selectionEntry"], selectionEntryGroups: ["selectionEntryGroup"],
  sharedSelectionEntries: ["selectionEntry"], sharedSelectionEntryGroups: ["selectionEntryGroup"],
  profiles: ["profile"], sharedProfiles: ["profile"], infoLinks: ["infoLink"], categoryLinks: ["categoryLink"],
  costs: ["cost"], constraints: ["constraint"], rules: ["rule"], sharedRules: ["rule"],
};
// conteneur attendu pour un élément déplaçable
const HOME = { selectionEntry: "selectionEntries", selectionEntryGroup: "selectionEntryGroups", entryLink: "entryLinks" };
// ordre BattleScribe des conteneurs dans une entrée (insertion d'un conteneur créé)
const ORDER = ["comment", "constraints", "modifiers", "modifierGroups", "profiles", "rules", "infoLinks", "infoGroups",
  "categoryLinks", "selectionEntries", "selectionEntryGroups", "entryLinks", "costs"];
const el = (tag) => { const e = xml.elem(tag, {}, []); e.selfClose = false; return e; };
function container(owner, tag) {
  let h = (owner.children || []).find((k) => k.tag === tag); if (h) return h;
  h = el(tag); const rank = ORDER.indexOf(tag);
  let at = owner.children.length;
  for (let i = 0; i < owner.children.length; i++) { const r = ORDER.indexOf(owner.children[i].tag); if (r > rank) { at = i; break; } }
  owner.children.splice(at, 0, h); return h;
}
const bad = []; let moved = 0;
for (const [file, doc] of c.docs) {
  const fixes = [];
  xml.walk(doc.root, (holder, owner, ancestors) => {
    const ok = ALLOWED[holder.tag]; if (!ok) return;
    for (const k of holder.children || []) {
      if (!k || typeof k !== "object" || !k.tag || ok.includes(k.tag)) continue;
      let unit = "—";
      for (let i = (ancestors || []).length - 1; i >= 0; i--) if (ancestors[i].tag === "selectionEntry" && /unit|model/.test(xml.getAttr(ancestors[i], "type") || "")) { unit = xml.getAttrDecoded(ancestors[i], "name") || "—"; break; }
      bad.push(`${file} | ${unit} | <${k.tag} «${xml.getAttrDecoded(k, "name") || ""}» ${xml.getAttr(k, "id") || ""}> dans <${holder.tag}>`);
      if (HOME[k.tag] && owner) fixes.push({ k, holder, owner });
    }
  });
  if (REPAIR && fixes.length) {
    for (const { k, holder, owner } of fixes) {
      holder.children.splice(holder.children.indexOf(k), 1);
      container(owner, HOME[k.tag]).children.push(k); moved++;
      if (!holder.children.some((x) => x && typeof x === "object" && x.tag)) owner.children.splice(owner.children.indexOf(holder), 1);
    }
    c.markDirty(file);
  }
}
if (REPAIR && moved) {
  const v = c.validate({ dirtyOnly: true });
  if (!v.ok) { console.log("✗ validation après réparation :", JSON.stringify((v.errors || []).slice(0, 3))); process.exit(1); }
  c.save(); console.log(`✓ ${moved} élément(s) déplacé(s) vers leur conteneur`); process.exit(0);
}
if (bad.length) {
  console.log(`✗ ${bad.length} élément(s) mal rangé(s) — ignorés par BattleScribe et l'appli (réparer : --repair) :`);
  for (const l of bad) console.log("  ✗", l);
  process.exit(1);
}
console.log("✓ aucun élément mal rangé dans un conteneur.");
