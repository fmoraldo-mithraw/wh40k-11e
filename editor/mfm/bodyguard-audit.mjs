// bodyguard-audit.mjs — audit des LISTES DE RATTACHEMENT (Leader / Support) vs le dump MFM.
//
// Le MFM imprime sous chaque fiche de personnage la liste des unités qu'il peut
// mener (bloc LEADER, champ `leader_targets`) ou rejoindre (bloc SUPPORT, champ
// `support_targets`, lu depuis le dump v1.6) et étiquette « BODYGUARD UNITS
// UPDATED » les fiches dont GW vient de changer la liste. apply.mjs ignore
// volontairement cette étiquette : en base, les rattachements suivent la FICHE
// OFFICIELLE (game-datacards `attachesTo`, posés par
// editor/translations/gdc-attach.cjs), qui fait foi. Sans contrôle croisé,
// un décalage entre les deux sources passe inaperçu — d'où cet audit.
//
// Un écart n'est donc PAS à corriger à la main : il dit que l'instantané
// game-datacards est en retard sur le MFM (rafraîchir la veille,
// editor/SOURCE_GAME_DATACARDS.md, puis relancer gdc-attach.cjs), que
// l'appariement de nom de gdc-attach décroche, ou qu'il faut un arbitrage.
// Écrire les liens à la main serait défait au prochain gdc-attach (il retire
// les liens que la fiche officielle ne porte pas).
//
// Classement de chaque cible MFM (2026-10-29) :
//   · fiche de la base (matrice map/<slug>.json, alias compris) → liée ? sinon ÉCART ;
//   · fiche LEGENDS du MFM (editor/mfm/legends.json, `mfm_parser.py legends`) → hors
//     base (décision du 2026-10-22), simple info — SAUF si un marqueur `leader-kw:`
//     du meneur la vise par une catégorie homonyme : rattachement à une AUTRE fiche
//     par mot-clef de nom → ⚑ à arbitrer ;
//   · prédicat de mots-clefs (« BATTLELINE IMPERIUM INFANTRY ») couvert par un
//     `leader-kw:` de mêmes mots → conforme ;
//   · fiche au barème MFM mais absente de la base → domaine d'apply.mjs (①), info.
// Lien de la base absent du MFM : `attachOverrides` du manifeste game-datacards
// (document officiel plus récent) → info ; sinon ÉCART.
// Le meneur est résolu par la matrice de SA faction : deux fiches homonymes de
// factions différentes (Sorcerer CSM / EC / TS, Ministorum Priest AS / AM, Watch
// Master DW / Agents) ne mélangent plus leurs listes.
//
// Usage : node editor/mfm/bodyguard-audit.mjs [dir-dump] [--all]
//   défaut : editor/mfm/dump/en, et seules les fiches étiquetées
//   « BODYGUARD UNITS UPDATED » sont auditées ; --all les audite toutes.
// Lecture seule ; sortie ≠ 0 s'il reste un écart (les ⚑ et les infos n'y comptent pas).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ALL = process.argv.includes("--all");
const DUMP = process.argv.slice(2).find((a) => !a.startsWith("--")) || path.join(ROOT, "editor/mfm/dump/en");
const MAPS = path.join(ROOT, "editor/mfm/map");
const c = new Catalog(ROOT); await c.load();

