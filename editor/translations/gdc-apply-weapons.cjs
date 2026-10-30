// gdc-apply-weapons.cjs — aligne CARACTÉRISTIQUES et PROFILS D'ARMES d'un chapitre sur game-datacards.
// Prudences : n'enlève jamais de mot-clef (la source en omet), ignore la CT « 7+ » des armes Torrent
// (artefact), scinde (copie locale) une entrée partagée avant de la modifier, renomme le PROFIL vers le nom
// officiel quand l'arme n'est appariable que par élimination (même nature, même nombre de profils).
// Garde (2026-10-30) : les ENTRÉES (selectionEntry / entryLink, copies locales comprises) ne sont jamais
// renommées — l'appli enregistre les choix d'options par nom : « ⚠ … entrée non renommée » à trancher à la main.
// Le PROFIL non plus, par défaut (l'appli résout l'arme d'un choix par le nom de base de ses profils,
// src/lib/loadout.js) : « ⚠ … profil non renommé » ; --rename-profils l'autorise, jamais vers un nom officiel
// réduit à un suffixe de mode (strike / sweep / melee / ranged / standard) : un tel appariement par élimination
// est douteux, l'arme est alors seulement signalée (ni nom, ni caractéristiques, ni mots-clefs écrits).
// Noms comparés tirets Unicode normalisés (U+2010-U+2015, U+2212 → « - », comme N() de gdc-compare.cjs) :
// « Jindarii tox‑cycler » (U+2011) ou « Force‐orb cane » (U+2010) ne sont pas un renommage.
//   node editor/translations/gdc-apply-weapons.cjs <fichier.cat> <gdc.json> [--write] [--trust] [--rename-profils] [--only "Fiche"] [--skip "Fiche:Arme"]
//   --trust (décision du 2026-10-07 : la fiche officielle fait foi à 100 %) : retire aussi les mots-clefs absents de la
//   fiche officielle ; seule la CT « 7+ » des armes Torrent reste lue comme « - » (N/A).
// Modificateurs de PORTEUR (même règle que gdc-compare.cjs et que le parseur de l'appli, PROFILE_CTX) : un modifier
// set / increment / decrement / append d'une caractéristique, conditionné par instanceOf / notInstanceOf de portée
// ancestor / root-entry / unit / model, est évalué contre la fiche (catégories, id d'entrée, figurines traversées).
// Une caractéristique qu'il modifie pour ce porteur n'est JAMAIS réécrite dans le profil (ni copie locale) : valeur
// effective = officielle → rien ; sinon « ⚠ … corriger le modificateur ». Ex. : Storm Bolter partagé SM (eb61,
// profil 83a0) BS 3+ imprimé, 2+ pour Captain / Lieutenant / … — le Captain in Terminator Armour est déjà à 2+.
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const [FILE, GJ] = args; const WRITE = args.includes("--write");
const RENAME_PROFILS = args.includes("--rename-profils"); const MODE_ONLY = /^(?:➤ )?(?:strike|sweep|melee|ranged|standard)$/i;
const TRUST = args.includes("--trust"); // fiche officielle = vérité : on retire aussi les mots-clefs qu'elle ne porte pas
const ONLY = new Set(args.filter((a, i) => args[i - 1] === "--only")); // limiter à certaines fiches
const NOKW = new Set(args.filter((a, i) => args[i - 1] === "--nokw"));
const SKIP = new Set(args.filter((a, i) => args[i - 1] === "--skip"));
const c = new Catalog(R).load(); const g = JSON.parse(fs.readFileSync(GJ, "utf8"));
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : x; const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\u2010-\u2015\u2212]/g, "-").replace(/^➤\s*/, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const base = (s) => N(s).split(" - ")[0].replace(/^astartes chainsword$/, "chainsword").trim();
const suf = (s) => (N(s).split(" - ")[1] || "").trim();
const TC = (k) => k.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bAnd\b/g, "and").replace(/:\s*Non-/i, ": non-").replace(/(non-)([a-z]+)\/([a-z]+)/i, (m, a, b, cc) => a + b.toUpperCase() + "/" + cc.toUpperCase()).replace(/\b(Monster|Vehicle|Infantry|Character|Fly|Psyker)\b(?=\s*\d\+)/g, (m) => m);
const kwNorm = (s) => N(s).replace(/\s+/g, " ");
const ref = new Map(); for (const [, d] of c.docs) xml.walk(d.root, (n) => { const t = xml.getAttr(n, "targetId"); if (t) ref.set(t, (ref.get(t) || 0) + 1); });
const byId = (id) => (c.byId.get(id) || {}).node;
// range un selectionEntry dans le <selectionEntries> du propriétaire (créé au besoin, à sa place BattleScribe)
const SE_ORDER = ["comment", "constraints", "modifiers", "modifierGroups", "profiles", "rules", "infoLinks", "infoGroups", "categoryLinks", "selectionEntries", "selectionEntryGroups", "entryLinks", "costs"];
function placeInSelectionEntries(owner, entry) {
  let h = (owner.children || []).find((x) => x.tag === "selectionEntries");
  if (!h) { h = xml.elem("selectionEntries", {}, []); h.selfClose = false; const r = SE_ORDER.indexOf("selectionEntries");
    let at = owner.children.length; for (let i = 0; i < owner.children.length; i++) if (SE_ORDER.indexOf(owner.children[i].tag) > r) { at = i; break; }
    owner.children.splice(at, 0, h); }
  h.children.push(entry);
}
const doc = c.docs.get(FILE); const log = []; const dirty = new Set([FILE]);
function unit(name) { for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(doc.root, b); if (bx) for (const e of bx.children) if (e.tag === "selectionEntry" && N(nm(e)) === N(name) && xml.getAttr(e, "hidden") !== "true") return e; } return null; }
// profils d'armes de la fiche avec le chemin de liens qui y mène, l'infoLink qui l'atteint (via) et la pile des
// figurines traversées (ms : contexte de porteur des modificateurs)
function collect(u) { const out = []; const isModel = (k) => k && k !== u && k.tag === "selectionEntry" && xml.getAttr(k, "type") === "model";
  const walk = (n, link, depth, seen, ms) => { for (const k of n.children || []) { if (!k.tag) continue;
  if (k.tag === "profile" && /Weapons$/.test(xml.getAttrDecoded(k, "typeName") || "")) out.push({ p: k, link, ms });
  if (k.tag === "selectionEntryGroup" && /Enhancement|^Can (Lead|Support)/.test(nm(k))) continue;
  if (k.tag === "entryLink") { if (xml.getAttr(k, "hidden") === "true" || /Upgrade$|^Warlord$|^Enhancements$/.test(nm(k)) || depth > 4) continue; const t = byId(xml.getAttr(k, "targetId")); if (t && !seen.has(t)) walk({ children: [t] }, link || k, depth + 1, new Set([...seen, t]), ms); continue; }
  if (k.tag === "infoLink" && xml.getAttr(k, "type") === "profile") { const t = byId(xml.getAttr(k, "targetId")); if (t && /Weapons$/.test(xml.getAttrDecoded(t, "typeName") || "")) out.push({ p: t, link: link || k, info: true, via: k, ms }); continue; }
  walk(k, link, depth, seen, isModel(k) ? [...ms, bearerIds(k)] : ms); } }; walk({ children: [u] }, null, 0, new Set(), []); return out; }
