// extrait.mjs — capacités à résumer (celles sans résumé à jour) d'une source :
// un .cat (profils Abilities) ou « faction:<Nom> » (capacités vues par le parseur
// de l'appli : règles d'unité liées par infoLink, sections à choix).
// Usage : node editor/briefs/extrait.mjs "<fichier.cat>|faction:<Nom>" [--tout] [--out f.json]
//   sortie JSON : [{ key, name, src, text }] ; --tout inclut celles déjà résumées.
//   `key` est la clef à reprendre telle quelle dans le lot du rédacteur.
import { writeFileSync } from "node:fs";
import { LANGS, loadBriefs, homonymsOf, keyOf, abilitiesOfSource, entryOf } from "./lib.mjs";
const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: extrait.mjs <fichier.cat> [--tout] [--out f.json]"); process.exit(2); }
const tout = argv.includes("--tout");
const outIx = argv.indexOf("--out");
const packs = Object.fromEntries(LANGS.map((l) => [l, loadBriefs(l).strings]));
const H = await homonymsOf();
const upToDate = (a) => LANGS.every((l) => { const e = entryOf(packs[l], a); return e && e.brief; });
const list = (await abilitiesOfSource(file)).filter((a) => tout || !upToDate(a)).map((a) => ({ key: keyOf(a, H), ...a }));
const json = JSON.stringify(list, null, 1);
if (outIx >= 0) { writeFileSync(argv[outIx + 1], json); console.log(`${list.length} capacité(s) → ${argv[outIx + 1]}`); }
else console.log(json);
