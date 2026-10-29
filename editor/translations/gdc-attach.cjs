// gdc-attach.cjs — synchronise les RATTACHEMENTS Leader / Support sur la fiche officielle (game-datacards,
// champ `attachesTo`), toutes factions du manifeste editor/sources/game-datacards.json.
//
// Pourquoi : les groupes déclaratifs « Can Lead (MFM) » / « Can Support (MFM) » (LEADER_LINKS_APP_PROMPT)
// avaient été générés une fois ; une fiche ajoutée ensuite (Kaius Konorius, codex SM 11e) restait sans liste,
// et un personnage du TRONC Space Marines ne pouvait pas viser une unité d'un CHAPITRE (hors de sa clôture
// d'import : Captain → Sword Brethren, Deathwatch Veterans, Inner Circle Companions…).
//
// Encodage (deux sens, toujours DANS la clôture d'import du fichier qui porte le groupe) :
//   · cible dans la clôture du meneur        → lien sur le meneur : groupe « Can Lead (MFM) » / « Can Support (MFM) » ;
//   · meneur dans la clôture de la cible     → lien INVERSE sur la cible : groupe « Led By (MFM) » / « Supported By (MFM) »
//     (hidden, max=0, entryLinks vers la fiche du meneur) ; l'appli les fusionne dans la liste du meneur, par faction.
// Le meneur reçoit aussi la règle de base (Leader b4dd-… / Support 21f5-…) et l'aptitude « Leader » / « Support »
// (texte officiel) s'il ne les porte pas. Les liens que la fiche officielle ne porte pas sont retirés (la fiche
// fait foi), sauf si la cible a été scindée côté officiel (« Eradicator Squad » ↔ « Eradicator Squad with … »).
// Appariement des noms (2026-10-29 — trois angles morts qui laissaient des fiches hors synchronisation) :
// tirets typographiques normalisés (« Shield‑Captain », U+2011), fiche racine hidden exposée par un entryLink
// visible (Marneus Calgar jusqu'au 2026-10-29), noms officiels ≠ les nôtres résolus par editor/mfm/aliases.json (« Eradicator Squad
// with melta rifles » → « Eradicator Squad », « Ancient in Terminator Armour » → « … Armor »).
//
// Fiches LEGENDS (editor/mfm/legends.json, décision du 2026-10-29 : rien de Legends dans la base ni l'appli) : une
// cible officielle Legends n'est ni liée ni écrite dans la prose. Un SENS que la fiche officielle ne porte pas
// (Judiciar, Sanguinary Priest : Support seulement) perd ses liens directs.
// --prose : réécrit la liste de la prose « Leader » / « Support » quand elle diffère de la fiche officielle
// (noms de nos fiches, Legends exclues ; en-tête et notes conservés ; aptitude renommée selon le sens officiel)
// et pose sa traduction dans translations/fr.json (noms du pack, sinon nom FR officiel de la source ; notes
// reprises de l'ancienne traduction). L'appli AFFICHE cette prose (panneau « Peut diriger ») et en déduit les
// rattachements par mot-clef des noms qu'elle ne résout pas : une prose périmée se voit et peut rattacher à tort.
//
//   node editor/translations/gdc-attach.cjs <dossier 11th/gdc> [--write] [--prose] [--only "Fiche"] [--strings fr.json]
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const GDC = args[0]; const WRITE = args.includes("--write"); const PROSE = args.includes("--prose");
const ONLY = new Set(args.filter((a, i) => args[i - 1] === "--only"));
if (!GDC) { console.error("usage : gdc-attach.cjs <11th/gdc> [--write] [--only Fiche]"); process.exit(2); }
const MAN = JSON.parse(fs.readFileSync(R + "/editor/sources/game-datacards.json", "utf8"));
const RULE = { leader: ["b4dd-3e1f-41cb-218f", "Leader"], support: ["21f5-c07c-6d97-4405", "Support"] };
const FWD = { leader: "Can Lead (MFM)", support: "Can Support (MFM)" };
const REV = { leader: "Led By (MFM)", support: "Supported By (MFM)" };
const ABIL_TYPE = "9cc3-6d83-4dd3-9b64";
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : (x == null ? "" : String(x));
// tirets typographiques (U+2010–2015) ramenés à « - » : la source écrit « Shield‑Captain » (U+2011), comme gdc-watch
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\u2010-\u2015]/g, "-").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const el = (tag, attrs, kids) => { const e = xml.elem(tag, attrs, kids || []); e.selfClose = !(kids && kids.length); return e; };
const c = new Catalog(R).load(); const dirty = new Set(); const log = []; const warn = [];

