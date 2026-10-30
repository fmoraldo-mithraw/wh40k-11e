#!/usr/bin/env node
// valider.mjs — la validation « règle maison » en une commande, pour la CI et
// pour l'humain pressé. Enchaîne :
//   1. bonne formation XML + validation complète de la lib (round-trip,
//      références pendantes, ids dupliqués NOUVEAUX par rapport à la baseline
//      interne de la lib) — catalog.validate() est désormais COMPLET par
//      défaut : l'ancien défaut dirtyOnly:true rendait {ok, checked:0} hors
//      session d'édition, un feu vert sur zéro fichier ;
//   2. le cliquet des ids dupliqués (dup-ids.mjs), qui borne le stock hérité ;
//   3. les defaultSelectionEntryId cassés (defauts-groupes.mjs) — un groupe
//      dont le défaut ne vise plus aucun enfant ne présélectionne rien (77
//      cas corrigés en série le 2026-09-03, plus aucun toléré) ;
//   4. les rattachements Leader/Support (rattachements.mjs) — toute fiche
//      Leader/Support a sa liste (groupe Can Lead/Support, lien inverse Led
//      By/Supported By, ou prose par mot-clef) ; né de Kaius Konorius (2026-10-08).
//   5. les éléments mal rangés (conteneurs.mjs) — un selectionEntry dans
//      <entryLinks> (ou tout enfant hors du type de son conteneur) est du XML
//      valide mais ignoré par BattleScribe et l'appli ; né des 43 armes perdues
//      du 2026-10-15 (storm bolter du Brotherhood Librarian) ;
//   5b. le contexte des invulnérables de fiche (invu-contexte.mjs) — une
//      invu conditionnelle doit dire vs=ranged|melee, lost=wound ou option= ;
//   5c. rien de Legends dans la base (legends.mjs, décision du 2026-10-29) :
//      noms « [Legends] », fiches Legends exposées, leader-kw / prose, renvois
//      « (see Legends: …) », catégories mortes au nom d'une fiche Legends, clés
//      FR mortes qui en nomment une (editor/mfm/legends.json + dump) ;
//   6. les résumés « initiation » (briefs.mjs) — un résumé PÉRIMÉ (la prose a
//      changé depuis sa rédaction) ou orphelin est une erreur ; un résumé
//      manquant n'est qu'un rapport de couverture (editor/BRIEFS_PROMPT.md).
// Code de sortie ≠ 0 au premier échec — c'est le contrat de la CI.

import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const require = createRequire(import.meta.url);

console.log("── validation de la lib (tous les .cat/.gst, round-trip + références) ──");
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js"));
const cat = new Catalog(ROOT);
cat.load();
const v = cat.validate();
const errs = v.results.filter((r) => r.errors.length);
for (const r of errs) console.error(`  ✗ ${r.file} : ${r.errors.join(" / ")}`);
console.log(`  ${v.results.length} fichiers, ${errs.length} en erreur`);
// Plancher dur : le dépôt a 45 .cat/.gst (2026-10-30). catalog.validate() rend
// { ok: results.every(...) }, et `every` sur un tableau VIDE vaut true → un
// checkout partiel (LFS, sparse, clone raté) validait « 0 fichiers, 0 erreur »
// au vert. On exige un nombre plausible de fichiers validés.
if (v.results.length < 45) { console.error(`  ✗ seulement ${v.results.length} fichiers validés (attendu ≥45) — checkout tronqué ?`); process.exit(1); }
if (!v.ok || errs.length) process.exit(1);

console.log("\n── cliquet des ids dupliqués ──");
const r = spawnSync(process.execPath, [join(HERE, "dup-ids.mjs")], { stdio: "inherit" });
if (r.status) process.exit(r.status);

console.log("\n── defaultSelectionEntryId des groupes ──");
const r3 = spawnSync(process.execPath, [join(HERE, "defauts-groupes.mjs")], { stdio: "inherit" });
if (r3.status) process.exit(r3.status);

console.log("\n── rattachements Leader / Support ──");
const r4 = spawnSync(process.execPath, [join(HERE, "rattachements.mjs")], { stdio: "inherit" });
if (r4.status) process.exit(r4.status);

console.log("\n── éléments mal rangés dans les conteneurs ──");
const r5 = spawnSync(process.execPath, [join(HERE, "conteneurs.mjs")], { stdio: "inherit" });
if (r5.status) process.exit(r5.status);

console.log("\n── contexte des invulnérables de fiche (invuln: vs=/lost=) ──");
const r7 = spawnSync(process.execPath, [join(HERE, "invu-contexte.mjs")], { stdio: "inherit" });
if (r7.status) process.exit(r7.status);

console.log("\n── rien de Legends dans la base (décision du 2026-10-29) ──");
const r8 = spawnSync(process.execPath, [join(HERE, "legends.mjs")], { stdio: "inherit" });
if (r8.status) process.exit(r8.status);

console.log("\n── résumés « initiation » (briefs/<lang>.json) ──");
const r6 = spawnSync(process.execPath, [join(HERE, "briefs.mjs")], { stdio: "inherit" });
process.exit(r6.status || 0);
