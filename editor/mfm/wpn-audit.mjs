// wpn-audit.mjs — audit des SURCOÛTS D'ARMES (« per <arme> = N pts ») vs le
// dump MFM. Comble le second trou structurel d'apply.mjs : les profils
// « per X » sont hors de son périmètre (seul le tag « WARGEAR COSTS
// REMOVED » y est traité) — un changement de VALEUR de surcoût passerait
// inaperçu, comme les DP avant dp-audit.
//
// Usage :  node editor/mfm/wpn-audit.mjs [dir-dump]   (défaut: editor/mfm/dump/en)
// Lecture seule. Nécessite les matrices (editor/mfm/map/) pour nom→bsId.
//
// Le prix bdd d'un surcoût vit sous PLUSIEURS formes (toutes vues en vrai) :
//   · option payante nommée comme l'arme (« Lascannon » = 5) ;
//   · paire de sponsons (« 2 Multi-meltas » = 10 pour « per Multi-melta=5 ») ;
//   · option combinée (« Battle cannon and heavy stubber » = 10) ;
//   · modèle-variante (« Thunderwolf w/ storm shield » = 5,
//     « Venatari Custodian (Venatari lance) » = 5) ;
//   · wargear nommé (« Banner of Macragge » = 15).
// L'audit accepte N ou 2×N sur tout nœud coûté du sous-arbre de l'unité dont
// le nom contient l'arme (liens résolus). Écart signalé seulement quand des
// nœuds au nom correspondant existent mais qu'AUCUN ne produit N ni 2×N ;
// aucune correspondance de nom → « à vérifier à la main » (jamais silencieux).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DUMP = process.argv[2] || path.join(HERE, "dump/en");
const MAPD = path.join(HERE, "map");

const norm = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
// singulier naïf pour « 2 Multi-meltas » ↔ « Multi-melta »
const sing = (s) => norm(s).replace(/s\b/g, "");

const c = new Catalog(ROOT);
await c.load();

// Tous les nœuds coûtés (pts>0) du sous-arbre d'une unité, liens résolus
// (profondeur 1 de résolution : la cible d'un entryLink est re-parcourue).
function paidNodes(unitNode) {
  const out = [];
  const seen = new Set();
  const collect = (root) => {
    if (!root || seen.has(root)) return;
    seen.add(root);
    xml.walk(root, (k) => {
      if (k.tag === "entryLink") {
        const t = c.byId.get(xml.getAttr(k, "targetId"));
        // Un entryLink peut porter SON PROPRE coût (Leman Russ : le lien
        // « Lascannon » coûte 5, la cible partagée est gratuite).
        const lc = (k.children || []).find((x) => x.tag === "costs");
        const lp = lc && (lc.children || []).find((x) => x.tag === "cost" && xml.getAttr(x, "name") === "pts");
        const lv = lp ? parseInt(xml.getAttr(lp, "value"), 10) : 0;
        if (lv > 0) out.push({ name: xml.getAttrDecoded(k, "name") || "", pts: lv });
        if (t) collect(t.node);
      }
      if (k.tag !== "selectionEntry") return;
      const costs = (k.children || []).find((x) => x.tag === "costs");
      const pts = costs && (costs.children || []).find((x) => x.tag === "cost" && xml.getAttr(x, "name") === "pts");
      const v = pts ? parseInt(xml.getAttr(pts, "value"), 10) : 0;
      if (v > 0) out.push({ name: xml.getAttrDecoded(k, "name") || "", pts: v });
    });
  };
  collect(unitNode);
  return out;
}

let ok = 0;
const issues = [], manual = [], orksSkipped = [];
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const slug = f.replace(/\.json$/, "");
  const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8"));
  const vnum = parseFloat(String(d.version || "").replace(/^v/i, "")) || 0;
  let matched = {};
  try { matched = JSON.parse(fs.readFileSync(path.join(MAPD, slug + ".json"), "utf8")).matched || {}; } catch { continue; }
  const idx = new Map(Object.entries(matched).map(([k, v]) => [norm(k), v]));
  for (const u of d.units || []) {
    for (const p of u.profiles || []) {
      const mm = /^per (.+)$/i.exec(p.size || "");
      if (!mm) continue;
      const wKey = sing(mm[1]);
      const want = Number(p.points);
      const rec = idx.get(norm(u.name));
      const label = `[${slug}] ${u.name} per ${mm[1]}=${want}`;
      const push = (arr, msg) => (slug === "orks" && vnum <= 1.3 ? orksSkipped : arr).push(msg);
      if (!rec) { push(manual, `${label} — unité non mappée`); continue; }
      const nodes = [];
      for (const t of rec.targets || []) {
        const hit = c.byId.get(t.bsId);
        if (hit) nodes.push(...paidNodes(hit.node));
        // Union avec les options indexées par build-map (résolution de groupes
        // partagée) — les deux sources se complètent, aucune n'est exhaustive.
        for (const o of t.weaponOptions || []) if (Number(o.pts) > 0) nodes.push({ name: o.name, pts: Number(o.pts) });
      }
      const uTokens = new Set(sing(u.name).split(" "));
      // wKey sans les mots déjà dans le nom de l'unité (« Despoiler battle
      // cannon » sous KNIGHT DESPOILER → « battle cannon ») + comparaison
      // sans espaces (« battle cannon » ↔ « battlecannon »).
      const wCore = wKey.split(" ").filter((x) => !uTokens.has(x)).join(" ") || wKey;
      const squash = (s) => s.replace(/ /g, "");
      const match = (n) => {
        const nn = sing(n.name);
        return nn.includes(wKey) || wKey.includes(nn) || nn.includes(wCore) ||
               squash(nn).includes(squash(wCore)) || squash(wCore).includes(squash(nn));
      };
      const named = nodes.filter(match);
      if (!named.length) { push(manual, `${label} — aucun nœud coûté au nom correspondant (encodage à vérifier à la main)`); continue; }
      if (named.some((n) => n.pts === want || n.pts === 2 * want)) ok++;
      else push(issues, `${label} — nœuds trouvés : ${[...new Set(named.map((n) => `«${n.name}»=${n.pts}`))].join(", ")}`);
    }
  }
}

console.log(`✓ surcoûts d'armes conformes : ${ok}`);
if (orksSkipped.length) console.log(`~ éléments Orks ignorés (MFM ≤ v1.3, codex plus récent) : ${orksSkipped.length}`);
if (manual.length) {
  console.log(`? À VÉRIFIER À LA MAIN (${manual.length}) — pas de correspondance de nom, pas forcément un écart :`);
  for (const x of [...new Set(manual)]) console.log("  ?", x);
}
if (issues.length) {
  console.log(`✗ ÉCARTS SURCOÛTS D'ARMES (${issues.length}) — à corriger via editor/lib/catalog.js :`);
  for (const x of [...new Set(issues)]) console.log("  ✗", x);
  process.exitCode = 1;
} else {
  console.log("✓ aucun écart de surcoût d'arme détecté.");
}
