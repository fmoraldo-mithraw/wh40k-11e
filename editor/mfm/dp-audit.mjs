// dp-audit.mjs — audit DP + Force Disposition + mot-clef UNIQUE des
// détachements vs le dump MFM.
//
// Comble le trou constaté à l'intégration v1.3 : apply.mjs ne compare que les
// POINTS (unités/améliorations) alors que le dump porte aussi, par détachement,
// `dp` et `force_disposition` (avec drapeaux `changed`) — le passage de Lions
// of the Emperor à 3 DP était passé inaperçu.
//
// Usage :  node editor/mfm/dp-audit.mjs [dir-dump]     (défaut: editor/mfm/dump/en)
// Sortie : les écarts réels (« ✗ »), les détachements MFM non appariés (« ? »),
// et les écarts Orks ignorés tant que le MFM est ≤ v1.3 (codex plus récent).
// Lecture seule — les corrections se font via editor/lib/catalog.js.
//
// Évalue les overrides de DP par chapitre (modifier `set` sur le coût DP
// conditionné `primary-catalogue`, à la MARINE_CHAPTER_COST) avant de signaler.
//
// CONTRÔLE SYMÉTRIQUE base → MFM (« ◇ à trancher ») : chaque détachement que
// l'APPLI propose à une faction (parser de l'app, clôture d'import — même
// résolution que build-map.mjs : pools.mjs, repli vendor/bsdata-parser.mjs) doit
// figurer dans la liste MFM du slug de cette faction (SLUG_TO_POOL). Sinon :
// ligne « à trancher » (retirer le détachement, le masquer pour la faction, ou
// consigner la décision). Un nom consigné dans editor/mfm/abandons.json pour ce
// slug sort en « ℹ ». Le sens MFM → base reste la ligne « ? » ci-dessous (et le
// « ⓪ » d'apply.mjs). Exemple : 19 détachements de chapitre 10e absents du MFM
// v1.6 et Gladius Task Force proposé aux Black Templars (inventaire du 2026-10-29).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";
import { SLUG_TO_POOL, parseRepo } from "./pools.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const DUMP = process.argv[2] || path.join(HERE, "dump/en");
const DP_TYPE_ID = "0d99-4ee2-7b3c-1f5a";
// slug MFM → id de catalogue (pour évaluer les overrides primary-catalogue)
const SLUG2CAT = {
  "black-templars": "36d3-36bc-68dd-40ac",
  "blood-angels": "4ef9-15ce-e3e6-36de",
  "deathwatch": "f89b-84e0-6e3b-f1e2",
  "dark-angels": "470a-6daa-9014-12df",
  "space-wolves": "94bb-3284-ee14-57a1",
};

const norm = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
// Clef tolérante à l'ordre des mots : « ORDO XENOS, ALIEN HUNTERS » ↔
// « Alien Hunters (Ordo Xenos) » partagent le même sac de mots.
const bag = (s) => norm(s).split(" ").sort().join(" ");

const c = new Catalog(ROOT);
await c.load();

