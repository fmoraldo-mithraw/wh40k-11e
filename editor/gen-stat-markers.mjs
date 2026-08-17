// Générateur des MARQUEURS DE STATS — matérialise en données les trois piliers
// qui reposaient sur la prose GW côté application :
//   invuln / FNP  → `invuln: 4+ [model="X"] [conditional]`, `fnp: 5+`
//   Supreme Commander → `must-warlord` / `cannot-warlord`
//   graphe de chefs (cibles PAR MOTS-CLEFS, la seule part restée prose —
//   les cibles datasheet sont déjà déclaratives via « Can Lead (MFM) »)
//                → `leader-kw: KW [& KW] [| KW & KW]`  (OR de groupes AND)
//
// Canal : lignes dans le <comment> PREMIER ENFANT du selectionEntry de l'unité
// — le même que sim-mod: (une ligne = un fait, les autres consommateurs
// BattleScribe l'ignorent, round-trip garanti par editor/lib). Le générateur ne
// touche QUE ses propres genres de lignes (invuln:/fnp:/must-warlord/
// cannot-warlord/leader-kw:) : les lignes sim-mod: et autres sont préservées.
//
// Source des valeurs : les extracteurs ÉPROUVÉS de l'application
// (cogitator-bellicum) — collectInvulns/pickInvuln, mustBeWarlord/
// cannotBeWarlord, leadgraph — exécutés UNE FOIS ici pour figer leur verdict en
// données. Après quoi la donnée est la source de vérité et la prose n'est plus
// qu'un repli : un nouveau codex à la tournure inédite se corrige en éditant le
// marqueur, plus en retouchant une regex.
//
// FNP : leçon invuln appliquée — seule l'aptitude NOMMÉE « Feel No Pain N+ »
// est une stat de fiche ; les dons conditionnels (aura de Painboy, chef qui
// confère…) sont des sim-mod, pas des stats, et ne produisent PAS de marqueur.
//
//   node editor/gen-stat-markers.mjs            (dry-run : rapport seul)
//   node editor/gen-stat-markers.mjs --apply    (écrit + valide + sauve)

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const APP = join(ROOT, "..", "cogitator-bellicum");

const { Catalog } = require(join(ROOT, "editor/lib/catalog"));
const xml = require(join(ROOT, "editor/lib/xml"));
const { parseAllCatalogues } = await import(join(APP, "scripts/bsdata-parser.mjs"));
const { annotateLeadTargets } = await import(join(APP, "scripts/leadgraph.mjs"));
const { pickInvuln } = await import(join(APP, "src/sim/datasheet.js"));
const { mustBeWarlord, cannotBeWarlord } = await import(join(APP, "src/rules.js"));

const APPLY = process.argv.includes("--apply");
const MARKER_RE = /^(invuln|fnp|must-warlord|cannot-warlord|leader-kw)\b/;

// FNP « stat de fiche » : l'aptitude s'appelle « Feel No Pain N+ » (valeur dans
// le nom, description = la règle générique). Rien d'autre ne compte.
function fnpFromAbilities(abilities) {
  for (const a of abilities || []) {
    const name = String((Array.isArray(a) ? a[0] : a && a.name) || "");
    const m = name.match(/^feel\s*no\s*pain\s*\(?(\d)\s*\+\)?$/i);
    if (m) return m[1] + "+";
  }
  return "";
}

const all = await parseAllCatalogues(ROOT);
await annotateLeadTargets(all, ROOT);
const c = new Catalog(ROOT).load();

// id de catégorie → nom (pour écrire leader-kw en NOMS, pas en ids) : les
// categoryEntry du .gst + de chaque .cat.
const catName = new Map();
for (const [, doc] of c.docs) xml.walk(doc.root, (n) => {
  if (n.tag === "categoryEntry") {
    const id = xml.getAttr(n, "id"), nm = xml.getAttrDecoded ? xml.getAttrDecoded(n, "name") : xml.getAttr(n, "name");
    if (id && nm && !catName.has(id)) catName.set(id, nm);
  }
});