// ── clôture d'import par fichier (catalogueLinks transitifs)
const fileOfCat = new Map(); for (const [f, d] of c.docs) fileOfCat.set(xml.getAttr(d.root, "id"), f);
const closure = new Map();
function clos(f) { if (closure.has(f)) return closure.get(f); const s = new Set([f]); closure.set(f, s);
  const cl = xml.child(c.docs.get(f).root, "catalogueLinks"); if (cl) for (const k of cl.children) { const t = fileOfCat.get(xml.getAttr(k, "targetId")); if (t) for (const x of clos(t)) s.add(x); } return s; }
// ── fiches racine par nom ; une fiche hidden reste une datasheet si un entryLink racine VISIBLE l'expose
// (cas de Marneus Calgar jusqu'au 2026-10-29 : l'appli le proposait, sa liste devait suivre la fiche officielle)
const linkedVisible = new Set(); for (const [, d] of c.docs) { const el = xml.child(d.root, "entryLinks"); if (el) for (const k of el.children) if (k.tag === "entryLink" && xml.getAttr(k, "hidden") !== "true") linkedVisible.add(xml.getAttr(k, "targetId")); }
const units = new Map(); for (const [f, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (!bx) continue;
  for (const e of bx.children) if (e.tag === "selectionEntry" && /^(unit|model)$/.test(xml.getAttr(e, "type") || "") && (xml.getAttr(e, "hidden") !== "true" || linkedVisible.has(xml.getAttr(e, "id")))) { const k = N(nm(e)); if (!units.has(k)) units.set(k, []); units.get(k).push({ f, e }); } }
// noms officiels qui diffèrent des nôtres : la table d'alias du MFM (mêmes noms que la source) —
// « Eradicator Squad with melta rifles » → « Eradicator Squad », « Ancient in Terminator Armour » → « … Armor »
const ALIAS = new Map(); { const A = JSON.parse(fs.readFileSync(R + "/editor/mfm/aliases.json", "utf8"));
  for (const [slug, m] of Object.entries(A)) if (slug !== "_doc") for (const [k, v] of Object.entries(m)) { const s = ALIAS.get(N(k)) || new Set(); for (const x of [].concat(v)) s.add(x); ALIAS.set(N(k), s); } }
const byName = (name) => { const direct = units.get(N(name)); if (direct) return direct; const out = [];
  for (const v of ALIAS.get(N(name)) || []) { const hit = c.byId.get(v); if (hit && hit.node.tag === "selectionEntry") { for (const l of units.values()) for (const x of l) if (x.e === hit.node) out.push(x); } else out.push(...(units.get(N(v)) || [])); }
  return out; };
// fiches Legends du MFM (hors base) : jamais liées ni écrites dans une prose. Legends = nom de
// editor/mfm/legends.json qui n'est au barème d'AUCUNE faction (Razorback : Legends SM, au barème GK).
const LEGENDS = new Set(); try { for (const v of Object.values(JSON.parse(fs.readFileSync(R + "/editor/mfm/legends.json", "utf8")).factions || {})) for (const n of v) LEGENDS.add(N(n));
  const D = R + "/editor/mfm/dump/en"; for (const f of fs.readdirSync(D)) if (f.endsWith(".json") && f[0] !== "_") for (const u of JSON.parse(fs.readFileSync(D + "/" + f, "utf8")).units || []) LEGENDS.delete(N(u.name));
} catch { console.log("⚠ editor/mfm/legends.json ou le dump MFM illisible : les cibles Legends ne sont pas reconnues"); }
const isLegends = (o) => LEGENDS.has(N(o));
// fiches EXPOSÉES (cibles d'un entryLink racine d'un catalogue) : entre homonymes, seules celles-ci sont des datasheets
// (la seconde entrée « Wolf Guard Headtakers », de type model, n'en est pas une)
const exposed = new Set(); for (const [, d] of c.docs) { const el = xml.child(d.root, "entryLinks"); if (el) for (const k of el.children) if (k.tag === "entryLink") exposed.add(xml.getAttr(k, "targetId")); }
for (const [k, l] of units) { if (l.length > 1 && l.some((x) => exposed.has(xml.getAttr(x.e, "id")))) units.set(k, l.filter((x) => exposed.has(xml.getAttr(x.e, "id")) || !l.some((y) => y.f === x.f && y !== x && exposed.has(xml.getAttr(y.e, "id"))))); }
const notDatasheet = new Set(); for (const [, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (bx) for (const e of bx.children) if (e.tag === "selectionEntry" && !exposed.has(xml.getAttr(e, "id")) && (units.get(N(nm(e))) || []).every((x) => x.e !== e)) notDatasheet.add(xml.getAttr(e, "id")); }
// fichier « primaire » de chaque fichier source → pour ne pas appliquer la liste SM générique à la copie locale d'un chapitre
const gdcFiles = Object.keys(MAN.files).filter((f) => fs.existsSync(path.join(GDC, f)));
const sheetsOf = new Map(); for (const f of gdcFiles) sheetsOf.set(f, new Set(JSON.parse(fs.readFileSync(path.join(GDC, f), "utf8")).datasheets.map((d) => N(en(d.name)))));
const primaryFile = (f) => (MAN.files[f].catalogues || [])[0];
function leaderNodes(file, name) {
  const cands = byName(name); const mine = cands.filter((x) => (MAN.files[file].catalogues || []).includes(x.f)); if (mine.length) return mine.slice(0, 1);
  // hors manifeste (ex. fiche Ultramarines dans space_marines.json) : écarter un fichier primaire d'une AUTRE source qui a la même fiche
  return cands.filter((x) => !gdcFiles.some((g) => g !== file && primaryFile(g) === x.f && sheetsOf.get(g).has(N(name)))).slice(0, 1);
}
const children = (n, tag) => { let b = xml.child(n, tag); if (!b) { b = el(tag, {}, []); b.selfClose = false; n.children = n.children || []; n.children.push(b); n.selfClose = false; } return b; };
function group(u, gname, create) {
  const gs = xml.child(u, "selectionEntryGroups"); let g = gs && gs.children.find((k) => k.tag === "selectionEntryGroup" && nm(k) === gname);
  if (g || !create) return g || null;
  g = el("selectionEntryGroup", { name: gname, hidden: "true", id: c.newId() }, [
    el("comment", {}, []), el("constraints", {}, [el("constraint", { type: "max", value: "0", field: "selections", scope: "parent", shared: "true", id: c.newId() })]), el("entryLinks", {}, [])]);
  const com = g.children[0]; com.selfClose = false; xml.setText(com, /Led By|Supported By/.test(gname) ? "attach-link inverse : meneurs (fiches) pouvant rejoindre cette unité — source : fiche officielle (attachesTo)" : "attach-link : unités que ce modèle peut rejoindre — source : fiche officielle (attachesTo)");
  g.children[2].selfClose = false; children(u, "selectionEntryGroups").children.push(g); return g;
}
const linkIds = (g) => g ? (xml.child(g, "entryLinks") || { children: [] }).children.filter((k) => k.tag === "entryLink").map((k) => xml.getAttr(k, "targetId")) : [];
function addLink(u, f, gname, target, why) { const g = group(u, gname, true); if (linkIds(g).includes(xml.getAttr(target.e, "id"))) return false;
  children(g, "entryLinks").children.push(el("entryLink", { import: "true", name: nm(target.e), hidden: "true", type: "selectionEntry", id: c.newId(), targetId: xml.getAttr(target.e, "id") }));
  dirty.add(f); log.push(`${nm(u)} [${f.replace(/\.cat$/, "")}] ${gname} + ${nm(target.e)}${why ? " (" + why + ")" : ""}`); return true; }
function dropLink(u, f, gname, tid, label) { const g = group(u, gname, false); const box = g && xml.child(g, "entryLinks"); if (!box) return;
  const before = box.children.length; box.children = box.children.filter((k) => !(k.tag === "entryLink" && xml.getAttr(k, "targetId") === tid));
  if (box.children.length !== before) { dirty.add(f); log.push(`${nm(u)} [${f.replace(/\.cat$/, "")}] ${gname} − ${label}`); } }
// la fiche porte-t-elle déjà le rattachement ? (règle par id ou nom, ou aptitude du même nom — même test que l'appli)
function ownWalk(u, fn) { const go = (n) => { for (const k of n.children || []) { if (!k.tag) continue; if (k.tag === "selectionEntryGroup" && /Enhancement|^Can (Lead|Support)|By \(MFM\)$/.test(nm(k))) continue; if (k.tag === "entryLink") continue; fn(k); go(k); } }; go(u); }
function hasRule(u, kind) { const [rid, rname] = RULE[kind]; let has = false; ownWalk(u, (k) => { if (k.tag === "infoLink" && xml.getAttr(k, "type") === "rule" && (xml.getAttr(k, "targetId") === rid || nm(k).trim() === rname)) has = true; if (k.tag === "profile" && nm(k).trim().toLowerCase() === rname.toLowerCase()) has = true; }); return has; }
function hasProse(u, kind) { const rname = RULE[kind][1]; let has = false; ownWalk(u, (k) => { if (k.tag === "profile" && /Abilities/.test(xml.getAttrDecoded(k, "typeName") || "")) { let t = ""; xml.walk(k, (q) => { if (q.tag === "characteristic") t = xml.getText(q) || ""; }); if (nm(k).trim().toLowerCase() === rname.toLowerCase() || /can be attached to the following units/i.test(t)) has = true; } }); return has; }
function ensureRule(u, f, kind) { if (hasRule(u, kind)) return; const [rid, rname] = RULE[kind];
  children(u, "infoLinks").children.push(el("infoLink", { name: rname, hidden: "false", type: "rule", id: c.newId(), targetId: rid })); dirty.add(f); log.push(`${nm(u)} : règle ${rname} ajoutée`); }
const added = {};
function ensureProse(u, f, kind, targets) { const pname = RULE[kind][1]; if (hasProse(u, kind)) return;
  const txt = "This model can be attached to the following units:\n" + targets.map((t) => "■ " + t).join("\n");
  const p = el("profile", { name: pname, typeId: ABIL_TYPE, typeName: "Abilities", hidden: "false", id: c.newId() }, [el("characteristics", {}, [el("characteristic", { name: "Description", typeId: "9b8f-694b-e5e-b573" }, [])])]);
  const ch = p.children[0].children[0]; ch.selfClose = false; xml.setText(ch, txt); children(u, "profiles").children.push(p); dirty.add(f); added[txt] = targets; log.push(`${nm(u)} : aptitude « ${pname} » ajoutée (${targets.length} cible(s))`); }

// ── --prose : la liste de la prose suit la fiche officielle ; traduction FR posée dans translations/fr.json
const FR_FILE = R + "/translations/fr.json"; const FR = PROSE ? JSON.parse(fs.readFileSync(FR_FILE, "utf8")) : null; const frAdds = {}; const frOld = new Set();
const gdcFr = new Map(); if (PROSE) for (const f of gdcFiles) for (const d of JSON.parse(fs.readFileSync(path.join(GDC, f), "utf8")).datasheets) { const n = d.name || {}; if (n.en && n.fr && !gdcFr.has(N(n.en))) gdcFr.set(N(n.en), n.fr); }
const frName = (n) => (FR && FR.strings[n]) || gdcFr.get(N(n)) || n;
const cleanName = (s) => String(s || "").replace(/\*\*|\^\^/g, "").replace(/[.;]\s*$/, "").trim();
const HEAD_RE = /^([\s\S]*?following units?\s*:)/i;
function attachProses(u) { const out = []; ownWalk(u, (k) => { if (k.tag !== "profile" || !/Abilities/.test(xml.getAttrDecoded(k, "typeName") || "")) return;
  let ch = null; xml.walk(k, (q) => { if (q.tag === "characteristic" && !ch) ch = q; });
  const t = ch ? xml.getText(ch) || "" : ""; if (/^(leader|support)$/i.test(nm(k).trim()) || /can be attached (as a support model )?to the following units?/i.test(t)) out.push({ p: k, ch, t }); }); return out; }
// découpe « en-tête : ■ A ■ B notes » (puces ■ • -, ou liste en ligne) ; null si la prose n'a pas cette forme
function splitProse(t) { const m = t.match(HEAD_RE); if (!m) return null; const head = m[1].trim(); const body = t.slice(m[0].length);
  const lines = body.split("\n"); const names = []; let last = -1;
  lines.forEach((l, i) => { const b = l.match(/^\s*(?:■|•|-)\s+(.+?)\s*$/); if (b && (last === -1 || i <= last + 2)) { names.push(cleanName(b[1])); last = i; } });
  if (names.length) return { head, names, notes: lines.slice(last + 1).join("\n").trim() };
  const first = body.split("\n").find((l) => l.trim()) || ""; const parts = cleanName(first).split(/\s*[,;]\s*|\s+and\s+/i).map((x) => x.trim()).filter(Boolean);
  if (!parts.length || parts.some((x) => x.split(/\s+/).length > 6)) return null;
  return { head, names: parts, notes: body.slice(body.indexOf(first) + first.length).trim() }; }
const FR_HEAD = [[/^This model can be attached to the following units?:$/i, "Cette figurine peut être attachée aux unités suivantes :", "Cette figurine peut être attachée à l'unité suivante :"],
  [/^This unit can be attached to the following units?:$/i, "Cette unité peut être attachée aux unités suivantes :", "Cette unité peut être attachée à l'unité suivante :"]];
// note FR = queue de l'ancienne traduction, à partir de sa première phrase (« Vous pouvez… », « Si… ») —
// jamais en cherchant le dernier nom d'unité, dont la forme FR varie d'une traduction à l'autre
const FR_NOTE_START = /(Vous pouvez|Si (?:cette|votre|une?|ce|l[ae]s?)\b|Tant qu|Cette figurine peut être attachée à une?|Chaque fois|Une fois|Lorsque|Au début)/;
function frNotes(oldFr, enNotes) { const colon = oldFr.indexOf(":"); const m = oldFr.slice(colon + 1).match(FR_NOTE_START); if (!m) return null;
  const tail = oldFr.slice(colon + 1 + m.index).trim(); if (/■|\n\s*-\s+\*\*/.test(tail) || tail.length < enNotes.length * 0.5) return null; return tail; }
function frFor(oldText, sp, head, names) {
  const row = FR_HEAD.find(([re]) => re.test(head)); const oldFr = FR && FR.strings[oldText];
  let fh = row ? (names.length > 1 ? row[1] : row[2]) : (oldFr ? oldFr.split(/■|\n-\s/)[0].trim() : null); if (!fh) return null;
  let fn = ""; if (sp.notes) { fn = (FR && FR.strings[sp.notes]) || "";
    if (!fn && oldFr) fn = frNotes(oldFr, sp.notes) || "";
    if (!fn) return null; }
  return fh + "\n\n" + names.map((n) => "■ " + frName(n)).join("\n") + (fn ? "\n\n" + fn : ""); }
function syncProse(u, f, kind, names, at) {
  if (at.some((a) => a.targetType && a.targetType !== "datasheet")) return; // cibles par mot-clef (Inquisiteurs) : prose rédigée à part
  const kname = RULE[kind][1]; const all = attachProses(u);
  if (!all.length) return ensureProse(u, f, kind, names);
  const kinds = new Set(at.map((a) => a.type)); const mine = all.filter((x) => nm(x.p).trim().toLowerCase() === kname.toLowerCase());
  const pick = mine.length === 1 ? mine[0] : (all.length === 1 && kinds.size === 1 ? all[0] : null);
  // une seule prose pour les deux sens (Cato Sicarius : Leader, Support si Marneus Calgar) : rien à faire si elle liste déjà ces cibles
  if (!pick && all.some((x) => { const sp = splitProse(x.t); return sp && sp.names.length === names.length && sp.names.every((n) => names.some((m) => N(m) === N(n))); })) return;
  if (!pick) { warn.push(`${nm(u)} : ${all.length} proses de rattachement, sens officiels ${[...kinds].join("+")} — prose non réécrite`); return; }
  if (nm(pick.p).trim() !== kname) { const was = nm(pick.p); xml.setAttr(pick.p, "name", kname); dirty.add(f); log.push(`${nm(u)} [${f.replace(/\.cat$/, "")}] aptitude « ${was} » renommée « ${kname} » (sens officiel)`); }
  const sp = splitProse(pick.t); if (!sp) { warn.push(`${nm(u)} : prose « ${kname} » de forme inattendue — non réécrite`); return; }
  const cur = new Set(sp.names.map(N)), want = new Set(names.map(N));
  if (cur.size === want.size && [...cur].every((x) => want.has(x))) return;
  const head = sp.head.replace(/following units?\s*:$/i, names.length > 1 ? "following units:" : "following unit:");
  const txt = head + "\n\n" + names.map((n) => "■ " + n).join("\n") + (sp.notes ? "\n\n" + sp.notes : "");
  xml.setText(pick.ch, txt); dirty.add(f);
  const gone = sp.names.filter((n) => !want.has(N(n))), plus = names.filter((n) => !cur.has(N(n)));
  log.push(`${nm(u)} [${f.replace(/\.cat$/, "")}] prose « ${kname} » : ${plus.length ? "+ " + plus.join(", ") : ""}${plus.length && gone.length ? " ; " : ""}${gone.length ? "− " + gone.join(", ") : ""}`);
  const fr = frFor(pick.t, sp, head, names); frOld.add(pick.t);
  if (fr) frAdds[txt] = fr; else warn.push(`${nm(u)} : traduction FR de la nouvelle prose à faire (notes non retrouvées)`); }

// ── synchronisation
const officialPairs = new Set(); // "kind|leaderId|targetId" attendus (pour les liens inverses en trop)
const legendsSkipped = new Set();
const touchedRev = new Set(); const processed = new Set(); // ids des meneurs synchronisés (alias compris)
for (const file of gdcFiles) {
  const J = JSON.parse(fs.readFileSync(path.join(GDC, file), "utf8"));
  for (const ds of J.datasheets) {
    const at = ds.attachesTo || []; if (!at.length) continue; if (ONLY.size && !ONLY.has(en(ds.name))) continue;
    const LN = leaderNodes(file, en(ds.name));
    if (isLegends(en(ds.name))) { if (LN.length) warn.push(`${en(ds.name)} [${file}] : fiche Legends PRÉSENTE dans la base — à retirer (editor/audit/legends.mjs), non synchronisée`); continue; }
    if (!LN.length) warn.push(`${en(ds.name)} [${file}] : meneur officiel sans fiche chez nous (renommage ? alias à ajouter) — liens non synchronisés`);
    for (const L of LN) { processed.add(xml.getAttr(L.e, "id")); for (const kind of ["leader", "support"]) {
      // + rattachements ajoutés par un document officiel plus récent (manifeste attachOverrides)
      const ovr = ((MAN.attachOverrides || {})[en(ds.name)] || {})[kind] || [];
      const offT = [...new Set([...at.filter((a) => a.type === kind).map((a) => a.target), ...ovr])];
      if (!offT.length) { // sens absent de la fiche officielle : ses liens directs tombent (les inverses : plus bas)
        for (const tid of linkIds(group(L.e, FWD[kind], false))) { const t = c.byId.get(tid); dropLink(L.e, L.f, FWD[kind], tid, (t ? nm(t.node) : tid) + ` (la fiche officielle n'a pas de ${RULE[kind][1]})`); }
        continue; }
      const resolved = [];
      for (const tname of offT) {
        if (isLegends(tname)) { legendsSkipped.add(tname); if (byName(tname).length) warn.push(`${en(ds.name)} : cible Legends « ${tname} » PRÉSENTE dans la base — à retirer, jamais liée`); continue; }
        const cands = byName(tname).filter((t) => t.e !== L.e);
        if (!cands.length) { const tt = (at.find((a) => a.target === tname) || {}).targetType;
          if (!tt || tt === "datasheet") warn.push(`${en(ds.name)} : cible « ${tname} » introuvable chez nous`); continue; }
        resolved.push(tname);
        for (const T of cands) {
          if (clos(L.f).has(T.f)) { officialPairs.add(`${kind}|${xml.getAttr(L.e, "id")}|${xml.getAttr(T.e, "id")}`); addLink(L.e, L.f, FWD[kind], T); }
          else if (clos(T.f).has(L.f)) { officialPairs.add(`${kind}|${xml.getAttr(L.e, "id")}|${xml.getAttr(T.e, "id")}`); touchedRev.add(T.f + "|" + xml.getAttr(T.e, "id")); addLink(T.e, T.f, REV[kind], L, "lien inverse"); }
        }
      }
      // prose : noms de NOS fiches (une fiche officielle scindée — « Eradicator Squad with melta rifles » —
      // s'écrit sous notre nom « Eradicator Squad », sinon l'appli ne la résoudrait pas)
      const ourName = (o) => { const b = byName(o); if (b.length) return nm(b[0].e); for (const [k, v] of units) if (N(o).startsWith(k + " ")) return nm(v[0].e); return o; };
      if (!resolved.length) continue; // aucune cible chez nous (toutes Legends ?) : ni règle, ni prose, ni lien
      ensureRule(L.e, L.f, kind);
      // liste de prose = cibles officielles qui sont des fiches de la base (Legends et introuvables exclues)
      const proseNames = [...new Set(resolved.map(ourName))];
      if (resolved.length) { if (PROSE) syncProse(L.e, L.f, kind, proseNames, at); else ensureProse(L.e, L.f, kind, proseNames); }
      // liens directs que la fiche officielle ne porte pas → retirés (sauf cible scindée côté officiel)
      for (const tid of linkIds(group(L.e, FWD[kind], false))) { const t = c.byId.get(tid); if (!t) continue; const tn = N(nm(t.node));
        // gardé si une cible officielle s'y résout (nom, alias) ; l'exception « fiche scindée » par préfixe ne joue
        // plus que pour une cible officielle qui ne se résout nulle part chez nous
        if (offT.some((o) => byName(o).some((x) => xml.getAttr(x.e, "id") === tid) || (!byName(o).length && !isLegends(o) && (N(o).startsWith(tn + " ") || tn.startsWith(N(o) + " "))))) continue;
        dropLink(L.e, L.f, FWD[kind], tid, nm(t.node) + " (absent de la fiche officielle)"); }
    } }
  }
}
// liens (directs ou inverses) vers un homonyme qui n'est pas une datasheet → retirés
for (const [f, d] of c.docs) xml.walk(d.root, (u) => { if (u.tag !== "selectionEntry") return;
  for (const gname of [...Object.values(FWD), ...Object.values(REV)]) for (const tid of linkIds(group(u, gname, false))) if (notDatasheet.has(tid)) dropLink(u, f, gname, tid, `${nm(c.byId.get(tid).node)} [${tid}] (homonyme non exposé, pas une datasheet)`); });
// liens inverses qui ne correspondent plus à la fiche officielle d'un meneur traité
for (const [f, d] of c.docs) xml.walk(d.root, (u) => { if (u.tag !== "selectionEntry") return;
  for (const kind of ["leader", "support"]) { const g = group(u, REV[kind], false); if (!g) continue;
    for (const lid of linkIds(g)) { const L = c.byId.get(lid); if (!L) continue; if (ONLY.size && !ONLY.has(nm(L.node))) continue;
      const handled = processed.has(lid) || gdcFiles.some((gf) => sheetsOf.get(gf).has(N(nm(L.node))));
      if (handled && !officialPairs.has(`${kind}|${lid}|${xml.getAttr(u, "id")}`)) dropLink(u, f, REV[kind], lid, nm(L.node) + " (absent de la fiche officielle)"); } } });

for (const l of log) console.log("Δ " + l); for (const w of warn) console.log("⚠ " + w);
if (legendsSkipped.size) console.log(`ℹ cibles officielles Legends ignorées (hors base) : ${[...legendsSkipped].join(", ")}`);
console.log(`${log.length} changement(s), ${warn.length} avertissement(s)`);
const sOut = args[args.indexOf("--strings") + 1]; if (args.includes("--strings") && sOut) fs.writeFileSync(sOut, JSON.stringify(added, null, 1));
if (PROSE) console.log(`traductions FR : ${Object.keys(frAdds).length} nouvelle(s) prose(s) traduite(s)`);
if (WRITE && log.length) { for (const f of dirty) c.markDirty(f); c.buildIndex(); const v = c.validate({ dirtyOnly: false }); let k = 0; for (const r of v.results || []) for (const e of r.errors) { k++; console.log("ERR", r.file, e); } console.log("validate", v.ok, k);
  if (v.ok) { c.save();
    if (PROSE && (Object.keys(frAdds).length || frOld.size)) { // anciennes clefs retirées si plus aucune aptitude ne porte ce texte
      const live = new Set(); for (const [, d] of c.docs) xml.walk(d.root, (q) => { if (q.tag === "characteristic") live.add(xml.getText(q) || ""); });
      let gone = 0; for (const t of frOld) if (!live.has(t) && t in FR.strings) { delete FR.strings[t]; gone++; }
      Object.assign(FR.strings, frAdds); if (FR.meta && "totalStrings" in FR.meta) FR.meta.totalStrings = Object.keys(FR.strings).length;
      const raw = fs.readFileSync(FR_FILE, "utf8"); const ind = (raw.match(/^\{\n( +)/) || [, "  "])[1].length;
      fs.writeFileSync(FR_FILE, JSON.stringify(FR, null, ind) + (raw.endsWith("\n") ? "\n" : "")); console.log(`translations/fr.json : +${Object.keys(frAdds).length} / −${gone}`); } } }
