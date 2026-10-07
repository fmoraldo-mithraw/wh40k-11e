// gdc-watch.cjs — veille sur la source game-datacards (export des données de l'appli officielle).
// Compare deux instantanés de 11th/gdc (ancien = version suivie dans editor/sources/game-datacards.json,
// nouveau = tête du dépôt amont), puis confronte CHAQUE changement amont à notre base et rend un verdict :
//   ✅ déjà conforme · 🛠 à appliquer (outil + commande) · 💰 points (à confirmer par le MFM)
//   ✋ manuel (composition, options, mots-clefs, fiche nouvelle) · ❓ doute · 🔇 bruit connu de la source
// Rien n'est modifié : le script produit un rapport Markdown (+ JSON) ; l'application se fait avec les
// outils gdc-* existants, puis la validation habituelle (CLAUDE.md, règle 4).
//   node editor/translations/gdc-watch.cjs --old <ancien 11th/gdc> --new <nouveau 11th/gdc>
//        [--changelogs <11th/changelogs>] [--out rapport.md] [--json rapport.json]
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const OLD = opt("--old"), NEW = opt("--new"), CL = opt("--changelogs"), OUT = opt("--out"), JOUT = opt("--json");
if (!OLD || !NEW) { console.error("usage : --old <dir> --new <dir> [--changelogs dir] [--out md] [--json f]"); process.exit(2); }
const MANIFEST = JSON.parse(fs.readFileSync(R + "/editor/sources/game-datacards.json", "utf8"));
const PTS = "51b2-306e-1021-d207";

