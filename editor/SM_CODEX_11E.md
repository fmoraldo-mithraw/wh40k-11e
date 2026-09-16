# Codex Space Marines 11e — état d'intégration (2026-09-16)

> Journal de ce qui est **sourcé** (pages du codex), **déduit** (extrapolé)
> et **encore manquant**. À mettre à jour à chaque nouveau lot de pages,
> puis à supprimer quand tout est sourcé (points MFM compris).

## Source

Codex Space Marines 11e, photos des pages 156-229 (fichier
`Space Marine Codex - 11th Edition.pdf`, uploads découpés par 5 pages).
Toutes les pages de fiches sont reçues (208-212 arrivées en dernier). Aucune
page de points : le MFM reste à intégrer.

## Sourcé et intégré

- **Règles d'armée** : Combat Doctrines (texte complet, id partagé
  `3b76-4053-ece9-6e7d`), Transhuman Strategist, Librarius, Space Marine
  Chapters (règle partagée, non liée).
- **Les 15 détachements sont complets** (règle, améliorations, stratagems) :
  Gladius Task Force, Assault/Tactical/Devastator Brethren, Tacticus Attack
  Force, Tacticus Firestorm Force, Phobos Shadow/Shock Force, Terminator
  Storm Force, Stormlance Task Force, Ironclad Champions, Gauntlet Task
  Force, Ironstorm Spearhead, Gravis Linebreaker/Siege Force. Améliorations « Upgrade »
  (règle maison n°1) liées aux unités par mots-clefs, Epic Heroes exclus :
  Furious Assault (INFANTRY), Supercharged Engines (MOUNTED), Auspex
  Triangulation Shrines (SPEEDER — nouvelle catégorie), Artificer Sarcophagus
  et Venerable Champion (DREADNOUGHT), Redoubtable Machine Spirit et Gunnery
  Honours (VEHICLE hors DEDICATED TRANSPORT/FLY/WALKER), Immovable
  Conquerors (GRAVIS). Portes des améliorations de personnage = clause de
  prose (Ancient, Captain, Phobos, Infantry, Terminator, Tacticus,
  Infantry/Mounted en alternative).
- **Fiches** : 82 fiches transcrites (`scratchpad/codex/units.jsonl`) et
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
- **Pages 208-212** (dernier lot) : Vanguard Veteran Squad with Jump Packs
  (T5, Relic Blade/Power Fist/Thunder Hammer au sergent, Master-crafted Power
  Weapon fixe, Combat Shield en entrée partagée à capacité « 5+ InSv »),
  Incursor Squad (Divinator-class Auspexes, Haywire Mine devenue capacité de
  fiche), Reiver Squad (armement fixe Bolt Carbine + Monomolecular Combat
  Knife + Special-issue Bolt Pistol, Grav-chutes/Grapnel Launchers), Scout
  Squad (Combat Knife fixe, Shotgun/Sniper Rifle/Chainsword, Flexible Asset),
  Eliminator Squad (Chameleoline Cloaks, Special-issue Optics and Ammunition,
  Instigator à Lethal Hits non-M/V), Outrider Squad (Full-throttle Assault,
  Power Weapon/Thunder Hammer au sergent, Plasma Pistol, Invader ATV attaché
  retiré), Eradicator Squad (= « with Melta Rifles » : Melta Rifle et
  Multi-melta à profil **Hunter**, Total Obliteration = relance des dégâts),
  Eradicator Squad with Heavy Bolters (Overlapping Destruction).
- Héros de chapitre du codex mis à jour dans leurs fichiers (Ultramarines,
  Imperial Fists, Raven Guard, Salamanders, Iron Hands, White Scars).

## Provisoire / déduit

| Objet | État |
|---|---|
| DP et Force Disposition (15 détachements) | provisoires, MFM à intégrer |
| Points des unités, des améliorations, du 2e Invader ATV, des 2 nouvelles fiches | non publiés (améliorations et nouvelles fiches à 0) |
| Options « pour 5 (ou 3) figurines » (Scout lourds/snipers, Eradicator multi-melta, Outrider/Vanguard plasma) | plafond simple (max 2, ou max 4) sans modificateur par tranche |
| Composition Terminator Assault Squad (variantes TH/SS), Heavy Intercessor (modèle heavy bolter), Wardens (profil fusionné Gadriel/Metaurus OC) | simplifications du dépôt conservées |
| Mots-clefs par figurine (Company Heroes : Ancient/Champion ; Victrix : Chapter Ancient/Champion Epic Hero) | à poser à la main |
| Copies locales Black Templars (Impulsor, Repulsor, Gladiators, LR Crusader, Sternguard, Terminators) | non touchées (supplément BT) |
| Listes *Leader* (prose + `Can Lead`) | inchangées : le codex ne les imprime pas sur les cartes |

Plus aucune fiche déduite : toutes les statlines et armes du tronc commun
sont sourcées sur les cartes (Tacticus T5, Phobos T4, Gravis T6, Scouts T4
4+, Outriders T6 W4).

## À faire

1. MFM : points, DP, Force Disposition.
2. Vérifier les options d'équipement fiche par fiche (rapport
   `scratchpad/codex/apply_report.txt`, lignes `OPTIONS codex`).
