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
//
//   node editor/translations/gdc-attach.cjs <dossier 11th/gdc> [--write] [--only "Fiche"] [--strings fr.json]
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const GDC = args[0]; const WRITE = args.includes("--write");
const ONLY = new Set(args.filter((a, i) => args[i - 1] === "--only"));
if (!GDC) { console.error("usage : gdc-attach.cjs <11th/gdc> [--write] [--only Fiche]"); process.exit(2); }
const MAN = JSON.parse(fs.readFileSync(R + "/editor/sources/game-datacards.json", "utf8"));
const RULE = { leader: ["b4dd-3e1f-41cb-218f", "Leader"], support: ["21f5-c07c-6d97-4405", "Support"] };
const FWD = { leader: "Can Lead (MFM)", support: "Can Support (MFM)" };
const REV = { leader: "Led By (MFM)", support: "Supported By (MFM)" };
const ABIL_TYPE = "9cc3-6d83-4dd3-9b64";
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : (x == null ? "" : String(x));
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const el = (tag, attrs, kids) => { const e = xml.elem(tag, attrs, kids || []); e.selfClose = !(kids && kids.length); return e; };
const c = new Catalog(R).load(); const dirty = new Set(); const log = []; const warn = [];

// ── clôture d'import par fichier (catalogueLinks transitifs)
const fileOfCat = new Map(); for (const [f, d] of c.docs) fileOfCat.set(xml.getAttr(d.root, "id"), f);
const closure = new Map();
function clos(f) { if (closure.has(f)) return closure.get(f); const s = new Set([f]); closure.set(f, s);
  const cl = xml.child(c.docs.get(f).root, "catalogueLinks"); if (cl) for (const k of cl.children) { const t = fileOfCat.get(xml.getAttr(k, "targetId")); if (t) for (const x of clos(t)) s.add(x); } return s; }
// ── fiches racine par nom
const units = new Map(); for (const [f, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (!bx) continue;
  for (const e of bx.children) if (e.tag === "selectionEntry" && /^(unit|model)$/.test(xml.getAttr(e, "type") || "") && xml.getAttr(e, "hidden") !== "true") { const k = N(nm(e)); if (!units.has(k)) units.set(k, []); units.get(k).push({ f, e }); } }
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
  const cands = units.get(N(name)) || []; const mine = cands.filter((x) => (MAN.files[file].catalogues || []).includes(x.f)); if (mine.length) return mine.slice(0, 1);
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

// ── synchronisation
const officialPairs = new Set(); // "kind|leaderId|targetId" attendus (pour les liens inverses en trop)
const touchedRev = new Set();
for (const file of gdcFiles) {
  const J = JSON.parse(fs.readFileSync(path.join(GDC, file), "utf8"));
  for (const ds of J.datasheets) {
    const at = ds.attachesTo || []; if (!at.length) continue; if (ONLY.size && !ONLY.has(en(ds.name))) continue;
    for (const L of leaderNodes(file, en(ds.name))) for (const kind of ["leader", "support"]) {
      const offT = at.filter((a) => a.type === kind).map((a) => a.target); if (!offT.length) continue;
      ensureRule(L.e, L.f, kind);
      const resolved = [];
      for (const tname of offT) {
        const cands = (units.get(N(tname)) || []).filter((t) => t.e !== L.e);
        if (!cands.length) { if (!(at.find((a) => a.target === tname) || {}).targetType || at.find((a) => a.target === tname).targetType === "datasheet") warn.push(`${en(ds.name)} : cible « ${tname} » introuvable chez nous`); continue; }
        resolved.push(tname);
        for (const T of cands) {
          if (clos(L.f).has(T.f)) { officialPairs.add(`${kind}|${xml.getAttr(L.e, "id")}|${xml.getAttr(T.e, "id")}`); addLink(L.e, L.f, FWD[kind], T); }
          else if (clos(T.f).has(L.f)) { officialPairs.add(`${kind}|${xml.getAttr(L.e, "id")}|${xml.getAttr(T.e, "id")}`); touchedRev.add(T.f + "|" + xml.getAttr(T.e, "id")); addLink(T.e, T.f, REV[kind], L, "lien inverse"); }
        }
      }
      // prose : noms de NOS fiches (une fiche officielle scindée — « Eradicator Squad with melta rifles » —
      // s'écrit sous notre nom « Eradicator Squad », sinon l'appli ne la résoudrait pas)
      const ourName = (o) => { if (units.has(N(o))) return nm(units.get(N(o))[0].e); for (const [k, v] of units) if (N(o).startsWith(k + " ")) return nm(v[0].e); return o; };
      if (resolved.length) ensureProse(L.e, L.f, kind, [...new Set(offT.map(ourName))]);
      // liens directs que la fiche officielle ne porte pas → retirés (sauf cible scindée côté officiel)
      for (const tid of linkIds(group(L.e, FWD[kind], false))) { const t = c.byId.get(tid); if (!t) continue; const tn = N(nm(t.node));
        if (offT.some((o) => N(o) === tn || N(o).startsWith(tn + " ") || tn.startsWith(N(o) + " "))) continue;
        dropLink(L.e, L.f, FWD[kind], tid, nm(t.node) + " (absent de la fiche officielle)"); }
    }
  }
}
// liens (directs ou inverses) vers un homonyme qui n'est pas une datasheet → retirés
for (const [f, d] of c.docs) xml.walk(d.root, (u) => { if (u.tag !== "selectionEntry") return;
  for (const gname of [...Object.values(FWD), ...Object.values(REV)]) for (const tid of linkIds(group(u, gname, false))) if (notDatasheet.has(tid)) dropLink(u, f, gname, tid, `${nm(c.byId.get(tid).node)} [${tid}] (homonyme non exposé, pas une datasheet)`); });
// liens inverses qui ne correspondent plus à la fiche officielle d'un meneur traité
for (const [f, d] of c.docs) xml.walk(d.root, (u) => { if (u.tag !== "selectionEntry") return;
  for (const kind of ["leader", "support"]) { const g = group(u, REV[kind], false); if (!g) continue;
    for (const lid of linkIds(g)) { const L = c.byId.get(lid); if (!L) continue; if (ONLY.size && !ONLY.has(nm(L.node))) continue;
      const handled = gdcFiles.some((gf) => sheetsOf.get(gf).has(N(nm(L.node))));
      if (handled && !officialPairs.has(`${kind}|${lid}|${xml.getAttr(u, "id")}`)) dropLink(u, f, REV[kind], lid, nm(L.node) + " (absent de la fiche officielle)"); } } });

for (const l of log) console.log("Δ " + l); for (const w of warn) console.log("⚠ " + w);
console.log(`${log.length} changement(s), ${warn.length} avertissement(s)`);
const sOut = args[args.indexOf("--strings") + 1]; if (args.includes("--strings") && sOut) fs.writeFileSync(sOut, JSON.stringify(added, null, 1));
if (WRITE && log.length) { for (const f of dirty) c.markDirty(f); c.buildIndex(); const v = c.validate({ dirtyOnly: false }); let k = 0; for (const r of v.results || []) for (const e of r.errors) { k++; console.log("ERR", r.file, e); } console.log("validate", v.ok, k); if (v.ok) c.save(); }
