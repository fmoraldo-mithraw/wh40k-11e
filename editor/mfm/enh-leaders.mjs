// Octrois de LEADER par amélioration (MFM) → données.
//
// Le MFM imprime, sous certaines améliorations, une ligne « LEADER: UNIT A,
// UNIT B » (FR : « MENEUR : … ») : l'amélioration permet à son porteur de mener
// ces unités (ex. Kaptin's Hat → Flash Gitz). mfm_parser.py la range dans le
// champ `leader` de l'amélioration. Ce script la matérialise en base, avec le
// MÊME idiome que les fiches de chefs : un groupe déclaratif
//
//   <selectionEntryGroup name="Can Lead (MFM)" hidden="true">   ← SUR l'amélioration
//     <constraint max=0 scope=parent/>                          (jamais sélectionnable)
//     <entryLink hidden="true" targetId="<datasheet menée>"/>…
//
// posé comme enfant de la selectionEntry de l'amélioration. L'appli l'ajoute
// aux cibles du porteur tant que l'amélioration est prise
// (editor/LEADER_LINKS_APP_PROMPT.md, § « accordé par une amélioration »).
//
// Résolution des noms : les matrices de build-map (map/<slug>.json) —
// `enhancements["DÉTACHEMENT / Nom"]` → id de l'amélioration, `matched[NOM]` →
// datasheets (clôture d'import résolue). Idempotent : n'ajoute que les liens
// manquants ; les liens en trop sont SIGNALÉS, jamais supprimés.
//
// usage : node editor/mfm/enh-leaders.mjs <dir-json-mfm> [--apply]
//   ex.   node editor/mfm/enh-leaders.mjs editor/mfm/dump/en            (dry-run)
//         node editor/mfm/enh-leaders.mjs editor/mfm/dump/en --apply
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const MAP_DIR = path.join(HERE, "map");
const { Catalog } = require(path.join(REPO, "editor/lib/catalog"));
const xml = require(path.join(REPO, "editor/lib/xml"));

const mfmDir = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!mfmDir || !fs.existsSync(mfmDir)) {
  console.error("usage: node editor/mfm/enh-leaders.mjs <dir-json-mfm> [--apply]");
  process.exit(1);
}

const GROUP = "Can Lead (MFM)";
const c = new Catalog(REPO).load();

const todo = [];      // { enhId, enhName, targets:[bsId], file }
const residue = [];   // à renvoyer : non résolu
for (const f of fs.readdirSync(mfmDir).filter((x) => x.endsWith(".json") && !x.startsWith("_"))) {
  const slug = f.replace(/\.json$/, "");
  const mapPath = path.join(MAP_DIR, slug + ".json");
  if (!fs.existsSync(mapPath)) continue;
  const mfm = JSON.parse(fs.readFileSync(path.join(mfmDir, f), "utf8"));
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const det of mfm.detachments || []) {
    for (const me of det.enhancements || []) {
      if (!Array.isArray(me.leader) || !me.leader.length) continue;
      const key = `${det.name} / ${me.name}`;
      const hit = map.enhancements && map.enhancements[key];
      if (!hit || !hit.bsId || !c.byId.get(hit.bsId)) { residue.push(`${slug} :: ${key} — amélioration introuvable en base`); continue; }
      const enhFile = c.byId.get(hit.bsId).file;
      const targets = [];
      for (const nm of me.leader) {
        const m = map.matched && map.matched[nm];
        const ids = m ? (m.targets || []).map((t) => t.bsId).filter((id) => c.byId.get(id)) : [];
        if (!ids.length) { residue.push(`${slug} :: ${key} → ${nm} — datasheet introuvable`); continue; }
        // Une cible par fichier possible : garder celles du fichier de
        // l'amélioration quand il y en a, sinon toutes (clôture d'import).
        const local = ids.filter((id) => c.byId.get(id).file === enhFile);
        targets.push(...(local.length ? local : ids));
      }
      if (targets.length) todo.push({ enhId: hit.bsId, enhName: key, slug, targets: [...new Set(targets)] });
    }
  }
}

// Une même amélioration peut apparaître dans plusieurs factions (bibliothèque
// partagée) : union des cibles.
const byEnh = new Map();
for (const t of todo) {
  const cur = byEnh.get(t.enhId) || { ...t, targets: [] };
  cur.targets = [...new Set([...cur.targets, ...t.targets])];
  byEnh.set(t.enhId, cur);
}

let added = 0, touched = 0;
for (const t of byEnh.values()) {
  const { node, file } = c.byId.get(t.enhId);
  const segs = xml.child(node, "selectionEntryGroups");
  let grp = segs && (segs.children || []).find((ch) => ch.tag === "selectionEntryGroup" && xml.getAttrDecoded(ch, "name") === GROUP);
  const have = new Set();
  if (grp) xml.walk(grp, (n) => { if (n.tag === "entryLink") have.add(xml.getAttrDecoded(n, "targetId")); });
  const missing = t.targets.filter((id) => !have.has(id));
  const extra = [...have].filter((id) => !t.targets.includes(id));
  const nm = (id) => xml.getAttrDecoded(c.byId.get(id).node, "name");
  console.log(`${missing.length ? "+" : "="} ${t.slug} :: ${t.enhName} → ${t.targets.map(nm).join(", ")}${missing.length ? `  (ajout : ${missing.map(nm).join(", ")})` : ""}`);
  if (extra.length) console.log(`  ⚑ liens en base absents du MFM (conservés) : ${extra.map((id) => (c.byId.get(id) ? nm(id) : id)).join(", ")}`);
  if (!missing.length || !APPLY) { added += missing.length; continue; }
  if (!grp) {
    grp = xml.elem("selectionEntryGroup", { name: GROUP, hidden: "true", id: c.newId() });
    grp.selfClose = false; // créé vide par elem() : il va recevoir des enfants
    const cons = xml.ensureChild(grp, "constraints");
    cons.children.push(xml.elem("constraint", { type: "max", value: "0", field: "selections", scope: "parent", shared: "true", id: c.newId() }));
    xml.ensureChild(grp, "entryLinks");
    xml.ensureChild(node, "selectionEntryGroups").children.push(grp);
  }
  const links = xml.ensureChild(grp, "entryLinks");
  for (const id of missing) links.children.push(xml.elem("entryLink", { import: "true", name: "", hidden: "true", id: c.newId(), type: "selectionEntry", targetId: id }));
  added += missing.length; touched++;
  c.markDirty(file);
}

console.log(`\n${byEnh.size} amélioration(s) avec octroi LEADER, ${added} lien(s) ${APPLY ? "ajouté(s)" : "à ajouter"}.`);
if (residue.length) { console.log("\n⚑ À ME RENVOYER :"); for (const r of residue) console.log("  " + r); }
if (!APPLY) { console.log("\n(dry-run — relancer avec --apply pour écrire)"); process.exit(0); }
if (!touched) process.exit(0);
c.buildIndex();
const v = c.validate({ dirtyOnly: false });
let nbErr = 0;
for (const r of v.results || []) { nbErr += r.errors.length; for (const e of r.errors.slice(0, 5)) console.error("  ✗", r.file, e); }
console.log("validate ok:", v.ok, "erreurs:", nbErr);
if (!v.ok) process.exit(1);
c.save();
