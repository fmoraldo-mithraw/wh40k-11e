#!/usr/bin/env node
// valider.mjs — la validation « règle maison » en une commande, pour la CI et
// pour l'humain pressé. Enchaîne :
//   1. bonne formation XML + validation complète de la lib (round-trip,
//      références pendantes, ids dupliqués NOUVEAUX par rapport à la baseline
//      interne de la lib) — catalog.validate() est désormais COMPLET par
//      défaut : l'ancien défaut dirtyOnly:true rendait {ok, checked:0} hors
//      session d'édition, un feu vert sur zéro fichier ;
//   2. le cliquet des ids dupliqués (dup-ids.mjs), qui borne le stock hérité.
// Code de sortie ≠ 0 au premier échec — c'est le contrat de la CI.

import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const require = createRequire(import.meta.url);

console.log("── validation de la lib (47 fichiers, round-trip + références) ──");
const { Catalog } = require(join(ROOT, "editor", "lib", "catalog.js"));
const cat = new Catalog(ROOT);
cat.load();
const v = cat.validate();
const errs = v.results.filter((r) => r.errors.length);
for (const r of errs) console.error(`  ✗ ${r.file} : ${r.errors.join(" / ")}`);
console.log(`  ${v.results.length} fichiers, ${errs.length} en erreur`);
// Plancher dur : le dépôt a ~47 .cat/.gst. catalog.validate() rend
// { ok: results.every(...) }, et `every` sur un tableau VIDE vaut true → un
// checkout partiel (LFS, sparse, clone raté) validait « 0 fichiers, 0 erreur »
// au vert. On exige un nombre plausible de fichiers validés.
if (v.results.length < 45) { console.error(`  ✗ seulement ${v.results.length} fichiers validés (attendu ≥45) — checkout tronqué ?`); process.exit(1); }
if (!v.ok || errs.length) process.exit(1);

console.log("\n── cliquet des ids dupliqués ──");
const r = spawnSync(process.execPath, [join(HERE, "dup-ids.mjs")], { stdio: "inherit" });
process.exit(r.status || 0);
