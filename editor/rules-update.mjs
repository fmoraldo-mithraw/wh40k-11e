// Mise à jour de caractéristiques par faction (updates globales GW : « change
// the following weapon/unit characteristics »), pilotée par une table JSON
// (editor/rules-updates/*.json — voir son champ _doc).
//
// Le piège : une même fiche / un même profil est souvent PARTAGÉ entre
// factions (véhicules Chaos définis dans Chaos Space Marines et importés par
// Death Guard, World Eaters, Emperor's Children…). Pour chaque profil touché :
//   • si TOUTES les factions qui l'utilisent reçoivent le même changement →
//     la caractéristique est modifiée directement (valeur imprimée) ;
//   • sinon → <modifier type="set" field="<caractéristique>"> sur le profil,
//     conditionné `primary-catalogue` sur les seules factions concernées
//     (natif BattleScribe ; l'appli le résout faction par faction).
// Un mot-clef retiré (removeKeywords) suit la même logique sur la fiche :
// categoryLink supprimé, ou <modifier type="remove" field="category">
// conditionné.
//
// Contrôles affichés : unité introuvable, arme introuvable sur une unité, et
// unités de la faction qui portent le MÊME profil sans être listées (le
// changement les toucherait aussi → à vérifier).
//
// usage : node editor/rules-update.mjs <table.json> [--apply]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const { Catalog } = require(path.join(REPO, "editor/lib/catalog"));
const xml = require(path.join(REPO, "editor/lib/xml"));

const specPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!specPath) { console.error("usage: node editor/rules-update.mjs <table.json> [--apply]"); process.exit(1); }
const spec = JSON.parse(readFileSync(specPath, "utf8"));

const c = new Catalog(REPO).load();
const A = (n, k) => xml.getAttrDecoded(n, k);
const kids = (n, tag, childTag) => ((xml.child(n, tag) || {}).children || []).filter((x) => x.tag === childTag);
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^[➤➜\s]+/, "").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

// ── catalogues ───────────────────────────────────────────────────────────────
const catInfo = new Map(); // file → { id, name, library, links:[{id, importRoot}] }
for (const [f, doc] of c.docs) {
  const r = doc.root; if (!r || r.tag !== "catalogue") continue;
  catInfo.set(f, { id: A(r, "id"), name: A(r, "name"), library: A(r, "library") === "true",
    links: kids(r, "catalogueLinks", "catalogueLink").map((l) => ({ id: A(l, "targetId"), importRoot: A(l, "importRootEntries") === "true" })) });
}
const fileById = new Map([...catInfo].map(([f, i]) => [i.id, f]));

// Unités EXPOSÉES par une faction : ses entryLinks racine + ceux des catalogues
// liés avec importRootEntries (transitivement).
const exposedCache = new Map();
function exposedUnits(file) {
  if (exposedCache.has(file)) return exposedCache.get(file);
  const out = new Map(); const seen = new Set();
  const visit = (f, own) => {
    if (seen.has(f)) return; seen.add(f);
    const doc = c.docs.get(f); if (!doc) return;
    for (const el of kids(doc.root, "entryLinks", "entryLink")) {
      const t = c.byId.get(A(el, "targetId")); if (!t) continue;
      const ty = A(t.node, "type"); if (ty !== "unit" && ty !== "model") continue;
      const k = A(t.node, "id"); if (!out.has(k)) out.set(k, { node: t.node, file: t.file, name: A(t.node, "name"), own });
    }
    for (const l of catInfo.get(f)?.links || []) if (l.importRoot && fileById.has(l.id)) visit(fileById.get(l.id), false);
  };
  visit(file, true);
  exposedCache.set(file, out);
  return out;
}