const chars = (p) => { const o = {}; xml.walk(p, (q) => { if (q.tag === "characteristic") o[xml.getAttrDecoded(q, "name")] = q; }); return o; };
// ── modificateurs de porteur (copie de gdc-compare.cjs : garder les deux alignés)
const elems = (n, box, tag) => { const b = xml.child(n, box); return b ? b.children.filter((x) => x.tag === tag) : []; };
const leavesOf = (...ns) => { const o = []; for (const n of ns) xml.walk(n, (q) => { if (q.tag === "condition") o.push(q); }); return o; };
function verdict(n, leaf, op = "and") {
  const parts = [...elems(n, "conditions", "condition").map(leaf), ...elems(n, "conditionGroups", "conditionGroup").map((g) => verdict(g, leaf, xml.getAttr(g, "type") === "or" ? "or" : "and"))];
  if (!parts.length) return true; if (parts.some((x) => x === null)) return null; return op === "or" ? parts.some(Boolean) : parts.every(Boolean); }
const modsOf = (n) => { const o = []; const rec = (x, gs) => { for (const m of elems(x, "modifiers", "modifier")) o.push([m, gs]); for (const g of elems(x, "modifierGroups", "modifierGroup")) rec(g, [...gs, g]); }; if (n) rec(n, []); return o; };
const fires = (m, gs, leaf) => verdict(m, leaf) === true && gs.every((g) => verdict(g, leaf) === true);
function bearerIds(e) { const s = new Set(elems(e, "categoryLinks", "categoryLink").map((l) => xml.getAttr(l, "targetId")));
  const catMods = elems(e, "modifiers", "modifier").filter((m) => xml.getAttr(m, "field") === "category" && !leavesOf(m).length);
  for (const m of catMods) if (xml.getAttr(m, "type") === "add") s.add(xml.getAttr(m, "value"));
  for (const m of catMods) if (xml.getAttr(m, "type") === "remove") s.delete(xml.getAttr(m, "value"));
  s.add(xml.getAttr(e, "id")); s.delete(undefined); return s; }
