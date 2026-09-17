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

## Points ESTIMÉS (2026-09-17) — en attente du MFM 11e

Aucune page de points dans le codex. Les points ci-dessous sont des **estimations**
dérivées des changements de profil : pour chaque fiche, indice d'attaque (dégâts
espérés de l'armement par défaut contre T5/3+, T10/3+, T4/5+) et indice de
résistance (PV / probabilité d'être blessé et de rater la sauvegarde) calculés
sur la fiche 10e (commit a39d2c6) et sur la fiche 11e ; nouveau coût = ancien ×
attaque^0,2 × résistance^0,3, borné à ±30 %, arrondi à 5 ; paliers de taille au
même ratio, surcoûts de chapitre (`chapter-cost`) conservés en delta. Quelques
ajustements manuels (Captain 90, Bladeguard Ancient 45, Lieutenant with
Combi-weapon 100, Reiver Squad 85, Sternguard 125), nouveautés à la main (Captain
on Bike 85, Kaius Konorius 90). Améliorations : valeurs de jugement (10-25).
Scripts : `scratchpad/pts_analyze.js`, `pts_apply.js`. **À écraser par le MFM.**

| Fiche | 10e | 11e (estimé) | paliers |
|---|---|---|---|
| Marneus Calgar | 200 | 170 |  |
| Chief Librarian Tigurius | 85 | 100 |  |
| Cato Sicarius | 105 | 115 |  |
| Captain Titus | 100 | 110 |  |
| Wardens of Ultramar | 120 | 130 |  |
| Victrix Honour Guard | 110 | 120 | 230→250 |
| Kaius Konorius | — | 90 |  |
| Darnath Lysander | 100 | 100 |  |
| Tor Garadon | 80 | 80 |  |
| Aethon Shaan | 100 | 105 |  |
| Kayvaan Shrike | 100 | 100 |  |
| Vulkan He'stan | 95 | 100 |  |
| Adrax Agatone | 80 | 85 |  |
| Caanok Var | 90 | 95 |  |
| Iron Father Feirros | 85 | 90 |  |
| Kor'sarro Khan | 55 | 65 |  |
| Suboden Khan | 90 | 90 |  |
| Captain | 80 | 90 |  |
| Captain with Jump Pack | 75 | 90 | 80→95 |
| Captain in Phobos Armour | 70 | 80 |  |
| Captain in Terminator Armour | 85 | 90 |  |
| Captain in Gravis Armour | 80 | 85 |  |
| Captain on Bike | — | 85 |  |
| Lieutenant | 45 | 50 |  |
| Lieutenant in Phobos Armour | 45 | 50 |  |
| Lieutenant with Combi-weapon | 95 | 100 |  |
| Chaplain | 60 | 65 |  |
| Chaplain with Jump Pack | 75 | 80 | 80→85 |
| Chaplain in Terminator Armour | 75 | 80 |  |
| Chaplain on Bike | 70 | 75 |  |
| Judiciar | 55 | 60 |  |
| Librarian | 70 | 80 |  |
| Librarian in Phobos Armour | 70 | 75 |  |
| Librarian in Terminator Armour | 85 | 90 |  |
| Ancient | 40 | 45 |  |
| Bladeguard Ancient | 40 | 45 |  |
| Ancient in Terminator Armour | 65 | 65 |  |
| Techmarine | 55 | 60 |  |
| Apothecary | 40 | 45 |  |
| Apothecary Biologis | 70 | 75 |  |
| Company Heroes | 105 | 120 |  |
| Intercessor Squad | 80 | 95 | 150→180 |
| Assault Intercessor Squad | 75 | 85 | 150→170, 80→90, 150→160 |
| Assault Intercessors with Jump Packs | 85 | 95 | 160→180, 95→105, 180→190 |
| Heavy Intercessor Squad | 100 | 105 | 200→215 |
| Hellblaster Squad | 110 | 125 | 220→245 |
| Desolation Squad | 180 | 210 |  |
| Infernus Squad | 85 | 90 | 180→195 |
| Infiltrator Squad | 110 | 125 | 180→200 |
| Bladeguard Veteran Squad | 80 | 85 | 160→175, 85→90, 170→175 |
| Aggressor Squad | 80 | 80 | 165→165 |
| Inceptor Squad | 125 | 125 | 250→250 |
| Terminator Assault Squad | 155 | 160 | 310→320 |
| Invader ATV | 60 | 65 |  |
| Rhino | 65 | 70 |  |
| Impulsor | 70 | 85 |  |
| Repulsor | 170 | 185 |  |
| Repulsor Executioner | 255 | 275 | 230→250, 230→250, 230→250, 230→250 |
| Land Raider | 220 | 230 |  |
| Land Raider Crusader | 220 | 245 |  |
| Land Raider Redeemer | 260 | 255 |  |
| Redemptor Dreadnought | 195 | 220 |  |
| Ballistus Dreadnought | 150 | 160 |  |
| Brutalis Dreadnought | 150 | 170 |  |
| Invictor Tactical Warsuit | 125 | 135 |  |
| Storm Speeder Hailstrike | 105 | 115 |  |
| Storm Speeder Hammerstrike | 140 | 150 |  |
| Storm Speeder Thunderstrike | 135 | 145 |  |
| Land Speeder | 105 | 105 |  |
| Gladiator Lancer | 160 | 160 |  |
| Gladiator Reaper | 160 | 190 |  |
| Gladiator Valiant | 150 | 160 |  |
| Vanguard Veteran Squad with Jump Packs | 105 | 115 | 210→230, 110→120, 220→230 |
| Incursor Squad | 85 | 95 | 150→165 |
| Reiver Squad | 75 | 85 | 150→170 |
| Scout Squad | 65 | 75 | 120→135 |
| Eliminator Squad | 75 | 80 |  |
| Outrider Squad | 70 | 80 | 140→160, 75→85, 140→150 |
| Eradicator Squad with Heavy Bolters | 80 | 90 |  |
| Eradicator Squad | 90 | 95 | 180→195 |
| Sternguard Veteran Squad | 100 | 125 | 200→250 |
| Terminator Squad | 160 | 180 | 320→355 |

Améliorations : Gravis Linebreaker Force — Indefatigable Fortitude = 20 ; Gravis Linebreaker Force — Relentless Advance = 15 ; Gravis Siege Force — Narthecis Gauntlet = 15 ; Gladius Task Force — Standard of the Emperor Ascendant = 25 ; Gladius Task Force — Laurels of Triumph = 20 ; Gladius Task Force — Adept of the Codex = 15 ; Gladius Task Force — Artificer Armour = 15 ; Assault Brethren — Imperium’s Sword = 25 ; Phobos Shadow Force — Venator Omni-auspex = 15 ; Phobos Shadow Force — Execute and Redeploy = 20 ; Phobos Shock Force — Seal of Shrouding = 10 ; Phobos Shock Force — Venator Omni-auspex = 15 ; Gauntlet Task Force — Linebreaker Onslaught = 15 ; Gauntlet Task Force — Damocles-class Uplink = 25 ; Tactical Brethren — Laurels of Vigilance = 15 ; Tactical Brethren — Tactical Insight = 15 ; Devastator Brethren — Master-forged Firearms = 20 ; Devastator Brethren — Honour of Vigilance = 25 ; Terminator Storm Force — Champion of the First Company = 20 ; Terminator Storm Force — Corporeum Reliquary = 15 ; Tacticus Attack Force — Martial Paragon = 20 ; Tacticus Attack Force — Spearpoint War Leader = 15 ; Tacticus Firestorm Force — Cyber-familiar = 20 ; Tacticus Firestorm Force — Tempered in Battle (Aura) = 10 ; Upgrade — Immovable Conquerors Upgrade = 10 ; Upgrade — Furious Assault Upgrade = 10 ; Upgrade — Supercharged Engines Upgrade = 10 ; Upgrade — Auspex Triangulation Shrines Upgrade = 15 ; Upgrade — Artificer Sarcophagus Upgrade = 20 ; Upgrade — Venerable Champion (Aura) Upgrade = 20 ; Upgrade — Redoubtable Machine Spirit Upgrade = 20 ; Upgrade — Gunnery Honours Upgrade = 15.

## Provisoire / déduit

| Objet | État |
|---|---|
| DP et Force Disposition (15 détachements) | provisoires, MFM à intégrer |
| Points des unités et des améliorations | **estimés** (section ci-dessus), MFM à intégrer ; 2e Invader ATV non chiffré |
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