// Profils atteints depuis une fiche (entrées, groupes, liens, infoLinks de
// profil) — sans descendre dans les groupes méta (Can Lead…), les menus
// d'améliorations, ni dans une AUTRE fiche d'unité.
const SKIP_GROUP = /^(Can (Lead|Support) \(MFM\))$|Enhancement|Crusade|Battle Scar|Battle Honour/i;
const profCache = new Map();
function profilesOf(entry) {
  const key = A(entry, "id");
  if (profCache.has(key)) return profCache.get(key);
  const out = new Map(); const seen = new Set();
  const visit = (n, depth) => {
    if (!n || depth > 12) return;
    const id = A(n, "id"); if (id) { if (seen.has(id)) return; seen.add(id); }
    for (const pr of kids(n, "profiles", "profile")) out.set(A(pr, "id"), pr);
    for (const il of kids(n, "infoLinks", "infoLink")) {
      if (A(il, "type") !== "profile") continue;
      const t = c.byId.get(A(il, "targetId")); if (t && t.node.tag === "profile") out.set(A(t.node, "id"), t.node);
    }
    for (const se of kids(n, "selectionEntries", "selectionEntry")) visit(se, depth + 1);
    for (const g of kids(n, "selectionEntryGroups", "selectionEntryGroup")) { if (!SKIP_GROUP.test(A(g, "name") || "")) visit(g, depth + 1); }
    for (const el of kids(n, "entryLinks", "entryLink")) {
      if (SKIP_GROUP.test(A(el, "name") || "") || A(el, "hidden") === "true") continue;
      const t = c.byId.get(A(el, "targetId")); if (!t) continue;
      if (t.node.tag === "selectionEntry" && A(t.node, "type") === "unit" && depth > 0) continue;
      visit(t.node, depth + 1);
    }
  };
  visit(entry, 0);
  profCache.set(key, out);
  return out;
}

const weaponMatch = (pr, want) => {
  const tn = A(pr, "typeName") || "";
  if (!/Weapons$/.test(tn)) return false;
  let w = want, need = null;
  const m = w.match(/\s*\((ranged|melee|ranged and melee)\)\s*$/i);
  if (m) { w = w.slice(0, m.index); need = m[1].toLowerCase(); }
  if (need === "ranged" && !/^Ranged/.test(tn)) return false;
  if (need === "melee" && !/^Melee/.test(tn)) return false;
  return norm(A(pr, "name")).split(" - ")[0] === norm(w);
};

// ── lecture de la table ──────────────────────────────────────────────────────
const problems = [];
const requests = new Map(); // `${pid}|${charName}` → { pid, prof, char, value, factions:Set(file), desc:[] }
const kwRequests = []; // { faction file, unit entry, keyword }
// Qui utilise un profil ? Raisonné par FICHE (datasheet = id d'entrée), pas
// par faction : une fiche importée en ALLIÉ (unités CSM dans une armée de
// Daemons) reste la même fiche — le changement la suit.
const usersOfProfile = new Map(); // pid → Set(datasheet ids)
const dsName = new Map(); // datasheet id → name
const factionFiles = [...catInfo].filter(([, i]) => !i.library).map(([f]) => f);
for (const f of factionFiles) for (const u of exposedUnits(f).values()) {
  dsName.set(A(u.node, "id"), u.name);
  for (const pid of profilesOf(u.node).keys()) {
    if (!usersOfProfile.has(pid)) usersOfProfile.set(pid, new Set());
    usersOfProfile.get(pid).add(A(u.node, "id"));
  }
}

function findUnit(file, name) {
  const ex = exposedUnits(file);
  const hits = [...ex.values()].filter((u) => norm(u.name) === norm(name));
  if (hits.length) return hits.sort((a, b) => (b.own ? 1 : 0) - (a.own ? 1 : 0))[0];
  // nom générique (« Masters of the Maelstrom ») → toutes les fiches qui le préfixent
  return null;
}
const addReq = (pr, charName, value, file, desc, dsId) => {
  const k = A(pr, "id") + "|" + charName;
  const r = requests.get(k) || { pid: A(pr, "id"), prof: pr, char: charName, values: new Map(), desc: [] };
  if (!r.values.has(value)) r.values.set(value, { facs: new Set(), ds: new Set() });
  r.values.get(value).facs.add(file); r.values.get(value).ds.add(dsId); r.desc.push(desc); requests.set(k, r);
};

