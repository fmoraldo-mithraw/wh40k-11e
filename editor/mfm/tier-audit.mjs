// tier-audit.mjs — audit des SEUILS de paliers de taille vs le dump MFM.
//
// Règle MFM : une unité dont l'effectif tombe ENTRE deux tailles listées coûte
// le palier SUPÉRIEUR (Meganobz : 2=75, 3=110, 5=185 ⇒ 4 modèles = 185). Le
// modifier `set` du palier k doit donc s'appliquer dès s_{k-1}+1 modèles, pas
// dès s_k (atLeast s_{k-1}+1, ou greaterThan s_{k-1}). apply.mjs compare les
// PRIX des paliers, pas leurs seuils : ce trou a laissé Meganobz et Wolf
// Scouts facturer 4 (resp. 7-11) modèles au palier inférieur.
//
// Usage : node editor/mfm/tier-audit.mjs [dir-dump]   (défaut editor/mfm/dump/en)
// Lecture seule ; sortie ≠ 0 s'il reste un seuil à corriger (via catalog.js).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";
const APPLY = false; // lecture seule — la correction se fait via editor/lib/catalog.js
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), PTS = "51b2-306e-1021-d207";
const c = new Catalog(ROOT); await c.load();
const DUMP = process.argv[2] || path.join(ROOT, "editor/mfm/dump/en"), MAPD = path.join(ROOT, "editor/mfm/map");
const fixes = [], odd = []; let checked = 0, ok = 0;
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const slug = f.replace(/\.json$/, "");
  const d = JSON.parse(fs.readFileSync(`${DUMP}/${f}`, "utf8"));
  let matched = {}; try { matched = JSON.parse(fs.readFileSync(`${MAPD}/${slug}.json`, "utf8")).matched || {}; } catch { continue; }
  for (const u of d.units || []) {
    // tailles listées du PREMIER barème (1ST… / YOUR UNIT COSTS)
    const firstTier = (u.profiles || []).find((p) => /^\d+ models?$/i.test(p.size || ""))?.tier;
    const sizes = (u.profiles || []).filter((p) => p.tier === firstTier && /^\d+ models?$/i.test(p.size || "")).map((p) => ({ n: parseInt(p.size, 10), pts: Number(p.points) })).sort((a, b) => a.n - b.n);
    if (sizes.length < 2) continue;
    const rec = matched[u.name]; if (!rec) continue;
    for (const t of rec.targets || []) {
      const hit = c.byId.get(t.bsId); if (!hit) continue;
      checked++;
      // modifiers set pts conditionnés par un décompte de modèles
      const mods = [];
      xml.walk(hit.node, (m) => {
        if (m.tag !== "modifier" || xml.getAttr(m, "type") !== "set" || xml.getAttr(m, "field") !== PTS) return;
        let cond = null; xml.walk(m, (k) => { if (k.tag === "condition" && xml.getAttr(k, "field") === "selections" && ["atLeast", "greaterThan"].includes(xml.getAttr(k, "type")) && xml.getAttr(k, "scope") !== "roster") cond = k; });
        if (cond) mods.push({ m, cond, pts: Number(xml.getAttr(m, "value")), type: xml.getAttr(cond, "type"), v: Number(xml.getAttr(cond, "value")) });
      });
      if (!mods.length) continue;
      for (let k = 1; k < sizes.length; k++) {
        const { n: sk, pts } = sizes[k], prev = sizes[k - 1].n;
        if (prev + 1 === sk) continue; // pas de trou : seuil = taille listée, rien à faire
        const cand = mods.filter((x) => x.pts === pts);
        if (cand.length !== 1) { odd.push(`[${slug}] ${u.name} (${t.catName}) : palier ${sk}=${pts} → ${cand.length} modifier(s) à ce prix`); continue; }
        const x = cand[0]; const thr = x.type === "atLeast" ? x.v : x.v + 1; // nombre de modèles à partir duquel le palier s'applique
        const want = prev + 1;
        if (thr === want) { ok++; continue; }
        if (thr !== sk) { odd.push(`[${slug}] ${u.name} (${t.catName}) : palier ${sk}=${pts} appliqué dès ${thr} modèles (ni ${sk} ni ${want})`); continue; }
        fixes.push(`[${slug}] ${u.name} (${t.catName}) : ${pts} pts dès ${thr} → dès ${want} modèles (tailles ${prev}/${sk})`);
      }
    }
  }
}
console.log(`unités examinées : ${checked} · paliers déjà conformes : ${ok}`);
console.log(`── SEUILS À CORRIGER (${fixes.length}) — palier appliqué dès la taille listée au lieu de la précédente + 1 ──`); for (const l of fixes) console.log("  ✗", l);
console.log(`── À VÉRIFIER À LA MAIN (${odd.length}) — encodage non standard (sélecteur de taille, doublon de prix, coût de chapitre…) ──`); for (const l of odd) console.log("  ?", l);
if (fixes.length) process.exitCode = 1;
