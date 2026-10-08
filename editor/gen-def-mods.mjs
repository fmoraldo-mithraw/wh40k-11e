// Générateur des marqueurs DÉFENSIFS `def-mod:` (onglet Résistance du
// simulateur de l'appli — indice de tankyness) à partir de la prose GW.
//
//   def-mod: source="Nom" <effets> [when=ranged|melee] [vsStronger] [conditional]
//   effets : dmg=-1 · halfdmg · wound=-1 · ap=-1 · cover · inv=4 · fnp=5
//
// Même canal que `sim-mod:` (un <comment>, une ligne par effet-source), posé
// sur : la selectionEntry de la fiche (aptitudes de datasheet), celle de
// l'amélioration, et la <rule> d'une règle de détachement / d'un stratagème.
//
// Extraction PRUDENTE : il faut un contexte défensif explicite (« attack …
// targets this/your unit », « allocated to a model in this unit », « your unit
// has … ») ; un effet offensif (« improve the AP of your attacks ») n'est
// jamais pris. Les invu/FNP de DATASHEET ne sont pas repris (marqueurs
// invuln:/fnp: déjà en base). Les lignes def-mod: existantes sont remplacées
// (zéro churn si identiques) ; une ligne portant `manual` est conservée.
//
// usage : node editor/gen-def-mods.mjs [--apply] [--list]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const { Catalog } = require(path.join(REPO, "editor/lib/catalog"));
const xml = require(path.join(REPO, "editor/lib/xml"));
const APPLY = process.argv.includes("--apply");
const LIST = process.argv.includes("--list");

const clean = (s) => String(s || "").replace(/\*\*|\^\^/g, "").replace(/\s+/g, " ").trim();

// Contexte défensif : l'attaque VISE l'unité / est ALLOUÉE à ses figurines,
// ou l'unité « a » l'effet.
const DEF_CTX = /(targets? (?:this|your|that|the bearer's|their|a friendly)[^.]{0,40}unit|that targets? (?:it|them)|allocated to (?:a|this|that|the bearer|an?)[^.]{0,30}model|attacks? that target (?:your|this|that|the bearer's)[^.]{0,30}unit|(?:this|your|that|the bearer's) unit (?:has|have|gains?)|models in (?:this|your|that|the bearer's) unit have)/i;

export function extractDef(text, { datasheet = false } = {}) {
  const t = clean(text);
  if (!t) return [];
  const out = [];
  // Phrase par phrase (EFFECT: d'un stratagème inclus) pour garder le contexte local.
  const sentences = t.split(/(?<=[.!?])\s+|\n|■|•/).map((x) => x.trim()).filter(Boolean);
  const whenOf = (s) => (/\branged attacks?\b/i.test(s) && !/\bmelee attacks?\b/i.test(s) ? "ranged" : /\bmelee attacks?\b/i.test(s) && !/\branged attacks?\b/i.test(s) ? "melee" : null);
  const ctx = (s, i) => DEF_CTX.test(s) || (i > 0 && DEF_CTX.test(sentences[i - 1]));
  sentences.forEach((s, i) => {
    if (!ctx(s, i)) return;
    const when = whenOf(s) || (i > 0 ? whenOf(sentences[i - 1]) : null);
    const stronger = /strength[^.]{0,40}(greater|higher) than[^.]{0,30}toughness|\bS greater than[^.]{0,30}\bT\b/i.test(s);
    const push = (fx) => out.push({ fx, when, stronger });
    if (/subtract 1 from the damage characteristic|-1 to (?:the )?damage|reduce the damage[^.]{0,30}by 1|damage characteristic of that attack is reduced by 1/i.test(s)) push("dmg=-1");
    if (/halve the damage/i.test(s)) push("halfdmg");
    if (/subtract 1 from (?:the|that) wound roll|-1 to wound rolls?/i.test(s)) push("wound=-1");
    if (/worsen the armou?r penetration[^.]{0,40}by 1/i.test(s)) push("ap=-1");
    if (/benefit of cover/i.test(s) && !/(do not|does not|cannot|lose|ignore)[^.]{0,20}benefit of cover/i.test(s)) push("cover");
    if (!datasheet) {
      const iv = s.match(/(\d)\+\s*(?:invulnerable save|InSv)/i); if (iv) push("inv=" + iv[1]);
      const fn = s.match(/feel no pain (\d)\+/i); if (fn) push("fnp=" + fn[1]);
    }
  });
  // dédoublonne
  const seen = new Set();
  return out.filter((o) => { const k = o.fx + "|" + o.when + "|" + o.stronger; if (seen.has(k)) return false; seen.add(k); return true; });
}

