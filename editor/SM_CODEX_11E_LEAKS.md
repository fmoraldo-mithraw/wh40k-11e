# Codex Space Marines 11e — état d'intégration depuis les leaks (2026-09)

> Journal de ce qui est **sourcé** (cartes/pages leakées), **placeholder**
> (nommé mais non publié) et **déduit** (extrapolé par règle). À reconcilier
> ligne par ligne à la parution du codex, puis à supprimer.

## Sources intégrées telles quelles

- Règle d'armée **Combat Doctrines** (encart Army Rules) — remplace *Oath of
  Moment* en gardant l'id de règle partagée `3b76-4053-ece9-6e7d` (170
  infoLinks renommés dans 11 fichiers ; marqueurs `sim-mod: source="Oath of
  Moment"` retirés). Le modifier « masquée si catalogue primaire Black
  Templars » de l'ancienne règle est conservé tel quel (Templar Vows).
- Cartes : **Roboute Guilliman** (Ultramarines.cat), **Librarian**,
  **Sternguard Veteran Squad**, **Terminator Squad**, **Intercessor Squad**
  (stats, armes, capacités, mots-clefs). Intercessor Squad : seule la partie
  haute de la carte est leakée — capacités (*Objective Secured*, *Hail of
  Bolts*) et composition conservées de la 10e, à vérifier.
- Pages 168-169 : **Gravis Linebreaker Force** et **Gravis Siege Force**
  (règle, 3 stratagems chacun, améliorations). *Immovable Conquerors Upgrade*
  est un « Upgrade » (règle maison n°1) : lié aux unités GRAVIS non-Epic
  (SM + Indomitor Kill Team Deathwatch). Coûts en points des améliorations
  **non publiés → 0 provisoire** (commentaire sur chaque entrée).
- Liste des détachements (annonce) : 15 détachements créés, exclusivité
  native `UNIQUE DOCTRINES / TACTICUS / PHOBOS / GRAVIS`.
- Unités retirées (annonce) : Tactical/Devastator/Suppressor Squad, Pedro
  Kantor, Uriel Ventris, Centurion Assault/Devastator, Razorback, Predator
  Destructor/Annihilator, Vindicator, Whirlwind, Dreadnought, Stormhawk,
  Stormtalon, Stormraven, Hammerfall Bunker — entrées, liens racine, liens
  « Can Lead », puces de prose *Leader* et références chapitres supprimés.
  Les copies Grey Knights (Razorback, Storm*) sont **conservées** (codex GK).

## Placeholders (à remplir à la parution)

| Objet | État |
|---|---|
| Règles d'armée *Transhuman Strategist*, *Librarius* | `sharedRules` avec texte « not yet published », liées depuis Guilliman / Librarian |
| 13 détachements hors Gravis | squelette : 1 règle « preview » (phrase de l'annonce), aucune amélioration ni stratagem, commentaire `codex-11e: contenu non publie…` |
| DP et Force Disposition | **provisoires** partout (Gladius 3 / Stormlance 3 conservés, 2 ailleurs) |
| Points des améliorations Gravis | 0 provisoire |
| Ancien texte des détachements de chapitre (BA/DA/SW/DW/BT…) | intacts, en attente de leurs suppléments |

## Règles de déduction appliquées à TOUT le catalogue SM (`editor/…/s5_deduce`)

Calibrées sur les 5 cartes + le codex Orks 11e déjà intégré (Meganobz
T5→6, Warboss méga-armure T6→7, motards T5→6, Choppa S4→5 AP0→-1,
pistolets → Close-Quarters, Burna/Skorcha D6→3 + Blast N sans Ignores Cover).

| # | Règle | Preuve |
|---|---|---|
| T1 | Infanterie (Tacticus/Phobos/autres, Scouts inclus) **T4→5** | Intercessor, Librarian, Sternguard |
| T2 | Terminator **T5→6** | Terminator Squad |
| T3 | Gravis **T6→7** ; Mounted **T5→6** | extrapolation (+1 uniforme, cf. Orks) |
| T4 | Véhicules, Marcheurs, Fortifications : **inchangés** | Trukk/Deff Dread/Gorkanaut inchangés en 11e |
| K1 | Mot-clef *Grenades* → **Explosives** ; retiré des unités TERMINATOR | Librarian/Sternguard/Intercessor ; carte Terminator sans Explosives |
| W1 | Mot-clef d'arme *Pistol* → **Close-Quarters** (infoLink échangé) | Bolt Pistol, Orks |
| W2 | Famille **bolt** (hors heavy bolter/absolvor/sniper) : S4→5, AP0→-1 | Bolt Pistol, Storm Bolter, Bolt Rifle |
| W3 | **Heavy bolter** : + Rapid Fire 2 | Sternguard Heavy Bolter |
| W4 | **Torrent** : attaques aléatoires → fixes (D6→3, D6+1→4, D6+3→6, 2D6→8), + Blast 2 (S≥5) / Blast 1 (S≤4), Ignores Cover retiré | Heavy Flamer, Pyrecannon, Orks |
| W5 | Missiles **frag** : D6→4, 2D6→8, AP0→-1, Blast 2 ; **krak** : S+1, D6→D3+3 | Cyclone Missile Launcher |
| W6 | Autres attaques aléatoires → fixes (D3→2, D3+1→3, D6+6→9) et *Blast* → *Blast 2* (Smite exclu) | Orks (Kannon, Lobba, KMB) |
| W7 | Mêlée S4 « force de marine » (CCW, chainsword, combat knife, lightning claws, paired blades) → **S5** | Chainsword, Knives and Fists, Ceramite Fists |
| W8 | **Power weapon** : A+1 | Power Weapon A5 (2 cartes) |
| W9 | **Chainfist** : profils ➤ Standard (A-1) / ➤ Hunter (A, WS+1, S12 D3), Anti-Vehicle retiré | Terminator Squad |

**Non déduits (aucune preuve)** : grav (Anti-vehicle), melta, plasma
(hors attaques aléatoires), lascannons, Twin-linked, Devastating Wounds des
combi-weapons, Anti-Fly, statlines des véhicules, W/LD/OC/SV, capacités des
autres fiches, unités locales des catalogues de chapitre (Death Company,
Deathwing…), listes *Leader*.

## À faire à la parution

1. Remplacer les 13 squelettes (règles, améliorations, stratagems, DP, FD).
2. Renseigner Transhuman Strategist, Librarius, points des améliorations Gravis.
3. Vérifier chaque déduction W1-W9 / T1-T3 carte par carte ; retirer ce fichier.
