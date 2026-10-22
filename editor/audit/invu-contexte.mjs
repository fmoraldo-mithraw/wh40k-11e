// invu-contexte.mjs — audit du CONTEXTE des invulnérables de fiche (`invuln:`).
//
// Une invulnérable conditionnelle n'est exploitable par l'appli (simulateur,
// indice de résistance) que si la base dit DANS QUEL CAS elle joue
// (STAT_MARKERS_APP_PROMPT.md, « Groupes de contexte ») :
//   vs=ranged | vs=melee  → contre ce type d'attaque seulement ;
//   lost=wound            → perdue dès que la figurine a perdu un PV ;
//   option="…"            → équipement optionnel (porteur) ;
// un bonus temporaire (« once per battle … has a 3+ invulnerable save ») n'est
// pas une invu de fiche : c'est un `def-mod: … inv=N oncePer=battle`.
//
// Erreurs (sortie 1) :
//   1. ligne `invuln:` marquée `conditional` sans aucun de ces contextes ;
//   2. profil « Invulnerable Save » de la fiche qui dit « against ranged/melee
//      attacks » pour une valeur dont la ligne `invuln:` n'a pas le `vs=` assorti.
//
// Usage : node editor/audit/invu-contexte.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const { Catalog } = require(path.join(ROOT, "editor", "lib", "catalog.js"));
const xml = require(path.join(ROOT, "editor", "lib", "xml.js"));
const { parseAllCatalogues } = await import(path.join(ROOT, "editor", "mfm", "vendor", "bsdata-parser.mjs"));

const c = new Catalog(ROOT); c.load();
const data = await parseAllCatalogues(ROOT);
const errors = [];
const seen = new Set();
let lines = 0;
for (const d of Object.values(data)) for (const u of d.units || []) {
  if (!u.bsId || seen.has(u.bsId)) continue;
  seen.add(u.bsId);
  const hit = c.byId.get(u.bsId);
  const com = hit && (hit.node.children || []).find((ch) => ch.tag === "comment");
  if (!com) continue;
  const inv = (xml.getText(com) || "").split("\n").map((l) => l.trim()).filter((l) => /^invuln:/i.test(l));
  lines += inv.length;
  const where = `${hit.file} « ${u.name} »`;
  for (const l of inv) {
    if (/\bconditional\b/.test(l) && !/\b(vs|lost)=|\boption="/.test(l)) errors.push(`${where} : « ${l} » conditionnelle sans contexte (vs=/lost=/option=)`);
  }
  for (const iv of u.invulns || []) {
    const txt = String(iv.note || "").replace(/\s+/g, " ");
    for (const [kind, re] of [["ranged", /(\d)\+[^.,]*?against ranged attacks/gi], ["melee", /(\d)\+[^.,]*?against melee attacks/gi]]) {
      for (const m of txt.matchAll(re)) {
        const v = m[1] + "+";
        const ok = inv.some((l) => l.startsWith("invuln: " + v) && new RegExp("\\bvs=" + kind + "\\b").test(l));
        if (!ok) errors.push(`${where} : « ${v} against ${kind} attacks » imprimé, aucune ligne « invuln: ${v} … vs=${kind} »`);
      }
    }
  }
}
for (const e of errors) console.error("  ✗ " + e);
console.log(`invu-contexte : ${seen.size} fiches, ${lines} lignes invuln:, ${errors.length} erreur(s)`);
process.exit(errors.length ? 1 : 0);
