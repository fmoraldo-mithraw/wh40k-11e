// gdc-apply-weapons.cjs — aligne CARACTÉRISTIQUES et PROFILS D'ARMES d'un chapitre sur game-datacards.
// Prudences : n'enlève jamais de mot-clef (la source en omet), ignore la CT « 7+ » des armes Torrent
// (artefact), scinde (copie locale) une entrée partagée avant de la modifier, renomme vers le nom
// officiel quand l'arme n'est appariable que par élimination (même nature, même nombre de profils).
//   node editor/translations/gdc-apply-weapons.cjs <fichier.cat> <gdc.json> [--write] [--skip "Fiche:Arme"]
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const [FILE, GJ] = args; const WRITE = args.includes("--write");
const NOKW = new Set(args.filter((a, i) => args[i - 1] === "--nokw"));
const SKIP = new Set(args.filter((a, i) => args[i - 1] === "--skip"));
const c = new Catalog(R).load(); const g = JSON.parse(fs.readFileSync(GJ, "utf8"));
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : x; const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[–—]/g, "-").replace(/^➤\s*/, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const base = (s) => N(s).split(" - ")[0].replace(/^astartes chainsword$/, "chainsword").trim();
const suf = (s) => (N(s).split(" - ")[1] || "").trim();
const TC = (k) => k.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bAnd\b/g, "and").replace(/:\s*Non-/i, ": non-").replace(/(non-)([a-z]+)\/([a-z]+)/i, (m, a, b, cc) => a + b.toUpperCase() + "/" + cc.toUpperCase()).replace(/\b(Monster|Vehicle|Infantry|Character|Fly|Psyker)\b(?=\s*\d\+)/g, (m) => m);
const kwNorm = (s) => N(s).replace(/\s+/g, " ");
const ref = new Map(); for (const [, d] of c.docs) xml.walk(d.root, (n) => { const t = xml.getAttr(n, "targetId"); if (t) ref.set(t, (ref.get(t) || 0) + 1); });
const byId = (id) => (c.byId.get(id) || {}).node;
const doc = c.docs.get(FILE); const log = []; const dirty = new Set([FILE]);
function unit(name) { for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(doc.root, b); if (bx) for (const e of bx.children) if (e.tag === "selectionEntry" && N(nm(e)) === N(name) && xml.getAttr(e, "hidden") !== "true") return e; } return null; }
// profils d'armes de la fiche avec le chemin de liens qui y mène
function collect(u) { const out = []; const walk = (n, link, depth, seen) => { for (const k of n.children || []) { if (!k.tag) continue;
  if (k.tag === "profile" && /Weapons$/.test(xml.getAttrDecoded(k, "typeName") || "")) out.push({ p: k, link });
  if (k.tag === "selectionEntryGroup" && /Enhancement|^Can (Lead|Support)/.test(nm(k))) continue;
  if (k.tag === "entryLink") { if (xml.getAttr(k, "hidden") === "true" || /Upgrade$|^Warlord$|^Enhancements$/.test(nm(k)) || depth > 4) continue; const t = byId(xml.getAttr(k, "targetId")); if (t && !seen.has(t)) walk({ children: [t] }, link || k, depth + 1, new Set([...seen, t])); continue; }
  if (k.tag === "infoLink" && xml.getAttr(k, "type") === "profile") { const t = byId(xml.getAttr(k, "targetId")); if (t && /Weapons$/.test(xml.getAttrDecoded(t, "typeName") || "")) out.push({ p: t, link: link || k, info: true }); continue; }
  walk(k, link, depth, seen); } }; walk({ children: [u] }, null, 0, new Set()); return out; }