const bearerLeaf = (ctx) => (q) => { const t = xml.getAttr(q, "type"); if (t !== "instanceOf" && t !== "notInstanceOf") return null; const sc = xml.getAttr(q, "scope");
  const top = ctx.model.length ? ctx.model[ctx.model.length - 1] : (ctx.unitIsModel ? ctx.unit : null);
  const has = sc === "root-entry" || sc === "unit" ? (id) => ctx.unit.has(id) : sc === "model" ? (top && ((id) => top.has(id))) : sc === "ancestor" ? (id) => ctx.unit.has(id) || ctx.model.some((x) => x.has(id)) : null;
  if (!has) return null; const r = has(xml.getAttr(q, "childId")); return t === "instanceOf" ? r : !r; };
const RANK = { set: 0, increment: 1, decrement: 1, append: 2 };
function effChars(p, link, ctx) { // { ch: nom → valeur effective, fired: caractéristiques touchées par un modifier appliqué }
  const ch = {}, byType = {}; xml.walk(p, (q) => { if (q.tag === "characteristic") { const n = xml.getAttrDecoded(q, "name"); ch[n] = xml.getText(q) || ""; byType[xml.getAttr(q, "typeId")] = n; } });
  const charOf = (m) => byType[xml.getAttr(m, "field")] || (xml.getAttr(m, "field") in ch ? xml.getAttr(m, "field") : null);
  const mods = [...modsOf(p), ...modsOf(link)].filter(([m]) => RANK[xml.getAttr(m, "type")] != null && !xml.getAttr(m, "affects") && xml.getAttr(m, "value") != null && charOf(m))
    .sort((a, b) => RANK[xml.getAttr(a[0], "type")] - RANK[xml.getAttr(b[0], "type")]);
  const fired = new Set(); const leaf = bearerLeaf(ctx);
  for (const [m, gs] of mods) { if (!fires(m, gs, leaf)) continue; const k = charOf(m), t = xml.getAttr(m, "type"), v = xml.getAttrDecoded(m, "value"); let nv = null;
    if (t === "set") nv = v;
    else if (t === "append") { const a = v.trim(), b = String(ch[k] || "").trim(); if (a) nv = !b || b === "-" ? a : b + (xml.getAttr(m, "join") ? xml.getAttrDecoded(m, "join") : k === "Keywords" ? ", " : " ") + a; }
    else { const mm = /^(-?\d+)("?)$/.exec(String(ch[k] || "").trim()); const d = Number(v); if (mm && Number.isFinite(d)) nv = `${Number(mm[1]) + (t === "increment" ? d : -d)}${mm[2]}`; }
    if (nv != null) { ch[k] = nv; fired.add(k); } }
  return { ch, fired }; }
const warned = new Set(); const warn = (msg) => { if (!warned.has(msg)) { warned.add(msg); log.push("⚠ " + msg); } };

const localized = new Map();
function editable(u, item) { // renvoie le profil à modifier (copie locale si partagé hors de la fiche)
  if (!item.link) return item.p; const lid = xml.getAttr(item.link, "id"); const tid = xml.getAttr(item.link, "targetId");
  let inside = 0; xml.walk(u, (x) => { if (xml.getAttr(x, "targetId") === tid) inside++; });
  if ((ref.get(tid) || 0) <= inside && !item.info) return item.p;
  if (item.info) return null; // profil partagé par infoLink : on n'y touche pas ici
  if (!localized.has(lid)) { // remplace le lien par une copie de sa cible
    const t = byId(tid); const k = JSON.parse(JSON.stringify(t)); xml.walk(k, (x) => { if (xml.getAttr(x, "id")) xml.setAttr(x, "id", c.newId()); });
    const lc = xml.child(item.link, "constraints"); if (lc) { k.children = k.children.filter((x) => x.tag !== "constraints"); const cc = JSON.parse(JSON.stringify(lc)); xml.walk(cc, (x) => { if (xml.getAttr(x, "id")) xml.setAttr(x, "id", c.newId()); }); k.children.push(cc); }
    xml.setAttr(k, "name", nm(item.link) || nm(t)); let par = null; xml.walk(u, (x) => { if (!par && (x.children || []).includes(item.link)) par = x; });
    if (!par) return null;
    // La copie est un selectionEntry : elle va dans <selectionEntries> du propriétaire, JAMAIS à la
    // place du lien dans <entryLinks> (un selectionEntry y est ignoré par BattleScribe et par l'appli :
    // l'arme disparaissait — storm bolter des Brotherhood Librarian/Chaplain, gdc v981).
    par.children.splice(par.children.indexOf(item.link), 1);
    let owner = null; xml.walk(u, (x) => { if (!owner && (x.children || []).includes(par)) owner = x; }); if (!owner) owner = u;
    placeInSelectionEntries(owner, k);
    if (!par.children.some((x) => typeof x === "object")) owner.children.splice(owner.children.indexOf(par), 1);
    for (const [, d] of c.docs) xml.walk(d.root, (gg) => { if (gg.tag === "selectionEntryGroup" && xml.getAttr(gg, "defaultSelectionEntryId") === lid) xml.setAttr(gg, "defaultSelectionEntryId", xml.getAttr(k, "id")); });
    localized.set(lid, k); log.push(`${nm(u)} : copie locale de « ${nm(t)} »`); }
  const k = localized.get(lid); let hit = null; const pn = nm(item.p); xml.walk(k, (x) => { if (!hit && x.tag === "profile" && nm(x) === pn) hit = x; }); return hit;
}

const DASH_SEP = /\s+[-\u2010-\u2015\u2212]\s+/; // « Nom – Profil », tous tirets
const asciiDash = (s) => String(s).replace(/[\u2010-\u2015\u2212]/g, "-"); // nom écrit : tirets ASCII, comme la base
function newName(w, op) { const s = asciiDash(en(op.name).split(DASH_SEP)[1] || "") || (w.profs.length > 1 ? "Standard" : ""); return (w.profs.length > 1 ? "➤ " : "") + w.name + (w.profs.length > 1 && s ? " - " + s : ""); }
const splitKw = (k) => { const m = /^anti-([a-z]+)\/([a-z]+) (\d\+)$/i.exec(k.trim()); return m ? [`Anti-${m[1]} ${m[3]}`, `Anti-${m[2]} ${m[3]}`] : [k]; };
// eff (effChars pour ce porteur) : une caractéristique modifiée par un modificateur de porteur n'est jamais réécrite —
// valeur effective comparée à l'officielle, écart signalé (ctx) au lieu d'être « corrigé » dans le profil partagé.
function plan(p, op, rename, eff, ctx) { const out = []; const ch = chars(p); const put = (key, v) => { const k = ch[key] ? key : ({ BS: "WS", WS: "BS" })[key]; if (!ch[k]) return;
    if (eff && eff.fired.has(k)) { if (eff.ch[k] !== v) warn(`${ctx} : ${k} effectif ${eff.ch[k]} (modificateur de porteur) ≠ officiel ${v} — corriger le modificateur, pas le profil`); return; }
    if ((xml.getText(ch[k]) || "") !== v) out.push([k, v]); };
  if (rename && nm(p) !== rename) out.push(["name", rename]);
  const isTorrent = (op.keywords || []).some((k) => /torrent/i.test(en(k)));
  put("Range", /melee/i.test(op.range) ? "Melee" : op.range); put("A", op.attacks);
  if (!(isTorrent && /^\d\+$/.test(op.skill) && +op.skill[0] >= 6)) put("BS", op.skill === "-" ? "N/A" : op.skill);
  put("S", op.strength); put("AP", op.ap); put("D", op.damage);
  const kc = ch.Keywords; if (kc) { const kwMod = !!(eff && eff.fired.has("Keywords")); const curS = kwMod ? eff.ch.Keywords : xml.getText(kc) || ""; const cur = curS.split(/,\s*/).map((x) => x.trim()).filter((x) => x && x !== "-");
    const offK = (op.keywords || []).map(en).filter(Boolean).flatMap(splitKw).filter((k) => TRUST || !/^pistol$/i.test(k));
    const stem = (x) => kwNorm(x).replace(/ \d\+$/, "");
    const pstem = (x) => kwNorm(x).replace(/ (d?\d+(\+\d+)?\+?|d\d)$/, "");
    let next = cur.filter((x) => !offK.some((k) => pstem(k) === pstem(x) && pstem(k) !== kwNorm(k) && kwNorm(k) !== kwNorm(x)));
    const have = new Set(next.map(kwNorm)); for (const k of offK) if (!have.has(kwNorm(k))) next.push(TC(k));
    // --trust : ne garder que les mots-clefs officiels (sauf notre encodage Hunter, qui double le profil ➤ - Hunter)
    if (TRUST) { const offN = new Set(offK.map(kwNorm)); next = next.filter((x) => offN.has(kwNorm(x)) || /^hunter\b/i.test(x)); }
    if (!TRUST && next.some((x) => /^pistol$/i.test(x))) next = next.filter((x) => !/^pistol$/i.test(x)).concat(next.some((x) => /^close-quarters$/i.test(x)) ? [] : ["Close-Quarters"]);
    next = [...new Set(next)].sort((a, b) => a.localeCompare(b)); const nv = next.join(", ") || "-";
    if (new Set(next.map(kwNorm)).size !== new Set(cur.map(kwNorm)).size || next.some((x) => !cur.map(kwNorm).includes(kwNorm(x)))) { if (kwMod) warn(`${ctx} : Keywords effectifs « ${curS} » (modificateur de porteur) ≠ attendus « ${nv} »${TRUST ? "" : " (sans --trust : Pistol lu Close-Quarters)"} — corriger le modificateur, pas le profil`); else out.push(["Keywords", nv]); } }
  return out; }
function setChar(p, key, v, ctx) { const ch = chars(p); const k = ch[key] ? key : ({ BS: "WS", WS: "BS" })[key]; if (!ch[k]) return; const cur = xml.getText(ch[k]) || ""; if (cur !== v) { xml.setText(ch[k], v); log.push(`${ctx} ${k}: ${cur} → ${v}`); } }
for (const ds of g.datasheets) {
  if (ONLY.size && !ONLY.has(en(ds.name))) continue;
  const u = unit(en(ds.name)); if (!u) continue; const un = nm(u); const uctx = bearerIds(u); const uIsModel = xml.getAttr(u, "type") === "model";
  // caractéristiques
  const stats = []; xml.walk(u, (p) => { if (p.tag === "profile" && xml.getAttrDecoded(p, "typeName") === "Unit") stats.push(p); });
  for (const s of ds.stats || []) { const sn = en(s.name); const tgt = stats.filter((p) => N(nm(p)) === N(sn) || N(nm(p)).replace(/s$/, "") === N(sn).replace(/s$/, ""));
    const use = tgt.length ? tgt : (stats.length === 1 && (ds.stats || []).length === 1 ? stats : []);
    for (const p of use) { const eff = effChars(p, null, { unit: uctx, model: [], unitIsModel: uIsModel });
      for (const [k, v] of [["M", s.m], ["T", s.t], ["SV", s.sv], ["W", s.w], ["LD", s.ld], ["OC", s.oc]]) if (v != null && v !== "") { const vv = String(v).replace(/"$/, '"');
        if (eff.fired.has(k)) { if (eff.ch[k] !== vv) warn(`${un} · ${nm(p)} : ${k} effectif ${eff.ch[k]} (modificateur de porteur) ≠ officiel ${vv} — corriger le modificateur, pas le profil`); continue; }
        setChar(p, k, vv, `${un} · ${nm(p)}`); } } }
  // armes
  const items = collect(u); const ours = new Map(); for (const it of items) { const b = base(nm(it.p)); if (!ours.has(b)) ours.set(b, []); ours.get(b).push(it); }
  const off = new Map(); for (const grp of [...(ds.rangedWeapons || []).map((x) => ["R", x]), ...(ds.meleeWeapons || []).map((x) => ["M", x])]) for (const p of grp[1].profiles || []) { const b = base(en(p.name)); if (!off.has(b)) off.set(b, { kind: grp[0], name: asciiDash(en(p.name).split(DASH_SEP)[0].trim()), profs: [] }); off.get(b).profs.push(p); }
  const unmatchedOurs = [...ours.keys()].filter((b) => !off.has(b));
  for (const [b, w] of off) { if (SKIP.has(`${un}:${w.name}`)) continue;
    let mine = ours.get(b); let rename = false;
    if (!mine) { const cand = unmatchedOurs.filter((ob) => { const its = ours.get(ob); const isMelee = /Melee/.test(xml.getAttrDecoded(its[0].p, "typeName")); return (isMelee ? "M" : "R") === w.kind && new Set(its.map((i) => nm(i.p))).size === w.profs.length; });
      const offNames = new Set([...off.keys()]); const free = cand.filter((ob) => !offNames.has(ob));
      const missing = [...off.entries()].filter(([ob, ww]) => !ours.has(ob) && ww.kind === w.kind && ww.profs.length === w.profs.length);
      if (free.length === 1 && missing.length === 1) { mine = ours.get(free[0]); rename = true; unmatchedOurs.splice(unmatchedOurs.indexOf(free[0]), 1); } }
    if (!mine) { log.push(`⚠ ${un} : arme officielle sans équivalent « ${w.name} » (option à créer ?)`); continue; }
    if (rename && MODE_ONLY.test(w.name)) { warn(`${un} : « ${nm(mine[0].p)} » apparié par élimination à un profil officiel sans nom d'arme (« ${w.name} ») — appariement douteux, rien n'est écrit : vérifier à la main`); continue; }
    const oldBase = base(nm(mine[0].p)); const distinct = []; for (const it of mine) if (!distinct.some((d) => nm(d.p) === nm(it.p))) distinct.push(it);
    if (distinct.length !== w.profs.length) { log.push(`⚠ ${un} : « ${w.name} » ${distinct.length} profil(s) chez nous / ${w.profs.length} officiel(s) — à reprendre`); continue; }
    // appariement des profils : par suffixe, sinon par ordre
    const used = new Set(); const pick = (f) => { const d = distinct.find((x) => !used.has(x) && f(suf(nm(x.p)))); if (d) used.add(d); return d || null; };
    const pairs = w.profs.map((op) => [op, null]);
    for (const pp of pairs) { const s = suf(en(pp[0].name)); if (s) pp[1] = pick((o) => o === s); }
    for (const pp of pairs) if (!pp[1] && !suf(en(pp[0].name))) pp[1] = pick((o) => o === "" || o === "standard");
    for (const pp of pairs) { const s = suf(en(pp[0].name)); if (!pp[1] && s) pp[1] = pick((o) => o.startsWith(s) || s.startsWith(o)); }
    for (const pp of pairs) if (!pp[1]) { const op = pp[0]; const d = distinct.find((x) => !used.has(x) && (() => { const ch = chars(x.p); const g = (k) => ch[k] ? xml.getText(ch[k]) : null; return g("Range") === (/melee/i.test(op.range) ? "Melee" : op.range) && g("S") === op.strength; })()); if (d) { used.add(d); pp[1] = d; } }
    for (const pp of pairs) if (!pp[1]) pp[1] = pick(() => true);
    for (const [op, d0] of pairs) { // toutes les occurrences locales de ce profil
      for (const it of mine.filter((m) => nm(m.p) === nm(d0.p))) {
        const eff = effChars(it.p, it.via || null, { unit: uctx, model: it.ms || [], unitIsModel: uIsModel });
        const nn = rename ? newName(w, op) : null; const okName = nn && RENAME_PROFILS;
        if (nn && !okName && nn !== nm(it.p)) warn(`${un} : profil « ${nm(it.p)} » non renommé (nom officiel « ${nn} ») — --rename-profils pour l'écrire`);
        const want = plan(it.p, op, okName ? nn : null, eff, `${un} · ${nm(it.p)}`).filter(([k]) => !(k === "Keywords" && NOKW.has(`${un}:${w.name}`))); if (!want.length) continue;
        const p = editable(u, it); if (!p) { log.push(`⚠ ${un} : « ${nm(it.p)} » profil partagé (infoLink) non modifié`); continue; }
        const ctx = `${un} · ${nm(p)}`; for (const [k, v] of want) { if (k === "name") { log.push(`${ctx} → nom officiel « ${v} »`); xml.setAttr(p, "name", v); continue; }
          const ch = chars(p); log.push(`${ctx} ${k}: ${xml.getText(ch[k]) || ""} → ${v}`); xml.setText(ch[k], v); } }
      if (rename && d0.link === null) { /* entrée locale : renommer aussi l'entrée */ } }
    if (rename) { // GARDE : jamais de renommage d'entrée (choix d'option enregistrés par nom dans l'appli) — signalé seulement
      const old = oldBase; const seen = new Set(); xml.walk(u, (e) => { if ((e.tag === "selectionEntry" || e.tag === "entryLink") && base(nm(e)) === old && !seen.has(nm(e))) { seen.add(nm(e)); warn(`${un} : entrée « ${nm(e)} » non renommée (nom officiel « ${w.name} ») — l'appli enregistre les choix par nom : à trancher à la main`); } }); }
  }
}
for (const l of log) console.log("Δ " + l); console.log(log.length + " changement(s)");
if (WRITE) { for (const f of dirty) c.markDirty(f); c.buildIndex(); const v = c.validate({ dirtyOnly: false }); console.log("validate", v.ok); if (v.ok) c.save(); }
