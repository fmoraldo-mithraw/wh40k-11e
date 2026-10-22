// extrait.mjs — capacités d'un .cat à résumer (celles sans résumé à jour).
// Usage : node editor/briefs/extrait.mjs "<fichier.cat>" [--tout] [--out f.json]
//   sortie JSON : [{ key, name, src, text }] ; --tout inclut celles déjà résumées.
//   `key` est la clef à reprendre telle quelle dans le lot du rédacteur.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, LANGS, abilitiesOf, loadBriefs, homonymsOf, keyOf } from "./lib.mjs";
const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: extrait.mjs <fichier.cat> [--tout] [--out f.json]"); process.exit(2); }
const tout = argv.includes("--tout");
const outIx = argv.indexOf("--out");
const packs = Object.fromEntries(LANGS.map((l) => [l, loadBriefs(l).strings]));
const H = homonymsOf();
const upToDate = (a) => LANGS.every((l) => { const e = packs[l][keyOf(a, H)]; return e && e.src === a.src && e.brief; });
const list = abilitiesOf(path.isAbsolute(file) ? file : path.join(ROOT, file)).filter((a) => tout || !upToDate(a)).map((a) => ({ key: keyOf(a, H), ...a }));
const json = JSON.stringify(list, null, 1);
if (outIx >= 0) { writeFileSync(argv[outIx + 1], json); console.log(`${list.length} capacité(s) → ${argv[outIx + 1]}`); }
else console.log(json);