const chars = (p) => { const o = {}; xml.walk(p, (q) => { if (q.tag === "characteristic") o[xml.getAttrDecoded(q, "name")] = q; }); return o; };
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
    if (!par) return null; par.children[par.children.indexOf(item.link)] = k;
    for (const [, d] of c.docs) xml.walk(d.root, (gg) => { if (gg.tag === "selectionEntryGroup" && xml.getAttr(gg, "defaultSelectionEntryId") === lid) xml.setAttr(gg, "defaultSelectionEntryId", xml.getAttr(k, "id")); });
    localized.set(lid, k); log.push(`${nm(u)} : copie locale de « ${nm(t)} »`); }
  const k = localized.get(lid); let hit = null; const pn = nm(item.p); xml.walk(k, (x) => { if (!hit && x.tag === "profile" && nm(x) === pn) hit = x; }); return hit;
}

function newName(w, op) { const s = en(op.name).split(/\s+[–-]\s+/)[1] || (w.profs.length > 1 ? "Standard" : ""); return (w.profs.length > 1 ? "➤ " : "") + w.name + (w.profs.length > 1 && s ? " - " + s : ""); }
const splitKw = (k) => { const m = /^anti-([a-z]+)\/([a-z]+) (\d\+)$/i.exec(k.trim()); return m ? [`Anti-${m[1]} ${m[3]}`, `Anti-${m[2]} ${m[3]}`] : [k]; };
function plan(p, op, rename) { const out = []; const ch = chars(p); const put = (key, v) => { const k = ch[key] ? key : ({ BS: "WS", WS: "BS" })[key]; if (ch[k] && (xml.getText(ch[k]) || "") !== v) out.push([k, v]); };
  if (rename && nm(p) !== rename) out.push(["name", rename]);
  const isTorrent = (op.keywords || []).some((k) => /torrent/i.test(en(k)));
  put("Range", /melee/i.test(op.range) ? "Melee" : op.range); put("A", op.attacks);
  if (!(isTorrent && /^\d\+$/.test(op.skill) && +op.skill[0] >= 6)) put("BS", op.skill === "-" ? "N/A" : op.skill);
  put("S", op.strength); put("AP", op.ap); put("D", op.damage);
  const kc = ch.Keywords; if (kc) { const curS = xml.getText(kc) || ""; const cur = curS.split(/,\s*/).map((x) => x.trim()).filter((x) => x && x !== "-");
    const offK = (op.keywords || []).map(en).filter(Boolean).flatMap(splitKw).filter((k) => !/^pistol$/i.test(k));
    const stem = (x) => kwNorm(x).replace(/ \d\+$/, "");
    const pstem = (x) => kwNorm(x).replace(/ (d?\d+(\+\d+)?\+?|d\d)$/, "");
    let next = cur.filter((x) => !offK.some((k) => pstem(k) === pstem(x) && pstem(k) !== kwNorm(k) && kwNorm(k) !== kwNorm(x)));
    const have = new Set(next.map(kwNorm)); for (const k of offK) if (!have.has(kwNorm(k))) next.push(TC(k));
    if (next.some((x) => /^pistol$/i.test(x))) next = next.filter((x) => !/^pistol$/i.test(x)).concat(next.some((x) => /^close-quarters$/i.test(x)) ? [] : ["Close-Quarters"]);
    next = [...new Set(next)].sort((a, b) => a.localeCompare(b)); const nv = next.join(", ") || "-";
    if (new Set(next.map(kwNorm)).size !== new Set(cur.map(kwNorm)).size || next.some((x) => !cur.map(kwNorm).includes(kwNorm(x)))) out.push(["Keywords", nv]); }
  return out; }
