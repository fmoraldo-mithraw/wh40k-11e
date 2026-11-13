# Listes du méta (Listhammer) — état des erreurs de chargement

> Écrit par `scripts/dev/listhammer-sync.mjs` (cogitator-bellicum) le 2026-11-13 15:59 UTC
> — appli `db26925`, données `2890a063`. Ne pas éditer à la main : la synchro le réécrit.
>
> Routine de correction : reproduire une liste avec
> `node scripts/dev/listhammer-sync.mjs --only <listId>` (côté appli, après `scripts/dev/sync-data.sh`),
> corriger le parseur d'import ou les données (jamais la liste), puis `--offline` pour réanalyser toute la file.
> Divergence légitime : l'ajouter à `listhammer/acceptees.json`. Guide : `editor/LISTES_META_PROMPT.md`.

**279** listes en file (10 max. par faction) · **222** sans erreur · **0** aux erreurs acceptées · **57** avec erreur(s) à traiter · 0 entrée(s), 0 sortie(s) aujourd'hui

## Par nature

| Occurrences | Message |
|---:|---|
| 49 | Arme / équipement « … » impossible sur cette unité (inconnu de la fiche, option peut-être  |
| 17 | Amélioration « … » non reconnue (ou interdite sur cette unité) — ignorée. |
| 11 | Aucun Seigneur de Guerre désigné. |
| 10 | Détachement « … » introuvable dans la base. |
| 8 | Figurine « … » non rapprochée d'une figurine de la fiche — composition par défaut. |
| 6 | Effectif hors bornes : 5 figurine(s) « … » (attendu 10–10). |
| 5 | Arme / équipement « … » impossible sur cette unité (inconnu de la fiche) — ignoré. |
| 4 | Effectif hors bornes : 0 figurine(s) « … » (attendu 4–9). |
| 4 | Effectif hors bornes : 2 figurine(s) « … » (attendu 1–1). |
| 4 | Faction lue « … » ≠ faction Listhammer « … ». |
| 3 | Effectif hors bornes : 2 figurine(s) « … » (attendu 3–6). |
| 3 | aucune unité lue |
| 3 | Effectif hors bornes : 10 figurine(s) « … » (attendu 5–5). |
| 2 | Détachement non lu — le premier de la faction (« … ») est retenu. |
| 2 | Effectif hors bornes : 5 figurine(s) « … » (attendu 1–1). |
| 2 | Effectif hors bornes : 11 figurine(s) « … » (attendu 5–10). |
| 2 | Effectif hors bornes : 16 figurine(s) « … » (attendu 5–10). |
| 2 | Effectif hors bornes : 6 figurine(s) « … » (attendu 12–16). |
| 1 | Effectif hors bornes : 18 figurine(s) « … » (attendu 9–9). |
| 1 | Fiche introuvable dans la base — unité ignorée. |
| 1 | Effectif hors bornes : 7 figurine(s) « … » (attendu 3–6). |
| 1 | Effectif hors bornes : 9 figurine(s) « … » (attendu 1–1). |
| 1 | Effectif hors bornes : 7 figurine(s) « … » (attendu 9–9). |
| 1 | Effectif hors bornes : 8 figurine(s) « … » (attendu 9–9). |

## À traiter, par liste

### Adepta Sororitas — Robin (Lamar) Philippot (OGRE 2026, Open du Grand Est 4ème EDITION, 5-0) `4zCa5i0KkQpX`

Faction Listhammer : Adepta Sororitas · 16/16 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ **Daemonifuge** : Arme / équipement « The Outcast’s Weapons » impossible sur cette unité (inconnu de la fiche) — ignoré.

### Adeptus Custodes — Manuel Wayand (Raccoon Rumble 2026 40K, 5-1) `2c012f89-c249-4fbd-a235-b05b30337e66`

Faction Listhammer : Adeptus Custodes · 11/11 unités reconnues · 1935 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Shield-Captain** : Arme / équipement « Superior Creation » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Telemon Heavy Dreadnought** : Arme / équipement « Augury Uplink » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Adeptus Custodes — Riffey Alexandre (OGRE 2026, Open du Grand Est 4ème EDITION, 4-1) `p0h1YovwtmrQ`

Faction Listhammer : Adeptus Custodes · 11/11 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Détachement « Grav‑Assault Force » introuvable dans la base.

### Adeptus Custodes — Aurelien Auguste (OGRE 2026, Open du Grand Est 4ème EDITION, 4-1) `TgDKTNad2GD0`

Faction Listhammer : Adeptus Custodes · 10/10 unités reconnues · 1735 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.
- ⚠ **Shield-Captain** : Arme / équipement « lame de parangon modèle Éternité et 1 bouclier praesidium » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Prosecutor Squad #1** : Arme / équipement « Bolter, 4× Crosse d'Arme » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Prosecutor Squad #2** : Arme / équipement « Bolter, 4× Crosse d'Arme » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Caladius Annihilator Grav-tank** : Arme / équipement « Caronade Incendiaire Arachnus, Canon Bolter Lastrum Jumelé, Coque Blindée » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Adeptus Custodes — Norman Werner (124. Bedburger Scheunenkloppen - Zweitagesturnier, 4-1) `BZshApGoAFDs`

Faction Listhammer : Adeptus Custodes · 10/10 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ Détachement non lu — le premier de la faction (« Aquilan Shield ») est retenu.

### Adeptus Custodes — Deena Addams (Atomic City Warzone 2026, 4-1) `WUti2W1YdHy2`

Faction Listhammer : Adeptus Custodes · 11/11 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Adeptus Mechanicus — Thomas (Ymrik) Sevrain (OGRE 2026, Open du Grand Est 4ème EDITION, 4-1) `2UTabMvl1IuR`

Faction Listhammer : Adeptus Mechanicus · 15/15 unités reconnues · 1995 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Sicarian Infiltrators** : Effectif hors bornes : 0 figurine(s) « 4-9 Sicarian Infiltrators » (attendu 4–9).
- ⚠ **Sicarian Infiltrators** : Effectif hors bornes : 5 figurine(s) « Sicarian Infiltrator Princeps » (attendu 1–1).
- ⚠ **Sicarian Ruststalkers** : Effectif hors bornes : 0 figurine(s) « 4-9 Sicarian Ruststalkers » (attendu 4–9).
- ⚠ **Sicarian Ruststalkers** : Effectif hors bornes : 5 figurine(s) « Sicarian Ruststalker Princeps » (attendu 1–1).

### Adeptus Mechanicus — Vlasta Král (40k Ogr Cubb Singles, 4-1) `Tc8wCxYYefl0`

Faction Listhammer : Adeptus Mechanicus · 16/16 unités reconnues · 1970 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Tech-Priest Enginseer #2** : Arme / équipement « TL-409 » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Skorpius Disintegrator #2** : Arme / équipement « ADEPTUS MECHANICUS — ARMY LIST CHEAT SHEET » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Skorpius Disintegrator #2** : Arme / équipement « CONQUEROR » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Skorpius Disintegrator #2** : Arme / équipement « [ASSAULT] » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Skorpius Disintegrator #2** : Arme / équipement « PROTECTOR » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Craftworlds — Dan Toohey (40k RoGCon GT, 4-1) `2pnAstpp73Gn`

Faction Listhammer : Aeldari · 21/21 unités reconnues · 2230 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Farseer** : Arme / équipement « Lucid Eye » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Farseer Skyrunner #1** : Arme / équipement « Torc of Morai-Heg » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Craftworlds — Jared Kinsella (The Hogtowner 2026, 4-1) `JoMz5ytGfXqv`

Faction Listhammer : Aeldari · 18/18 unités reconnues · 1985 pts (liste : ?) · entrée le 2026-11-13

- ✗ **Shroud Runners** : Amélioration « Assassin's Eye » non reconnue (ou interdite sur cette unité) — ignorée.

### Astra Militarum — Simon Selberg (SSG & MM Shuffle Wars IV: Makari's Hope, 4-1) `OZPmUpHJN5zQ`

Faction Listhammer : Astra Militarum · 18/18 unités reconnues · 1995 pts (liste : 1995) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Astra Militarum — Hugo Batt (Paris Wargame Expo 2 - Solo 40K, 5-0) `1t4ybPZtv52i`

Faction Listhammer : Astra Militarum · 16/16 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Astra Militarum — Oisin Donnelly (Warpstorm 3, 4-1) `ocojZlU8ku6Z`

Faction Listhammer : Astra Militarum · 16/16 unités reconnues · 1995 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Cadian Shock Troops** : Effectif hors bornes : 2 figurine(s) « Shock Trooper Sergeant » (attendu 1–1).
- ⚠ **Cadian Shock Troops** : Effectif hors bornes : 18 figurine(s) « 9 Shock Troopers » (attendu 9–9).

### Black Templars — Michael Pritchard (Warhammer 40,000 - My First Two Day Tournament Cardiff, 5-0) `oefiIMxLskjY`

Faction Listhammer : Black Templars · 15/16 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ **Exported with App Version: v2.8.1 (149), Data Version: v995Blade Bros vs Sword Bros.** : Fiche introuvable dans la base — unité ignorée.

### Black Templars — Finlay Stewart (THE COVENTRY 40K : 2-Day, 4-1) `fBBmj6u3zkph`

Faction Listhammer : Black Templars · 18/18 unités reconnues · 2285 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Assault Intercessor Squad #2** : Effectif hors bornes : 11 figurine(s) « Assault Intercessors » (attendu 5–10).
- ⚠ **Assault Intercessor Squad #2** : Figurine « Furious Assault (Upgrade) » non rapprochée d'une figurine de la fiche — composition par défaut.
- ⚠ **Terminator Assault Squad** : Effectif hors bornes : 11 figurine(s) « Assault Terminators » (attendu 5–10).
- ⚠ **Terminator Assault Squad** : Figurine « Furious Assault (Upgrade) » non rapprochée d'une figurine de la fiche — composition par défaut.
- ⚠ **Chaplain on Bike #2** : Arme / équipement « Imperium's Sword » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Bladeguard Veteran Squad #2** : Effectif hors bornes : 7 figurine(s) « Bladeguard Veterans » (attendu 3–6).
- ⚠ **Bladeguard Veteran Squad #2** : Arme / équipement « Furious Assault (Upgrade) » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Blood Angels — Tim Verbeek (Gaelcon 2026, 4-1) `dsezuSHBvM2m`

Faction Listhammer : Blood Angels · 17/17 unités reconnues · 1715 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Eradicator Squad with Melta Rifles #1** : Effectif hors bornes : 2 figurine(s) « Eradicators » (attendu 3–6).
- ⚠ **Eradicator Squad with Melta Rifles #2** : Effectif hors bornes : 2 figurine(s) « Eradicators » (attendu 3–6).

### Chaos Daemons — Byron 🔥🎲 Sidhu (THE COVENTRY 40K : 2-Day, 4-1) `uV3EHRmv6DBq`

Faction Listhammer : Chaos Daemons · 8/8 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Fiends** : Effectif hors bornes : 2 figurine(s) « Fiends » (attendu 3–6).
- ⚠ **Fiends** : Arme / équipement « Blissbringer » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Chaos Daemons — Kyriakos Kamarakis (GANGSTA BEAR CHAMPIONSHIP, 4-1) `3eYI5Wl15gkM`

Faction Listhammer : Chaos Daemons · 12/12 unités reconnues · 1990 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Bloodcrushers #2** : Arme / équipement « Soulshattering charge (upgrade 10 points) » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Chaos Knights — Erwan GAVENS (Paris Wargame Expo 2 - Solo 40K, 4-1) `ITh6x2VvGAlv`

Faction Listhammer : Chaos Knights · 12/12 unités reconnues · 1930 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Knight Despoiler #1** : Arme / équipement « Relic : Bestial Aspect » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Chaos Knights — Ryan Toddie (Ratcon 2026, 4-1) `pAFtHRDUsj3f`

Faction Listhammer : Chaos Knights · 11/11 unités reconnues · 1535 pts (liste : 1995) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Chaos Knights — Derek Swift (BZU 40K 2026, 4-1) `qLcplXY86jiJ`

Faction Listhammer : Chaos Knights · 11/11 unités reconnues · 1525 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Chaos Knights — Jonathon Hefner (Call to Arms Hosted by Away Games, 4-1) `zOa9ibv9nVja`

Faction Listhammer : Chaos Knights · 11/11 unités reconnues · 1545 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Dark Angels — Nathan Robertson (Rose City Ruckus Singles, 5-0) `T8UOB84QdtJa`

Faction Listhammer : Dark Angels · 14/14 unités reconnues · 1975 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Ancient** : Arme / équipement « Imperium's Sword » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Death Guard — Christian Breuer (124. Bedburger Scheunenkloppen - Zweitagesturnier, 4-1) `bDyK3QOqk9m0`

Faction Listhammer : Death Guard · 19/19 unités reconnues · 2000 pts (liste : ?) · entrée le 2026-11-13

- ⚠ Détachement non lu — le premier de la faction (« Flyblown Host ») est retenu.
- ⚠ **Chaos Rhino #1** : Arme / équipement « Habicht » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Chaos Rhino #2** : Arme / équipement « Habicht » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Knight Despoiler** : Arme / équipement « Heavy Stuber » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Deathwatch — Travis Finell (LVO 2026 - Warhammer 40k Championships - Las Vegas Open, 5-1) `PrT64LuQFiCj`

Faction Listhammer : Deathwatch · 0/0 unités reconnues · 0 pts (liste : ?) · entrée le 2026-11-13

- ✗ aucune unité lue

### Deathwatch — David Zapletal (Pilsen Meta Rift Fall 2026, 4-1) `BltOvZwOQHIY`

Faction Listhammer : Deathwatch · 10/10 unités reconnues · 1915 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Indomitor Kill Team #1** : Effectif hors bornes : 5 figurine(s) « Squad Members » (attendu 10–10).
- ⚠ **Indomitor Kill Team #2** : Effectif hors bornes : 5 figurine(s) « Squad Members » (attendu 10–10).

### Deathwatch — Joshua Gray (Whitby Autumn GT, 4-1) `V4VBgBCAw1H4`

Faction Listhammer : Deathwatch · 11/11 unités reconnues · 2150 pts (liste : ?) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.
- ⚠ **Indomitor Kill Team #1** : Effectif hors bornes : 5 figurine(s) « Squad Members » (attendu 10–10).
- ⚠ **Indomitor Kill Team #2** : Effectif hors bornes : 5 figurine(s) « Squad Members » (attendu 10–10).

### Deathwatch — Nicky 🐿️ Myland (Whitby Autumn GT, 4-1) `aR9ppo2jLKYF`

Faction Listhammer : Deathwatch · 13/13 unités reconnues · 2095 pts (liste : ?) · entrée le 2026-11-13

- ⚠ **Deathwatch Veterans #1** : Arme / équipement « Watch Sergeant » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Deathwatch Veterans #2** : Arme / équipement « Watch Sergeant » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Indomitor Kill Team #1** : Effectif hors bornes : 5 figurine(s) « Squad Members » (attendu 10–10).
- ⚠ **Indomitor Kill Team #2** : Effectif hors bornes : 5 figurine(s) « Squad Members » (attendu 10–10).

### Deathwatch — Feliks Bartkiewicz (The London Grand Tournament - 40k Main Event (LGT 40k GT), 5-1) `ksIqX3Cnjj0u`

Faction Listhammer : Deathwatch · 13/13 unités reconnues · 2070 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Ancient in Terminator Armour** : Figurine « Terminator Storm Shield » non rapprochée d'une figurine de la fiche — composition par défaut.
- ⚠ **Ancient in Terminator Armour** : Arme / équipement « Thunder hammer » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Deathwatch Veterans** : Arme / équipement « Watch Sergeant » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Deathwatch — Guy Miscampbell (The London Grand Tournament - 40k Main Event (LGT 40k GT), 4-1) `QMuuHFhTH64P`

Faction Listhammer : Deathwatch · 11/11 unités reconnues · 2105 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Ancient in Terminator Armour** : Figurine « Terminator Storm Shield » non rapprochée d'une figurine de la fiche — composition par défaut.
- ⚠ **Ancient in Terminator Armour** : Arme / équipement « Thunder hammer » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Deathwatch — Travis Finell (THERE IS ONLY WAR V 40k GT, 5-1) `WmrmfnL7ePAn`

Faction Listhammer : Deathwatch · 0/0 unités reconnues · 0 pts (liste : ?) · entrée le 2026-11-13

- ✗ aucune unité lue

### Deathwatch — Kyle Sams (The Innsmouth Slaughter 40k GT, 5-0) `2X2UAT5x4482`

Faction Listhammer : Deathwatch · 13/13 unités reconnues · 2070 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Ancient in Terminator Armour** : Arme / équipement « Power fist » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Deathwatch Veterans** : Arme / équipement « Watch Sergeant » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Drukhari — Axel Rydén (SSG & MM Shuffle Wars IV: Makari's Hope, 4-0-1) `fPXho3S408vX`

Faction Listhammer : Drukhari · 22/22 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Lady Malys** : Arme / équipement « Melee Weapons » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Drukhari — AxelRyden (Malmö Wargaming Weekend X, 4-0-1) `696061d6-1ff8-4ae8-9b95-a2db5c1a7f59`

Faction Listhammer : Drukhari · 21/21 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Lady Malys** : Arme / équipement « Melee Weapons » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Emperor's Children — Bastian Jansson Grönwald (SSG & MM Shuffle Wars IV: Makari's Hope, 4-1) `Hsv6r68D8f43`

Faction Listhammer : Emperor's Children · 13/13 unités reconnues · 1995 pts (liste : 1995) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Genestealer Cults — Bilbo Göransson (SSG & MM Shuffle Wars IV: Makari's Hope, 4-1) `ytdrpI59kFH7`

