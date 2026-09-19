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

## Audit de complétude (2026-09-16)

Scripts `scratchpad/audit_units.js` et `audit_dets.js` : comparaison
systématique spec codex ↔ `.cat` (statlines par profil, marqueur invuln,
règles de base/d'armée, mots-clefs, capacités nom+texte, équipements à
capacité, transport, chaque arme profil par profil avec infoLinks de règles,
armes hors codex). Résultat : 82/82 fiches et 15/15 détachements sans écart
(les seuls restes sont les modèles-variantes « w/ X » qui remplacent
légitimement l'arme de base). Corrigés par l'audit : entrées partagées à
mauvaise BS (Plasma Pistol/Storm Bolter 2+ sur des escouades), armes
héritées de la 10e sur Captain/Chaplain JP/Ancient Terminator/Librarian
Terminator, renommages (Ceramite Fists, Servo-armature, Relics of Battle,
Omnissian Power Axe and Servo-arm, Combat Knife/MC Bolt Pistol des Company
Heroes, Raven's Talons, Artificer Grav-gun), Anzuq ajouté à Kor'sarro Khan,
Combi-weapon à deux profils, Lieutenant Phobos (SIBP/MC Bolt Carbine).

## Seconde passe complète (2026-09-17)

Relecture visuelle de **toutes** les pages (158-229) contre les données :
84 fiches (82 du codex + Sternguard Veteran Squad et Terminator Squad, issues
des leaks, désormais transcrites p.207/214) et 15 détachements (règle,
améliorations, stratagèmes, texte par texte). Écarts trouvés et corrigés :
Sternguard Power Weapon A5, Terminator Squad Storm Bolter 3+ et Power Weapon
A5, Victrix Chapter Ancient avec Master-crafted Bolt Carbine et groupe 1-8,
catégories Dx périmées sur des armes sans dé.

**Errata fonctionnels (marqués `errata-11e:` en commentaire de fiche)** : le
codex omet systématiquement le mot-clef de rôle sur la fiche générique
(Captain sans CAPTAIN, Chaplain, Librarian ×3, Lieutenant ×3, Ancient,
Techmarine, Apothecary, Judiciar), Librarian in Terminator Armour sans
CHARACTER, Kayvaan Shrike sans CHARACTER/EPIC HERO, Kaius Konorius sans
IMPERIUM. Ces mots-clefs sont rétablis car les améliorations « X model only »,
Leader et les portes d'unicité en dépendent ; `units.jsonl` porte le champ
`errataKeywords`.

**Fiches du dépôt absentes du codex 11e, supprimées** (avec leurs liens
inter-fichiers et catégories propres) : Captain with Relic Shield, Lieutenant in
Reiver Armour, Astraeus, Thunderhawk Gunship (tronc commun) ; Captain Sicarius,
Lieutenant Titus, Marneus Calgar in Armour of Antilochus (Ultramarines). Le
Thunderhawk des Grey Knights (fiche propre) est conservé.

## Troisième passe (2026-09-17) — structurelle

Audits automatiques rejoués (fiches, détachements, compositions, Dx) + nouveaux
contrôles : marqueurs `sim-mod` dont la source n'existe plus (8 fiches
corrigées : Close-quarters Firestorm, Vivispectral Analysis Targeting,
Targeted Intercession, Deeds of Legend, Aquilon Optics, Reaping Tally,
Priority Target Acquisition ; Silent Fury retiré du Judiciar), atteignabilité
de chaque amélioration de menu (Narthecis Gauntlet inatteignable → mot-clef
BIOLOGIS rétabli sur Apothecary Biologis, errata), menu Warlord/Enhancements
sur chaque personnage non-Epic (Lieutenant with Combi-weapon complété),
prose *Leader* citant des fiches disparues (Relic Terminator Squad, Bike
Squad retirés), catégories orphelines des unités supprimées, fiches cachées
sans lien visible, coûts nuls (Captain on Bike, Kaius Konorius : MFM),
aucune référence pendante sur les 47 fichiers.

## Points PROVISOIRES (2026-09-19) — leak « review Art of War », MFM officiel à venir

Source : table de points diffusée avec la review Art of War du codex (image
fournie par l'utilisateur), appliquée telle quelle aux 84 fiches : coût de
base, palier de taille (« 5/10 »), surcoût par répétition (« 3e unité +N » →
forme native `increment` conditionné `atLeast N` scope roster), surcoûts
d'options (Orbital Comms Array +10, Vengor Launcher +5, Cyclone Missile
Launcher +10, Multi-melta de l'Invader ATV +5, Heavy Laser Destroyer +10,
Macro Plasma Incinerator +10, Banner of Macragge +15, Thunder Hammer + Storm
Shield +5/modèle). Les surcoûts de répétition 10e non repris par la table
(Librarian, Land Raiders, Repulsor, Gladiators, Drop Pod, Redemptor,
Aggressors, Incursors, Infiltrators, Scouts, Vanguard, Assault Intercessors
JP) ont été **retirés**. Correspondances de noms : Titus' Wardens = Wardens
of Ultramar, Kais = Kaius Konorius, « Caven » = Aethon Shaan, Kanokvar =
Caanok Var.

Hypothèses là où la table est muette : Aggressors 6 = 180 et Outriders 6 =
160 (×2), Terminators 10 = 380 (×2), « 3e exemplaire +10 » appliqué aux
trois Storm Speeders (la table ne l'imprime que sous le Thunderstrike),
Blades of Honour du Chapter Champion à 0, surcoûts de chapitre
(`chapter-cost`, Blood Angels) conservés en delta par rapport au nouveau
coût de base. Coût porté par le modèle pour Firestrike Servo-Turrets (80) et
Invader ATV (65) afin d'obtenir 160/130 à deux modèles. **Améliorations :
toujours estimées** (10-25), la table ne les donne pas. Script :
`scratchpad/pts_leak.js`. **À écraser par le MFM officiel.**

## Provisoire / déduit

| Objet | État |
|---|---|
| DP des 15 détachements | **déduits de la règle constatée sur les 348 détachements du MFM v1.4** : 2 améliorations ⇒ 1 DP (98/98), 4 améliorations ⇒ 2 ou 3 DP ; Gladius Task Force 3 (valeur MFM v1.4), les 14 autres 1 |
| Force Disposition (15 détachements) | provisoire ; Gladius/Stormlance/Ironstorm conformes au MFM v1.4 |
| Points des unités | **leak Art of War** (section ci-dessus), MFM officiel à intégrer |
| Points des améliorations | estimés (10-25), absents du leak |
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