// ── utilitaires
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : (x == null ? "" : String(x));
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[–—]/g, "-").replace(/^➤\s*/, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const txt = (s) => N(String(s || "").replace(/<[^>]+>/g, " ").replace(/\*\*|\^\^|■|●/g, " ").replace(/[“”"]/g, '"')).replace(/[^a-z0-9+"'-]+/g, " ").trim();
const wbase = (s) => N(s).split(" - ")[0].trim(); const wsuf = (s) => (N(s).split(" - ")[1] || "").trim();
const kw = (p) => (p.keywords || []).map(en).map((k) => N(k)).filter(Boolean);
const sig = (p) => [p.range, p.attacks, p.skill, p.strength, p.ap, p.damage].map((v) => N(v)).join("|");
const load = (d, f) => { try { return JSON.parse(fs.readFileSync(path.join(d, f), "utf8")); } catch { return null; } };
const nm = (n) => xml.getAttrDecoded(n, "name") || "";

// ── notre base : index des fiches (unités/figurines non cachées au niveau racine)
const c = new Catalog(R).load(); const byId = (id) => (c.byId.get(id) || {}).node;
const units = new Map();
for (const [f, d] of c.docs) for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (!bx) continue;
  for (const e of bx.children) if (e.tag === "selectionEntry" && /^(unit|model)$/.test(xml.getAttr(e, "type") || "") && xml.getAttr(e, "hidden") !== "true") { const k = N(nm(e)); if (!units.has(k)) units.set(k, []); units.get(k).push({ file: f, node: e }); } }
function ourUnit(name, file) { const l = units.get(N(name)) || []; const pref = (MANIFEST.files[file] || {}).catalogues || []; return l.find((u) => pref.includes(u.file)) || l[0] || null; }
function subtree(u, fn) { const seen = new Set(); const go = (n, depth) => { for (const k of n.children || []) { if (!k.tag) continue; fn(k);
  if (k.tag === "selectionEntryGroup" && /Enhancement|^Can (Lead|Support)/.test(nm(k))) continue;
  if ((k.tag === "entryLink" || k.tag === "infoLink") && depth < 4) { if (/^(Warlord|Enhancements)$/.test(nm(k)) || /Upgrade$/.test(nm(k))) continue; const t = byId(xml.getAttr(k, "targetId")); if (t && !seen.has(t)) { seen.add(t); fn(t); go({ children: [t] }, depth + 1); } continue; }
  go(k, depth); } }; go({ children: [u] }, 0); }
const chars = (p) => { const o = {}; xml.walk(p, (q) => { if (q.tag === "characteristic") o[xml.getAttrDecoded(q, "name")] = xml.getText(q) || ""; }); return o; };
function ourWeapons(u) { const o = []; subtree(u, (k) => { if (k.tag === "profile" && /Weapons$/.test(xml.getAttrDecoded(k, "typeName") || "")) o.push(k); }); return o; }
function ourAbilities(u) { const o = new Map(); subtree(u, (k) => { if (k.tag === "profile" && xml.getAttrDecoded(k, "typeName") === "Abilities") { const ch = chars(k); o.set(N(nm(k)).replace(/\s*\(.*$/, ""), Object.values(ch)[0] || ""); } if (k.tag === "infoLink" && xml.getAttr(k, "type") === "rule") o.set(N(nm(k)), ""); }); return o; }
function ourStats(u) { const o = []; subtree(u, (k) => { if (k.tag === "profile" && xml.getAttrDecoded(k, "typeName") === "Unit") o.push({ name: nm(k), ch: chars(k) }); }); return o; }
function ourPts(u) { const cs = xml.child(u.node, "costs"); const k = cs && cs.children.find((x) => xml.getAttr(x, "typeId") === PTS); return k ? xml.getAttr(k, "value") : null; }
const ourRuleNames = new Set(); for (const [, d] of c.docs) xml.walk(d.root, (n) => { if (n.tag === "rule" || (n.tag === "selectionEntry" && xml.getAttr(n, "type") === "upgrade")) ourRuleNames.add(N(nm(n)).replace(/\s*\((stratagem|enhancement)[^)]*\)$/, "")); });

// ── verdicts
const newFields = new Set(); const items = []; const V = { ok: "✅ déjà conforme", apply: "🛠 à appliquer", pts: "💰 points", manual: "✋ manuel", doubt: "❓ doute", noise: "🔇 bruit connu" };
const add = (file, unit, kind, detail, verdict, action) => items.push({ faction: (MANIFEST.files[file] || {}).label || file, file, unit, kind, detail, verdict, action: action || "" });
const tool = (file, t) => { const m = MANIFEST.files[file] || {}; const cat = (m.catalogues || [])[0]; return cat ? `node editor/translations/${t} "${cat}" <gdc>/${file}` : `(pas de catalogue associé à ${file} dans le manifeste)`; };

function diffWeapons(file, ds0, ds1, u) {
  const flat = (ds) => { const m = new Map(); for (const [kind, arr] of [["R", ds.rangedWeapons], ["M", ds.meleeWeapons]]) for (const w of arr || []) for (const p of w.profiles || []) m.set(N(en(p.name)), { kind, p }); return m; };
  const a = flat(ds0), b = flat(ds1); const mine = u ? ourWeapons(u.node) : [];
  for (const [k, { kind, p }] of b) { const o = a.get(k); const name = en(p.name);
    if (!o) { const inOurs = mine.some((q) => wbase(nm(q)) === wbase(name)); add(file, en(ds1.name), "arme", `nouvelle arme/profil « ${name} »`, inOurs ? V.ok : V.manual, inOurs ? "" : "option/composition à encoder (WEAPON_SLOTS_APP_PROMPT, FACTION_PACK_PROMPT)"); continue; }
    const kwA = kw(o.p), kwB = kw(p); const removed = kwA.filter((x) => !kwB.includes(x)); const added = kwB.filter((x) => !kwA.includes(x));
    const moved = o.kind !== kind; if (sig(o.p) === sig(p) && !removed.length && !added.length && !moved) continue;
    const det = []; if (sig(o.p) !== sig(p)) det.push(`${sig(o.p)} → ${sig(p)}`); if (added.length) det.push(`+[${added.join(", ")}]`); if (removed.length) det.push(`−[${removed.join(", ")}]`); if (moved) det.push(o.kind === "M" ? "mêlée → tir" : "tir → mêlée");
    const torrentNoise = kwB.includes("torrent") && /^[6-9]\+$/.test(p.skill) && N(o.p.skill) !== N(p.skill);
    if (torrentNoise && sig({ ...o.p, skill: p.skill }) === sig(p)) { add(file, en(ds1.name), "arme", `« ${name} » CT ${o.p.skill} → ${p.skill} (arme Torrent)`, V.noise, "artefact connu de la source : ignorer"); continue; }
    if (!u) { add(file, en(ds1.name), "arme", `« ${name} » ${det.join(" ; ")}`, V.manual, "fiche introuvable chez nous (nom différent ?)"); continue; }
    const cand = mine.filter((q) => wbase(nm(q)) === wbase(name) && (!wsuf(name) || wsuf(nm(q)) === wsuf(name) || !wsuf(nm(q))));
    const conform = cand.length && cand.every((q) => { const ch = chars(q); const v = [ch.Range, ch.A, ch.BS || ch.WS, ch.S, ch.AP, ch.D].map(N).join("|"); const want = sig({ ...p, range: /melee/i.test(p.range) ? "Melee" : p.range, skill: p.skill === "-" ? "N/A" : p.skill });
      const ourKw = N(ch.Keywords).split(/,\s*/); return v === want && added.every((x) => ourKw.includes(x) || (x === "pistol" && ourKw.includes("close-quarters"))); });
    if (conform && !removed.length) { add(file, en(ds1.name), "arme", `« ${name} » ${det.join(" ; ")}`, V.ok); continue; }
    if (removed.length && sig(o.p) === sig(p) && !added.length) { add(file, en(ds1.name), "arme", `« ${name} » ${det.join(" ; ")}`, V.doubt, "la source omet parfois des mots-clefs : ne retirer qu'après confirmation (fiche / MFM)"); continue; }
    if (!cand.length) { add(file, en(ds1.name), "arme", `« ${name} » ${det.join(" ; ")}`, V.manual, "arme introuvable sous ce nom chez nous (renommage ?)"); continue; }
    const oursTxt = [...new Set(cand.map((q) => { const ch = chars(q); return [ch.Range, ch.A, ch.BS || ch.WS, ch.S, ch.AP, ch.D].join("|") + (ch.Keywords && ch.Keywords !== "-" ? " " + ch.Keywords : ""); }))].join(" / ");
    add(file, en(ds1.name), "arme", `« ${name} » ${det.join(" ; ")} — nous : ${oursTxt}${removed.length ? " (retrait de mot-clef : à confirmer)" : ""}`, V.apply, tool(file, "gdc-apply-weapons.cjs") + " --write");
  }
  for (const [k, { p }] of a) if (!b.has(k)) { const name = en(p.name); const still = [...b.values()].some((x) => wbase(en(x.p.name)) === wbase(name));
    if (!still) add(file, en(ds1.name), "arme", `arme/profil retiré en amont « ${name} »`, mine.some((q) => wbase(nm(q)) === wbase(name)) ? V.doubt : V.ok, "retrait d'option : vérifier sur la fiche avant de supprimer"); }
}
function diffStats(file, ds0, ds1, u) {
  const key = (s) => N(en(s.name)); const a = new Map((ds0.stats || []).map((s) => [key(s), s]));
  for (const s of ds1.stats || []) { const o = a.get(key(s)); const vals = (x) => ["m", "t", "sv", "w", "ld", "oc"].map((k) => N(x[k])).join("/");
    if (o && vals(o) === vals(s)) continue; const det = `${en(s.name)} ${o ? vals(o) + " → " : ""}${vals(s)}`;
    if (!u) { add(file, en(ds1.name), "caractéristiques", det, V.manual, "fiche introuvable chez nous"); continue; }
    const ours = ourStats(u.node); const m = ours.filter((x) => N(x.name).replace(/s$/, "") === key(s).replace(/s$/, "")); const use = m.length ? m : (ours.length === 1 ? ours : []);
    const conform = use.length && use.every((x) => ["M", "T", "SV", "W", "LD", "OC"].map((k) => N(x.ch[k])).join("/") === vals(s));
    add(file, en(ds1.name), "caractéristiques", det + (conform || !use.length ? "" : ` — nous : ${use.map((x) => ["M", "T", "SV", "W", "LD", "OC"].map((k) => x.ch[k]).join("/")).join(" ; ")}`), conform ? V.ok : (use.length ? V.apply : V.manual), conform ? "" : (use.length ? tool(file, "gdc-apply-weapons.cjs") + " --write" : "profil de caractéristiques introuvable chez nous"));
  }
}
function diffAbilities(file, ds0, ds1, u) {
  const flat = (ds) => { const m = new Map(); const ab = ds.abilities || {}; for (const [grp, v] of Object.entries(ab)) for (const a of Array.isArray(v) ? v : []) { const n = en(a.name); if (n) m.set(N(n), { grp, name: n, text: en(a.description || a.value) }); } if (ab.invul && ab.invul.value) m.set("invulnerable save", { grp: "invul", name: "Invulnerable Save", text: ab.invul.value }); return m; };
  const a = flat(ds0), b = flat(ds1); const ours = u ? ourAbilities(u.node) : new Map();
  for (const [k, x] of b) { const o = a.get(k); if (o && txt(o.text) === txt(x.text)) continue;
    const det = o ? `texte modifié : « ${x.name} »` : `nouvelle aptitude « ${x.name} »`;
    if (x.grp === "invul") { const has = u && JSON.stringify(xml.child(u.node, "comment") || "").includes(`invuln: ${x.text}`); add(file, en(ds1.name), "aptitude", `invulnérable ${o ? o.text + " → " : ""}${x.text}`, has ? V.ok : V.apply, has ? "" : "profil « Invulnerable Save » + marqueur invuln: (STAT_MARKERS_APP_PROMPT)"); continue; }
    if (x.grp === "core" || x.grp === "faction") { add(file, en(ds1.name), "aptitude", det + " (règle de base/faction)", ours.has(k) ? V.ok : V.manual, ours.has(k) ? "" : "infoLink de règle à ajouter"); continue; }
    const mineTxt = ours.get(k.replace(/\s*\(.*$/, "")); const conform = mineTxt != null && txt(mineTxt).includes(txt(x.text).slice(0, 120));
    add(file, en(ds1.name), "aptitude", det, conform ? V.ok : V.apply, conform ? "" : tool(file, "gdc-apply-abilities.cjs") + " --write  (puis fr.json : texte FR officiel)"); }
  for (const [k, o] of a) if (!b.has(k)) add(file, en(ds1.name), "aptitude", `aptitude retirée en amont « ${o.name} »`, ours.has(k) ? V.doubt : V.ok, "retrait : confirmer sur la fiche (source parfois lacunaire)");
}
function diffMisc(file, ds0, ds1, u) {
  const j = (x) => JSON.stringify(Array.isArray(x) ? x.map(en) : (x && typeof x === "object" && !("en" in x) ? x : en(x))); const name = en(ds1.name);
  const kA = (ds0.keywords || []).map(en).map(N), kB = (ds1.keywords || []).map(en).map(N);
  const kAdd = kB.filter((x) => !kA.includes(x)), kRem = kA.filter((x) => !kB.includes(x));
  if (kAdd.length || kRem.length) add(file, name, "mots-clefs", `${kAdd.length ? "+[" + kAdd.join(", ") + "] " : ""}${kRem.length ? "−[" + kRem.join(", ") + "]" : ""}`, V.manual, "categoryLinks de la fiche (et ENHANCEMENT_BEARERS_PROMPT si mot-clef porteur)");
  if (j(ds0.composition) !== j(ds1.composition)) add(file, name, "composition", `${j(ds0.composition)} → ${j(ds1.composition)}`, V.manual, "bornes de modèles (UNIT_COMPOSITION_APP_PROMPT)");
  if (j(ds0.wargear) !== j(ds1.wargear) || j(ds0.loadout) !== j(ds1.loadout)) add(file, name, "options", "options d'équipement / équipement de base modifiés", V.manual, "groupes d'armes (WEAPON_SLOTS_APP_PROMPT) ; voir l'option dans la fiche");
  const pt = (ds) => (ds.points || []).map((p) => `${p.models}:${p.cost}${p.keyword ? "@" + p.keyword : ""}`).join(" ");
  if (pt(ds0) !== pt(ds1)) { const tiers = (ds1.points || []).filter((p) => !p.keyword && !p.detachment).sort((x, y) => (+x.models || 0) - (+y.models || 0)); const first = tiers[0]; const ours = u ? ourPts(u) : null; const ok = first && ours === String(first.cost);
    add(file, name, "points", `${pt(ds0)} → ${pt(ds1)} (nous : ${ours ?? "?"} pts de base)`, ok ? V.ok : V.pts, ok ? "" : "confirmer par le MFM puis appliquer (MFM_PROMPT ; paliers/répétition)"); }
}
function diffFaction(file, F0, F1) {
  const dsKey = (d) => d.id || N(en(d.name)); const a = new Map((F0.datasheets || []).map((d) => [dsKey(d), d]));
  for (const d of F1.datasheets || []) { const o = a.get(dsKey(d)); const u = ourUnit(en(d.name), file);
    if (!o) { add(file, en(d.name), "fiche", "nouvelle fiche amont", u ? V.ok : V.manual, u ? "déjà présente chez nous" : "fiche à créer (FACTION_PACK_PROMPT)"); continue; }
    for (const k of Object.keys(d)) if (!(k in o)) newFields.add(`datasheets.${k}`);
    if (JSON.stringify(o) === JSON.stringify(d)) continue;
    diffStats(file, o, d, u); diffWeapons(file, o, d, u); diffAbilities(file, o, d, u); diffMisc(file, o, d, u); }
  const b = new Set((F1.datasheets || []).map(dsKey)); for (const [k, o] of a) if (!b.has(k)) add(file, en(o.name), "fiche", "fiche retirée en amont (Legends ?)", ourUnit(en(o.name), file) ? V.doubt : V.ok, "ne rien supprimer sans annonce officielle");
  // détachements, stratagèmes, améliorations, règles d'armée / de détachement
  const sync = (MANIFEST.files[file] || {}).detachmentTool;
  const SECS = { detachments: (F) => F.detachments || [], stratagems: (F) => F.stratagems || [], enhancements: (F) => F.enhancements || [],
    "règles d'armée": (F) => (F.rules && F.rules.army) || [], "règles de détachement": (F) => ((F.rules && F.rules.detachment) || []).flatMap((d) => (d.rules || []).map((r) => ({ ...r, detachment: d.detachment }))) };
  for (const [sec, list] of Object.entries(SECS)) {
    const key = (x) => x.id || `${en(x.detachment)}::${N(en(x.name))}`; const A = new Map(list(F0).map((x) => [key(x), x]));
    for (const x of list(F1)) { const o = A.get(key(x));
      // champs apparus côté source (changement de format) : relevés une fois, hors comparaison
      if (o) for (const k of Object.keys(x)) if (!(k in o)) newFields.add(`${sec}.${k}`);
      const proj = (y) => JSON.stringify(Object.fromEntries(Object.keys(y).filter((k) => !o || (k in o && k in x)).sort().map((k) => [k, y[k]])));
      if (o && proj(o) === proj(x)) continue; const name = en(x.name) || key(x);
      const exists = ourRuleNames.has(N(name)); const what = !o ? "nouveau" : "modifié";
      const cost = o && x.cost !== o.cost ? ` (coût ${o.cost} → ${x.cost})` : "";
      add(file, x.detachment ? en(x.detachment) : "—", sec, `${what} : « ${name} »${cost}`, !o && exists ? V.ok : V.apply,
        sync ? `node editor/translations/gdc-sync-detachments.cjs <gdc>/${file} --write  (puis fr.json)` : "à reporter à la main (FACTION_PACK_PROMPT : stratagèmes, améliorations, règle des porteurs)"); }
    const B = new Set(list(F1).map(key)); for (const [k, o] of A) if (!B.has(k)) add(file, o.detachment ? en(o.detachment) : "—", sec, `retiré en amont : « ${en(o.name) || k} »`, ourRuleNames.has(N(en(o.name))) ? V.apply : V.ok, sync ? "gdc-sync-detachments.cjs le retire" : "retrait manuel");
  }
}

// ── parcours
const files = fs.readdirSync(NEW).filter((f) => f.endsWith(".json"));
let v0 = null, v1 = null;
for (const f of files) { const F1 = load(NEW, f); if (!F1 || !Array.isArray(F1.datasheets)) continue; const F0 = load(OLD, f) || { datasheets: [] };
  v0 = v0 || F0.compatibleDataVersion; v1 = v1 || F1.compatibleDataVersion; diffFaction(f, F0, F1); }

// ── rapport
const order = [V.apply, V.pts, V.manual, V.doubt, V.noise, V.ok]; const count = (v) => items.filter((i) => i.verdict === v).length;
const L = [`# Veille game-datacards — données ${v0 ?? "?"} → ${v1 ?? "?"}`, "", `Source : ${MANIFEST.repo} (${MANIFEST.path}). Généré par \`editor/translations/gdc-watch.cjs\`.`, "",
  ...(newFields.size ? [`> ℹ️ Format de la source : champ(s) nouveau(x) ${[...newFields].map((f) => "`" + f + "`").join(", ")} — ignoré(s) par la comparaison ; à exploiter si utile (ex. \`uniqueTags\` ↔ UNIQUE_DETACHMENT_APP_PROMPT).`, ""] : []),
  "| Verdict | Nombre |", "|---|---|", ...order.map((v) => `| ${v} | ${count(v)} |`), ""];
if (CL) { const notes = fs.readdirSync(CL).filter((f) => /_summary\.md$/.test(f)).map((f) => [parseInt(f), f]).filter(([n]) => n > (v0 || 0) && n <= (v1 || Infinity)).sort((x, y) => x[0] - y[0]);
  for (const [n, f] of notes) L.push(`## Journal amont v${n}`, "", fs.readFileSync(path.join(CL, f), "utf8").trim().replace(/^/gm, "> "), ""); }
for (const v of order) { const its = items.filter((i) => i.verdict === v); if (!its.length) continue; L.push(`## ${v} (${its.length})`, "");
  if (v === V.ok) { L.push(`<details><summary>${its.length} changement(s) amont déjà présents dans la base</summary>`, ""); }
  let fac = null; for (const i of its.sort((x, y) => (x.faction + x.unit).localeCompare(y.faction + y.unit))) { if (i.faction !== fac) { fac = i.faction; L.push(`### ${fac}`); }
    L.push(`- **${i.unit}** · ${i.kind} · ${i.detail}${i.action ? `  \n  → ${i.action}` : ""}`); }
  if (v === V.ok) L.push("", "</details>"); L.push(""); }
const md = L.join("\n") + "\n"; if (OUT) fs.writeFileSync(OUT, md); else process.stdout.write(md);
if (JOUT) fs.writeFileSync(JOUT, JSON.stringify({ from: v0, to: v1, counts: Object.fromEntries(order.map((v) => [v, count(v)])), items }, null, 1));
console.error(`gdc-watch : ${v0} → ${v1} · ` + order.map((v) => `${v} ${count(v)}`).join(" · "));