Faction Listhammer : Genestealer Cult · 23/23 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ **Goliath Truck** : Arme / équipement « Armoured hull » impossible sur cette unité (inconnu de la fiche) — ignoré.

### Genestealer Cults — João Figueiredo (BATALHA DOS CORVOS WARHAMER 40K, 4-1) `pz3qXv0pmXsG`

Faction Listhammer : Genestealer Cult · 21/21 unités reconnues · 1995 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Atalan Jackals #1** : Effectif hors bornes : 2 figurine(s) « 1-2 Atalan Wolfquads » (attendu 1–1).
- ⚠ **Atalan Jackals #2** : Effectif hors bornes : 2 figurine(s) « 1-2 Atalan Wolfquads » (attendu 1–1).

### Genestealer Cults — ROBIN ROBERTS (Mektoberfest  2026 40k Gt, 5-0) `cZ1mW5e9M1q5`

Faction Listhammer : Genestealer Cult · 23/23 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Goliath Truck #1** : Arme / équipement « Armoured hull » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Goliath Truck #2** : Arme / équipement « Armoured hull » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Genestealer Cults — Lucas (Malmö Wargaming Weekend X, 4-1) `f92ab134-5054-4299-b742-ce78612e3f30`

Faction Listhammer : Genestealer Cult · 22/22 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Goliath Truck** : Arme / équipement « Armoured hull » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Grey Knights — Bill Adriaensen (Hell's Basement GT 2026, 4-1) `eJvlgRteUtSo`

Faction Listhammer : Grey Knights · 0/0 unités reconnues · 0 pts (liste : ?) · entrée le 2026-11-13

- ✗ aucune unité lue

### Grey Knights — Joel Hansson (Malmö Wargaming Weekend X, 4-1) `208aa2f4-1a7a-43ea-a545-7feb6c84198a`

Faction Listhammer : Grey Knights · 9/9 unités reconnues · 1505 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Interceptor Squad** : Arme / équipement « Castellan Crowe — 105 pts · » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Interceptor Squad** : Figurine « └ Leads: Purifier Squad ×10 — 290 pts » non rapprochée d'une figurine de la fiche — composition par défaut.
- ⚠ **Interceptor Squad** : Arme / équipement « Purifying Flame » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nemesis Dreadknight #2** : Arme / équipement « / 2000 pts · 11 units · Strike Force » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Adepta Sororitas — Christopher Cockburn (Roskilde Tabletop Gathering - 40k GT, 4-1) `dfg4HyHj7XUq`

Faction Listhammer : Imperial Agents · 24/24 unités reconnues · 2195 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Faction lue « Adepta Sororitas » ≠ faction Listhammer « Imperial Agents ».
- ✗ Détachement « Imperialis Fleet » introuvable dans la base.
- ✗ Détachement « Veiled Blade Elimination Force » introuvable dans la base.
- ✗ **Inquisitor #2** : Amélioration « Digital Weapons » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Rogue Trader Entourage** : Amélioration « Fleetmaster » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Callidus Assassin** : Amélioration « Decoy Targets » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Eversor Assassin** : Amélioration « Intraneural Biotech » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Navigator #1** : Amélioration « Combat Landers » non reconnue (ou interdite sur cette unité) — ignorée.
- ⚠ **Inquisitorial Agents #1** : Effectif hors bornes : 16 figurine(s) « 5 - 10 Acolytes » (attendu 5–10).
- ⚠ **Inquisitorial Agents #2** : Effectif hors bornes : 16 figurine(s) « 5 - 10 Acolytes » (attendu 5–10).
- ⚠ **Imperial Navy Breachers #1** : Effectif hors bornes : 9 figurine(s) « Navis Sergeant-at-Arms » (attendu 1–1).
- ⚠ **Imperial Navy Breachers #1** : Effectif hors bornes : 7 figurine(s) « 9 Armsmen » (attendu 9–9).
- ⚠ **Imperial Navy Breachers #2** : Effectif hors bornes : 2 figurine(s) « Navis Sergeant-at-Arms » (attendu 1–1).
- ⚠ **Imperial Navy Breachers #2** : Effectif hors bornes : 8 figurine(s) « 9 Armsmen » (attendu 9–9).

### Agents of the Imperium — Sam Fagan (Bendigo open 2026, 4-0-1) `oUDLxcGiRWfT`

Faction Listhammer : Imperial Agents · 23/23 unités reconnues · 2015 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Callidus Assassin** : Arme / équipement « Decoy Targets » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Culexus Assassin** : Arme / équipement « Esoteric Explosives » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Adepta Sororitas — Joseph Sault (2026 Wars on the Shore GT, 4-1) `kcgrnE0biqaw`

Faction Listhammer : Imperial Agents · 23/23 unités reconnues · 2170 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Faction lue « Adepta Sororitas » ≠ faction Listhammer « Imperial Agents ».
- ✗ Détachement « Imperialis Fleet » introuvable dans la base.
- ✗ Détachement « Veiled Blade Elimination Force » introuvable dans la base.
- ✗ **Rogue Trader Entourage** : Amélioration « Fleetmaster » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Inquisitor #2** : Amélioration « Digital Weapons » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Inquisitor #3** : Amélioration « Clandestine Operation » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Navigator** : Amélioration « Combat Landers » non reconnue (ou interdite sur cette unité) — ignorée.

### Adepta Sororitas — Matt Stadnik (Turbulent Games Warhammer 40K GT @Siouxper Con, 4-1) `k5s43fZM8stt`

Faction Listhammer : Imperial Agents · 25/25 unités reconnues · 2245 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Faction lue « Adepta Sororitas » ≠ faction Listhammer « Imperial Agents ».
- ✗ Détachement « Imperialis Fleet » introuvable dans la base.
- ✗ Détachement « Veiled Blade Elimination Force » introuvable dans la base.
- ✗ **Rogue Trader Entourage #1** : Amélioration « Combat Landers » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Inquisitor #1** : Amélioration « Clandestine Operation » non reconnue (ou interdite sur cette unité) — ignorée.

### Adepta Sororitas — Joseph Sault (The Port City GT , 5-0) `XMpGKTnf6uk1`

Faction Listhammer : Imperial Agents · 23/23 unités reconnues · 2170 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Faction lue « Adepta Sororitas » ≠ faction Listhammer « Imperial Agents ».
- ✗ Détachement « Imperialis Fleet » introuvable dans la base.
- ✗ Détachement « Veiled Blade Elimination Force » introuvable dans la base.
- ✗ **Rogue Trader Entourage** : Amélioration « Fleetmaster » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Inquisitor #2** : Amélioration « Digital Weapons » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Inquisitor #3** : Amélioration « Clandestine Operation » non reconnue (ou interdite sur cette unité) — ignorée.
- ✗ **Navigator** : Amélioration « Combat Landers » non reconnue (ou interdite sur cette unité) — ignorée.

### Agents of the Imperium — Derrick Ramsey (Wasteland Wars GT V, 4-1) `eTrptUFdlVcs`

Faction Listhammer : Imperial Agents · 20/20 unités reconnues · 2020 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Aquila Kill Team** : Effectif hors bornes : 10 figurine(s) « Kill Team Sergeant / Gravis Veteran w/ infernus heavy bolter / Deathwatch Veteran w/ stalker bolt rifle / Deathwatch Veteran w/ heavy thunder hammer / Deathwatch Veteran w/ carbine / Deathwatch Veteran w/ xenophase blade » (attendu 5–5).

### Agents of the Imperium — Pascal Peter Semmler (HUXLEYS OPEN 2026 - WARHAMMER 40K, 5-1) `6d52240d-e4f5-4664-9741-3861adece179`

Faction Listhammer : Imperial Agents · 19/19 unités reconnues · 2095 pts (liste : 1985) · entrée le 2026-11-13

- ⚠ **Aquila Kill Team #1** : Effectif hors bornes : 10 figurine(s) « Kill Team Sergeant / Gravis Veteran w/ infernus heavy bolter / Deathwatch Veteran w/ stalker bolt rifle / Deathwatch Veteran w/ heavy thunder hammer / Deathwatch Veteran w/ carbine / Deathwatch Veteran w/ xenophase blade » (attendu 5–5).

### Agents of the Imperium — Matt Stadnik (Northern Maelstrom 2026 Warhammer 40,000 Grand Tournament, 5-1) `f1tdXXMxlk75`

Faction Listhammer : Imperial Agents · 19/19 unités reconnues · 2105 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Aquila Kill Team #1** : Effectif hors bornes : 10 figurine(s) « Kill Team Sergeant / Gravis Veteran w/ infernus heavy bolter / Deathwatch Veteran w/ stalker bolt rifle / Deathwatch Veteran w/ heavy thunder hammer / Deathwatch Veteran w/ carbine / Deathwatch Veteran w/ xenophase blade » (attendu 5–5).

### Leagues of Votann — Hyun-Young Kim (CritCon26 40K GT, 4-1) `hQFBUjrShbhY`

Faction Listhammer : Leagues of Votann · 19/19 unités reconnues · 2185 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Einhyr Hearthguard #1** : Effectif hors bornes : 0 figurine(s) « 4-9 Hearthguard » (attendu 4–9).
- ⚠ **Kâhl** : Arme / équipement « Oathbound Speculator » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Memnyr Strategist** : Arme / équipement « Dead Reckoning » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Necrons — quentin gallé (OGRE 2026, Open du Grand Est 4ème EDITION, 4-1) `b63us8Ym79kv`

Faction Listhammer : Necrons · 9/9 unités reconnues · 1740 pts (liste : 1990) · entrée le 2026-11-13

- ✗ **Nekrosor Ammentar** : Amélioration « Canoptek Reanimator » non reconnue (ou interdite sur cette unité) — ignorée.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Atomiser beam » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Reanimator's claws » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Canoptek Scarab Swarms » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Flayed Ones » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Ophydian Destroyers » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Plasmacyte » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Nekrosor Ammentar** : Arme / équipement « Other units » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.

### Necrons — Graham Richards (Warhammer 40,000 - My First Two Day Tournament Cardiff, 4-1) `MS6rakywaGnG`

Faction Listhammer : Necrons · 9/9 unités reconnues · 1875 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Détachement « The Phaeron's Armoury » introuvable dans la base.
- ✗ **Tesseract Vault** : Arme / équipement « Antimatter Meteor » impossible sur cette unité (inconnu de la fiche) — ignoré.
- ✗ **Tesseract Vault** : Arme / équipement « Cosmic Fire » impossible sur cette unité (inconnu de la fiche) — ignoré.
- ✗ **Tesseract Vault** : Arme / équipement « Time’s Arrow » impossible sur cette unité (inconnu de la fiche) — ignoré.

### Orks — Moritz Hanacher (124. Bedburger Scheunenkloppen - Zweitagesturnier, 4-1) `DvoeP4qlJzXF`

Faction Listhammer : Orks · 15/15 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### Space Wolves — Garron Owen (BrewHammer GT 10, 4-1) `jMW12ZgeKUkZ`

Faction Listhammer : Space Wolves · 11/11 unités reconnues · 1940 pts (liste : 2000) · entrée le 2026-11-13

- ⚠ **Chaplain on Bike** : Arme / équipement « Imperium's Sword » impossible sur cette unité (inconnu de la fiche, option peut-être retirée depuis la liste) — ignoré.
- ⚠ **Wulfen with Storm Shields** : Figurine « Storm shield » non rapprochée d'une figurine de la fiche — composition par défaut.
- ⚠ **Wulfen with Storm Shields** : Figurine « Storm shield » non rapprochée d'une figurine de la fiche — composition par défaut.

### Space Wolves — Matthew McCurdy (THE COVENTRY 40K : 2-Day, 5-0) `EaJynduuq8CP`

Faction Listhammer : Space Wolves · 15/15 unités reconnues · 2000 pts (liste : ?) · entrée le 2026-11-13

- ⚠ **Wolf Scouts #1** : Effectif hors bornes : 6 figurine(s) « Wolf Scout Pack Leader / Wolf Scout / Wolf Scout w/ plasma gun / Wolf Scout w/ haywire mine / Wolf Scout w/ runic stave and Thunderclap / Wolf Scout w/ instigator bolt carbine / Hunting Wolf » (attendu 12–16).
- ⚠ **Wolf Scouts #2** : Effectif hors bornes : 6 figurine(s) « Wolf Scout Pack Leader / Wolf Scout / Wolf Scout w/ plasma gun / Wolf Scout w/ haywire mine / Wolf Scout w/ runic stave and Thunderclap / Wolf Scout w/ instigator bolt carbine / Hunting Wolf » (attendu 12–16).

### Thousand Sons — Thierry Chanet (Paris Wargame Expo 2 - Solo 40K, 4-1) `uOPSuCbSihIT`

Faction Listhammer : Thousand Sons · 14/14 unités reconnues · 2000 pts (liste : 2000) · entrée le 2026-11-13

- ✗ Aucun Seigneur de Guerre désigné.

### World Eaters — Dany Vo (OGRE 2026, Open du Grand Est 4ème EDITION, 4-1) `VDXpVYfidymq`

Faction Listhammer : World Eaters · 13/13 unités reconnues · 1820 pts (liste : 1995) · entrée le 2026-11-13

- ⚠ **Chaos Terminators** : Effectif hors bornes : 0 figurine(s) « 4 - 9 Terminators » (attendu 4–9).
- ⚠ **Chaos Terminators** : Figurine « Chaos Terminator » non rapprochée d'une figurine de la fiche — composition par défaut.