const FWD = { leader: "Can Lead (MFM)", support: "Can Support (MFM)" };
const REV = { leader: "Led By (MFM)", support: "Supported By (MFM)" };
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const N = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[\u2018\u2019'`]/g, "'").replace(/[\u2010-\u2015]/g, "-").replace(/\s+/g, " ").trim();
const tokens = (s) => N(s).split(/[^a-z0-9'-]+/).filter(Boolean).sort().join(" ");
const readJson = (f, dflt) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return dflt; } };

const groupLinks = (u, gname) => {
  const out = []; const gs = xml.child(u, "selectionEntryGroups"); if (!gs) return out;
  for (const g of gs.children) if (g.tag === "selectionEntryGroup" && nm(g) === gname) {
    const el = xml.child(g, "entryLinks"); if (el) for (const l of el.children) if (l.tag === "entryLink") out.push(xml.getAttr(l, "targetId"));
  }
  return out;
};
// marqueur `leader-kw: A & B | C` du <comment> de la fiche → groupes de noms de catégories
const leaderKw = (u) => {
  const com = (u.children || []).find((k) => k.tag === "comment"); const t = com ? xml.getText(com) || "" : "";
  const m = t.split("\n").map((l) => l.trim()).find((l) => /^leader-kw:/i.test(l));
  return m ? m.replace(/^leader-kw:\s*/i, "").split("|").map((g) => g.split("&").map((s) => s.trim()).filter(Boolean)).filter((g) => g.length) : [];
};

// fiches racine par nom normalisé (repli quand la matrice ne connaît pas un nom)
const byName = new Map();
for (const [, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) {
  const bx = xml.child(d.root, b); if (!bx) continue;
  for (const u of bx.children) {
    if (u.tag !== "selectionEntry" || !/^(unit|model)$/.test(xml.getAttr(u, "type") || "")) continue;
    const k = N(nm(u)); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(u);
  }
}
// catégorie (nom normalisé) → noms des fiches racine qui la portent (pour nommer la cible d'un leader-kw)
const catCarriers = new Map();
for (const list of byName.values()) for (const u of list) {
  const cl = xml.child(u, "categoryLinks"); if (!cl) continue;
  for (const k of cl.children) if (k.tag === "categoryLink") { const n = N(nm(k)); if (!catCarriers.has(n)) catCarriers.set(n, new Set()); catCarriers.get(n).add(nm(u)); }
}
// liens INVERSES : id du meneur → ids des cibles qui le visent (hors clôture d'import du meneur)
const rev = { leader: new Map(), support: new Map() };
for (const [, d] of c.docs) xml.walk(d.root, (u) => {
  if (u.tag !== "selectionEntry") return;
  for (const k of ["leader", "support"]) for (const id of groupLinks(u, REV[k])) {
    if (!rev[k].has(id)) rev[k].set(id, new Set()); rev[k].get(id).add(xml.getAttr(u, "id"));
  }
});

// matrices MFM → base (alias compris) : par faction, et toutes factions confondues
const maps = new Map(); const anyMap = new Map();
for (const f of fs.existsSync(MAPS) ? fs.readdirSync(MAPS) : []) {
  if (!f.endsWith(".json")) continue; const m = readJson(path.join(MAPS, f), {}); const per = new Map();
  for (const [name, v] of Object.entries(m.matched || {})) {
    const ids = (v.targets || []).map((t) => t.bsId).filter(Boolean); per.set(N(name), ids);
    if (!anyMap.has(N(name))) anyMap.set(N(name), new Set()); for (const id of ids) anyMap.get(N(name)).add(id);
  }
  maps.set(f.replace(/\.json$/, ""), per);
}
const LEG = readJson(path.join(ROOT, "editor/mfm/legends.json"), null);
const legends = new Set(); if (LEG) for (const names of Object.values(LEG.factions || {})) for (const n of names) legends.add(N(n));
const OVR = readJson(path.join(ROOT, "editor/sources/game-datacards.json"), {}).attachOverrides || {};

const cards = []; const priced = new Set(); let dumpVersion = null;
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f === "_index.json") continue;
  const slug = f.replace(/\.json$/, ""); const J = JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8"));
  dumpVersion = dumpVersion || J.version;
  for (const u of J.units || []) {
    priced.add(N(u.name));
    if (!u.leader_targets && !u.support_targets) continue;
    const tags = (u.change_tags || []).map((t) => String(t).toUpperCase());
    if (ALL || tags.some((t) => t.includes("BODYGUARD"))) cards.push({ slug, name: u.name, leader: u.leader_targets, support: u.support_targets });
  }
}
// cible MFM → ids de fiches de la base (matrice de la faction, puis toutes, puis nom EXACT) ; les noms qui
// diffèrent (« Eradicator Squad with melta rifles » → « Eradicator Squad ») passent par les alias de la matrice —
// jamais par un préfixe : « Vanguard Veteran Squad » (Legends, à pied) n'est pas « … with Jump Packs »
const targetIds = (slug, t) => {
  const per = maps.get(slug); if (per && per.has(N(t)) && per.get(N(t)).length) return new Set(per.get(N(t)));
  if (anyMap.has(N(t)) && anyMap.get(N(t)).size) return anyMap.get(N(t));
  return new Set((byName.get(N(t)) || []).map((u) => xml.getAttr(u, "id")));
};