// bdd : toute selectionEntry upgrade portant un coût DP direct = un détachement.
const byName = new Map(), byBag = new Map();
for (const [file, doc] of c.docs) {
  xml.walk(doc.root, (n) => {
    if (n.tag !== "selectionEntry" || xml.getAttr(n, "type") !== "upgrade") return;
    const costs = (n.children || []).find((k) => k.tag === "costs");
    const dp = costs && (costs.children || []).find((k) => k.tag === "cost" && xml.getAttr(k, "name") === "DP");
    if (!dp) return;
    const nm = xml.getAttrDecoded(n, "name") || "";
    // Toutes les dispositions (plusieurs profils = choix 1-parmi-X du joueur).
    const fds = [];
    const profs = (n.children || []).find((k) => k.tag === "profiles");
    if (profs) for (const p of profs.children || []) {
      if (p.tag === "profile" && xml.getAttrDecoded(p, "name") === "Force Disposition") {
        let v = null; xml.walk(p, (k) => { if (k.tag === "characteristic" && !v) v = xml.getText(k).trim(); });
        if (v) fds.push(v);
      }
    }
    const fd = fds.join(" / ") || null;
    const uniques = [];
    const cls = (n.children || []).find((k) => k.tag === "categoryLinks");
    if (cls) for (const l of cls.children || []) {
      const ln = xml.getAttrDecoded(l, "name") || "";
      if (/^UNIQUE\b/i.test(ln)) uniques.push(ln.toUpperCase().replace(/\s+/g, " ").trim());
    }
    const over = {};
    const mods = (n.children || []).find((k) => k.tag === "modifiers");
    if (mods) for (const m of mods.children || []) {
      if (m.tag !== "modifier" || xml.getAttr(m, "type") !== "set" || xml.getAttr(m, "field") !== DP_TYPE_ID) continue;
      xml.walk(m, (k) => {
        if (k.tag === "condition" && xml.getAttr(k, "scope") === "primary-catalogue")
          over[xml.getAttr(k, "childId")] = parseInt(xml.getAttr(m, "value"), 10);
      });
    }
    const rec = { file, nm, dp: parseInt(xml.getAttr(dp, "value"), 10), fd, over, uniques };
    (byName.get(norm(nm)) || byName.set(norm(nm), []).get(norm(nm))).push(rec);
    (byBag.get(bag(nm)) || byBag.set(bag(nm), []).get(bag(nm))).push(rec);
  });
}

const issues = [], orksSkipped = [], notFound = [];
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f.startsWith("_")) continue;
  const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8"));
  const vnum = parseFloat(String(d.version || "").replace(/^v/i, "")) || 0;
  for (const det of d.detachments || []) {
    const cands = byName.get(norm(det.name)) || byBag.get(bag(det.name));
    if (!cands) { notFound.push(`${d.slug} :: ${det.name}`); continue; }
    for (const b of cands) {
      const eff = (SLUG2CAT[d.slug] && b.over[SLUG2CAT[d.slug]] != null) ? b.over[SLUG2CAT[d.slug]] : b.dp;
      const bad = [];
      if (det.dp != null && eff !== det.dp) bad.push(`DP ${eff}→${det.dp}`);
      // Dump récent : force_dispositions (liste) ; ancien : la seule première.
      const want = Array.isArray(det.force_dispositions) && det.force_dispositions.length ? det.force_dispositions : [det.force_disposition].filter(Boolean);
      const fdm = want.join(" / ").trim();
      const setOf = (x) => String(x || "").split(" / ").map(norm).filter(Boolean).sort().join("|");
      // Ancien dump (1 seule valeur lue) : la base peut en porter davantage ;
      // on exige seulement que la valeur lue en fasse partie.
      const legacy = !Array.isArray(det.force_dispositions);
      if (fdm && b.fd && (legacy ? !setOf(b.fd).split("|").includes(norm(fdm)) : setOf(b.fd) !== setOf(fdm))) bad.push(`FD «${b.fd}»→«${fdm}»`);
      if (fdm && !b.fd) bad.push(`FD ABSENT→«${fdm}»`);
      let uWant = String(det.unique || "").toUpperCase().replace(/\s+/g, " ").trim();
      if (/REMOVED/.test(uWant)) uWant = "";
      const uHave = b.uniques.join(" + ");
      if (norm(uWant.replace(/^UNIQUE:?\s*/, "UNIQUE ")) !== norm(uHave.replace(/^UNIQUE:?\s*/, "UNIQUE ")))
        bad.push(`UNIQUE «${uHave || "aucun"}»→«${det.unique || "aucun"}»`);
      if (!bad.length) continue;
      const line = `[${d.slug}] ${b.nm} (${b.file}) : ${bad.join("; ")}`;
      // Exception Orks : le codex en base est plus récent qu'un MFM ≤ v1.3.
      if (d.slug === "orks" && vnum <= 1.3) orksSkipped.push(line);
      else issues.push(line);
    }
  }
}

