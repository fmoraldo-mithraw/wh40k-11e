# MFM v1.6 — intégration (tir cowork du 2026-10-14)

Dump intégré : `5e8087005680d9f6f49eb5f89d945771fd4224b3` (poussé par le cron
serveur en `e0ddf2a`, « MFM v1.6 : nouveau dump détecté »).

## Périmètre réel du v1.6

Le diff du dump est volumineux (réordonnancement) mais les **valeurs** ne
changent que sur deux factions :

- **Adepta Sororitas** — Exorcist 180 → 175 (et 220 → 215 au 3e : Δ=40
  inchangé, déjà encodé en forme native).
- **Adeptus Custodes** — la section est **refondue sur le codex 11e** :
  fiches renommées/scindées (Custodian Guard Sodality, Sentinel Guard
  Sodality, Gyrfalcon Jetbike Sodality, Aquilon Terminators ×2, Venatari ×2,
  Caladius Annihilator, Prosecutor/Vigilator/Witchseeker Squad…), nouveaux
  barèmes, **13 détachements** avec DP et Force Disposition officiels,
  listes d'améliorations renouvelées.
- **Aeldari** / **Orks** — cosmétique seulement (casse « Heavy Wraithcannon » ;
  libellé de taille Gretchin « 10 Gretchin » → « 10 models »). Aucune écriture.

La base portait déjà le codex Custodes 11e (décision du 2026-10-09) : prix,
fiches et améliorations étaient donc **déjà conformes** — le MFM rattrape la
base, pas l'inverse.

## Écritures de ce tir (2 fichiers)

**Imperium - Adepta Sororitas.cat**
- Exorcist : coût de base 180 → 175.

**Imperium - Adeptus Custodes.cat**
- 7 Force Dispositions réalignées sur le MFM : Auric Champions
  (Priority Assets → Purge the Foe), Emperor's Chosen (Take and Hold →
  Priority Assets), Grav-Assault Force (Purge the Foe → Reconnaissance),
  Lions of the Emperor (Take and Hold → Disruption), Null Maiden Vigil
  (Reconnaissance → Disruption), Shadowkeepers (Take and Hold → Purge the
  Foe), et **Guardians of the Throne** qui en offre deux au choix
  (Purge the Foe **+ Priority Assets**, second profil ajouté).
- 2 seuils de répétition corrigés (règle 5 / COWORK_TASK § 5bis) :
  Custodian Guard Sodality et Sentinel Guard Sodality, MFM
  « 1ST TO 3RD » ⟹ le +30 s'applique **dès le 4e** — condition `atLeast`
  value 3 → 4.

## Question ETAT.md n° 5 (DP Custodes) — RÉSOLUE par le MFM

Le v1.6 publie le DP des 13 détachements Custodes : **tous à 1 DP sauf
Guardians of the Throne à 3** (qui conserve son modifier Incursion = 2).
C'est exactement ce que porte la base — aucune écriture de DP nécessaire,
et la valeur « par défaut » retenue le 2026-10-13 est confirmée officielle.

Les 5 détachements du v1.5 que GW ne liste plus (Shield Host, Silent
Hunters, Solar Spearhead, Talons of the Emperor, Tharanatoi Hammerblow)
avaient déjà été retirés de la base avec le codex 11e : rien à arbitrer.

## Vérifications

`build-map` (avant et après écritures) · `apply.mjs` → **0 delta auto**
(était 1) · `phase3` → 0 à écrire · `dp-audit` → **DP, Force Dispositions et
UNIQUE alignés** · `tier-audit` → 0 ✗ · `wpn-audit` → 0 écart (130
conformes) · `valider.mjs` → 0 erreur, **444 ids dupliqués (ligne de base,
0 dépassement)**, 0 `defaultSelectionEntryId` cassé · `xmllint` OK sur les
deux fichiers.

## Résidu — TEXTE À FOURNIR (règle 6)

**Nouveau en v1.6 — 2 fiches Custodes du MFM absentes de la base :**
- **ARES GUNSHIP**
- **ORION ASSAULT DROPSHIP**

(Fiches Legends d'Imperial Armour que le MFM reprend désormais côté
Custodes. Ni alias ni invention possible : envoyer le texte des fiches.)

**Préexistant, inchangé** — mêmes entrées qu'en v1.5, aucune n'est du
travail qu'un tir ultérieur pourrait finir :
- ① fiches absentes de la base : ASTRAEUS et THUNDERHAWK GUNSHIP (×6
  chapitres Space Marines), GARGANTUAN SQUIGGOTH (Orks) ;
- ④ 15 unités à coût porté par les modèles (Ironstrider Ballistarii,
  Hippogriff AFV, Firestrike Servo-turrets, Invader ATVs, Lokhust Heavy
  Destroyers) — barème par modèle à confirmer ;
- ⑤ 3 prix à composition (Crusader Squad, Wolf Guard Headtakers, Tidewall
  Shieldline) ; **Gretchin est sorti du résidu** (le parser lit enfin
  « 10 models ») ;
- les 6 « ? » de `tier-audit` restent les encodages non standard déjà
  vérifiés conformes en v1.5 (Windriders, Decimus Kill Team, Atalan
  Jackals, Aquila Kill Team ×2, Inquisitorial Agents) ;
- les 12 « ? » de `phase3` sont la même classe que ④ (base sans paliers,
  coût par modèle) — aucune n'est touchée par le v1.6.

## Pourquoi le marqueur est posé

Même raisonnement qu'en v1.5 : le résidu restant est soit de la **donnée
absente de la base** (rien à écrire sans source utilisateur), soit des
encodages **vérifiés conformes**. Laisser le marqueur vide ferait tourner la
routine à vide et brouillerait la détection du prochain vrai MFM.
