# Codex Space Marines 11e — état d'intégration (2026-09-16)

> Journal de ce qui est **sourcé** (pages du codex), **déduit** (extrapolé)
> et **encore manquant**. À mettre à jour à chaque nouveau lot de pages,
> puis à supprimer quand tout est sourcé (points MFM compris).

## Source

Codex Space Marines 11e, photos des pages 156-229 (fichier
`Space Marine Codex - 11th Edition.pdf`, uploads découpés par 5 pages).
**Pages non reçues** : 161-165 (Tactical Brethren, Devastator Brethren,
Tacticus Attack Force, Tacticus Firestorm Force, Terminator Storm Force) et
208-212 (Incursor, Reiver, Eliminator, Scout, Vanguard Veteran, Eradicator,
Outrider… — à confirmer). Aucune page de points : le MFM reste à intégrer.

## Sourcé et intégré

- **Règles d'armée** : Combat Doctrines (texte complet, id partagé
  `3b76-4053-ece9-6e7d`), Transhuman Strategist, Librarius, Space Marine
  Chapters (règle partagée, non liée).
- **Détachements complets** (règle, améliorations, stratagems) : Gladius Task
  Force, Assault Brethren, Phobos Shadow Force, Phobos Shock Force, Stormlance
  Task Force, Ironclad Champions, Gauntlet Task Force, Ironstorm Spearhead,
  Gravis Linebreaker Force, Gravis Siege Force. Améliorations « Upgrade »
  (règle maison n°1) liées aux unités par mots-clefs, Epic Heroes exclus :
  Furious Assault (INFANTRY), Supercharged Engines (MOUNTED), Auspex
  Triangulation Shrines (SPEEDER — nouvelle catégorie), Artificer Sarcophagus
  et Venerable Champion (DREADNOUGHT), Redoubtable Machine Spirit et Gunnery
  Honours (VEHICLE hors DEDICATED TRANSPORT/FLY/WALKER), Immovable
  Conquerors (GRAVIS). Portes des améliorations de personnage = clause de
  prose (Ancient, Captain, Phobos, Infantry).
- **Fiches** : 74 fiches transcrites (`scratchpad/codex/units.jsonl`) et
  appliquées : stats, armes (profils, mots-clefs, infoLinks), capacités,
  règles de base, règles d'armée, mots-clefs, transport. Renommages d'armes
  du codex (Close combat weapon → Ceramite Fists / Armoured Impact / Hovering
  Bulk, Astartes Chainsword → Chainsword, Twin … → … pluriel, Defensive
  Array…) en entrées partagées canoniques par (nom, profil). Options
  disparues retirées (Gladiators : Icarus/Ironhail/sponsons ; Repulsor
  Executioner : Icarus/Ironhail). Nouvelles fiches : **Kaius Konorius**
  (Ultramarines), **Captain on Bike**. Calgar sans garde du corps, Invader
  ATV 1-2, Intercessor Squad restaurée (Bolt Pistol, Grenade Launcher à deux
  profils, options du sergent).
- Héros de chapitre du codex mis à jour dans leurs fichiers (Ultramarines,
  Imperial Fists, Raven Guard, Salamanders, Iron Hands, White Scars).

## Provisoire / déduit

| Objet | État |
|---|---|
| 5 détachements des pages manquantes | squelette « preview » (annonce), commentaire `codex-11e: contenu non publie…` |
| DP et Force Disposition (15 détachements) | provisoires, MFM à intégrer |
| Points des unités, des améliorations, du 2e Invader ATV, des 2 nouvelles fiches | non publiés (améliorations et nouvelles fiches à 0) |
| Fiches des pages 208-212 | valeurs **déduites** (voir table ci-dessous) — à écraser |
| Composition Terminator Assault Squad (variantes TH/SS), Heavy Intercessor (modèle heavy bolter), Wardens (profil fusionné Gadriel/Metaurus OC) | simplifications du dépôt conservées |
| Mots-clefs par figurine (Company Heroes : Ancient/Champion ; Victrix : Chapter Ancient/Champion Epic Hero) | à poser à la main |
| Copies locales Black Templars (Impulsor, Repulsor, Gladiators, LR Crusader, Sternguard, Terminators) | non touchées (supplément BT) |
| Listes *Leader* (prose + `Can Lead`) | inchangées : le codex ne les imprime pas sur les cartes |

### Règles de déduction encore actives sur les fiches non sourcées

Calibrées sur les cartes sourcées : infanterie Tacticus **T5**, Phobos **T4**
(confirmé : Incursor/Reiver/Eliminator restent probablement T4), Gravis
**T6**, Terminator **T6**, montés **T6** ; pistolets → Close-Quarters ; bolts
S5 AP-1 ; Torrent à attaques fixes + Blast ; missiles frag/krak ; mêlée S4 → S5.
La déduction Gravis T7 de la passe précédente a été **annulée** par les
cartes (T6).

## À faire

1. Recevoir les pages 161-165 et 208-212 ; intégrer les 5 détachements et
   les fiches restantes (même pipeline : `units.jsonl` → `s7`/`s8`).
2. MFM : points, DP, Force Disposition.
3. Vérifier les options d'équipement fiche par fiche (rapport
   `scratchpad/codex/apply_report.txt`, lignes `OPTIONS codex`).