// ── contrôle symétrique base → MFM ───────────────────────────────────────────
const toDecide = new Map(), symInfo = [];                  // clé slug::nom → { slug, name, facs[], dp, enh }
let symErr = null, all = null;
try { all = await parseRepo("dp-audit"); if (!all) symErr = "parser de l'app introuvable (ni dépôt frère, ni vendor/bsdata-parser.mjs)"; }
catch (e) { symErr = `parseAllCatalogues en échec (${e.message})`; }
const abandonsDet = new Map();                             // slug → Set(bag(nom)) — editor/mfm/abandons.json
try { for (const [slug, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(HERE, "abandons.json"), "utf8"))))
  if (!slug.startsWith("_") && v && typeof v === "object") abandonsDet.set(slug, new Map(Object.keys(v).map((n) => [bag(n), String(v[n])]))); }
catch (e) { if (e.code !== "ENOENT") symInfo.push(`abandons.json illisible (${e.message})`); }
if (all) {
  const pooled = new Set(Object.values(SLUG_TO_POOL).flat());
  const dumped = new Set();
  for (const f of fs.readdirSync(DUMP).sort()) {
    if (!f.endsWith(".json") || f.startsWith("_")) continue;
    const slug = f.replace(/\.json$/, ""); dumped.add(slug);
    const pool = SLUG_TO_POOL[slug];
    if (!pool) { symInfo.push(`slug MFM sans faction de l'appli (pools.mjs) : ${slug}`); continue; }
    const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8"));
    const mfmDets = new Set((d.detachments || []).map((x) => bag(x.name)));
    for (const fac of pool) {
      const F = all[fac];
      if (!F) { symInfo.push(`faction « ${fac} » (${slug}) absente de la sortie du parser`); continue; }
      for (const det of F.dets || []) {
        if (mfmDets.has(bag(det.name))) continue;
        const ab = (abandonsDet.get(slug) || new Map()).get(bag(det.name));
        if (ab) { symInfo.push(`[${slug}] ${fac} :: ${det.name} — consigné dans abandons.json (${ab})`); continue; }
        const k = slug + "::" + det.name;
        if (!toDecide.has(k)) toDecide.set(k, { slug, name: det.name, facs: [], dp: det.dp, enh: (F.enhs || []).filter((e) => e.det === det.name).length });
        toDecide.get(k).facs.push(fac);
      }
    }
  }
  // factions de l'appli qui proposent des détachements sans barème MFM (aucun slug du dump ne les couvre)
  for (const [fac, F] of Object.entries(all)) if ((F.dets || []).length && !pooled.has(fac)) symInfo.push(`faction de l'appli sans barème MFM (pools.mjs) : ${fac} — ${F.dets.length} détachement(s) non contrôlé(s)`);
  for (const [slug, pool] of Object.entries(SLUG_TO_POOL)) if (!dumped.has(slug)) symInfo.push(`slug ${slug} (${pool.join(", ")}) absent du dump : non contrôlé`);
}

if (notFound.length) {
  console.log(`? détachements MFM non appariés (${notFound.length}) — nouveaux dets ou renommages à examiner :`);
  for (const x of notFound) console.log("  ?", x);
}
if (orksSkipped.length) {
  console.log(`~ écarts Orks ignorés (MFM ≤ v1.3, codex plus récent) : ${orksSkipped.length}`);
}
if (symErr) { console.log(`⚠ contrôle symétrique base → MFM indisponible : ${symErr}`); process.exitCode = 1; }
else if (toDecide.size) {
  console.log(`◇ À TRANCHER — détachements proposés par l'appli ABSENTS du MFM de leur faction (${toDecide.size}) : retirer, masquer pour la faction, ou consigner la décision :`);
  for (const t of toDecide.values()) console.log(`  ◇ [${t.slug}] ${t.name} — proposé à ${t.facs.join(", ")} (${t.dp ?? "?"} DP, ${t.enh} amélioration(s)) ; absent du MFM ${t.slug}`);
  process.exitCode = 1;
} else console.log("✓ contrôle symétrique : tout détachement proposé par l'appli figure au MFM de sa faction.");
for (const l of symInfo) console.log("  ℹ", l);
if (issues.length) {
  console.log(`✗ ÉCARTS DP/FD/UNIQUE (${issues.length}) — à corriger via editor/lib/catalog.js :`);
  for (const x of [...new Set(issues)]) console.log("  ✗", x);
  process.exitCode = 1;
} else {
  console.log("✓ DP, Force Dispositions et mots-clefs UNIQUE alignés sur le MFM.");
}
