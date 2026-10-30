// pools.mjs — ce que build-map.mjs et dp-audit.mjs partagent :
//   • SLUG_TO_POOL : slug MFM (editor/mfm/dump/<lang>/<slug>.json) → factions de l'appli (noms rendus par
//     parseAllCatalogues) dont les fiches / détachements relèvent de ce barème. Le PREMIER nom est la faction
//     « primaire » de la matrice (map/<slug>.json, champ faction).
//   • resolveParser(tag) : le parser de l'appli (clôture d'import), ou en repli sa copie vendorisée.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");

export const SM_CHAPTERS = ["Space Marines", "Ultramarines", "Imperial Fists", "Iron Hands", "Raven Guard", "Salamanders", "White Scars"];
export const SLUG_TO_POOL = {
  "orks": ["Orks"], "necrons": ["Necrons"], "tyranids": ["Tyranids"],
  "space-marines": SM_CHAPTERS,
  "space-wolves": ["Space Wolves"], "blood-angels": ["Blood Angels"], "dark-angels": ["Dark Angels"],
  "black-templars": ["Black Templars"], "deathwatch": ["Deathwatch"],
  "imperial-knights": ["Imperial Knights"], "chaos-knights": ["Chaos Knights"],
  "adeptus-mechanicus": ["Adeptus Mechanicus"], "adepta-sororitas": ["Adepta Sororitas"],
  "adeptus-custodes": ["Adeptus Custodes"], "astra-militarum": ["Astra Militarum"],
  "grey-knights": ["Grey Knights"], "imperial-agents": ["Agents of the Imperium"],
  "chaos-space-marines": ["Chaos Space Marines"], "death-guard": ["Death Guard"],
  "thousand-sons": ["Thousand Sons"], "world-eaters": ["World Eaters"],
  "chaos-daemons": ["Chaos Daemons"], "emperors-children": ["Emperor's Children"],
  "genestealer-cults": ["Genestealer Cults"], "leagues-of-votann": ["Leagues of Votann"],
  "tau-empire": ["T'au Empire"], "aeldari": ["Craftworlds"], "drukhari": ["Drukhari"],
  // Titans (Library - Titans.cat, fiches partagées par les deux factions) : barème MFM à part depuis la v1.6 ;
  // côté Chaos, les noms MFM portent « CHAOS » (alias dans aliases.json → mêmes fiches, même bsId).
  "titan-legions": ["Adeptus Titanicus"], "chaos-titan-legions": ["Titanicus Traitoris"],
};

// Dépendance UNIQUE et EN LECTURE SEULE hors de ce dépôt : le parser de l'app cogitator-bellicum
// (clôture d'import : quels datasheets / détachements une faction propose réellement). Résolution :
//   BSDATA_PARSER=<chemin .mjs>  ou  COGITATOR_DIR=<repo>  ou le dépôt frère ../cogitator-bellicum
//   (si ses dépendances npm sont installées), et EN REPLI la copie autonome commitée
//   vendor/bsdata-parser.mjs (bundle, aucune dépendance). Resynchroniser : vendor/sync-parser.sh.
export function resolveParser(tag = "mfm") {
  const cands = [
    process.env.BSDATA_PARSER,
    process.env.COGITATOR_DIR && path.join(process.env.COGITATOR_DIR, "scripts", "bsdata-parser.mjs"),
    path.resolve(REPO, "..", "cogitator-bellicum", "scripts", "bsdata-parser.mjs"),
  ].filter(Boolean);
  // Le parser d'une source ne se charge que si ses dépendances npm sont
  // installées (clone nu sans node_modules → import en échec) : sinon repli.
  for (const c of cands) {
    if (!fs.existsSync(c)) continue;
    const appNm = path.resolve(path.dirname(c), "..", "node_modules", "fast-xml-parser");
    if (c === process.env.BSDATA_PARSER || fs.existsSync(appNm)) return c;
    console.error(`[${tag}] ${c} présent mais dépendances non installées — repli sur la copie vendorisée.`);
  }
  const vendored = path.join(HERE, "vendor", "bsdata-parser.mjs");
  if (fs.existsSync(vendored)) {
    const head = fs.readFileSync(vendored, "utf8").slice(0, 600);
    const commit = (head.match(/source-commit: (\S+)/) || [])[1] || "?";
    console.error(`[${tag}] parser de l'app absent — copie vendorisée (commit app ${commit}).`);
    return vendored;
  }
  return null;
}

// parseAllCatalogues(REPO) en silence (le parser bavarde sur stdout) ; null si le parser est introuvable.
export async function parseRepo(tag = "mfm") {
  const p = resolveParser(tag);
  if (!p) return null;
  const { parseAllCatalogues } = await import(p);
  const log = console.log, warn = console.warn; console.log = () => {}; console.warn = () => {};
  try { return await parseAllCatalogues(REPO); } finally { console.log = log; console.warn = warn; }
}
