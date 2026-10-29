// legends.mjs — garde-fou : RIEN de Legends dans la base (décision utilisateur du 2026-10-29 : « Tout ce qui a
// trait à des fiches Legends n'a pas sa place dans l'appli ni la base »).
//
// Référence : editor/mfm/legends.json (section LEGENDS du MFM, `mfm_parser.py legends`). Une fiche est
// « Legends » si son nom y figure et n'est au barème d'AUCUNE faction (dump editor/mfm/dump/en) : Venerable
// Dreadnought est Legends chez les Space Marines mais au barème des Grey Knights → fiche valide.
// Les mots-clefs homonymes portés par des fiches au barème (« Predator Annihilator », « Dreadnought ») restent.
//
// Contrôles (sortie 1 au premier écart) :
//   · nom « … [Legends] » (fiche, lien, catégorie) ou catalogue au nom « … Legends » ;
//   · fiche EXPOSÉE (entryLink racine visible) dont le nom est une fiche Legends ;
//   · marqueur `leader-kw:` qui nomme une fiche Legends ;
//   · prose Leader / Support dont une puce nomme une fiche Legends (l'appli l'affiche et en tire des liens) ;
//   · commentaire-marqueur « Legends » / « HIDDEN UNTIL LEGENDS » / « HIDDEN IN CASE OF LEGENDS ».
// Usage : node editor/audit/legends.mjs   (enchaîné par editor/audit/valider.mjs)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[‐-―]/g, "-").replace(/[‘’'`]/g, "'").replace(/\*\*|\^\^/g, "").replace(/\s+/g, " ").trim();
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
let LEG;
try { LEG = JSON.parse(fs.readFileSync(path.join(ROOT, "editor/mfm/legends.json"), "utf8")); }
catch { console.log("✗ editor/mfm/legends.json introuvable (python3 editor/mfm/mfm_parser.py legends -o editor/mfm/legends.json)"); process.exit(1); }
const legends = new Set(); for (const v of Object.values(LEG.factions || {})) for (const n of v) legends.add(N(n));
const DUMP = path.join(ROOT, "editor/mfm/dump/en");
for (const f of fs.readdirSync(DUMP)) if (f.endsWith(".json") && f[0] !== "_") for (const u of JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8")).units || []) legends.delete(N(u.name));
const isLeg = (s) => legends.has(N(s));

const c = new Catalog(ROOT); await c.load();
const bad = [];
for (const [f, d] of c.docs) {
  if (/legends/i.test(nm(d.root))) bad.push(`${f} : catalogue « ${nm(d.root)} »`);
  const el = xml.child(d.root, "entryLinks");
  if (el) for (const k of el.children) if (k.tag === "entryLink" && xml.getAttr(k, "hidden") !== "true") {
    const t = c.byId.get(xml.getAttr(k, "targetId")); const n = t ? nm(t.node) : nm(k);
    if (isLeg(n)) bad.push(`${f} : fiche exposée « ${n} » — Legends au MFM`); }
  xml.walk(d.root, (n) => {
    if (/\[legends\]/i.test(nm(n))) bad.push(`${f} : ${n.tag} « ${nm(n)} »`);
    if (n.tag === "comment") { const t = xml.getText(n) || "";
      for (const l of t.split("\n")) {
        if (/^\s*(legends|hidden (until|in case of) legends)\s*$/i.test(l)) bad.push(`${f} : commentaire « ${l.trim()} »`);
        const m = l.match(/^\s*leader-kw:\s*(.+)$/i);
        if (m) for (const g of m[1].split("|")) if (!g.includes("&") && isLeg(g)) bad.push(`${f} : leader-kw « ${g.trim()} » — fiche Legends`); } }
    if (n.tag === "profile" && /^(leader|support)$/i.test(nm(n).trim())) {
      let t = ""; xml.walk(n, (q) => { if (q.tag === "characteristic") t = xml.getText(q) || ""; });
      for (const l of t.split("\n")) { const b = l.match(/^\s*(?:■|•|-)\s+(.+?)\s*$/); if (b && isLeg(b[1].replace(/[.;]\s*$/, ""))) bad.push(`${f} : prose « ${nm(n)} » cite la fiche Legends « ${b[1].trim()} »`); } }
  });
}
if (!bad.length) { console.log(`✓ rien de Legends dans la base (${legends.size} fiches Legends du MFM ${LEG.version || ""}).`); process.exit(0); }
console.log(`✗ ${bad.length} élément(s) Legends dans la base (décision du 2026-10-29 : rien de Legends) :`);
for (const b of [...new Set(bad)]) console.log("  ✗ " + b);
process.exit(1);
