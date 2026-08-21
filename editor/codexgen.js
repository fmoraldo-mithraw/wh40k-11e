// Genere un HTML type codex (regles, detachements, fiches) depuis Orks.cat.
// Usage : node editor/codexgen.js [sortie.html]   (defaut : codex-orks.html a la racine)
// PDF   : chromium --headless --no-sandbox --print-to-pdf=Codex-Orks-11e.pdf --no-pdf-header-footer codex-orks.html
const path = require("path");
const ROOT = path.join(__dirname, "..");
const xml = require(path.join(__dirname, "lib/xml"));
const fs = require("fs");
const cat = xml.parse(fs.readFileSync(path.join(ROOT, "Orks.cat"), "utf8"));
const OUT = process.argv[2] || path.join(ROOT, "codex-orks.html");

const dec = s => String(s == null ? "" : s).replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const esc = s => dec(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// markdown leger -> HTML (les textes du .cat sont deja decodes par la lib)
function md(s) {
  let h = esc(s);
  h = h.replace(/\*\*\^\^([^^]+)\^\^\*\*/g, '<span class="kw">$1</span>');
  h = h.replace(/\^\^([^^]+)\^\^/g, '<span class="kw">$1</span>');
  h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  h = h.replace(/(^|[\s(>])\*([^*\n]+)\*(?=[\s.,;:)<]|$)/g, "$1<i>$2</i>");
  // listes a puces
  const lines = h.split("\n");
  let out = [], inUl = false;
  for (const l of lines) {
    const m = l.match(/^\s*-\s+(.*)$/);
    if (m) { if (!inUl) { out.push("<ul>"); inUl = true; } out.push("<li>" + m[1] + "</li>"); }
    else { if (inUl) { out.push("</ul>"); inUl = false; } if (l.trim()) out.push("<p>" + l + "</p>"); }
  }
  if (inUl) out.push("</ul>");
  return out.join("");
}
const A = (n, a) => xml.getAttr(n, a);
const txt = n => xml.getText(n);

// ---------- collecte ----------
const rootLinks = [];
for (const top of cat.root.children) if (top.tag === "entryLinks")
  for (const l of top.children) if (l.tag === "entryLink") rootLinks.push(A(l, "targetId"));
const byId = new Map();
xml.walk(cat.root, n => { const i = A(n, "id"); if (i && !byId.has(i)) byId.set(i, n); });

// regles d'armee / partagees (bloc <rules> racine)
const armyRules = [];
for (const top of cat.root.children) if (top.tag === "rules")
  for (const r of top.children) if (r.tag === "rule") {
    const d = r.children.find(c => c.tag === "description");
    armyRules.push({ name: A(r, "name"), text: d ? txt(d) : "" });
  }
// regles universelles introduites par ce codex (desormais dans le .gst)
const gstDoc = xml.parse(fs.readFileSync(path.join(ROOT, "Warhammer 40,000.gst"), "utf8"));
for (const id2 of ["0d1a-9f3b-7c40-1c01", "0d1a-9f3b-7c40-1c06", "0d1a-9f3b-7c40-1c07", "0d1a-9f3b-7c40-1c08", "0d1a-9f3b-7c40-1c09"])
  xml.walk(gstDoc.root, r => {
    if (r.tag !== "rule" || A(r, "id") !== id2) return;
    const d = r.children.find(c => c.tag === "description");
    armyRules.push({ name: A(r, "name"), text: d ? txt(d) : "", universal: true });
  });

// detachements
const DET_GROUP = "8b85-ad3b-752f-6502", ENH_MENU = "1dd8-39ae-cbd8-a9fa", ENH_CAT = "6226-9b9b-107a-9ada";
const dets = [];
xml.walk(cat.root, n => {
  if (n.tag !== "selectionEntryGroup" || A(n, "id") !== DET_GROUP) return;
  xml.walk(n, e => {
    if (e.tag !== "selectionEntry" || A(e, "type") !== "upgrade") return;
    const det = { name: A(e, "name"), id: A(e, "id"), dp: "?", fd: "?", rules: [], strats: [] };
    xml.walk(e, m => {
      if (m.tag === "cost" && A(m, "name") === "DP") det.dp = A(m, "value");
      if (m.tag === "characteristic" && A(m, "typeId") === "9145-6e6a-17b9-0a2c") det.fd = txt(m);
      if (m.tag === "rule") {
        const d = m.children.find(c => c.tag === "description");
        const o = { name: A(m, "name"), text: d ? txt(d) : "" };
        if (/\(Stratagem/.test(o.name)) det.strats.push(o); else det.rules.push(o);
      }
    });
    dets.push(det);
  });
});
// ameliorations personnage par detachement (sous-groupes du menu)
const enhByDet = new Map();
xml.walk(cat.root, n => {
  if (n.tag !== "selectionEntryGroup" || A(n, "id") !== ENH_MENU) return;
  xml.walk(n, g => {
    if (g.tag !== "selectionEntryGroup" || !(A(g, "name") || "").endsWith("Enhancements")) return;
    // detachement associe = condition lessThan childId (modifiers directs du sous-groupe uniquement)
    let detId = null;
    const gmods = g.children.find(c => c.tag === "modifiers");
    if (gmods) xml.walk(gmods, c => { if (c.tag === "condition" && A(c, "field") === "selections" && A(c, "scope") === "roster" && !detId) detId = A(c, "childId"); });
    const list = [];
    for (const se of (g.children.find(c => c.tag === "selectionEntries") || { children: [] }).children) {
      if (se.tag !== "selectionEntry") continue;
      let pts = "0", text = "";
      xml.walk(se, m => {
        if (m.tag === "cost" && A(m, "typeId") === "51b2-306e-1021-d207") pts = A(m, "value");
        if (m.tag === "characteristic" && A(m, "typeId") === "9b8f-694b-e5e-b573" && !text) text = txt(m);
      });
      list.push({ name: A(se, "name"), pts, text });
    }
    if (detId) enhByDet.set(detId, (enhByDet.get(detId) || []).concat(list));
  });
});
// upgrades partagees (categorie Enhancement) -> rattacher au detachement via le commentaire
const upgrades = [];
for (const top of cat.root.children) if (top.tag === "sharedSelectionEntries")
  for (const se of top.children) {
    if (se.tag !== "selectionEntry") continue;
    let isEnh = false, pts = "0", text = "", det = "";
    xml.walk(se, m => {
      if (m.tag === "categoryLink" && A(m, "targetId") === ENH_CAT) isEnh = true;
      if (m.tag === "cost" && A(m, "typeId") === "51b2-306e-1021-d207") pts = A(m, "value");
      if (m.tag === "characteristic" && A(m, "typeId") === "9b8f-694b-e5e-b573" && !text) text = txt(m);
    });
    const cm = se.children.find(c => c.tag === "comment");
    if (cm) { const m = txt(cm).match(/Upgrade \(([^)]+)\)/); if (m) det = m[1]; }
    if (isEnh) upgrades.push({ name: A(se, "name"), pts, text, det });
  }

// datasheets
const sheets = [];
const seen = new Set();
for (const tid of rootLinks) {
  const e = byId.get(tid);
  if (!e || seen.has(tid) || A(e, "type") === "upgrade") continue;
  seen.add(tid);
  const s = { name: A(e, "name"), pts: "?", stats: [], ranged: [], melee: [], abilities: [], transport: "", core: [], army: [], kws: [], inv: null, fnp: null, comp: [] };
  for (const c of e.children) if (c.tag === "costs")
    for (const k of c.children) if (A(k, "name") === "pts") s.pts = A(k, "value");
  const cm = e.children.find(c => c.tag === "comment");
  if (cm) {
    const t = txt(cm);
    const iv = t.match(/^invuln: (\S+)/m); if (iv) s.inv = iv[1];
    const fp = t.match(/^fnp: (\S+)/m); if (fp) s.fnp = fp[1];
  }
  const wseen = new Set(), aseen = new Set(), sseen = new Set();
  xml.walk(e, m => {
    if (m.tag === "profile") {
      const tn = A(m, "typeName"), nm = A(m, "name");
      const vals = []; xml.walk(m, c => { if (c.tag === "characteristic") vals.push(txt(c)); });
      if (tn === "Unit" && !sseen.has(nm)) { sseen.add(nm); s.stats.push({ name: nm, v: vals }); }
      else if ((tn === "Ranged Weapons" || tn === "Melee Weapons")) {
        const key = nm + vals.join("|");
        if (!wseen.has(key)) { wseen.add(key); (tn === "Ranged Weapons" ? s.ranged : s.melee).push({ name: nm, v: vals }); }
      } else if (tn === "Abilities" && !aseen.has(nm)) {
        aseen.add(nm);
        let d = ""; xml.walk(m, c => { if (c.tag === "characteristic") d = txt(c); });
        s.abilities.push({ name: nm, text: d });
      } else if (tn === "Transport") { xml.walk(m, c => { if (c.tag === "characteristic") s.transport = txt(c); }); }
    }
    if (m.tag === "infoLink" && A(m, "type") === "rule") {
      let app = ""; xml.walk(m, c => { if (c.tag === "modifier" && A(c, "type") === "append") app = " " + A(c, "value"); });
      const nm = A(m, "name") + app;
      const CORE = /^(Leader|Deep Strike|Deadly Demise|Damaged|Feel No Pain|Firing Deck|Infiltrators|Stealth|Lone Operative|Scouts|Super-Heavy Walker|Support|Assault Disembark Move|Pulse Jet Move)/;
      const ARMY = /^(Waaagh!|Da Boss|Unstable Energies)/;
      if (ARMY.test(nm)) { if (!s.army.includes(nm)) s.army.push(nm); }
      else if (CORE.test(nm)) { if (!s.core.includes(nm)) s.core.push(nm); }
    }
    if (m.tag === "categoryLink") {
      const nm = A(m, "name");
      if (!["Ranged Weapon", "Melee Weapon", "Enhancement"].includes(nm) && !nm.startsWith("Faction") && !s.kws.includes(nm)) s.kws.push(nm);
    }
    if (m.tag === "selectionEntry" && A(m, "type") === "model") {
      let mn = null, mx = null;
      for (const c of m.children) if (c.tag === "constraints")
        for (const k of c.children) {
          if (A(k, "type") === "min" && A(k, "scope") === "parent") mn = A(k, "value");
          if (A(k, "type") === "max" && A(k, "scope") === "parent") mx = A(k, "value");
        }
      if (mn != null || mx != null) s.comp.push({ name: A(m, "name"), mn, mx });
    }
  });
  // options d'armement : groupes a choix, armes optionnelles, ratios 1-pour-N
  s.options = [];
  const isWeapon = node => {
    let w2 = false;
    for (const c of node.children) if (c.tag === "profiles")
      for (const p of c.children) if (["Ranged Weapons", "Melee Weapons"].includes(A(p, "typeName"))) w2 = true;
    return w2;
  };
  const perN = node => { // cap "1 par N modeles"
    let n2 = null;
    xml.walk(node, m => { if (m.tag === "repeat" && A(m, "childId") === "model") n2 = A(m, "value"); });
    return n2;
  };
  (function optwalk(node, owner) {
    for (const c of node.children || []) {
      if (c.tag === "selectionEntry" && A(c, "type") === "model") { optwalk(c, A(c, "name")); continue; }
      if (c.tag === "selectionEntryGroup") {
        const entries = (c.children.find(x => x.tag === "selectionEntries") || { children: [] }).children.filter(x => x.tag === "selectionEntry");
        if (entries.length > 1 && entries.some(isWeapon)) {
          const def = A(c, "defaultSelectionEntryId");
          const names = entries.map(x => A(x, "name") + (A(x, "id") === def ? "*" : "") + (perN(x) ? ` (1 per ${perN(x)} models)` : ""));
          s.options.push({ owner, txt: `one of: ${names.join(" / ")}` });
          continue;
        }
      }
      if (c.tag === "selectionEntry" && isWeapon(c)) {
        let mn = null, mx = null;
        for (const k of c.children) if (k.tag === "constraints")
          for (const kk of k.children) {
            if (A(kk, "type") === "min" && A(kk, "scope") === "parent") mn = A(kk, "value");
            if (A(kk, "type") === "max" && A(kk, "scope") === "parent") mx = A(kk, "value");
          }
        const N = perN(c);
        if (N) s.options.push({ owner, txt: `${A(c, "name")}: 1 per ${N} models` });
        else if (mn === "0" && mx === "1") s.options.push({ owner, txt: `can take 1 ${A(c, "name")}` });
        else if (mn && mx && mn !== mx) s.options.push({ owner, txt: `${A(c, "name")}: ${mn} to ${mx}` });
      }
      optwalk(c, owner);
    }
  })(e, null);
  // equipement par defaut chiffre, par modele
  s.equip = [];
  function defaultLoadout(modelNode) {
    const items = [];
    (function lw(node) {
      for (const c of node.children || []) {
        if (c.tag === "selectionEntry" && A(c, "type") === "model") continue; // pas de modeles imbriques
        if (c.tag === "selectionEntryGroup") {
          const entries = (c.children.find(x => x.tag === "selectionEntries") || { children: [] }).children.filter(x => x.tag === "selectionEntry");
          if (entries.length && entries.some(isWeapon)) {
            const def = entries.find(x => A(x, "id") === A(c, "defaultSelectionEntryId")) || entries[0];
            let gmin = 1;
            for (const k of c.children) if (k.tag === "constraints")
              for (const kk of k.children) if (A(kk, "type") === "min" && A(kk, "scope") === "parent") gmin = parseInt(A(kk, "value"));
            if (gmin >= 1) items.push(`${gmin} ${dec(A(def, "name"))}`);
            continue;
          }
        }
        if (c.tag === "selectionEntry" && isWeapon(c)) {
          let mn = null;
          for (const k of c.children) if (k.tag === "constraints")
            for (const kk of k.children) if (A(kk, "type") === "min" && A(kk, "scope") === "parent") mn = parseInt(A(kk, "value"));
          if (mn >= 1) items.push(`${mn} ${dec(A(c, "name"))}`);
          continue;
        }
        lw(c);
      }
    })(modelNode);
    return items;
  }
  if (A(e, "type") === "model") {
    const it = defaultLoadout(e);
    if (it.length) s.equip.push({ owner: null, items: it });
  } else {
    xml.walk(e, m => {
      if (m.tag === "selectionEntry" && A(m, "type") === "model") {
        const it = defaultLoadout(m);
        if (it.length) s.equip.push({ owner: dec(A(m, "name")), items: it });
      }
    });
  }
  sheets.push(s);
}
// tri : personnages/epiques d'abord ? garder l'ordre TOC approx : par categorie Character/Epic puis autres
// ordre : Epic Hero, Characters, Battleline, Infantry, Mounted, Vehicle (+Monster/Fortification), Aircraft
const order = n =>
  n.kws.includes("Epic Hero") ? 0 :
  n.kws.includes("Character") ? 1 :
  n.kws.includes("Battleline") ? 2 :
  n.kws.includes("Aircraft") ? 6 :
  n.kws.includes("Infantry") ? 3 :
  n.kws.includes("Mounted") ? 4 : 5;
sheets.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));