function setChar(p, key, v, ctx) { const ch = chars(p); const k = ch[key] ? key : ({ BS: "WS", WS: "BS" })[key]; if (!ch[k]) return; const cur = xml.getText(ch[k]) || ""; if (cur !== v) { xml.setText(ch[k], v); log.push(`${ctx} ${k}: ${cur} → ${v}`); } }
for (const ds of g.datasheets) {
  const u = unit(en(ds.name)); if (!u) continue; const un = nm(u);
  // caractéristiques
  const stats = []; xml.walk(u, (p) => { if (p.tag === "profile" && xml.getAttrDecoded(p, "typeName") === "Unit") stats.push(p); });
  for (const s of ds.stats || []) { const sn = en(s.name); const tgt = stats.filter((p) => N(nm(p)) === N(sn) || N(nm(p)).replace(/s$/, "") === N(sn).replace(/s$/, ""));
    const use = tgt.length ? tgt : (stats.length === 1 && (ds.stats || []).length === 1 ? stats : []);
    for (const p of use) for (const [k, v] of [["M", s.m], ["T", s.t], ["SV", s.sv], ["W", s.w], ["LD", s.ld], ["OC", s.oc]]) if (v != null && v !== "") setChar(p, k, String(v).replace(/"$/, '"'), `${un} · ${nm(p)}`); }
  // armes
  const items = collect(u); const ours = new Map(); for (const it of items) { const b = base(nm(it.p)); if (!ours.has(b)) ours.set(b, []); ours.get(b).push(it); }
  const off = new Map(); for (const grp of [...(ds.rangedWeapons || []).map((x) => ["R", x]), ...(ds.meleeWeapons || []).map((x) => ["M", x])]) for (const p of grp[1].profiles || []) { const b = base(en(p.name)); if (!off.has(b)) off.set(b, { kind: grp[0], name: en(p.name).split(/\s+[–-]\s+/)[0].trim(), profs: [] }); off.get(b).profs.push(p); }
  const unmatchedOurs = [...ours.keys()].filter((b) => !off.has(b));
  for (const [b, w] of off) { if (SKIP.has(`${un}:${w.name}`)) continue;
    let mine = ours.get(b); let rename = false;
    if (!mine) { const cand = unmatchedOurs.filter((ob) => { const its = ours.get(ob); const isMelee = /Melee/.test(xml.getAttrDecoded(its[0].p, "typeName")); return (isMelee ? "M" : "R") === w.kind && new Set(its.map((i) => nm(i.p))).size === w.profs.length; });
      const offNames = new Set([...off.keys()]); const free = cand.filter((ob) => !offNames.has(ob));
      const missing = [...off.entries()].filter(([ob, ww]) => !ours.has(ob) && ww.kind === w.kind && ww.profs.length === w.profs.length);
      if (free.length === 1 && missing.length === 1) { mine = ours.get(free[0]); rename = true; unmatchedOurs.splice(unmatchedOurs.indexOf(free[0]), 1); } }
    if (!mine) { log.push(`⚠ ${un} : arme officielle sans équivalent « ${w.name} » (option à créer ?)`); continue; }
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
        const want = plan(it.p, op, rename ? newName(w, op) : null).filter(([k]) => !(k === "Keywords" && NOKW.has(`${un}:${w.name}`))); if (!want.length) continue;
        const p = editable(u, it); if (!p) { log.push(`⚠ ${un} : « ${nm(it.p)} » profil partagé (infoLink) non modifié`); continue; }
        const ctx = `${un} · ${nm(p)}`; for (const [k, v] of want) { if (k === "name") { log.push(`${ctx} → nom officiel « ${v} »`); xml.setAttr(p, "name", v); continue; }
          const ch = chars(p); log.push(`${ctx} ${k}: ${xml.getText(ch[k]) || ""} → ${v}`); xml.setText(ch[k], v); } }
      if (rename && d0.link === null) { /* entrée locale : renommer aussi l'entrée */ } }
    if (rename) { // renommer les entrées locales qui portaient l'ancien nom
      const old = oldBase; xml.walk(u, (e) => { if ((e.tag === "selectionEntry" || e.tag === "entryLink") && base(nm(e)) === old) { log.push(`${un} : entrée « ${nm(e)} » → « ${w.name} »`); xml.setAttr(e, "name", w.name); } }); for (const [, k] of localized) if (base(nm(k)) === old) xml.setAttr(k, "name", w.name); }
  }
}
for (const l of log) console.log("Δ " + l); console.log(log.length + " changement(s)");
if (WRITE) { for (const f of dirty) c.markDirty(f); c.buildIndex(); const v = c.validate({ dirtyOnly: false }); console.log("validate", v.ok); if (v.ok) c.save(); }
