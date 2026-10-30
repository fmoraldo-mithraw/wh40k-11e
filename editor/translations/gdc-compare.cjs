// gdc-compare.cjs — compare TOUTES les fiches de notre base aux fiches de l'appli officielle publiées par
// game-datacards/datasources (dossier 11th/gdc) : caractéristiques, profils d'armes (champ par champ),
// mots-clefs (unité et figurine — champ modelKeywords), aptitudes (présence, texte, invulnérable).
// LECTURE SEULE : produit un rapport Markdown + JSON par fichier amont (= faction), plus un index.
//
// Appariement : chaque fiche racine de la base (unité/figurine, cachée seulement si un lien visible l'expose)
// est comparée à la fiche officielle de même nom (accents, tirets, pluriel près ; repli editor/mfm/aliases.json)
// prise d'abord dans les fichiers amont dont le manifeste (editor/sources/game-datacards.json → files) liste son
// catalogue — catalogue principal d'abord —, sinon n'importe où (COPIE hors faction : les fiches Deathwatch du
// catalogue Agents, par exemple, se comparent à deathwatch.json). Chaque copie est comparée séparément.
//
// Classement de chaque écart (la fiche officielle fait foi à 100 % : décision du 2026-10-07) :
//   vrai      — vrai écart à corriger dans la base (valeur, mot-clef, aptitude absente ou en trop, texte) ;
//   nom       — faux positif d'appariement : même contenu sous un autre nom (arme, profil, aptitude) ;
//   modele    — choix de modélisation de la base : catégories internes (« Faction: », « … * », nom d'unité),
//               profils « (ref. only) », mot-clef Hunter (…), CT 7+ Torrent = N/A, préfixe (Once per …).
//
// Profils lus comme l'appli les affiche (parseur ../cogitator-bellicum/scripts/bsdata-parser.mjs : PROFILE_CTX,
// characteristics/applyProfileMods, staticPrimaryCatVerdict/unitCatLeaf) — sinon faux « vrais » écarts :
//   (a) PORTEUR — un modifier set / increment / decrement / append d'une caractéristique, porté par le profil ou
//       par l'infoLink qui l'atteint, conditionné par instanceOf / notInstanceOf de portée ancestor, root-entry,
//       unit ou model, est évalué contre la fiche comparée : ses catégories (categoryLinks + ajouts − retraits
//       inconditionnels), l'id de son entrée, et les figurines (entrées model) traversées pour atteindre l'arme.
//       Ex. : Storm Bolter partagé SM (eb61, profil 83a0) BS 3+ → 2+ pour un Captain / Lieutenant / … ;
//       Mechanicus pistol 3+ sur un CHARACTER. Toute autre condition (sélections, roster, primary-catalogue)
//       est indécidable ici : modificateur non appliqué (valeur imprimée).
//   (b) RÈGLE PROJETÉE PAR UN DÉTACHEMENT — un profil ou infoLink masqué sur une liste vide et révélé seulement
//       par une condition de sélection roster/force (hidden="true" + « set hidden=false si atLeast 1 <détachement> »,
//       ou visible + « set hidden=true si lessThan 1 <détachement> ») n'est pas une aptitude de la fiche : ignoré
//       pour l'invulnérable et les aptitudes (invulnérables 5+ tyranides de Warrior Bioform Onslaught, Brazen
//       Fury, Disciples of Be'lakor, Firebase Control…). Un masquage sans charnière roster/force reste compté.
//
//   node editor/translations/gdc-compare.cjs --gdc /tmp/gdc/11th/gdc --out-dir <dossier> [--only a.json,b.json]
//   node editor/translations/gdc-compare.cjs <rapport.md> [/tmp/gdc/11th/gdc]   (ancien usage : chapitres
//        divergents DA, BA, SW, BT, DW en un seul Markdown — editor/SM_FICHES_OFFICIELLES_11E.md)
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const LEGACY = args[0] && !args[0].startsWith("--") ? args[0] : null;
const GDC = opt("--gdc") || (LEGACY ? args[1] : null) || "/tmp/gdc/11th/gdc";
const OUTDIR = opt("--out-dir");
const CHAPTERS = ["darkangels.json", "bloodangels.json", "spacewolves.json", "blacktemplar.json", "deathwatch.json"];
const ONLY = opt("--only") ? opt("--only").split(",") : (LEGACY ? CHAPTERS : null);
if (!LEGACY && !OUTDIR) { console.error("usage : --gdc <11th/gdc> --out-dir <dossier> [--only a.json,b.json]   |   <rapport.md> [gdc]"); process.exit(2); }
const MANIFEST = JSON.parse(fs.readFileSync(R + "/editor/sources/game-datacards.json", "utf8"));

// ── normalisations
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : (x == null ? "" : String(x));
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[‐-―−]/g, "-").replace(/^➤\s*/, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const K = (s) => N(s).replace(/\s*\((aura|psychic)\)$/i, "");                   // nom d'aptitude
const sing = (s) => N(s).replace(/s$/, "");
const plain = (s) => N(String(s || "").replace(/^\s*\(once per [^)]*\)\s*/i, "").replace(/<[^>]+>/g, " ").replace(/\*\*|\^\^/g, "").replace(/[■▫•●]/g, " ")).replace(/[^a-z0-9+]+/g, "");
const toOurs = (s) => String(s || "").replace(/<k>(.*?)<\/k>/g, "^^$1^^").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const cut = (s, n = 160) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const kwList = (k) => (Array.isArray(k) ? k : String(k || "").split(/,\s*/)).map((x) => N(x))
  .flatMap((x) => { const m = x.match(/^anti-([a-z]+)\/([a-z]+) (\d\+)$/); return m ? [`anti-${m[1]} ${m[3]}`, `anti-${m[2]} ${m[3]}`] : [x]; })
  .map((x) => x === "close-quarters" ? "pistol" : x).filter((x) => x && x !== "-" && !/^hunter/.test(x)).filter((x, i, a) => a.indexOf(x) === i);