// ---------- rendu ----------
const statHdr = ["M", "T", "SV", "W", "LD", "OC"];
function statBoxes(st) {
  return `<div class="statline"><div class="statname">${esc(st.name)}</div>` +
    st.v.map((v, i) => `<div class="statbox"><div class="stath">${statHdr[i]}</div><div class="statv">${esc(v)}</div></div>`).join("") + `</div>`;
}
function weaponTable(list, ranged) {
  if (!list.length) return "";
  const cols = ranged ? ["RANGE", "A", "BS", "S", "AP", "D"] : ["RANGE", "A", "WS", "S", "AP", "D"];
  let h = `<table class="wt"><thead><tr><th class="wname">${ranged ? "&#9678; RANGED WEAPONS" : "&#9876; MELEE WEAPONS"}</th>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
  for (const w of list) {
    const kw = w.v[6] && w.v[6] !== "-" ? `<div class="wkw">[${esc(w.v[6]).toUpperCase()}]</div>` : "";
    h += `<tr><td class="wname">${esc(w.name)}${kw}</td>` + w.v.slice(0, 6).map(v => `<td>${esc(v)}</td>`).join("") + `</tr>`;
  }
  return h + "</tbody></table>";
}
function sheetHtml(s) {
  const inv = s.inv ? `<div class="shield">INSV<b>${esc(s.inv)}</b></div>` : "";
  const fnp = s.fnp ? `<div class="shield fnpb">FNP<b>${esc(s.fnp)}</b></div>` : "";
  const equipHtml = s.equip.length ? `<div class="eqh">DEFAULT WARGEAR</div><ul>` +
    s.equip.map(q => `<li>${q.owner ? "<b>Every " + esc(q.owner) + "</b>: " : ""}${esc(q.items.join(" ; "))}</li>`).join("") + `</ul>` : "";
  const comp = (s.comp.length || s.equip.length) ? `<div class="box"><div class="boxh">UNIT COMPOSITION</div><ul>` + s.comp.map(c => `<li>${c.mn == null ? "up to " + c.mx : c.mn === c.mx ? c.mn : c.mn + "-" + c.mx} ${esc(c.name)}</li>`).join("") + `</ul>${equipHtml}</div>` : "";
  const opts = s.options.length ? `<div class="box"><div class="boxh">&#9881; WARGEAR OPTIONS</div><ul class="pad" style="margin-left:16px">` + s.options.map(o => `<li>${o.owner ? "<b>" + esc(o.owner) + "</b> &mdash; " : ""}${o.txt.replace(/\*(?=[ /<]|$)/g, ' <span class="epts">default</span>')}</li>`).join("") + `</ul></div>` : "";
  return `<section class="sheet">
  <header class="shead"><div class="sname">${esc(s.name).toUpperCase()}</div><div class="pts">${esc(s.pts)} pts</div></header>
  <div class="statrow">${s.stats.map(statBoxes).join("")}${inv}${fnp}</div>
  <div class="cols">
    <div class="colL">${weaponTable(s.ranged, true)}${weaponTable(s.melee, false)}${opts}</div>
    <div class="colR">
      <div class="box"><div class="boxh">CORE ABILITIES</div><div class="pad">${esc(s.core.join(", ") || "-")}</div>
      <div class="boxh">ARMY RULES</div><div class="pad">${esc(s.army.join(", ") || "-")}</div></div>
      ${s.abilities.map(a => `<div class="abil"><b>${esc(a.name)} :</b> ${md(a.text)}</div>`).join("")}
      ${s.transport ? `<div class="box"><div class="boxh">TRANSPORT</div><div class="pad">${md(s.transport)}</div></div>` : ""}
      ${comp}
    </div>
  </div>
  <footer class="kwbar"><span>KEYWORDS: <b>${esc(s.kws.join(" ; ").toUpperCase())}</b></span><span class="fac">FACTION KEYWORDS: <b>ORKS</b></span></footer>
</section>`;
}
function detHtml(d) {
  const enh = enhByDet.get(d.id) || [];
  const ups = upgrades.filter(u => u.det === d.name);
  return `<section class="det">
  <header class="dhead"><div class="sname">${esc(d.name).toUpperCase()}</div><div class="pts">DP ${esc(d.dp)} &middot; ${esc(d.fd)}</div></header>
  <div class="cols">
    <div class="colL">
      <div class="boxh2">DETACHMENT RULE</div>
      ${d.rules.map(r => `<div class="abil"><b>${esc(r.name)}</b>${md(r.text)}</div>`).join("")}
      <div class="boxh2">ENHANCEMENTS</div>
      ${enh.map(e2 => `<div class="abil"><b>${esc(e2.name)}</b> <span class="epts">${esc(e2.pts)} pts</span>${md(e2.text)}</div>`).join("") || '<div class="abil">-</div>'}
      ${ups.map(u => `<div class="abil"><b>${esc(u.name)}</b> <span class="uptag">UPGRADE</span> <span class="epts">${esc(u.pts)} pts</span>${md(u.text)}</div>`).join("")}
    </div>
    <div class="colR">
      <div class="boxh2">STRATAGEMS</div>
      ${d.strats.map(st => {
        const cp = (st.name.match(/\(Stratagem, ([^)]+)\)/) || [])[1] || "";
        const nm = st.name.replace(/\s*\(Stratagem[^)]*\)/, "");
        const body = st.text.replace(/^.*STRATAGEM[^\n]*\n+/, "");
        return `<div class="strat"><div class="strath"><span>${esc(nm).toUpperCase()}</span><span class="cp">${esc(cp)}</span></div><div class="stratb">${md(body)}</div></div>`;
      }).join("") || '<div class="abil">No stratagems (confirmed).</div>'}
    </div>
  </div>
</section>`;
}