const gaps = [], flags = [], infos = { legends: new Map(), keyword: 0, overrides: [], absentSheet: [], absentLeader: [] };
let okCount = 0, lists = 0;
const seenCard = new Set();
for (const t of cards) {
  const key = `${t.slug}|${N(t.name)}`; if (seenCard.has(key)) continue; seenCard.add(key); // carte répétée dans plusieurs sections
  const per = maps.get(t.slug);
  let leaders = (per && per.get(N(t.name)) || []).map((id) => c.byId.get(id)).filter((h) => h && h.node.tag === "selectionEntry").map((h) => h.node);
  if (!leaders.length) leaders = byName.get(N(t.name)) || [];
  if (!leaders.length) { infos.absentLeader.push(`[${t.slug}] ${t.name}`); continue; }
  const kwGroups = leaders.flatMap(leaderKw);
  for (const sens of ["leader", "support"]) {
    const mfm = [...new Set(String(t[sens] || "").split(",").map((s) => s.trim()).filter(Boolean))];
    if (!mfm.length) continue;
    lists++;
    const base = new Map(); // id → nom
    for (const u of leaders) {
      for (const id of groupLinks(u, FWD[sens])) base.set(id, nameOf(id));
      for (const id of rev[sens].get(xml.getAttr(u, "id")) || []) base.set(id, nameOf(id));
    }
    const covered = new Set(); const missing = [], unknown = [];
    for (const m of mfm) {
      const ids = targetIds(t.slug, m);
      if (ids.size) {
        const hit = [...base].filter(([id, n]) => ids.has(id) || N(n) === N(m));
        if (hit.length) hit.forEach(([id]) => covered.add(id)); else missing.push(m);
        continue;
      }
      const kwSame = kwGroups.find((g) => g.length === 1 && N(g[0]) === N(m));
      const kwTok = kwGroups.find((g) => tokens(g.join(" ")) === tokens(m));
      if (legends.has(N(m))) {
        if (!infos.legends.has(m)) infos.legends.set(m, 0); infos.legends.set(m, infos.legends.get(m) + 1);
        if (kwSame) flags.push(`[${t.slug}] ${t.name} (${sens}) — cible Legends « ${m} » visée par leader-kw: ${kwSame[0]} → rattache en fait à : ${[...(catCarriers.get(N(kwSame[0])) || [])].filter((x) => N(x) !== N(m)).join(", ") || "?"}`);
      } else if (kwTok) infos.keyword++;
      else if (priced.has(N(m))) infos.absentSheet.push(`[${t.slug}] ${t.name} → ${m}`);
      else unknown.push(m);
    }
    const overrides = new Set(((OVR[nm(leaders[0])] || {})[sens]) || []);
    const extra = [];
    for (const [id, n] of base) {
      if (covered.has(id) || mfm.some((m) => N(n) === N(m))) continue;
      if ([...overrides].some((o) => N(o) === N(n))) infos.overrides.push(`[${t.slug}] ${t.name} → ${n}`);
      else extra.push(n);
    }
    if (!missing.length && !extra.length && !unknown.length) { okCount++; continue; }
    gaps.push(`[${t.slug}] ${t.name} (${sens}) — MFM ${mfm.length} / base ${base.size}`
      + (missing.length ? `\n     absent(s) en base : ${missing.join(", ")}` : "")
      + (extra.length ? `\n     en trop en base   : ${extra.join(", ")}` : "")
      + (unknown.length ? `\n     cible(s) non résolue(s) : ${unknown.join(", ")}` : ""));
  }
}
function nameOf(id) { const h = c.byId.get(id); return h ? nm(h.node) : id; }

console.log(`fiches auditées : ${seenCard.size}${ALL ? " (toutes)" : " (étiquetées « BODYGUARD UNITS UPDATED »)"} · listes comparées : ${lists} · conformes : ${okCount}`);
if (!LEG) console.log("⚠ editor/mfm/legends.json absent : les cibles Legends tombent en « non résolues » (python3 editor/mfm/mfm_parser.py legends -o editor/mfm/legends.json)");
else if (dumpVersion && LEG.version && LEG.version !== dumpVersion) console.log(`⚠ legends.json est en ${LEG.version}, le dump en ${dumpVersion} : rafraîchir (python3 editor/mfm/mfm_parser.py legends -o editor/mfm/legends.json)`);
if (infos.legends.size) console.log(`ℹ cibles Legends (hors base, décision du 2026-10-22) : ${[...infos.legends].map(([n, k]) => `${n} ×${k}`).join(", ")}`);
if (infos.keyword) console.log(`ℹ cibles par mots-clefs couvertes par un leader-kw : ${infos.keyword}`);
if (infos.overrides.length) console.log(`ℹ liens posés par attachOverrides (document officiel plus récent) : ${infos.overrides.join(" ; ")}`);
if (infos.absentSheet.length) console.log(`ℹ cibles au barème MFM sans fiche en base (domaine d'apply.mjs ①) : ${infos.absentSheet.join(" ; ")}`);
if (infos.absentLeader.length) console.log(`ℹ meneurs MFM sans fiche en base (domaine d'apply.mjs ①) : ${infos.absentLeader.join(" ; ")}`);
if (flags.length) { console.log(`\n── ⚑ À ARBITRER (${flags.length}) — leader-kw qui vise une fiche Legends par une catégorie homonyme ──`); for (const f of flags) console.log("  ⚑ " + f); }
if (!gaps.length) { console.log("✓ listes de rattachement alignées sur le MFM."); process.exit(0); }
console.log(`\n── ÉCARTS (${gaps.length}) — instantané game-datacards en retard sur le MFM, appariement de gdc-attach, ou arbitrage requis ──`);
for (const g of gaps) console.log("  • " + g);
console.log("\nNe PAS écrire ces liens à la main : rafraîchir la veille game-datacards");
console.log("(editor/SOURCE_GAME_DATACARDS.md) puis `node editor/translations/gdc-attach.cjs <gdc>/11th/gdc --write`.");
process.exit(1);