for (const [fname, fx] of Object.entries(spec.factions || {})) {
  const file = fx.file;
  if (!catInfo.has(file)) { problems.push(`[${fname}] fichier introuvable : ${file}`); continue; }
  const unitsFor = (names) => {
    const out = [];
    for (const n of names) {
      const u = findUnit(file, n);
      if (u) out.push(u);
      else {
        const pref = [...exposedUnits(file).values()].filter((x) => norm(x.name).startsWith(norm(n)));
        if (pref.length) out.push(...pref); else problems.push(`[${fname}] unité introuvable : ${n}`);
      }
    }
    return out;
  };
  for (const w of fx.weapons || []) {
    const units = unitsFor(w.units);
    const listed = new Set(units.map((u) => A(u.node, "id")));
    const pids = new Set();
    for (const u of units) {
      const hits = [...profilesOf(u.node).values()].filter((pr) => weaponMatch(pr, w.name));
      if (!hits.length) { problems.push(`[${fname}] « ${w.name} » introuvable sur ${u.name}`); continue; }
      for (const pr of hits) {
        pids.add(A(pr, "id"));
        for (const [ch, v] of Object.entries(w.set)) addReq(pr, ch, v, file, `${fname} · ${w.name} · ${u.name}`, A(u.node, "id"));
      }
    }
    // Unités de la faction qui portent le même profil sans être listées.
    for (const u of exposedUnits(file).values()) {
      if (listed.has(A(u.node, "id"))) continue;
      const hit = [...pids].some((pid) => profilesOf(u.node).has(pid));
      if (hit) problems.push(`[${fname}] « ${w.name} » : ${u.name} porte le même profil sans être listée`);
    }
  }
  for (const st of fx.stats || []) {
    for (const u of unitsFor(st.units)) {
      const ups = [...profilesOf(u.node).values()].filter((pr) => A(pr, "typeName") === "Unit");
      if (!ups.length) { problems.push(`[${fname}] profil d'unité introuvable : ${u.name}`); continue; }
      for (const pr of ups) for (const [ch, v] of Object.entries(st.set)) addReq(pr, ch, v, file, `${fname} · ${u.name} (${A(pr, "name")})`, A(u.node, "id"));
    }
  }
  for (const kw of fx.removeKeywords || []) for (const u of unitsFor(kw.units)) kwRequests.push({ file, fname, u, keyword: kw.keyword });
}

// ── plan ─────────────────────────────────────────────────────────────────────
const charOf = (pr, name) => kids(pr, "characteristics", "characteristic").find((ch) => norm(A(ch, "name")) === norm(name));
const plan = [];
for (const r of requests.values()) {
  const ch = charOf(r.prof, r.char);
  if (!ch) { problems.push(`caractéristique « ${r.char} » absente du profil ${A(r.prof, "name")} (${r.pid})`); continue; }
  const users = usersOfProfile.get(r.pid) || new Set();
  for (const [value, { facs, ds }] of r.values) {
    // Toutes les fiches qui portent ce profil reçoivent CE changement → direct.
    const others = [...users].filter((id) => !ds.has(id));
    plan.push({ r, ch, value, facs, ds, others, mode: others.length || r.values.size > 1 ? "conflict" : "direct", users });
  }
}

const fname = (f) => (catInfo.get(f)?.name || f).replace(/^(Chaos|Imperium) - /, "");
let nDirect = 0, nCond = 0, nSame = 0;
for (const p of plan) {
  const cur = (xml.getText(p.ch) || "").trim();
  const tag = `${A(p.r.prof, "name")} [${A(p.r.prof, "typeName")}] ${p.r.char}: ${cur} → ${p.value}`;
  if (p.mode === "direct") {
    if (cur === p.value) { nSame++; continue; }
    nDirect++; if (process.argv.includes("--verbose")) console.log(`  = direct   ${tag}  (${[...p.users].map((id) => dsName.get(id)).join(", ")})`);
  } else {
    nCond++; console.log(`  ✗ CONFLIT  ${tag} (${p.r.pid}) — cité : ${[...p.ds].map((id) => dsName.get(id)).join(", ")} | NON cité mais même profil : ${p.others.map((id) => dsName.get(id)).join(", ")}`);
  }
}
for (const k of kwRequests) console.log(`  − mot-clef ${k.keyword} retiré de ${k.u.name} pour ${k.fname}`);
console.log(`\n${nDirect} modification(s) directe(s), ${nCond} conflit(s), ${nSame} déjà à jour, ${kwRequests.length} mot(s)-clef(s).`);
if (problems.length) { console.log(`\n⚑ À VÉRIFIER (${problems.length}) :`); for (const p of [...new Set(problems)]) console.log("  " + p); }
if (!APPLY) { console.log("\n(dry-run — relancer avec --apply pour écrire)"); process.exit(0); }