const css = `
@page { size: A4; margin: 9mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 8.2pt; color: #1a1a1a; background: #fff; }
.kw { font-variant: small-caps; font-weight: 700; letter-spacing: .02em; }
p { margin: 2px 0; } ul { margin: 2px 0 2px 14px; } li { margin: 1px 0; }
.cover { page-break-after: always; height: 265mm; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(160deg,#1c2413,#2d3a1f 55%,#141a0d); color: #e8e0c8; text-align: center; border: 4px solid #6b7a3f; }
.cover h1 { font-size: 44pt; letter-spacing: .08em; } .cover h2 { font-size: 16pt; margin-top: 8mm; color: #b8c47e; }
.cover .sub { margin-top: 14mm; font-size: 9pt; color: #9aa76b; }
h2.secttl { page-break-before: always; background: #2d3a1f; color: #fff; padding: 6px 10px; font-size: 15pt; letter-spacing: .06em; margin-bottom: 4mm; border-left: 6px solid #b03a2e; }
.rule { margin-bottom: 4mm; border: 1px solid #b9b18f; background: #f5f1e3; page-break-inside: avoid; }
.rule .rh { background: #3a4a24; color: #fff; padding: 3px 8px; font-weight: 700; font-size: 9.5pt; }
.rule .rb { padding: 4px 8px; }
.sheet, .det { page-break-before: always; }
.shead, .dhead { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg,#2d3a1f,#4a5c2e); color: #fff; padding: 5px 10px; border-bottom: 3px solid #b03a2e; }
.sname { font-size: 15pt; font-weight: 800; letter-spacing: .05em; }
.pts { background: #b03a2e; color: #fff; font-weight: 800; padding: 3px 8px; border-radius: 3px; font-size: 9.5pt; white-space: nowrap; }
.statrow { display: flex; flex-wrap: wrap; gap: 6mm; background: #222a17; padding: 4px 10px 6px; align-items: flex-end; }
.statline { display: flex; gap: 4px; align-items: flex-end; }
.statname { color: #d8d2b8; font-size: 7.5pt; font-weight: 700; width: 22mm; align-self: center; }
.statbox { text-align: center; }
.stath { color: #b8c47e; font-size: 6.5pt; font-weight: 700; }
.statv { background: #f5f1e3; border: 1.5px solid #888; width: 9.5mm; padding: 2px 0; font-weight: 800; font-size: 10pt; border-radius: 2px; }
.shield { background: #b03a2e; color: #fff; font-size: 6.5pt; font-weight: 700; padding: 3px 6px; border-radius: 0 0 6px 6px; text-align: center; }
.shield b { display: block; font-size: 10pt; } .fnpb { background: #6b7a3f; }
.cols { display: flex; gap: 4mm; margin-top: 3mm; }
.colL { flex: 1.25; } .colR { flex: 1; }
table.wt { width: 100%; border-collapse: collapse; margin-bottom: 3mm; font-size: 7.8pt; }
.wt thead th { background: #3a4a24; color: #fff; padding: 2px 4px; font-size: 7.5pt; text-align: center; }
.wt th.wname { text-align: left; }
.wt td { border-bottom: 1px solid #c9c2a3; padding: 2px 4px; text-align: center; background: #f5f1e3; }
.wt td.wname { text-align: left; font-weight: 700; }
.wkw { font-weight: 400; font-size: 6.8pt; color: #5a4a1a; }
.box { border: 1px solid #b9b18f; margin-bottom: 2.5mm; background: #f5f1e3; }
.boxh { background: #3a4a24; color: #fff; padding: 2px 6px; font-weight: 700; font-size: 8pt; }
.pad { padding: 3px 6px; }
.abil { background: #f5f1e3; border: 1px solid #b9b18f; border-left: 3px solid #6b7a3f; padding: 3px 6px; margin-bottom: 2mm; page-break-inside: avoid; }
.kwbar { display: flex; justify-content: space-between; background: #222a17; color: #d8d2b8; padding: 4px 8px; margin-top: 3mm; font-size: 7pt; }
.kwbar .fac { color: #b8c47e; }
.boxh2 { background: #2d3a1f; color: #fff; padding: 3px 8px; font-weight: 800; font-size: 9.5pt; margin: 0 0 2mm; border-left: 4px solid #b03a2e; }
.eqh { background: #6b7a3f; color: #fff; padding: 1px 6px; font-weight: 700; font-size: 7pt; }
.strat { border: 1px solid #8a8264; margin-bottom: 2.5mm; page-break-inside: avoid; background: #f5f1e3; }
.strath { display: flex; justify-content: space-between; background: #5a2320; color: #fff; padding: 3px 8px; font-weight: 800; font-size: 8.5pt; }
.cp { background: #fff; color: #5a2320; padding: 0 6px; border-radius: 2px; }
.stratb { padding: 3px 8px; }
.epts { background: #6b7a3f; color: #fff; padding: 0 5px; border-radius: 2px; font-size: 7pt; font-weight: 700; }
.uptag { background: #8a6d1a; color: #fff; padding: 0 5px; border-radius: 2px; font-size: 6.5pt; font-weight: 800; }
.toc td { padding: 1px 8px; border-bottom: 1px dotted #999; }
`;