// Fiche par bsId unique → lignes de marqueurs calculées.
const seen = new Set();
const perFile = new Map();
let unitsMarked = 0, linesTotal = 0, skippedNoNode = [], conflicts = [];
const changes = []; // {file, node, newComment}

for (const [fk, f] of Object.entries(all)) {
  for (const u of f.units || []) {
    if (!u.bsId || seen.has(u.bsId)) continue;
    seen.add(u.bsId);
    const lines = [];
    // Invuln : structuré (par modèle, conditionnel) d'abord, scan nommé sinon.
    if (u.invulns && u.invulns.length) {
      for (const iv of u.invulns) {
        if (!iv || !iv.value) continue;
        lines.push("invuln: " + iv.value
          + (iv.model ? ' model="' + iv.model + '"' : "")
          + (iv.conditional ? " conditional" : ""));
      }
    } else {
      const pi = pickInvuln(u);
      if (pi && pi.value) lines.push("invuln: " + pi.value + "+" + (pi.star ? " conditional" : ""));
    }
    const fnp = fnpFromAbilities(u.abilities);
    if (fnp) lines.push("fnp: " + fnp);
    if (mustBeWarlord(u)) lines.push("must-warlord");
    if (cannotBeWarlord(u)) lines.push("cannot-warlord");
    if (u.leadKeywords && u.leadKeywords.length) {
      const groups = u.leadKeywords
        .map((pred) => (pred || []).map((or) => {
          // chaque élément du AND est un OR d'ids — même nom sous plusieurs ids,
          // on prend le premier nom connu.
          const nm = (or || []).map((id) => catName.get(id)).find(Boolean);
          return nm || "";
        }).filter(Boolean).join(" & "))
        .filter(Boolean);
      if (groups.length) lines.push("leader-kw: " + groups.join(" | "));
    }
    if (!lines.length) continue;

    const hit = c.byId.get(u.bsId);
    if (!hit) { skippedNoNode.push(fk + " / " + u.name); continue; }
    const { node, file } = hit;

    // Comment premier enfant : préserver les lignes étrangères (sim-mod:…),
    // remplacer uniquement les nôtres. Diff-check : zéro churn si identique.
    let com = (node.children || []).find((ch) => ch.tag === "comment");
    const existing = com ? (xml.getText(com) || "") : "";
    const kept = existing.split("\n").map((l) => l.trim()).filter((l) => l && !MARKER_RE.test(l));
    const next = [...kept, ...lines].join("\n");
    if (next === existing.split("\n").map((l) => l.trim()).filter(Boolean).join("\n")) continue;

    unitsMarked++; linesTotal += lines.length;
    perFile.set(file, (perFile.get(file) || 0) + 1);
    changes.push({ file, node, com, next, name: u.name, lines });
  }
}

console.log(`Marqueurs calculés : ${unitsMarked} fiches, ${linesTotal} lignes.`);
for (const [f, n] of [...perFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
if (skippedNoNode.length) console.log("Sans nœud (bsId introuvable) :", skippedNoNode.length, skippedNoNode.slice(0, 5));
if (conflicts.length) console.log("Conflits :", conflicts);
console.log("\nÉchantillon :");
for (const ch of changes.slice(0, 8)) console.log("  <" + ch.name + ">  " + ch.lines.join("  ·  "));

if (!APPLY) { console.log("\n(dry-run — relancer avec --apply pour écrire)"); process.exit(0); }

for (const ch of changes) {
  let com = ch.com;
  if (!com) {
    com = xml.elem("comment", {});
    ch.node.children.unshift(com);
  }
  xml.setText(com, ch.next);
  c.markDirty(ch.file);
}
c.buildIndex();
const v = c.validate({ dirtyOnly: false });
let nbErr = 0;
for (const r of v.results || []) { nbErr += r.errors.length; for (const e of r.errors.slice(0, 5)) console.error("  ✗", r.file, e); }
console.log("validate ok:", v.ok, "erreurs:", nbErr);
if (!v.ok) process.exit(1);
c.save();
console.log("sauvegardé :", [...perFile.keys()].length, "fichiers.");
