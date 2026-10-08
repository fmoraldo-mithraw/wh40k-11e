---
name: integration-texte
description: Intégrer dans wh40k-11e un texte fourni par l'utilisateur (captures ou texte collé) — détachement (règle, stratagèmes, améliorations, DP, Force Disposition), fiche d'unité, ou amélioration — en respectant les règles maison. À utiliser quand l'utilisateur envoie des captures de l'appli officielle ou du codex.
---

# Intégration d'un texte fourni (captures / texte collé)

1. **Lire** `editor/FACTION_PACK_PROMPT.md` (sections utiles seulement : `grep -n "^#"` puis Read
   ciblé) et, pour une amélioration, `editor/ENHANCEMENT_BEARERS_PROMPT.md`.
2. **Localiser** la cible et un modèle à cloner : `node editor/bin/trouve.mjs "<nom>"`,
   `node editor/bin/montre.mjs <id> --depth 2` (détachement voisin de la même faction).
3. **Transcrire fidèlement** (aucune invention ; un mot illisible → demander) :
   - détachement : coût DP (`0d99-4ee2-7b3c-1f5a`), profil Force Disposition, règle(s),
     stratagèmes `<rule name="X (Stratagem, NCP)">` + `<comment>strat-timing: …</comment>`,
     groupe d'améliorations (pts `51b2-306e-1021-d207`), portes `primary-catalogue` si nécessaire ;
   - amélioration : règle maison 1 (Upgrade vs personnage non-Epic) et porteurs par
     conjonction de mots-clefs (règle 2) ;
   - mécanismes spéciaux → marqueur du guide correspondant (table de `CLAUDE.md`).
4. **Éditer par script** via `editor/lib/catalog.js` (scratchpad), jamais sed sur un `.cat` ;
   FR officiel dans `translations/fr.json` si fourni.
5. **Vérifier** : `editor/bin/verifie.sh` ; côté appli `scripts/dev/sync-data.sh` puis
   `node scripts/dev/faction.mjs "<Faction>" --det "<nom>"` (dp, fd, stratagèmes, améliorations).
6. Enchaîner sur la skill **livraison**.
