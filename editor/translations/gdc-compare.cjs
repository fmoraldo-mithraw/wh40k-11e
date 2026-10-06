// gdc-compare.cjs — compare les fiches des chapitres divergents (DA, BA, SW, BT, DW) aux
// données de l'appli officielle publiées par game-datacards/datasources (dossier 11th/gdc) :
// caractéristiques, profils d'armes, capacités (texte officiel), composition et options.
//   git clone --depth 1 https://github.com/game-datacards/datasources.git /tmp/gdc
//   node editor/translations/gdc-compare.cjs editor/SM_FICHES_OFFICIELLES_11E.md /tmp/gdc/11th/gdc
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../.."); const GDC = process.argv[3] || "/tmp/gdc/11th/gdc";
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const c = new Catalog(R).load();
const CH = [["Dark Angels", "Imperium - Dark Angels.cat", "darkangels"], ["Blood Angels", "Imperium - Blood Angels.cat", "bloodangels"], ["Space Wolves", "Imperium - Space Wolves.cat", "spacewolves"], ["Black Templars", "Imperium - Black Templars.cat", "blacktemplar"], ["Deathwatch", "Imperium - Deathwatch.cat", "deathwatch"]];
const idx = new Map(); for (const [, d] of c.docs) xml.walk(d.root, (n) => { const id = xml.getAttr(n, "id"); if (id && !idx.has(id)) idx.set(id, n); });
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : x;
const fr = (x) => (x && typeof x === "object" && "fr" in x) ? x.fr : null;
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[–—]/g, "-").replace(/^➤\s*/, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
const plain = (s) => N(String(s || "").replace(/<[^>]+>/g, " ").replace(/\*\*|\^\^/g, "").replace(/[■▫•]/g, " ")).replace(/[^a-z0-9+]+/g, "");
const toOurs = (s) => String(s || "").replace(/<k>(.*?)<\/k>/g, "**^^$1^^**").replace(/<\/?(b|u|i)>/g, "").replace(/<ul>/g, "").replace(/<\/ul>/g, "").replace(/<li>/g, "\n■ ").replace(/<\/li>/g, "").replace(/▫/g, "■").replace(/\n+/g, "\n").trim();
const kwN = (k) => (Array.isArray(k) ? k : String(k || "").split(/,\s*/)).map((x) => N(x)).flatMap((x) => { const m = x.match(/^anti-([a-z]+)\/([a-z]+) (\d\+)$/); return m ? [`anti-${m[1]} ${m[3]}`, `anti-${m[2]} ${m[3]}`] : [x]; }).filter((x) => x && x !== "-" && !/^hunter/.test(x)).sort().join(", ");
const vsig = (p) => [String(p.range).replace(/"/g, "").replace(/^melee$/i, "melee"), p.attacks, String(p.skill).replace(/^(-|n\/a)$/i, "N/A"), p.strength, p.ap, p.damage, kwN(p.keywords)].map((v) => N(v)).join(" | ");
function oursUnit(file, name) { const d = c.docs.get(file); for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (bx) for (const e of bx.children) if (e.tag === "selectionEntry" && N(nm(e)) === N(name) && xml.getAttr(e, "hidden") !== "true") return e; } return null; }
function collect(u) {
  const W = new Map(), S = [], A = new Map(), L = new Set(); let prov = ""; const seen = new Set();
  const com = xml.child(u, "comment"); if (com) { const m = (xml.getText(com) || "").match(/^texte-provisoire:.*?— (.*)$/m); if (m) prov = m[1]; }
  const st = [u]; while (st.length) { const n = st.pop(); if (!n || seen.has(n)) continue; seen.add(n);
    const walkF = (x, f) => { f(x); for (const k of x.children || []) { if (!k.tag) continue; if ((k.tag === "selectionEntryGroup" && /Enhancement/i.test(nm(k))) || (k.tag === "selectionEntry" && /Upgrade$/.test(nm(k)))) continue; walkF(k, f); } };
    walkF(n, (k) => {
      if (k.tag === "profile") { const t = xml.getAttrDecoded(k, "typeName") || ""; const ch = {}; xml.walk(k, (q) => { if (q.tag === "characteristic") ch[xml.getAttrDecoded(q, "name")] = xml.getText(q) || ""; });
        if (/Weapons$/.test(t)) W.set(N(nm(k)), vsig({ range: ch.Range, attacks: ch.A, skill: ch.BS || ch.WS, strength: ch.S, ap: ch.AP, damage: ch.D, keywords: ch.Keywords }));
        else if (t === "Unit") S.push([nm(k), [ch.M, ch.T, ch.SV, ch.W, ch.LD, ch.OC].map((v) => String(v || "").replace(/"/g, "")).join("/")]);
        else if (!/Transport/.test(t) || true) A.set(N(nm(k).replace(/\s*\((aura|psychic)\)$/i, "")), Object.values(ch).join(" ")); }
      if (k.tag === "infoLink") L.add(N(nm(k)));
      if (k.tag === "entryLink" && xml.getAttr(k, "hidden") !== "true" && !/Upgrade$|^Warlord$|^Enhancements$/.test(nm(k))) st.push(idx.get(xml.getAttr(k, "targetId")));
    }); }
  return { W, S, A, L, prov };
}
const out = []; const P = (s) => out.push(s); const tot = { ok: 0, diff: 0, abs: 0, ext: 0 };
for (const [chap, file, gf] of CH) {
  const g = JSON.parse(fs.readFileSync(`${GDC}/${gf}.json`, "utf8"));
  P(`\n## ${chap}\n`); const done = new Set();
  for (const ds of g.datasheets) {
    const name = en(ds.name); const u = oursUnit(file, name);
    if (!u) { tot.abs++; P(`### ${name} — ⚪ absente de notre fichier ${chap}`); continue; }
    done.add(u); const o = collect(u); const rows = [];
    // caractéristiques
    const gs = (ds.stats || []).map((s) => [en(s.name), [s.m, s.t, s.sv, s.w, s.ld, s.oc].map((v) => String(v).replace(/"/g, "")).join("/")]);
    for (const [n, v] of gs) { const mine = o.S.find(([a]) => N(a) === N(n)) || o.S.find(([, x]) => x === v) || (o.S.length === 1 && gs.length === 1 ? o.S[0] : null); if (!mine) rows.push(`- 📊 profil **${n}** ${v} absent chez nous (nous : ${o.S.map((x) => x.join(" ")).join(" ; ") || "—"})`); else if (mine[1] !== v) rows.push(`- 📊 **${n}** : nous ${mine[1]} → officiel ${v}`); }
    if (ds.abilities?.invul?.value && !o.A.has("invulnerable save") && !JSON.stringify([...o.L]).includes("invulnerable")) rows.push(`- 🛡️ invulnérable officielle ${ds.abilities.invul.value} : pas de profil/lien chez nous`);
    // armes : par nom de base, ensemble des profils (valeurs)
    const base = (k) => N(k).split(" - ")[0].trim().replace(/^astartes chainsword$/, "chainsword");
    const offB = new Map(); for (const grp of [...(ds.rangedWeapons || []), ...(ds.meleeWeapons || [])]) for (const p of grp.profiles || []) { const b = base(en(p.name)); if (!offB.has(b)) offB.set(b, { name: en(p.name).split(/\s+[–-]\s+/)[0], sigs: new Set() }); offB.get(b).sigs.add(vsig(p)); }
    const ourB = new Map(); for (const [k, v] of o.W) { const b = base(k); if (!ourB.has(b)) ourB.set(b, new Set()); ourB.get(b).add(v); }
    for (const [b, w] of offB) { const mine = ourB.get(b); if (!mine) { rows.push(`- ➕ arme officielle absente : **${w.name}** ${[...w.sigs].join(" ; ")}`); continue; }
      const miss = [...w.sigs].filter((x) => !mine.has(x)); if (miss.length) rows.push(`- ✏️ **${w.name}** : nous ${[...mine].join(" ; ")} → officiel ${[...w.sigs].join(" ; ")}`); }
    const extraW = [...ourB.keys()].filter((b) => !offB.has(b));
    if (extraW.length) rows.push(`- ➖ armes chez nous absentes de la fiche officielle : ${extraW.join(", ")}`);
    // capacités
    const ab = ds.abilities || {}; const offA = [];
    for (const a of ab.other || []) offA.push([en(a.name), en(a.description)]);
    for (const a of ab.special || []) offA.push([en(a.name), en(a.description)]);
    for (const grp of ab.primarch || []) for (const a of grp.abilities || []) offA.push([en(a.name), en(a.description)]);
    for (const a of ab.wargear || []) offA.push([en(a.name), en(a.description)]);
    const provSet = new Set((o.prov || "").split(" | ").map((x) => N(x.replace(/\s*\((aura|psychic)\)$/i, ""))));
    for (const [n, t] of offA) { const k = N(String(n).replace(/\s*\((aura|psychic)\)$/i, "")); const mine = o.A.get(k) ?? [...o.A.entries()].find(([a]) => a.startsWith(k) || k.startsWith(a))?.[1];
      if (mine == null) { if (!o.L.has(k)) rows.push(`- 🆕 capacité officielle absente : **${n}** — « ${toOurs(t).replace(/\n/g, " ⏎ ")} »`); }
      else if (plain(mine) !== plain(t)) (process.env.GDC_DEBUG && console.log('GDC_DEBUG', n, '\n  N:', plain(mine), '\n  O:', plain(t)), rows.push(`- ${provSet.has(k) ? "⚑ texte provisoire à remplacer" : "≠ texte différent"} : **${n}** — officiel « ${toOurs(t).replace(/\n/g, " ⏎ ")} »`)); }
    const coreN = new Set([...(ab.core || []), ...(ab.faction || [])].map((a) => N(en(a.name))));
    const offN = new Set(offA.map(([n]) => N(String(n).replace(/\s*\((aura|psychic)\)$/i, ""))));
    const extraA = [...o.A.keys()].filter((k) => !offN.has(k) && ![...offN].some((x) => x.startsWith(k) || k.startsWith(x)) && !coreN.has(k) && !/^(leader|invulnerable save|attached unit|transport|damaged|supreme commander)/.test(k) && !/^\d|^[a-z]+ ?\d/.test(k));
    if (extraA.length) rows.push(`- ➖ capacités chez nous absentes de la fiche officielle : ${extraA.join(", ")}`);
    // composition (texte officiel, pour encodage)
    const comp = (ds.composition || []).map(en).join(" ; "), load = en(ds.loadout);
    const opts = [...new Set((ds.wargearOptions || []).map((w) => en(w.instruction)).filter((x) => x && !/^Default Wargear$/i.test(x)))];
    const optsFr = (ds.wargearOptions || []).map((w) => fr(w.instruction)).filter((x) => x && !/^Équipement par Défaut$/i.test(x));
    if (rows.length) { tot.diff++; P(`### ${name} — ${rows.length} écart(s)`); rows.forEach((r) => P(r)); } else { tot.ok++; P(`### ${name} — ✔ conforme (caractéristiques, armes, capacités)`); }
    P(`- 📦 composition officielle : ${comp}${ds.leader ? "" : ""}`); if (load) P(`  - équipement : ${load}`); for (const x of opts) P(`  - option : ${x}`);
  }
  // fiches chez nous non couvertes par la source (pas dans le codex du chapitre)
  const d = c.docs.get(file); const ext = []; for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(d.root, b); if (bx) for (const e of bx.children) if (e.tag === "selectionEntry" && ["unit", "model"].includes(xml.getAttr(e, "type")) && xml.getAttr(e, "hidden") !== "true" && !done.has(e)) { let pts = false; xml.walk(e, (k) => { if (k.tag === "cost" && xml.getAttr(k, "name") === "pts" && +xml.getAttr(k, "value") > 0) pts = true; }); if (pts || xml.getAttr(e, "type") === "unit") ext.push(nm(e)); } }
  if (ext.length) { tot.ext += ext.length; P(`\n*Fiches de notre fichier ${chap} sans fiche dans la source (unités du tronc Space Marines ou variantes) :* ${ext.join(", ")}`); }
}
const head = ["# Fiches 11ᵉ des chapitres divergents — notre base vs données de l'appli officielle", "",
  `Source : dépôt public \`game-datacards/datasources\`, dossier \`11th/gdc\` (export des données de l'appli officielle, mis à jour le ${JSON.parse(fs.readFileSync(GDC + "/darkangels.json", "utf8")).updated.slice(0, 10)}). Contrôle : la fiche du Lion y est identique aux captures de l'appli (E10 PV16, Arma Luminis 18", Martial Exemplar…).`, "",
  "Légende : 📊 caractéristiques · ➕ arme/figurine officielle absente · ✏️ valeurs d'arme différentes · ➖ chez nous mais pas sur la fiche officielle · 🆕 capacité absente · ⚑ texte provisoire (ALN) à remplacer · ≠ texte différent · 📦 composition et options officielles (à encoder).", "",
  `Bilan : ${tot.ok} fiches conformes, ${tot.diff} avec écarts, ${tot.abs} fiches officielles absentes de notre fichier, ${tot.ext} fiches de nos fichiers hors source.`, ""];
fs.writeFileSync(process.argv[2], head.concat(out).join("\n") + "\n"); console.log(head.slice(-2).join(""));
