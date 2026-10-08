// gdc-sync-detachments.cjs — aligne les DÉTACHEMENTS (règles, stratagèmes, améliorations) d'un
// fichier game-datacards (11th/gdc/<faction>.json) sur la base : texte officiel EN, stratagèmes
// ajoutés/retirés, améliorations (texte, points, ajout par clonage d'une sœur, retrait).
//   node editor/translations/gdc-sync-detachments.cjs <gdc.json> [--write] [--keep "Det:Nom"]
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const GJ = args[0]; const WRITE = args.includes("--write");
const KEEP = new Set(args.filter((a, i) => args[i - 1] === "--keep"));
const c = new Catalog(R).load(); const g = JSON.parse(fs.readFileSync(GJ, "utf8"));
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : x;
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const TYPO = { "upgarde": "upgrade", "feroicity": "ferocity" };
const K = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\b(upgarde|feroicity)\b/g, (m) => TYPO[m]).replace(/\(stratagem[^)]*\)|\(upgrade\)|\bupgrade\b|\(aura\)|^the /g, "").replace(/[^a-z0-9]+/g, "");
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plain = (s) => N(String(s || "").replace(/<[^>]+>/g, " ").replace(/\*\*|\^\^/g, "").replace(/^.*?STRATAGEM \(\d+CP\)/s, "")).replace(/[”“″]/g, '"').replace(/[^a-z0-9+]+/g, "");
const toOurs = (s) => String(s || "").replace(/<k>\s*(\[[^\]]*\])\s*<\/k>/g, "**$1**").replace(/<k>(.*?)<\/k>/g, (m, x) => `**^^${x.trim()}^^**`).replace(/<b><b>(.*?)<\/b><\/b>/g, "\n**$1**\n").replace(/<\/?(b|u|i)>/g, "").replace(/<ul>|<\/ul>/g, "").replace(/<li>/g, "\n■ ").replace(/<\/li>/g, "").replace(/▫/g, "■").replace(/\s*\(pg \d+\)/g, "").replace(/ | /g, " ").replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const upper = (s) => toOurs(s).replace(/\*\*\^\^(.*?)\^\^\*\*/g, (m, x) => x.toUpperCase()).replace(/\*\*(\[[^\]]*\])\*\*/g, "$1").replace(/\*\*/g, "");
const fixName = (s) => String(s).replace(/\(Upgarde\)/, "(Upgrade)").replace(/Feroicity/, "Ferocity");
const el = (tag, attrs, kids) => { const e = xml.elem(tag, attrs, kids || []); e.selfClose = !(kids && kids.length); return e; };
const txt = (tag, attrs, text) => { const e = xml.elem(tag, attrs, []); e.selfClose = false; xml.setText(e, text); return e; };
const clone = (n) => { const k = JSON.parse(JSON.stringify(n)); xml.walk(k, (x) => { if (xml.getAttr(x, "id")) xml.setAttr(x, "id", c.newId()); }); return k; };
const timing = (s) => { const t = { your: "your", opponents: "opponent", opponent: "opponent", either: "either" }[s.turn] || "either"; const ph = (s.phase || []).length ? s.phase.slice().sort((a, b) => ["command", "movement", "shooting", "charge", "fight"].indexOf(a) - ["command", "movement", "shooting", "charge", "fight"].indexOf(b)).join("|") : "any"; return `strat-timing: turn=${t} phase=${ph}`; };
const dets = new Map(); for (const [f, d] of c.docs) xml.walk(d.root, (n) => { if (n.tag === "selectionEntry" && xml.getAttr(n, "type") === "upgrade") for (const k of n.children || []) if (k.tag === "costs") for (const q of k.children || []) if (xml.getAttr(q, "typeId") === "0d99-4ee2-7b3c-1f5a") dets.set(K(nm(n)), { n, f }); });
const log = []; const dirty = new Set(); const touchedStrings = [];
const parentOf = (n) => { for (const [f, d] of c.docs) { let p = null; xml.walk(d.root, (x) => { if (!p && (x.children || []).includes(n)) p = x; }); if (p) return { p, f }; } return null; };
for (const gd of g.detachments) {
  const dn = en(gd.name); const D = dets.get(K(dn)); if (!D) { log.push(`✗ ${dn} absent`); continue; } dirty.add(D.f);
  let rules = xml.child(D.n, "rules"); if (!rules) { rules = el("rules", {}, []); rules.selfClose = false; D.n.children.push(rules); }
  const rr = () => rules.children.filter((r) => r.tag === "rule");
  // règles
  for (const x of (g.rules.detachment || []).filter((x) => x.detachment === dn)) for (const r0 of x.rules) {
    const rn = en(r0.name); const t = toOurs(r0.rules.map((q) => en(q.text)).join("\n\n"));
    const mine = rr().find((r) => K(nm(r)) === K(rn)) || rr().find((r) => !/Stratagem/.test(nm(r)));
    if (!mine) { rules.children.unshift(el("rule", { name: rn, id: c.newId(), hidden: "false" }, [txt("description", {}, t)])); log.push(`${dn} : règle ajoutée « ${rn} »`); continue; }
    if (nm(mine) !== rn) { log.push(`${dn} : règle « ${nm(mine)} » → « ${rn} »`); xml.setAttr(mine, "name", rn); }
    const d = xml.child(mine, "description"); if (plain(xml.getText(d)) !== plain(t)) { xml.setText(d, t); log.push(`${dn} : règle « ${rn} » texte officiel`); }
    touchedStrings.push(["rule", dn, rn, xml.getText(d), r0]);
  }
  // stratagèmes
  const off = g.stratagems.filter((x) => x.detachment === dn);
  for (const s of off) { const sn = fixName(en(s.name)); const want = `${sn} (Stratagem, ${s.cost}CP)`;
    const desc = `${dn} – STRATAGEM (${s.cost}CP)\n\nWHEN: ${upper(en(s.when))}\nTARGET: ${upper(en(s.target))}\nEFFECT: ${upper(en(s.effect))}`;
    let mine = rr().find((r) => /Stratagem/.test(nm(r)) && K(nm(r)) === K(sn));
    if (!mine) { mine = el("rule", { name: want, id: c.newId(), hidden: "false" }, [txt("comment", {}, timing(s)), txt("description", {}, desc)]); rules.children.push(mine); log.push(`${dn} : stratagème ajouté « ${sn} »`); }
    else { if (nm(mine) !== want) { log.push(`${dn} : « ${nm(mine)} » → « ${want} »`); xml.setAttr(mine, "name", want); }
      const d = xml.child(mine, "description"); if (plain(xml.getText(d)) !== plain(desc) || !xml.getText(d).startsWith(`${dn} – STRATAGEM (${s.cost}CP)`)) { xml.setText(d, desc); log.push(`${dn} : stratagème « ${sn} » texte officiel`); }
      const com = xml.child(mine, "comment"); const tl = timing(s); if (!com) mine.children.unshift(txt("comment", {}, tl)); else { const ls = (xml.getText(com) || "").split("\n").filter((l) => !/^strat-timing:/.test(l)); xml.setText(com, [tl, ...ls].join("\n")); } }
    touchedStrings.push(["strat", dn, sn, xml.getText(xml.child(mine, "description")), s, nm(mine)]); }
  const offK = new Set(off.map((s) => K(fixName(en(s.name)))));
  for (const r of rr()) if (/Stratagem/.test(nm(r)) && !offK.has(K(nm(r))) && !KEEP.has(`${dn}:${nm(r)}`)) { rules.children = rules.children.filter((x) => x !== r); log.push(`${dn} : stratagème retiré (absent de la fiche officielle) « ${nm(r)} »`); }
  // améliorations : candidates = groupes « <Det> Enhancements » / « <Det> Enhancement »
  const groups = []; for (const [f, d] of c.docs) xml.walk(d.root, (gr) => { if (gr.tag === "selectionEntryGroup" && [dn + " Enhancements", dn + " Enhancement"].includes(nm(gr))) groups.push({ gr, f }); });
  const cands = []; for (const { gr, f } of groups) for (const box of gr.children || []) if (["selectionEntries", "entryLinks"].includes(box.tag)) for (const k of box.children || []) { const t = k.tag === "entryLink" ? (c.byId.get(xml.getAttr(k, "targetId")) || {}).node : k; if (t) cands.push({ k, t, box, f, gr }); }
  const offE = g.enhancements.filter((x) => x.detachment === dn);
  for (const e of offE) { const en0 = fixName(en(e.name)); const isUp = /\(Upgrade\)/.test(en0); const ourName = en0.replace(/\s*\(Upgrade\)$/, isUp ? " Upgrade" : "");
    const want = toOurs(en(e.description)); const hits = cands.filter((x) => K(nm(x.t)) === K(en0));
    if (!hits.length) { // clone d'une sœur du groupe central (même gate de détachement), porteur = Adeptus Astartes à vérifier
      const sis = cands.find((x) => x.k.tag === "selectionEntry" && !/Upgrade/.test(nm(x.t)));
      if (!sis || isUp) { log.push(`${dn} : ⚠ amélioration « ${en0} » à créer à la main`); continue; }
      const k = clone(sis.t); xml.setAttr(k, "name", ourName); k.children = k.children.filter((x) => x.tag !== "comment");
      xml.walk(k, (p) => { if (p.tag === "profile") xml.setAttr(p, "name", ourName); if (p.tag === "characteristic") xml.setText(p, want); if (p.tag === "cost" && xml.getAttr(p, "name") === "pts") xml.setAttr(p, "value", String(e.cost)); });
      sis.box.children.push(k); dirty.add(sis.f); log.push(`${dn} : amélioration ajoutée « ${ourName} » (gate copiée de « ${nm(sis.t)} » — vérifier les porteurs : ${e.keywords.join("+")})`); touchedStrings.push(["enh", dn, ourName, want, e]); continue; }
    for (const h of hits) { const t = h.t; dirty.add(h.f);
      if (nm(t) !== ourName) { log.push(`${dn} : amélioration « ${nm(t)} » → « ${ourName} »`); xml.setAttr(t, "name", ourName); if (h.k !== t) xml.setAttr(h.k, "name", ourName); xml.walk(t, (p) => { if (p.tag === "profile" && /Abilities/.test(xml.getAttrDecoded(p, "typeName") || "")) xml.setAttr(p, "name", ourName); }); }
      let pts = null; xml.walk(t, (q) => { if (!pts && q.tag === "cost" && xml.getAttr(q, "name") === "pts") pts = q; });
      if (pts && xml.getAttr(pts, "value") !== String(e.cost)) { log.push(`${dn} : « ${ourName} » ${xml.getAttr(pts, "value")} → ${e.cost} pts`); xml.setAttr(pts, "value", String(e.cost)); }
      let ch = null; xml.walk(t, (q) => { if (!ch && q.tag === "characteristic" && xml.getAttrDecoded(q, "name") === "Description") ch = q; });
      if (ch && plain(xml.getText(ch)) !== plain(want)) { xml.setText(ch, want); log.push(`${dn} : « ${ourName} » texte officiel`); } }
    touchedStrings.push(["enh", dn, ourName, want, e]); }
  const offEK = new Set(offE.map((e) => K(fixName(en(e.name)))));
  for (const x of cands) if (!offEK.has(K(nm(x.t))) && nm(x.t) && !KEEP.has(`${dn}:${nm(x.t)}`)) { x.box.children = x.box.children.filter((y) => y !== x.k); dirty.add(x.f); log.push(`${dn} : amélioration retirée (absente de la fiche officielle) « ${nm(x.t)} »`); }
  // groupes d'amélioration devenus vides → retirés
  for (const { gr, f } of groups) { const n = (gr.children || []).filter((b) => ["selectionEntries", "entryLinks"].includes(b.tag)).reduce((a, b) => a + (b.children || []).length, 0);
    if (!n) { const P = parentOf(gr); if (P) { P.p.children = P.p.children.filter((x) => x !== gr); dirty.add(P.f); log.push(`${dn} : groupe vide retiré « ${nm(gr)} » (${P.f.replace(/^Imperium - |\.cat$/g, "")})`); } } }
}
for (const l of log) console.log("Δ " + l); console.log(log.length + " changement(s)");
fs.writeFileSync((process.env.GDC_STRINGS || "/tmp/gdc-strings") + ".json", JSON.stringify(touchedStrings));
if (WRITE) { for (const f of dirty) c.markDirty(f); c.buildIndex(); const v = c.validate({ dirtyOnly: false }); let k = 0; for (const r of v.results || []) { k += r.errors.length; for (const e of r.errors.slice(0, 5)) console.log("ERR", r.file, e); } console.log("validate", v.ok, k); if (v.ok) c.save(); }