const SITUATIONAL = /\b(once per|while|if |until|each time this unit|in your opponent's|at the start|select one|roll one d6|on a \d\+)/i;
const line = (src, d, conditional) => `def-mod: source="${src.replace(/"/g, "'")}" ${d.fx}${d.when ? " when=" + d.when : ""}${d.stronger ? " vsStronger" : ""}${conditional ? " conditional" : ""}`;

const c = new Catalog(REPO).load();
const plan = new Map(); // node → { file, label, lines:[] }
const add = (node, file, label, l) => { if (!plan.has(node)) plan.set(node, { file, label, lines: [] }); const p = plan.get(node); if (!p.lines.includes(l)) p.lines.push(l); };

for (const [file, doc] of c.docs) {
  xml.walk(doc.root, (n) => {
    // Règles de détachement et stratagèmes : <rule> avec <description>.
    if (n.tag === "rule") {
      const name = xml.getAttrDecoded(n, "name") || "";
      const desc = xml.getText(xml.child(n, "description") || {}) || "";
      const isStrat = /\(Stratagem/i.test(name) || /STRATAGEM/.test(desc);
      const src = name.replace(/\s*\(Stratagem[^)]*\)/i, "");
      for (const d of extractDef(desc)) add(n, file, name, line(src, d, isStrat || SITUATIONAL.test(clean(desc))));
      return;
    }
    if (n.tag !== "selectionEntry") return;
    const type = xml.getAttr(n, "type");
    const name = xml.getAttrDecoded(n, "name") || "";
    if (type === "unit" || type === "model") {
      // Aptitudes de la fiche (profils Abilities directs de l'entrée).
      const profs = ((xml.child(n, "profiles") || {}).children || []).filter((p) => p.tag === "profile" && /abilit/i.test(xml.getAttrDecoded(p, "typeName") || ""));
      for (const p of profs) {
        const pn = xml.getAttrDecoded(p, "name") || "";
        if (/^(invul|feel no pain|leader)/i.test(pn)) continue;
        let desc = ""; xml.walk(p, (ch) => { if (ch.tag === "characteristic") desc += " " + (xml.getText(ch) || ""); });
        for (const d of extractDef(desc, { datasheet: true })) add(n, file, name, line(pn, d, SITUATIONAL.test(clean(desc))));
      }
    } else if (type === "upgrade") {
      // Améliorations : entrée upgrade portant un profil Abilities à son nom,
      // dans un groupe d'améliorations (catégorie / nom « Enhancement »).
      const profs = ((xml.child(n, "profiles") || {}).children || []).filter((p) => p.tag === "profile" && /abilit/i.test(xml.getAttrDecoded(p, "typeName") || ""));
      const isEnh = /enhancement/i.test(JSON.stringify(((xml.child(n, "categoryLinks") || {}).children || []).map((x) => xml.getAttrDecoded(x, "name")))) || /Upgrade$/.test(name);
      if (!isEnh) return;
      for (const p of profs) {
        let desc = ""; xml.walk(p, (ch) => { if (ch.tag === "characteristic") desc += " " + (xml.getText(ch) || ""); });
        for (const d of extractDef(desc)) add(n, file, name, line(name, d, SITUATIONAL.test(clean(desc))));
      }
    }
  });
}

// Écriture : remplace les lignes def-mod: non manuelles du <comment>.
let changed = 0, lines = 0; const perFile = new Map(); const sample = [];
for (const [node, p] of plan) {
  let com = (node.children || []).find((ch) => ch.tag === "comment");
  const existing = com ? (xml.getText(com) || "") : "";
  const kept = existing.split("\n").filter((l) => l.trim() && !(/^\s*def-mod:/.test(l) && !/\bmanual\b/.test(l)));
  const next = [...kept, ...p.lines].join("\n");
  if (next.trim() === existing.trim()) continue;
  changed++; lines += p.lines.length; perFile.set(p.file, (perFile.get(p.file) || 0) + 1);
  if (sample.length < 400) sample.push(`${p.file.replace(/\.(cat|gst)$/, "")} :: ${p.label}\n    ${p.lines.join("\n    ")}`);
  if (APPLY) {
    if (!com) { com = xml.elem("comment", {}); com.selfClose = false; node.children = [com, ...(node.children || [])]; node.selfClose = false; }
    xml.setText(com, next);
    c.markDirty(p.file);
  }
}
console.log(`def-mod : ${changed} nœud(s), ${lines} ligne(s).`);
for (const [f, n] of [...perFile].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
if (LIST) console.log("\n" + sample.join("\n"));
if (APPLY && changed) {
  c.buildIndex();
  const v = c.validate({ dirtyOnly: false });
  let e = 0; for (const r of v.results || []) e += r.errors.length;
  console.log("validate", v.ok, e);
  if (v.ok) c.save(); else process.exit(1);
}