const fv = (v) => String(v == null ? "" : v).replace(/"/g, "").replace(/\s+/g, "").toLowerCase();
const skillN = (s, kws) => { const v = fv(s); if (/^(-|n\/a|)$/.test(v)) return "n/a"; if (/^[7-9]\+$/.test(v) && kws.includes("torrent")) return "n/a"; return v; };
const nm = (n) => xml.getAttrDecoded(n, "name") || "";

// ── Legends / abandons / alias (mêmes sources que gdc-watch.cjs)
const LEG = new Set(), PRICED = new Set(), ABD = new Set();
try { for (const v of Object.values(JSON.parse(fs.readFileSync(R + "/editor/mfm/legends.json", "utf8")).factions || {})) for (const n of v) LEG.add(N(n)); } catch {}
try { const D = R + "/editor/mfm/dump/en"; for (const f of fs.readdirSync(D)) if (f.endsWith(".json") && f[0] !== "_") for (const u of JSON.parse(fs.readFileSync(path.join(D, f), "utf8")).units || []) PRICED.add(N(u.name)); } catch {}
try { for (const [s, v] of Object.entries(JSON.parse(fs.readFileSync(R + "/editor/mfm/abandons.json", "utf8")))) if (!s.startsWith("_")) for (const n of Object.keys(v)) ABD.add(N(n)); } catch {}
const ALIAS = new Map();
try { for (const [s, v] of Object.entries(JSON.parse(fs.readFileSync(R + "/editor/mfm/aliases.json", "utf8")))) if (!s.startsWith("_")) for (const [k, t] of Object.entries(v)) for (const x of [].concat(t)) { if (!ALIAS.has(N(k))) ALIAS.set(N(k), new Set()); ALIAS.get(N(k)).add(N(x)); } } catch {}

// ── base : index, lignes, fiches racines
const c = new Catalog(R).load(); const byId = (id) => (c.byId.get(id) || {}).node;
const LINES = new Map();                                       // fichier → Map(id → ligne)
for (const f of c.docs.keys()) { const m = new Map(); fs.readFileSync(path.join(R, f), "utf8").split("\n").forEach((L, i) => { for (const x of L.matchAll(/\bid="([^"]+)"/g)) if (!m.has(x[1])) m.set(x[1], i + 1); }); LINES.set(f, m); }
const where = (n) => { const id = n && xml.getAttr(n, "id"); const h = id && c.byId.get(id); if (!h) return null; return { file: h.file, line: (LINES.get(h.file) || new Map()).get(id) || null, id }; };
const loc = (w) => w ? `${w.file}:${w.line}` : "?";
const exposed = new Set(); for (const [, d] of c.docs) xml.walk(d.root, (n) => { if (n.tag === "entryLink" && xml.getAttr(n, "hidden") !== "true") exposed.add(xml.getAttr(n, "targetId")); });
// règles racine d'un catalogue (et des catalogues qu'il lie) : règles d'armée portées au niveau du catalogue
const CAT_RULES = new Map(); const catIdFile = new Map(); for (const [f, d] of c.docs) catIdFile.set(xml.getAttr(d.root, "id"), f);
for (const [f, d] of c.docs) { const set = new Set(); const take = (doc) => { for (const b of ["rules", "sharedRules"]) { const bx = xml.child(doc.root, b); for (const r of bx ? bx.children : []) if (r.tag === "rule") set.add(K(nm(r))); } };
  take(d); const cl = xml.child(d.root, "catalogueLinks"); for (const l of cl ? cl.children : []) { const t = c.docs.get(catIdFile.get(xml.getAttr(l, "targetId"))); if (t) take(t); }
  for (const [g, gd] of c.docs) if (g.endsWith(".gst")) take(gd); CAT_RULES.set(f, set); }
const roots = [];
for (const [f, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (!bx) continue;
  for (const e of bx.children) if (e.tag === "selectionEntry" && /^(unit|model)$/.test(xml.getAttr(e, "type") || "") && (xml.getAttr(e, "hidden") !== "true" || exposed.has(xml.getAttr(e, "id")))) roots.push({ file: f, node: e, name: nm(e) }); }

// ── modificateurs de profil décidables statiquement (voir l'en-tête : (a) porteur, (b) règle projetée)
const elems = (n, box, tag) => { const b = xml.child(n, box); return b ? b.children.filter((x) => x.tag === tag) : []; };
const leavesOf = (...ns) => { const o = []; for (const n of ns) xml.walk(n, (q) => { if (q.tag === "condition") o.push(q); }); return o; };
// verdict des conditions d'un modifier / modifierGroup / conditionGroup : true, false, ou null (une feuille indécidable)
function verdict(n, leaf, op = "and") {
  const parts = [...elems(n, "conditions", "condition").map(leaf), ...elems(n, "conditionGroups", "conditionGroup").map((g) => verdict(g, leaf, xml.getAttr(g, "type") === "or" ? "or" : "and"))];
  if (!parts.length) return true; if (parts.some((x) => x === null)) return null; return op === "or" ? parts.some(Boolean) : parts.every(Boolean); }
const modsOf = (n) => { const o = []; const rec = (x, gs) => { for (const m of elems(x, "modifiers", "modifier")) o.push([m, gs]); for (const g of elems(x, "modifierGroups", "modifierGroup")) rec(g, [...gs, g]); }; if (n) rec(n, []); return o; };
const fires = (m, gs, leaf) => verdict(m, leaf) === true && gs.every((g) => verdict(g, leaf) === true);
// (a) ids d'un porteur (fiche ou figurine) : catégories + ajouts − retraits inconditionnels, + id de l'entrée
function bearerIds(e) { const s = new Set(elems(e, "categoryLinks", "categoryLink").map((l) => xml.getAttr(l, "targetId")));
  const catMods = elems(e, "modifiers", "modifier").filter((m) => xml.getAttr(m, "field") === "category" && !leavesOf(m).length);
  for (const m of catMods) if (xml.getAttr(m, "type") === "add") s.add(xml.getAttr(m, "value"));
  for (const m of catMods) if (xml.getAttr(m, "type") === "remove") s.delete(xml.getAttr(m, "value"));
  s.add(xml.getAttr(e, "id")); s.delete(undefined); s.key = xml.getAttr(e, "id") || ""; return s; }
// feuille instanceOf / notInstanceOf de portée porteur → true / false ; autre feuille → null (comme unitCatLeaf)
const bearerLeaf = (ctx) => (q) => { const t = xml.getAttr(q, "type"); if (t !== "instanceOf" && t !== "notInstanceOf") return null; const sc = xml.getAttr(q, "scope");
  const top = ctx.model.length ? ctx.model[ctx.model.length - 1] : (ctx.unitIsModel ? ctx.unit : null);
  const has = sc === "root-entry" || sc === "unit" ? (id) => ctx.unit.has(id) : sc === "model" ? (top && ((id) => top.has(id))) : sc === "ancestor" ? (id) => ctx.unit.has(id) || ctx.model.some((x) => x.has(id)) : null;
  if (!has) return null; const r = has(xml.getAttr(q, "childId")); return t === "instanceOf" ? r : !r; };
const RANK = { set: 0, increment: 1, decrement: 1, append: 2 };
// caractéristiques d'un profil vues par ce porteur ; fired = caractéristiques touchées par un modifier appliqué
function effChars(p, link, ctx) {
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
// (b) masqué sur une liste vide (sélections roster/force comptées 0) ET charnière roster/force : règle projetée
const ZERO = { atLeast: (v) => 0 >= v, greaterThan: (v) => 0 > v, lessThan: (v) => 0 < v, atMost: (v) => 0 <= v, equalTo: (v) => 0 === v, notEqualTo: (v) => 0 !== v };
const ROSTER = (q) => /^(roster|force)$/.test(xml.getAttr(q, "scope") || "");
const rosterLeaf = (q) => ROSTER(q) && xml.getAttr(q, "field") === "selections" && ZERO[xml.getAttr(q, "type")] ? ZERO[xml.getAttr(q, "type")](Number(xml.getAttr(q, "value"))) : null;
function projected(...ns) { let hinge = false, hidden = false;
  for (const n of ns) { if (!n) continue; let h = xml.getAttr(n, "hidden") === "true";
    for (const [m, gs] of modsOf(n)) { if (xml.getAttr(m, "field") !== "hidden" || xml.getAttr(m, "type") !== "set" || !leavesOf(m, ...gs).some(ROSTER)) continue;
      hinge = true; if (fires(m, gs, rosterLeaf)) h = xml.getAttr(m, "value") === "true"; }
    hidden = hidden || h; }
  return hidden && hinge; }

// sous-arbre d'une fiche (liens visibles suivis, hors améliorations / Upgrade / Warlord / rattachements) ;
// les profils atteints par infoLink (profils partagés : « Battle Sister », « Bolt pistol »…) comptent comme les profils directs.
// Contexte de porteur (a) : la fiche + la pile des figurines traversées ; une entrée partagée atteinte sous deux
// figurines différentes est relue dans chaque contexte (profils dédoublonnés sur nœud + valeurs effectives).
function collect(u) {
  const W = [], S = [], A = [], L = new Set(), cats = new Set(), figs = []; let prov = "", invuln = null; const seen = new Map(), seenP = new Map(), figSeen = new Set();
  const com = xml.child(u, "comment"); if (com) { const t = xml.getText(com) || ""; const m = t.match(/^texte-provisoire:.*?— (.*)$/m); if (m) prov = m[1]; const iv = t.match(/invuln:\s*(\d\+)/); if (iv) invuln = iv[1]; }
  const catsOf = (e) => { const o = new Set(); const cl = xml.child(e, "categoryLinks"); for (const l of cl ? cl.children : []) if (l.tag === "categoryLink") { const t = byId(xml.getAttr(l, "targetId")); o.add((t ? nm(t) : "") || nm(l)); }
    const ms = xml.child(e, "modifiers"); for (const m of ms ? ms.children : []) if (m.tag === "modifier" && xml.getAttr(m, "type") === "add" && xml.getAttr(m, "field") === "category") { const t = byId(xml.getAttr(m, "value")); if (t) o.add(nm(t)); } o.delete(""); return o; };
  const unitCtx = bearerIds(u); const unitIsModel = xml.getAttr(u, "type") === "model";
  const prof = (k, name, link, ms) => { const { ch } = effChars(k, link, { unit: unitCtx, model: ms, unitIsModel }); const key = JSON.stringify(ch);
    if (!seenP.has(k)) seenP.set(k, new Set()); if (seenP.get(k).has(key)) return; seenP.get(k).add(key); const t = xml.getAttrDecoded(k, "typeName") || "";
    if (/Weapons$/.test(t)) W.push({ name, ch, kind: /^Melee/.test(t) ? "M" : "R", node: k });
    else if (t === "Unit") S.push({ name, v: [ch.M, ch.T, ch.SV, ch.W, ch.LD, ch.OC], node: k });
    else if (t === "Abilities") A.push({ name, text: Object.values(ch).join(" "), node: k });
    else if (t) A.push({ name: /^Transport$/i.test(t) ? t : name, text: Object.values(ch).join(" "), node: k, typed: t }); };   // Transport, Canticles…
  for (const x of catsOf(u)) cats.add(x); if (xml.getAttr(u, "type") === "model") figs.push({ name: nm(u), cats: catsOf(u), node: u });
  const isModel = (k) => k && k !== u && k.tag === "selectionEntry" && xml.getAttr(k, "type") === "model";
  const st = [[u, []]]; while (st.length) { const [n, ms0] = st.pop(); if (!n) continue; const ms = isModel(n) ? [...ms0, bearerIds(n)] : ms0;
    const sk = ms.map((x) => x.key).join(">"); if (!seen.has(n)) seen.set(n, new Set()); if (seen.get(n).has(sk)) continue; seen.get(n).add(sk);
    const go = (x, ms) => { for (const k of x.children || []) { if (!k.tag) continue;
      if ((k.tag === "selectionEntryGroup" && /Enhancement|^(Can (Lead|Support)|Led By|Supported By)/i.test(nm(k))) || (k.tag === "selectionEntry" && /Upgrade$/.test(nm(k)))) continue;
      if (isModel(k) && !figSeen.has(k)) { figSeen.add(k); figs.push({ name: nm(k), cats: catsOf(k), node: k }); }
      if (k.tag === "profile") { if (projected(k)) continue; prof(k, nm(k), null, ms); }
      if (k.tag === "infoLink") { const t = byId(xml.getAttr(k, "targetId")); if (projected(k, t)) continue; if (t && t.tag === "profile") prof(t, nm(k) || nm(t), k, ms); else L.add(N(nm(k) || (t ? nm(t) : ""))); continue; }
      if (k.tag === "entryLink") { if (xml.getAttr(k, "hidden") !== "true" && !/Upgrade$|^Warlord$|^Enhancements$/.test(nm(k))) st.push([byId(xml.getAttr(k, "targetId")), ms]); continue; }
      go(k, isModel(k) ? [...ms, bearerIds(k)] : ms); } };
    go(n, ms); }
  return { W, S, A, L, cats, figs, prov, invuln };
}

// ── amont : fiches par fichier
const files = fs.readdirSync(GDC).filter((f) => f.endsWith(".json")).filter((f) => { try { return Array.isArray(JSON.parse(fs.readFileSync(path.join(GDC, f), "utf8")).datasheets); } catch { return false; } });
const GD = new Map(); for (const f of files) GD.set(f, JSON.parse(fs.readFileSync(path.join(GDC, f), "utf8")));
const VOCAB = new Set(); for (const [, F] of GD) for (const ds of F.datasheets) { for (const k of ds.keywords || []) VOCAB.add(N(en(k))); for (const m of ds.modelKeywords || []) for (const k of m.keywords || []) VOCAB.add(N(en(k))); }
const offByName = new Map();                                    // nom normalisé (singulier) → [{ file, ds }]
for (const [f, F] of GD) for (const ds of F.datasheets) { const k = sing(en(ds.name)); if (!offByName.has(k)) offByName.set(k, []); offByName.get(k).push({ file: f, ds }); }
const homes = (cat) => Object.entries(MANIFEST.files).filter(([, v]) => (v.catalogues || []).includes(cat)).sort((a, b) => a[1].catalogues.indexOf(cat) - b[1].catalogues.indexOf(cat)).map(([f]) => f);

// ── comparaison d'une paire (fiche officielle, fiche de la base)
const wN = (s) => N(s).replace(/\s*&\s*/g, " and ").replace(/\s*\(ref\.? only\)/, "");
const kwKey = (x) => x.replace(/\s*\(([^)]*)\)$/, ": $1").replace(/[\s-]+/g, "");     // « twin linked » = « twin-linked », « (x) » = « : x »
function compare(ds, ours) {
  const o = collect(ours.node); const it = []; const W0 = where(ours.node);
  const add = (classe, kind, field, base, off, node, note) => it.push({ classe, kind, field, valBase: String(base), valOff: String(off), at: where(node) || W0, note: note || "" });
  // caractéristiques
  const offS = (ds.stats || []).map((s) => ({ name: en(s.name), v: [s.m, s.t, s.sv, s.w, s.ld, s.oc] }));
  const F6 = ["M", "T", "SV", "W", "LD", "OC"]; const usedS = new Set(); const sameV = (a, b) => a.map(fv).join("/") === b.map(fv).join("/");
  for (const s of offS) { let mine = o.S.find((x) => !usedS.has(x) && sing(x.name) === sing(s.name));
    if (!mine && offS.length === 1 && o.S.length === 1) { mine = o.S[0]; if (N(mine.name) !== N(s.name)) add("nom", "caractéristiques", "profil", mine.name, s.name, mine.node, "seul profil de part et d'autre, nom différent"); }
    if (!mine) { const same = o.S.find((x) => !usedS.has(x) && !offS.some((y) => sing(y.name) === sing(x.name)) && sameV(x.v, s.v)); if (same) { usedS.add(same); add("nom", "caractéristiques", "profil", same.name, s.name, same.node, "mêmes valeurs sous un autre nom"); continue; }
      const rest = o.S.filter((x) => !usedS.has(x) && !offS.some((y) => sing(y.name) === sing(x.name)));
      if (rest.length === 1 && offS.filter((y) => !o.S.some((x) => sing(x.name) === sing(y.name))).length === 1) { mine = rest[0]; add("nom", "caractéristiques", "profil", mine.name, s.name, mine.node, "nom de profil différent (valeurs comparées ci-dessous)"); }
      else { const d6 = (x) => x.v.reduce((n, v, i) => n + (fv(v) !== fv(s.v[i])), 0); const near = [...o.S].sort((a, b) => d6(a) - d6(b))[0];
        if (near && d6(near) <= 2) { add("nom", "caractéristiques", "profil", near.name, s.name, near.node, `profil officiel « ${s.name} » absent : comparé au profil le plus proche de la base`);
          for (let i = 0; i < 6; i++) if (fv(near.v[i]) !== fv(s.v[i])) add("vrai", "caractéristiques", `${s.name} ${F6[i]}`, near.v[i], s.v[i], near.node); continue; }
        add("vrai", "caractéristiques", "profil", "—", `${s.name} ${s.v.join("/")}`, ours.node, "profil officiel absent"); continue; } }
    usedS.add(mine); for (let i = 0; i < 6; i++) if (fv(mine.v[i]) !== fv(s.v[i])) add("vrai", "caractéristiques", `${s.name} ${F6[i]}`, mine.v[i], s.v[i], mine.node); }
  // invulnérable
  const offInv = ds.abilities && ds.abilities.invul && ds.abilities.invul.value;
  const ourInvTxt = o.A.find((a) => /^invulnerable save/i.test(N(a.name)));
  const ourInv = o.invuln || (ourInvTxt && (ourInvTxt.text.match(/(\d\+)/) || [])[1]) || null;
  if (offInv && !ourInv) add("vrai", "aptitude", "invulnérable", "—", offInv, ours.node, "profil « Invulnerable Save » / marqueur invuln: absents");
  else if (offInv && ourInv && fv(ourInv) !== fv(offInv)) add("vrai", "aptitude", "invulnérable", ourInv, offInv, ourInvTxt ? ourInvTxt.node : ours.node);
  else if (!offInv && ourInv) add("vrai", "aptitude", "invulnérable", ourInv, "—", ourInvTxt ? ourInvTxt.node : ours.node, "invulnérable de la base absente de la fiche officielle (aptitude conditionnelle ?)");
  // armes : profil par profil, appariés par nom puis par type (tir / mêlée), au plus proche
  const offW = []; for (const [kind, arr] of [["R", ds.rangedWeapons], ["M", ds.meleeWeapons]]) for (const g of arr || []) for (const p of g.profiles || []) offW.push({ kind, name: en(p.name), p });
  const sig = (r, a, s, st, ap, d, kw) => { const kws = kwList(kw); return { v: [/melee/i.test(r) ? "melee" : fv(r), fv(a), skillN(s, kws), fv(st), fv(ap), fv(d)], kws }; };
  const offSig = (p) => sig(p.range, p.attacks, p.skill, p.strength, p.ap, p.damage, p.keywords);
  const ourSig = (ch) => sig(ch.Range, ch.A, ch.BS || ch.WS, ch.S, ch.AP, ch.D, ch.Keywords);
  const dist = (a, b) => a.v.reduce((n, x, i) => n + (x !== b.v[i]), 0) + (a.kws.map(kwKey).sort().join() !== b.kws.map(kwKey).sort().join());
  const WF = ["Range", "A", "BS/WS", "S", "AP", "D"];
  const refOnly = o.W.filter((w) => /\(ref\.? only\)/i.test(w.name)); const ourW = o.W.filter((w) => !refOnly.includes(w));
  // dédoublonnage : un même profil partagé atteint par plusieurs chemins ne compte qu'une fois (nom + valeurs)
  const uniq = []; for (const w of ourW) { const k = wN(w.name) + "#" + JSON.stringify(ourSig(w.ch)); if (!uniq.some((u) => u.k === k)) uniq.push({ k, w }); }
  const ours2 = uniq.map((u) => u.w); const used = new Set(), unOff = [];
  for (const w of offW) { const os = offSig(w.p); const cands = ours2.filter((q) => !used.has(q) && wN(q.name) === wN(w.name));
    if (!cands.length) { if (ours2.some((q) => wN(q.name) === wN(w.name))) continue; unOff.push(w); continue; }
    const q = cands.sort((a, b) => (a.kind !== w.kind) - (b.kind !== w.kind) || dist(ourSig(a.ch), os) - dist(ourSig(b.ch), os))[0]; used.add(q);
    const us = ourSig(q.ch); for (let i = 0; i < 6; i++) if (us.v[i] !== os.v[i]) add("vrai", "arme", `${w.name} ${WF[i]}`, us.v[i], os.v[i], q.node);
    const ok = os.kws.map(kwKey), uk = us.kws.map(kwKey); const plus = os.kws.filter((x) => !uk.includes(kwKey(x))), minus = us.kws.filter((x) => !ok.includes(kwKey(x)));
    if (plus.length || minus.length) add("vrai", "arme", `${w.name} mots-clefs`, us.kws.join(", ") || "—", os.kws.join(", ") || "—", q.node, `${plus.length ? "+[" + plus.join(", ") + "] " : ""}${minus.length ? "−[" + minus.join(", ") + "]" : ""}`.trim()); }
  const unOur = ours2.filter((q) => !used.has(q) && !offW.some((w) => wN(w.name) === wN(q.name)));
  for (const w of unOff) { const os = offSig(w.p); const same = unOur.find((q) => dist(ourSig(q.ch), os) === 0);
    if (same) { add("nom", "arme", w.name, same.name, w.name, same.node, "même profil sous un autre nom"); unOur.splice(unOur.indexOf(same), 1); continue; }
    const ref = refOnly.find((q) => wN(q.name) === wN(w.name));
    if (ref) { add("modele", "arme", w.name, ref.name, w.name, ref.node, "profil « (ref. only) » de la base"); continue; }
    const wb = (x) => wN(x).split(" - ")[0].trim();
    const near = unOur.find((q) => q.kind === w.kind && (dist(ourSig(q.ch), os) <= 1 || (wb(q.name) === wb(w.name) && dist(ourSig(q.ch), os) <= 3)));
    if (near) { add("nom", "arme", w.name, near.name, w.name, near.node, "profil voisin sous un autre nom (valeurs comparées ci-dessous)"); unOur.splice(unOur.indexOf(near), 1);
      const us = ourSig(near.ch); for (let i = 0; i < 6; i++) if (us.v[i] !== os.v[i]) add("vrai", "arme", `${w.name} ${WF[i]}`, us.v[i], os.v[i], near.node);
      const ok = os.kws.map(kwKey), uk = us.kws.map(kwKey); const plus = os.kws.filter((x) => !uk.includes(kwKey(x))), minus = us.kws.filter((x) => !ok.includes(kwKey(x)));
      if (plus.length || minus.length) add("vrai", "arme", `${w.name} mots-clefs`, us.kws.join(", ") || "—", os.kws.join(", ") || "—", near.node, `${plus.length ? "+[" + plus.join(", ") + "] " : ""}${minus.length ? "−[" + minus.join(", ") + "]" : ""}`.trim()); continue; }
    add("vrai", "arme", w.name, "—", `${os.v.join("|")}${os.kws.length ? " [" + os.kws.join(", ") + "]" : ""}`, ours.node, "profil officiel absent de la base"); }
  for (const q of unOur) add("vrai", "arme", q.name, ourSig(q.ch).v.join("|"), "—", q.node, "profil de la base absent de la fiche officielle");
  // mots-clefs : unité + figurines (modelKeywords)
  const strip = (x) => sing(N(x).replace(/^faction: /, "").replace(/\*$/, "").trim());
  const offKw = new Set((ds.keywords || []).map((k) => sing(en(k))));
  const allOurCats = [...o.cats, ...o.figs.flatMap((f) => [...f.cats])]; const ourCats = new Set(allOurCats.map(strip));
  const mk = (ds.modelKeywords || []).map((m) => ({ name: en(m.name), names: Object.values(m.name && typeof m.name === "object" ? m.name : { en: m.name }).map(sing), kws: (m.keywords || []).map((k) => sing(en(k))) }));
  const modelOnly = new Set(mk.flatMap((m) => m.kws));
  const names = new Set([sing(en(ds.name)), sing(nm(ours.node)), ...o.figs.map((f) => sing(f.name)), ...(ds.stats || []).map((s) => sing(en(s.name))), ...mk.flatMap((m) => m.names)]);
  for (const k of offKw) { if (ourCats.has(k)) { for (const m of mk.filter((m) => m.kws.includes(k))) { const f = o.figs.filter((x) => m.names.includes(sing(x.name)));
        if (f.length && !f.every((x) => [...x.cats].map(strip).includes(k) || [...o.cats].map(strip).includes(k))) add("vrai", "mots-clefs", `figurine « ${m.name} »`, "—", k, f[0].node, "mot-clef de figurine porté ailleurs dans la fiche mais pas par cette figurine"); }
      continue; }
    const m = mk.find((x) => x.kws.includes(k));
    if (names.has(k)) { add("modele", "mots-clefs", m ? `figurine « ${m.name} »` : "unité", "—", k, ours.node, "mot-clef au nom de la fiche / d'une figurine : catégorie non créée par la base"); continue; }
    add("vrai", "mots-clefs", m ? `figurine « ${m.name} »` : "unité", "—", k, ours.node, m && !o.figs.some((x) => m.names.includes(sing(x.name))) ? `figurine « ${m.name} » absente de la fiche` : "mot-clef officiel absent"); }
  for (const k of ourCats) { if (offKw.has(k) || modelOnly.has(k)) continue; const raw = allOurCats.find((x) => strip(x) === k) || k;
    if (/^faction: /i.test(raw) || /\*$/.test(raw) || names.has(k) || !VOCAB.has(k)) add("modele", "mots-clefs", "catégorie", raw, "—", ours.node, /^faction: /i.test(raw) ? "catégorie de faction" : /\*$/.test(raw) ? "catégorie conditionnelle (« * »)" : names.has(k) ? "catégorie au nom de l'unité / d'une figurine" : "catégorie interne (absente du vocabulaire officiel)");
    else add("vrai", "mots-clefs", "unité", raw, "—", ours.node, "mot-clef de la base absent de la fiche officielle"); }
  // aptitudes : par nom (exact, puis inclusion), puis par texte identique
  const ab = ds.abilities || {}; const offA = [];
  for (const g of ["other", "special", "wargear"]) for (const a of ab[g] || []) offA.push({ name: en(a.name), text: en(a.description) });
  for (const grp of ab.primarch || []) for (const a of grp.abilities || []) offA.push({ name: en(a.name), text: en(a.description) });
  const provSet = new Set((o.prov || "").split(" | ").map(K));
  const ourA = []; for (const a of o.A) if (!/^invulnerable save|^damaged/i.test(N(a.name)) && !ourA.some((x) => K(x.name) === K(a.name) && plain(x.text) === plain(a.text))) ourA.push(a);
  const usedA = new Set(); const offTexts = new Set(offA.map((a) => plain(a.text)).filter(Boolean));
  for (const a of offA) { const k = K(a.name); const po = plain(a.text); const free = ourA.filter((x) => !usedA.has(x));
    let mine = free.find((x) => K(x.name) === k) || free.find((x) => K(x.name).includes(k) || k.includes(K(x.name)));
    if (!mine) { if (o.L.has(k) || [...o.L].some((x) => x.startsWith(k))) continue; const same = free.find((x) => po && plain(x.text) === po);
      if (same) { usedA.add(same); add("nom", "aptitude", a.name, same.name, a.name, same.node, "même texte sous un autre nom"); }
      else add("vrai", "aptitude", a.name, "—", cut(toOurs(a.text)), ours.node, "aptitude officielle absente"); continue; }
    usedA.add(mine); if (K(mine.name) !== k) add("nom", "aptitude", a.name, mine.name, a.name, mine.node, "nom de la base plus long / plus court (textes comparés ci-dessous)");
    const pm = plain(mine.text);
    if (pm !== po) { if (provSet.has(k)) add("vrai", "aptitude", a.name, "texte provisoire (ALN)", cut(toOurs(a.text)), mine.node, "⚑ texte provisoire à remplacer");
      else if (pm.includes(po) || po.includes(pm)) add("modele", "aptitude", a.name, cut(mine.text, 80), cut(toOurs(a.text), 80), mine.node, "texte de la base inclus dans l'officiel (ou l'inverse) : ajout/omission locale à relire");
      else add("vrai", "aptitude", a.name, cut(mine.text), cut(toOurs(a.text)), mine.node, "texte différent"); } }
  const coreN = [...(ab.core || []), ...(ab.faction || [])].map((a) => K(en(a.name)));
  const stemOf = (k) => k.replace(/(\s+[0-9d+"'\-]+)+$/i, "").trim();
  for (const a of [...(ab.core || []), ...(ab.faction || [])]) { const k = K(en(a.name)); if (/^damaged/.test(k)) continue; const st = stemOf(k);
    if (!o.L.has(k) && ![...o.L].some((x) => x.startsWith(st)) && !ourA.some((x) => K(x.name).startsWith(st))) {
      const cat = CAT_RULES.get(ours.file) || new Set(); const glob = [...cat].some((x) => x === k || x.startsWith(st));
      if (glob) add("modele", "aptitude", en(a.name), "règle du catalogue", "règle de base / de faction", ours.node, "règle d'armée portée au niveau du catalogue (rules racine), pas par la fiche");
      else add("vrai", "aptitude", en(a.name), "—", "règle de base / de faction", ours.node, "règle officielle absente (infoLink)"); } }
  const offN = offA.map((a) => K(a.name));
  for (const x of ourA) { if (usedA.has(x)) continue; const k = K(x.name);
    if (offN.some((y) => y === k || y.includes(k) || k.includes(y)) || coreN.some((y) => stemOf(y) && k.startsWith(stemOf(y)))) continue;
    if (/^(leader|support|attached unit|transport|supreme commander|deadly demise|deep strike|scouts?|infiltrators|stealth|lone operative|feel no pain|firing deck|fights first|hover)/.test(k) || /\(ref\.? only\)/.test(k)) continue;
    if (offTexts.has(plain(x.text))) continue;
    add("vrai", "aptitude", x.name, cut(x.text, 80), "—", x.node, "aptitude de la base absente de la fiche officielle"); }
  return it;
}

// ── appariement base → amont
const pairs = new Map();                                        // fichier amont → [{ ds, ours, copy, items }]
const matchedOff = new Set(); const horsSource = [];
for (const r of roots) {
  const keys = new Set([sing(r.name)]); for (const [k, v] of ALIAS) if (v.has(N(r.name))) keys.add(sing(k));
  const cands = [...keys].flatMap((k) => offByName.get(k) || []);
  if (!cands.length) { horsSource.push(r); continue; }
  const H = homes(r.file); const home = H.flatMap((f) => cands.filter((x) => x.file === f));
  let targets = home, note = "";
  if (!targets.length) { // copie hors faction : la fiche officielle la plus proche (moins d'écarts « vrais »)
    const scored = cands.map((x) => ({ x, items: compare(x.ds, r) })).sort((a, b) => a.items.filter((i) => i.classe === "vrai").length - b.items.filter((i) => i.classe === "vrai").length);
    targets = [scored[0].x]; note = `copie hors faction (catalogue ${r.file})${cands.length > 1 ? ` ; ${cands.length} fiches officielles de ce nom (${[...new Set(cands.map((x) => x.file))].join(", ")}), la plus proche retenue` : ""}`; }
  for (const t of targets) { matchedOff.add(t.ds); if (!pairs.has(t.file)) pairs.set(t.file, []); pairs.get(t.file).push({ ds: t.ds, ours: r, note, items: compare(t.ds, r) }); }
}

// ── extras systématiques (même aptitude / catégorie de la base « absente de la fiche officielle » sur ≥ 4 fiches :
//    marques du Chaos, règles d'armée posées sur chaque fiche, catégories techniques…) → choix de modélisation
const SYS = new Map(); const sysKey = (i) => i.kind + "|" + N(i.field === "unité" ? i.valBase : i.field);
const isExtra = (i) => i.classe === "vrai" && /aptitude de la base absente|mot-clef de la base absent/.test(i.note);
for (const [, P] of pairs) for (const p of P) for (const i of p.items) if (isExtra(i)) SYS.set(sysKey(i), (SYS.get(sysKey(i)) || 0) + 1);
for (const [, P] of pairs) for (const p of P) for (const i of p.items) if (isExtra(i) && SYS.get(sysKey(i)) >= 4) { i.classe = "modele"; i.note = `${i.note} — systématique (${SYS.get(sysKey(i))} fiches : option, marque, règle d'armée ou catégorie technique de la base)`; }
// mot-clef officiel absent sur ≥ 5 fiches (EXPLOSIVES, FRAME…) : reste un vrai écart, signalé comme décision d'ensemble
const MISS = new Map(); for (const [, P] of pairs) for (const p of P) for (const i of p.items) if (i.classe === "vrai" && i.note === "mot-clef officiel absent") MISS.set(i.valOff, (MISS.get(i.valOff) || 0) + 1);
for (const [, P] of pairs) for (const p of P) for (const i of p.items) if (i.classe === "vrai" && i.note === "mot-clef officiel absent" && MISS.get(i.valOff) >= 5) i.note += ` — systématique (${MISS.get(i.valOff)} fiches : catégorie à poser en masse)`;

// ── rapports
const CL = { vrai: "Vrais écarts à corriger", nom: "Faux positifs d'appariement (noms)", modele: "Choix de modélisation de la base" };
const index = []; const outFiles = []; const legacy = [];
for (const f of files.filter((x) => !ONLY || ONLY.includes(x))) {
  const F = GD.get(f); const label = (MANIFEST.files[f] || {}).label || f.replace(/\.json$/, ""); const P = pairs.get(f) || [];
  const absent = F.datasheets.filter((ds) => !matchedOff.has(ds)).map((ds) => { const n = en(ds.name); return { name: n, statut: ABD.has(N(n)) ? "abandonnée (abandons.json)" : LEG.has(N(n)) ? (PRICED.has(N(n)) ? "Legends au MFM pour cette faction (au barème d'une autre faction)" : "Legends (hors base)") : "absente de la base" }; });
  const cats = new Set((MANIFEST.files[f] || {}).catalogues || []);
  const hs = horsSource.filter((r) => cats.has(r.file) && (MANIFEST.files[f].catalogues[0] === r.file)).map((r) => ({ name: r.name, at: where(r.node) }));
  const items = P.flatMap((p) => p.items.map((i) => ({ fiche: en(p.ds.name), ours: p.ours.name, copie: p.note, ...i })));
  const count = (k) => items.filter((i) => i.classe === k).length;
  const ok = P.filter((p) => !p.items.some((i) => i.classe === "vrai")).length;
  const L = [`# ${label} — fiches de la base vs fiches officielles (${f})`, "",
    `Source : game-datacards/datasources \`11th/gdc/${f}\`, données ${F.compatibleDataVersion}, export ${String(F.updated || "?").slice(0, 19)}. Généré par \`editor/translations/gdc-compare.cjs\` (lecture seule).`, "",
    `Bilan : ${P.length} paire(s) comparée(s) (${ok} sans vrai écart) · ${count("vrai")} vrai(s) écart(s) · ${count("nom")} faux positif(s) d'appariement · ${count("modele")} choix de modélisation · ${absent.filter((a) => a.statut === "absente de la base").length} fiche(s) officielle(s) absente(s) de la base · ${hs.length} fiche(s) de la base hors source.`, ""];
  for (const k of ["vrai", "nom", "modele"]) { const its = items.filter((i) => i.classe === k); if (!its.length) continue;
    L.push(`## ${CL[k]} (${its.length})`, ""); if (k === "modele") L.push("<details><summary>détail</summary>", "");
    let cur = null; for (const i of its) { const head = `${i.fiche}${N(i.ours) !== N(i.fiche) ? ` (base : « ${i.ours} »)` : ""}${i.copie ? ` — ${i.copie}` : ""}`; if (head !== cur) { cur = head; L.push(`### ${head}`); }
      L.push(`- ${i.kind} · **${i.field}** : base \`${i.valBase}\` → officiel \`${i.valOff}\`${i.note ? ` — ${i.note}` : ""} · ${loc(i.at)}`); }
    if (k === "modele") L.push("", "</details>"); L.push(""); }
  if (absent.length) { L.push(`## Fiches officielles sans fiche dans la base (${absent.length})`, ""); for (const a of absent) L.push(`- ${a.name} — ${a.statut}`); L.push(""); }
  if (hs.length) { L.push(`## Fiches / figurines racines de la base sans fiche officielle (${hs.length}) — catalogue principal de la faction`, ""); L.push(hs.map((h) => `${h.name} (${loc(h.at)})`).join(" · "), ""); }
  // composition officielle (pour encodage) : composition, équipement par défaut, options
  const compos = [...new Set(P.map((p) => p.ds))].map((ds) => ({ fiche: en(ds.name), composition: (ds.composition || []).map(en).filter(Boolean), equipement: en(ds.loadout),
    options: [...new Set((ds.wargearOptions || []).map((w) => en(w.instruction)).filter((x) => x && !/^Default Wargear$/i.test(x)))] }));
  if (compos.length) { L.push(`## Composition et options officielles (${compos.length})`, ""); if (!LEGACY) L.push("<details><summary>détail</summary>", "");
    for (const c of compos) { L.push(`### ${c.fiche}`, `- 📦 composition officielle : ${c.composition.join(" ; ")}`); if (c.equipement) L.push(`  - équipement : ${c.equipement}`); for (const x of c.options) L.push(`  - option : ${x}`); }
    if (!LEGACY) L.push("", "</details>"); L.push(""); }
  const md = L.join("\n") + "\n";
  const json = { file: f, label, dataVersion: F.compatibleDataVersion, updated: F.updated, counts: { paires: P.length, sansEcart: ok, vrai: count("vrai"), nom: count("nom"), modele: count("modele"), absentes: absent.length, horsSource: hs.length },
    items: items.map((i) => ({ fiche: i.fiche, ficheBase: i.ours, copie: i.copie || undefined, classe: i.classe, kind: i.kind, field: i.field, base: i.valBase, officiel: i.valOff, note: i.note || undefined, file: i.at && i.at.file, line: i.at && i.at.line, id: i.at && i.at.id })), absentes: absent, horsSource: hs.map((h) => ({ name: h.name, file: h.at && h.at.file, line: h.at && h.at.line })), compositions: compos };
  if (OUTDIR) { const b = f.replace(/\.json$/, ""); fs.mkdirSync(OUTDIR, { recursive: true }); fs.writeFileSync(path.join(OUTDIR, b + ".md"), md); fs.writeFileSync(path.join(OUTDIR, b + ".json"), JSON.stringify(json, null, 1) + "\n"); outFiles.push(b); }
  if (LEGACY) legacy.push(md.replace(/^# /, "## "));
  index.push({ f, label, ...json.counts });
}
const T = (k) => index.reduce((s, x) => s + x[k], 0);
const head = [`# Fiches de la base vs fiches officielles (game-datacards ${[...GD.values()][0].compatibleDataVersion})`, "",
  "Classement : **vrai** = écart à corriger (la fiche officielle fait foi) · **nom** = faux positif d'appariement (même contenu, autre nom) · **modele** = choix de modélisation de la base (catégories internes, « (ref. only) », Hunter, Torrent 7+ = N/A…).", "",
  "| Faction | Fichier | Paires | Sans écart | Vrais | Noms | Modélisation | Absentes | Hors source |", "|---|---|---|---|---|---|---|---|---|",
  ...index.map((x) => `| ${x.label} | ${OUTDIR ? `[${x.f}](${x.f.replace(/\.json$/, ".md")})` : x.f} | ${x.paires} | ${x.sansEcart} | ${x.vrai} | ${x.nom} | ${x.modele} | ${x.absentes} | ${x.horsSource} |`),
  `| **Total** | | ${T("paires")} | ${T("sansEcart")} | ${T("vrai")} | ${T("nom")} | ${T("modele")} | ${T("absentes")} | ${T("horsSource")} |`, ""];
if (OUTDIR) { fs.writeFileSync(path.join(OUTDIR, "README.md"), head.join("\n") + "\n"); fs.writeFileSync(path.join(OUTDIR, "index.json"), JSON.stringify(index, null, 1) + "\n"); }
if (LEGACY) fs.writeFileSync(LEGACY, head.concat(legacy).join("\n") + "\n");
console.log(`gdc-compare : ${index.length} fichier(s) · ${T("paires")} paires · vrais ${T("vrai")} · noms ${T("nom")} · modélisation ${T("modele")} · absentes ${T("absentes")} · hors source ${T("horsSource")}${OUTDIR ? ` → ${OUTDIR}/` : ""}${LEGACY ? ` → ${LEGACY}` : ""}`);
