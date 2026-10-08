#!/usr/bin/env node
// rattachements.mjs — invariant : toute fiche qui porte la règle LEADER ou SUPPORT (lien de règle core, par id
// ou par nom, ou aptitude du même nom) doit avoir une liste de rattachement exploitable par l'appli :
//   · un groupe « Can Lead (MFM) » / « Can Support (MFM) » non vide sur la fiche, OU
//   · au moins un lien inverse « Led By (MFM) » / « Supported By (MFM) » posé sur une unité qui la vise, OU
//   · une prose de rattachement PAR MOT-CLEF (« any … unit », prédicat leader-kw:) — non réductible à des fiches.
// Né du retour utilisateur « Kaius Konorius est Support mais il n'y a pas la liste pour l'attacher » : la fiche
// avait été créée (codex SM 11e) après la génération des groupes, et rien ne le détectait.
// Réparation : node editor/translations/gdc-attach.cjs <gdc>/11th/gdc --write (voir SOURCE_GAME_DATACARDS.md).
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const HERE = dirname(fileURLToPath(import.meta.url)); const ROOT = join(HERE, "..", "..");
const require = createRequire(import.meta.url);
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js")); const xml = require(join(ROOT, "editor", "lib", "xml.js"));
const c = new Catalog(ROOT); c.load();
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const RULE = { leader: ["b4dd-3e1f-41cb-218f", "Leader", "Can Lead (MFM)", "Led By (MFM)"], support: ["21f5-c07c-6d97-4405", "Support", "Can Support (MFM)", "Supported By (MFM)"] };
const own = (u, fn) => { const go = (n) => { for (const k of n.children || []) { if (!k.tag || k.tag === "entryLink") continue; if (k.tag === "selectionEntryGroup" && /Enhancement|\(MFM\)$/.test(nm(k))) continue; fn(k); go(k); } }; go(u); };
const groupLinks = (u, gname) => { const out = []; const gs = xml.child(u, "selectionEntryGroups"); if (gs) for (const g of gs.children) if (g.tag === "selectionEntryGroup" && nm(g) === gname) { const el = xml.child(g, "entryLinks"); if (el) for (const l of el.children) if (l.tag === "entryLink") out.push(xml.getAttr(l, "targetId")); } return out; };
const reverse = { leader: new Set(), support: new Set() };
for (const [, d] of c.docs) xml.walk(d.root, (u) => { if (u.tag !== "selectionEntry") return; for (const k of ["leader", "support"]) for (const id of groupLinks(u, RULE[k][3])) reverse[k].add(id); });
const bad = [];
for (const [f, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (!bx) continue;
  for (const u of bx.children) { if (u.tag !== "selectionEntry" || !/^(unit|model)$/.test(xml.getAttr(u, "type") || "") || xml.getAttr(u, "hidden") === "true") continue;
    for (const k of ["leader", "support"]) { const [rid, rname, fwd] = RULE[k]; let has = false, prose = "";
      own(u, (n) => { if (n.tag === "infoLink" && xml.getAttr(n, "type") === "rule" && (xml.getAttr(n, "targetId") === rid || nm(n).trim() === rname)) has = true;
        if (n.tag === "profile" && nm(n).trim().toLowerCase() === rname.toLowerCase()) { has = true; xml.walk(n, (q) => { if (q.tag === "characteristic") prose = xml.getText(q) || ""; }); } });
      if (!has) continue;
      if (groupLinks(u, fwd).length || reverse[k].has(xml.getAttr(u, "id"))) continue;
      if (/\bany\b|\bwith the\b.*\bkeyword|\bunits? from your army\b/i.test(prose) || /leader-kw:/.test(JSON.stringify(xml.child(u, "comment") || ""))) continue;
      bad.push(`${f} · ${nm(u)} [${xml.getAttr(u, "id")}] : ${rname} sans liste de rattachement (ni « ${fwd} », ni lien inverse, ni prose par mot-clef)`); } } }
for (const l of bad) console.error("  ✗ " + l);
console.log(bad.length ? `  ${bad.length} fiche(s) Leader/Support sans liste de rattachement — réparer avec editor/translations/gdc-attach.cjs` : "✓ toutes les fiches Leader/Support ont une liste de rattachement.");
process.exit(bad.length ? 1 : 0);