let html = `<!doctype html><html><head><meta charset="utf-8"><title>Codex: Orks (11th Edition)</title><style>${css}</style></head><body>`;
html += `<div class="cover"><h1>CODEX&nbsp;: ORKS</h1><h2>Warhammer 40,000 &mdash; 11th Edition</h2>
<div class="sub">Army rules &middot; ${dets.length} detachments &middot; ${sheets.length} datasheets<br>
Generated from Orks.cat (branch feat/codex-ork-v11) &mdash; provisional points (previous MFM / deduced), pending the 11th Edition MFM</div></div>`;

// regles d'armee
html += `<h2 class="secttl" style="page-break-before:auto">ARMY RULES &amp; SHARED RULES</h2>`;
for (const r of armyRules) html += `<div class="rule"><div class="rh">${esc(r.name)}${r.universal ? ' <span class="epts">R&Egrave;GLE UNIVERSELLE (introduite par ce codex)</span>' : ""}</div><div class="rb">${md(r.text)}</div></div>`;

// detachements
html += `<h2 class="secttl">DETACHMENTS</h2><table class="toc">` +
  dets.map(d => `<tr><td><b>${esc(d.name)}</b></td><td>DP ${esc(d.dp)}</td><td>${esc(d.fd)}</td><td>${d.strats.length} stratagems</td></tr>`).join("") + `</table>`;
for (const d of dets) html += detHtml(d);

// datasheets
html += `<h2 class="secttl">DATASHEETS</h2><table class="toc">` +
  sheets.map(s => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.pts)} pts</td><td>${esc(s.kws.slice(0, 4).join(", "))}</td></tr>`).join("") + `</table>`;
for (const s of sheets) html += sheetHtml(s);

html += `</body></html>`;
fs.writeFileSync(OUT, html);
console.log("HTML:", OUT, Math.round(html.length / 1024) + "ko", "| dets:", dets.length, "| sheets:", sheets.length, "| rules:", armyRules.length);
