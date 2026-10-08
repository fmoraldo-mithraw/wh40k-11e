// gdc-apply-abilities.cjs — aligne les APTITUDES de fiche d'un chapitre sur le texte officiel
// (game-datacards/datasources, 11th/gdc) : texte remplacé si différent, aptitude ajoutée si
// absente, marqueur « texte-provisoire: » retiré. Ne touche ni armes ni compositions.
//   node editor/translations/gdc-apply-abilities.cjs <fichier.cat> <gdc.json> [--write] [--rename "Ancien=Nouveau" ...] [--drop "Fiche:Aptitude" ...]
const fs = require("fs"); const path = require("path"); const R = path.resolve(__dirname, "../..");
const { Catalog } = require(R + "/editor/lib/catalog"); const xml = require(R + "/editor/lib/xml");
const args = process.argv.slice(2); const [FILE, GJ] = args; const WRITE = args.includes("--write");
const multi = (flag) => { const o = []; args.forEach((a, i) => { if (a === flag && args[i + 1]) o.push(args[i + 1]); }); return o; };
const RENAME = Object.fromEntries(multi("--rename").map((s) => s.split("="))); const DROP = new Set(multi("--drop"));
const c = new Catalog(R).load(); const g = JSON.parse(fs.readFileSync(GJ, "utf8"));
const en = (x) => (x && typeof x === "object" && "en" in x) ? x.en : x;
const nm = (n) => xml.getAttrDecoded(n, "name") || "";
const N = (s) => String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’'`]/g, "'").replace(/\s*\((aura|psychic|once per [^)]*|[^)]*per (battle|turn|phase)[^)]*)\)\s*/g, " ").replace(/\s+/g, " ").trim();
const plain = (s) => N(String(s || "").replace(/<[^>]+>/g, " ").replace(/\*\*|\^\^/g, "").replace(/[■▫•]/g, " ")).replace(/[”“″]/g, '"').replace(/[^a-z0-9+]+/g, "");
const toOurs = (s) => String(s || "").replace(/<k>\s*(\[[^\]]*\])\s*<\/k>/g, "**$1**").replace(/<k>(.*?)<\/k>/g, (m, x) => `**^^${x.trim()}^^**`).replace(/<b><b>(.*?)<\/b><\/b>/g, "\n**$1**\n").replace(/<\/?(b|u|i)>/g, "").replace(/<ul>/g, "").replace(/<\/ul>/g, "").replace(/<li>/g, "\n■ ").replace(/<\/li>/g, "").replace(/▫/g, "■").replace(/\s*\(pg \d+\)/g, "").replace(/ | /g, " ").replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const el = (tag, attrs, kids) => { const e = xml.elem(tag, attrs, kids || []); e.selfClose = !(kids && kids.length); return e; };
const txt = (tag, attrs, text) => { const e = xml.elem(tag, attrs, []); e.selfClose = false; xml.setText(e, text); return e; };
const doc = c.docs.get(FILE); const log = []; const written = new Map();
function unit(name) { for (const b of ["sharedSelectionEntries", "selectionEntries"]) { const bx = xml.child(doc.root, b); if (bx) for (const e of bx.children) if (e.tag === "selectionEntry" && N(nm(e)) === N(name) && xml.getAttr(e, "hidden") !== "true") return e; } return null; }
for (const ds of g.datasheets) {
  const u = unit(en(ds.name)); if (!u) { log.push(`(absente) ${en(ds.name)}`); continue; }
  const un = nm(u); const ab = ds.abilities || {};
  const off = []; for (const k of ["other", "special", "wargear"]) for (const a of ab[k] || []) if (a.description) off.push([en(a.name), en(a.description)]);
  for (const grp of ab.primarch || []) for (const a of grp.abilities || []) off.push([en(a.name), en(a.description)]);
  // profils d'aptitudes de la fiche (unité + sous-entrées, hors armes/stats)
  const profs = []; const seen = new Set();
  const visit = (n, depth) => { if (!n || seen.has(n)) return; seen.add(n); xml.walk(n, (p) => {
    if (p.tag === "profile" && !/Weapons$|^Unit$/.test(xml.getAttrDecoded(p, "typeName") || "")) profs.push(p);
    if (p.tag === "infoLink" && xml.getAttr(p, "type") === "profile") { const t = c.byId.get(xml.getAttr(p, "targetId")); if (t && !seen.has(t.node)) { seen.add(t.node); profs.push(t.node); } }
    if (p.tag === "entryLink" && depth < 3 && xml.getAttr(p, "hidden") !== "true" && !/Upgrade$|^Warlord$|^Enhancements$/.test(nm(p))) { const t = c.byId.get(xml.getAttr(p, "targetId")); if (t) visit(t.node, depth + 1); }
    if (p.tag === "selectionEntryGroup" && /Enhancement/.test(nm(p))) return; }); };
  visit(u, 0);
  for (const p of profs) { const r = RENAME[nm(p)]; if (r) { log.push(`${un} : «${nm(p)}» → «${r}»`); xml.setAttr(p, "name", r); } }
  for (const [n0, t0] of off) {
    if (/^(leader|support)$/i.test(n0)) continue;
    const k = N(n0); const p = profs.find((x) => N(nm(x)) === k) || profs.find((x) => N(nm(x)).startsWith(k) || k.startsWith(N(nm(x))));
    const pre = (n0.match(/\((once per [^)]*|[^)]*per (battle|turn|phase)[^)]*)\)/i) || [])[0];
    let t = toOurs(t0); if (pre && !t.startsWith("(")) t = `${pre} ${t}`;
    if (p) { const ch = Object.values((() => { const o = {}; xml.walk(p, (q) => { if (q.tag === "characteristic") o[xml.getAttrDecoded(q, "name")] = q; }); return o; })())[0];
      const pid = xml.getAttr(p, "id"); const prev = written.get(pid);
      if (prev && plain(prev.t) !== plain(t)) { log.push(`⚠ ${un} · ${nm(p)} : profil partagé avec ${prev.un} mais texte officiel différent — non écrit (à scinder)`); continue; }
      written.set(pid, { t, un });
      if (ch && plain(xml.getText(ch)) !== plain(t)) { log.push(`${un} · ${nm(p)} : texte officiel`); xml.setText(ch, t); } }
    else { const box = xml.child(u, "profiles") || (() => { const b = el("profiles", {}, []); b.selfClose = false; u.children.push(b); u.selfClose = false; return b; })();
      box.children.push(el("profile", { name: n0.replace(/\s*\((once per [^)]*)\)/i, ""), typeId: "9cc3-6d83-4dd3-9b64", typeName: "Abilities", hidden: "false", id: c.newId() }, [el("characteristics", {}, [txt("characteristic", { name: "Description", typeId: "9b8f-694b-e5e-b573" }, t)])]));
      log.push(`${un} : aptitude ajoutée «${n0}»`); }
  }
  for (const d of DROP) { const [du, da] = d.split(":"); if (N(du) !== N(un)) continue; xml.walk(u, (b) => { if (b.tag === "profiles") { const l = b.children.length; b.children = b.children.filter((p) => !(p.tag === "profile" && N(nm(p)) === N(da))); if (l !== b.children.length) log.push(`${un} : aptitude retirée «${da}»`); } }); }
  const com = xml.child(u, "comment"); if (com) { const t = xml.getText(com) || ""; const nx = t.split("\n").filter((l) => !/^texte-provisoire:/.test(l)).join("\n"); if (nx !== t) { log.push(`${un} : marqueur texte-provisoire retiré`); if (nx.trim()) xml.setText(com, nx); else u.children = u.children.filter((k) => k !== com); } }
}
for (const l of log) console.log("Δ " + l); console.log(log.length + " changement(s)");
if (WRITE) { c.markDirty(FILE); c.buildIndex(); const v = c.validate({ dirtyOnly: false }); console.log("validate", v.ok); if (v.ok) c.save(); }