// ── écriture ─────────────────────────────────────────────────────────────────
const dirty = new Set();
const markFileOf = (node) => { const h = c.byId.get(A(node, "id")); if (h) dirty.add(h.file); };
const condGroup = (facs) => {
  const g = xml.elem("conditionGroup", { type: "or" }); g.selfClose = false;
  const conds = xml.elem("conditions", {}); conds.selfClose = false;
  for (const f of facs) conds.children.push(xml.elem("condition", { type: "instanceOf", value: "1", field: "selections", scope: "primary-catalogue", childId: catInfo.get(f).id, shared: "true" }));
  g.children.push(conds);
  const gs = xml.elem("conditionGroups", {}); gs.selfClose = false; gs.children.push(g);
  return gs;
};
// ── Séparation des fiches NON citées (conflits) ──────────────────────────────
// Le texte est appliqué à la lettre : une fiche qui partage le profil sans être
// citée garde l'ancienne valeur. On lui donne SA copie : le lien le plus
// profond de son chemin vers le profil qui ne sert QU'aux fiches non citées est
// redirigé vers une copie de sa cible (ids renumérotés, références internes
// remappées) ; le profil commun peut alors être modifié directement.
const byIdNode = (id) => c.byId.get(id);
function pathsTo(entry, pid) {
  const out = [];
  const visit = (n, links, depth, seen) => {
    if (!n || depth > 12) return;
    const id = A(n, "id"); if (id) { if (seen.has(id)) return; seen = new Set(seen); seen.add(id); }
    for (const pr of kids(n, "profiles", "profile")) if (A(pr, "id") === pid) out.push(links);
    for (const il of kids(n, "infoLinks", "infoLink")) if (A(il, "type") === "profile" && A(il, "targetId") === pid) out.push([...links, il]);
    for (const se of kids(n, "selectionEntries", "selectionEntry")) visit(se, links, depth + 1, seen);
    for (const g of kids(n, "selectionEntryGroups", "selectionEntryGroup")) if (!SKIP_GROUP.test(A(g, "name") || "")) visit(g, links, depth + 1, seen);
    for (const el of kids(n, "entryLinks", "entryLink")) {
      if (SKIP_GROUP.test(A(el, "name") || "") || A(el, "hidden") === "true") continue;
      const t = byIdNode(A(el, "targetId")); if (!t) continue;
      if (t.node.tag === "selectionEntry" && A(t.node, "type") === "unit" && depth > 0) continue;
      visit(t.node, [...links, el], depth + 1, seen);
    }
  };
  visit(entry, [], 0, new Set());
  return out;
}
function cloneWithNewIds(node) {
  const copy = JSON.parse(JSON.stringify(node));
  const map = new Map();
  xml.walk(copy, (n) => { const id = xml.getAttr(n, "id"); if (id) map.set(id, c.newId()); });
  xml.walk(copy, (n) => { for (const a of n.attrs || []) if (map.has(a.value)) a.value = map.get(a.value); });
  return copy;
}
const dsNode = (id) => { for (const f of factionFiles) { const u = exposedUnits(f).get(id); if (u) return u.node; } return null; };
const conflictPids = new Map(); // pid → Set(datasheet ids à séparer)
for (const p of plan) if (p.mode === "conflict" && p.r.values.size === 1) {
  if (!conflictPids.has(p.r.pid)) conflictPids.set(p.r.pid, new Set());
  for (const id of p.others) conflictPids.get(p.r.pid).add(id);
}
const copyOf = new Map(); // `${pid}|${targetId}` → id de la copie (une seule par cible)
for (const [pid, others] of conflictPids) {
  for (const dsId of others) {
    for (let guard = 0; guard < 60; guard++) {
      const d = dsNode(dsId); if (!d) break;
      const paths = pathsTo(d, pid); if (!paths.length) break;
      // Qui passe par chaque lien ? (toutes les fiches utilisatrices du profil)
      const through = new Map();
      for (const uid of usersOfProfile.get(pid) || []) { const un = dsNode(uid); if (!un) continue; for (const path of pathsTo(un, pid)) for (const l of path) { if (!through.has(l)) through.set(l, new Set()); through.get(l).add(uid); } }
      const path = paths[0];
      const link = [...path].reverse().find((l) => [...(through.get(l) || [])].every((uid) => others.has(uid)));
      if (!link) { console.log(`  ✗ séparation impossible : ${dsName.get(dsId)} (profil ${pid})`); break; }
      const tgt = byIdNode(A(link, "targetId"));
      const key = pid + "|" + A(link, "targetId");
      if (copyOf.has(key)) {
        xml.setAttr(link, "targetId", copyOf.get(key));
      } else {
        const parent = c.findParent(tgt.file, tgt.node);
        const copy = cloneWithNewIds(tgt.node);
        parent.children.splice(parent.children.indexOf(tgt.node) + 1, 0, copy);
        copyOf.set(key, xml.getAttr(copy, "id"));
        xml.setAttr(link, "targetId", xml.getAttr(copy, "id"));
        dirty.add(tgt.file);
        console.log(`  ⑂ ${dsName.get(dsId)} : copie de « ${A(tgt.node, "name")} » (garde l'ancienne valeur)`);
      }
      markFileOf(link);
      c.buildIndex();
    }
  }
}
for (const p of plan) {
  const cur = (xml.getText(p.ch) || "").trim();
  if (p.mode === "direct" || (p.mode === "conflict" && p.r.values.size === 1)) {
    if (cur === p.value) continue;
    xml.setText(p.ch, p.value); markFileOf(p.r.prof); continue;
  }
  const typeId = A(p.ch, "typeId");
  const mods = xml.ensureChild(p.r.prof, "modifiers");
  // Idempotence : un set identique déjà conditionné → on complète ses factions.
  const same = mods.children.find((m) => m.tag === "modifier" && A(m, "type") === "set" && A(m, "field") === typeId && A(m, "value") === p.value);
  if (same) {
    const conds = []; xml.walk(same, (n) => { if (n.tag === "condition" && A(n, "scope") === "primary-catalogue") conds.push(n); });
    const have = new Set(conds.map((n) => A(n, "childId")));
    const holder = conds.length ? c.findParent(c.byId.get(A(p.r.prof, "id")).file, conds[0]) : null;
    for (const f of p.facs) if (!have.has(catInfo.get(f).id) && holder) holder.children.push(xml.elem("condition", { type: "instanceOf", value: "1", field: "selections", scope: "primary-catalogue", childId: catInfo.get(f).id, shared: "true" }));
  } else {
    const m = xml.elem("modifier", { type: "set", value: p.value, field: typeId }); m.selfClose = false;
    m.children.push(condGroup([...p.facs]));
    mods.children.push(m);
  }
  markFileOf(p.r.prof);
}
for (const k of kwRequests) {
  const catId = (() => { for (const [, doc] of c.docs) { let hit = null; xml.walk(doc.root, (n) => { if (!hit && n.tag === "categoryEntry" && norm(A(n, "name")) === norm(k.keyword)) hit = A(n, "id"); }); if (hit) return hit; } return null; })();
  if (!catId) { console.log(`  ✗ catégorie ${k.keyword} introuvable`); continue; }
  const users = [...factionFiles].filter((f) => [...exposedUnits(f).values()].some((u) => A(u.node, "id") === A(k.u.node, "id")));
  const onlyThis = users.every((f) => f === k.file);
  if (onlyThis) {
    const cl = xml.child(k.u.node, "categoryLinks");
    if (cl) cl.children = cl.children.filter((x) => !(x.tag === "categoryLink" && A(x, "targetId") === catId));
  } else {
    const mods = xml.ensureChild(k.u.node, "modifiers");
    const m = xml.elem("modifier", { type: "remove", value: catId, field: "category" }); m.selfClose = false;
    m.children.push(condGroup([k.file]));
    mods.children.push(m);
  }
  dirty.add(k.u.file);
}
for (const f of dirty) c.markDirty(f);
c.buildIndex();
const v = c.validate({ dirtyOnly: false });
let nErr = 0; for (const r of v.results || []) { nErr += r.errors.length; for (const e of r.errors.slice(0, 5)) console.error("  ✗", r.file, e); }
console.log("validate ok:", v.ok, "erreurs:", nErr, "| fichiers modifiés:", [...dirty].join(", "));
if (!v.ok) process.exit(1);
c.save();
