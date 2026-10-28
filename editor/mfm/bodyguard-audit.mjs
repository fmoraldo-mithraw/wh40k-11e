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
// editor/SOURCE_GAME_DATACARDS.md, puis relancer gdc-attach.cjs) ou qu'il faut
// un arbitrage. Écrire les liens à la main serait défait au prochain
// gdc-attach (il retire les liens que la fiche officielle ne porte pas).
//
// Usage : node editor/mfm/bodyguard-audit.mjs [dir-dump] [--all]
//   défaut : editor/mfm/dump/en, et seules les fiches étiquetées
//   « BODYGUARD UNITS UPDATED » sont auditées ; --all les audite toutes.
// Lecture seule ; sortie ≠ 0 s'il reste un écart.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "../lib/catalog.js";
import * as xml from "../lib/xml.js";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ALL = process.argv.includes("--all");
const DUMP = process.argv.slice(2).find((a) => !a.startsWith("--")) || path.join(ROOT, "editor/mfm/dump/en");
const c = new Catalog(ROOT); await c.load();

const FWD = { leader: "Can Lead (MFM)", support: "Can Support (MFM)" };
const REV = { leader: "Led By (MFM)", support: "Supported By (MFM)" };
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[‘’'`]/g, "'").replace(/[‐-―]/g, "-").replace(/\s+/g, " ").trim();
// « Eradicator Squad » (base) couvre « Eradicator Squad with Melta Rifles » (MFM, fiche scindée) et l'inverse.
const same = (a, b) => a === b || a.startsWith(b + " with") || b.startsWith(a + " with");

const nameById = new Map();
for (const [, d] of c.docs) xml.walk(d.root, (n) => { if (n.tag === "selectionEntry") nameById.set(xml.getAttr(n, "id"), nm(n)); });

const groupLinks = (u, gname) => {
  const out = []; const gs = xml.child(u, "selectionEntryGroups"); if (!gs) return out;
  for (const g of gs.children) if (g.tag === "selectionEntryGroup" && nm(g) === gname) {
    const el = xml.child(g, "entryLinks"); if (el) for (const l of el.children) if (l.tag === "entryLink") out.push(xml.getAttr(l, "targetId"));
  }
  return out;
};

// fiches racine par nom normalisé (tronc + copies locales des chapitres)
const byName = new Map();
for (const [, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) {
  const bx = xml.child(d.root, b); if (!bx) continue;
  for (const u of bx.children) {
    if (u.tag !== "selectionEntry" || !/^(unit|model)$/.test(xml.getAttr(u, "type") || "")) continue;
    const k = N(nm(u)); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(u);
  }
}
// liens INVERSES : id du meneur → noms des cibles qui le visent (hors clôture d'import du meneur)
const rev = { leader: new Map(), support: new Map() };
for (const [, d] of c.docs) xml.walk(d.root, (u) => {
  if (u.tag !== "selectionEntry") return;
  for (const k of ["leader", "support"]) for (const id of groupLinks(u, REV[k])) {
    if (!rev[k].has(id)) rev[k].set(id, new Set()); rev[k].get(id).add(nm(u));
  }
});

const cards = [];
for (const f of fs.readdirSync(DUMP).sort()) {
  if (!f.endsWith(".json") || f === "_index.json") continue;
  const slug = f.replace(/\.json$/, "");
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (typeof o.name === "string" && ("leader_targets" in o || "support_targets" in o)) {
      const tags = (o.change_tags || []).map((t) => String(t).toUpperCase());
      if (ALL || tags.some((t) => t.includes("BODYGUARD"))) cards.push({ slug, name: o.name, leader: o.leader_targets, support: o.support_targets });
    }
    Object.values(o).forEach(walk);
  };
  walk(JSON.parse(fs.readFileSync(path.join(DUMP, f), "utf8")));
}

const gaps = []; let okCount = 0, lists = 0;
for (const t of cards) {
  const cands = byName.get(N(t.name));
  if (!cands) { gaps.push(`[${t.slug}] ${t.name} — aucune fiche en base pour ce nom MFM`); continue; }
  for (const sens of ["leader", "support"]) {
    const mfm = String(t[sens] || "").split(",").map(N).filter(Boolean);
    if (!mfm.length) continue;
    lists++;
    const base = new Set();
    for (const u of cands) {
      for (const id of groupLinks(u, FWD[sens])) base.add(N(nameById.get(id) || id));
      for (const x of rev[sens].get(xml.getAttr(u, "id")) || []) base.add(N(x));
    }
    const missing = mfm.filter((m) => ![...base].some((b) => same(b, m)));
    const extra = [...base].filter((b) => !mfm.some((m) => same(b, m)));
    if (!missing.length && !extra.length) { okCount++; continue; }
    gaps.push(`[${t.slug}] ${t.name} (${sens}) — MFM ${mfm.length} / base ${base.size}`
      + (missing.length ? `\n     absent(s) en base : ${missing.join(", ")}` : "")
      + (extra.length ? `\n     en trop en base   : ${extra.join(", ")}` : ""));
  }
}

console.log(`fiches auditées : ${cards.length}${ALL ? " (toutes)" : " (étiquetées « BODYGUARD UNITS UPDATED »)"} · listes comparées : ${lists} · conformes : ${okCount}`);
if (!gaps.length) { console.log("✓ listes de rattachement alignées sur le MFM."); process.exit(0); }
console.log(`\n── ÉCARTS (${gaps.length}) — instantané game-datacards en retard sur le MFM, ou arbitrage requis ──`);
for (const g of gaps) console.log("  • " + g);
console.log("\nNe PAS écrire ces liens à la main : rafraîchir la veille game-datacards");
console.log("(editor/SOURCE_GAME_DATACARDS.md) puis `node editor/translations/gdc-attach.cjs <gdc>/11th/gdc --write`.");
process.exit(1);
