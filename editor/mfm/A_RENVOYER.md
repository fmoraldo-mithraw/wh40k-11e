# MFM — à renvoyer (en, v1.6)

╔══ ⚑ À ME RENVOYER — non traité automatiquement ══╗

① NOMS MFM SANS DATASHEET — envoie-moi le nom EXACT de la datasheet .cat (ou son bsId) : j'ajoute l'alias.  [15]
   • [Adeptus Custodes] ARES GUNSHIP — aucune datasheet .cat pour ce nom MFM
   • [Adeptus Custodes] ORION ASSAULT DROPSHIP — aucune datasheet .cat pour ce nom MFM
   • [Black Templars] ASTRAEUS — aucune datasheet .cat pour ce nom MFM
   • [Black Templars] THUNDERHAWK GUNSHIP — aucune datasheet .cat pour ce nom MFM
   • [Blood Angels] ASTRAEUS — aucune datasheet .cat pour ce nom MFM
   • [Blood Angels] THUNDERHAWK GUNSHIP — aucune datasheet .cat pour ce nom MFM
   • [Dark Angels] ASTRAEUS — aucune datasheet .cat pour ce nom MFM
   • [Dark Angels] THUNDERHAWK GUNSHIP — aucune datasheet .cat pour ce nom MFM
   • [Deathwatch] ASTRAEUS — aucune datasheet .cat pour ce nom MFM
   • [Deathwatch] THUNDERHAWK GUNSHIP — aucune datasheet .cat pour ce nom MFM
   • [Orks] GARGANTUAN SQUIGGOTH — aucune datasheet .cat pour ce nom MFM
   • [Space Marines] ASTRAEUS — aucune datasheet .cat pour ce nom MFM
   • [Space Marines] THUNDERHAWK GUNSHIP — aucune datasheet .cat pour ce nom MFM
   • [Space Wolves] ASTRAEUS — aucune datasheet .cat pour ce nom MFM
   • [Space Wolves] THUNDERHAWK GUNSHIP — aucune datasheet .cat pour ce nom MFM

④ COÛT PORTÉ PAR LES MODÈLES (unité à 0, prix sur les modèles) — confirme le barème par modèle de composition.  [15]
   • [Adeptus Mechanicus] IRONSTRIDER BALLISTARII — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Astra Militarum] HIPPOGRIFF AFV — coût unité 0 (probablement porté par les modèles de composition), MFM base=70
   • [Black Templars] FIRESTRIKE SERVO-TURRETS — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Black Templars] INVADER ATVS — coût unité 0 (probablement porté par les modèles de composition), MFM base=65
   • [Blood Angels] FIRESTRIKE SERVO-TURRETS — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Blood Angels] INVADER ATVS — coût unité 0 (probablement porté par les modèles de composition), MFM base=65
   • [Dark Angels] FIRESTRIKE SERVO-TURRETS — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Dark Angels] INVADER ATVS — coût unité 0 (probablement porté par les modèles de composition), MFM base=65
   • [Deathwatch] FIRESTRIKE SERVO-TURRETS — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Deathwatch] INVADER ATVS — coût unité 0 (probablement porté par les modèles de composition), MFM base=65
   • [Necrons] LOKHUST HEAVY DESTROYERS — coût unité 0 (probablement porté par les modèles de composition), MFM base=50
   • [Space Marines] FIRESTRIKE SERVO-TURRETS — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Space Marines] INVADER ATVS — coût unité 0 (probablement porté par les modèles de composition), MFM base=65
   • [Space Wolves] FIRESTRIKE SERVO-TURRETS — coût unité 0 (probablement porté par les modèles de composition), MFM base=80
   • [Space Wolves] INVADER ATVS — coût unité 0 (probablement porté par les modèles de composition), MFM base=65

⑤ PRIX À COMPOSITION (tailles spéciales : Runtherds…) — le barème MFM est donné ci-dessous, confirme l'encodage voulu.  [3]
   • [Black Templars] CRUSADER SQUAD — composition (taille non « N model ») — barème MFM: 1 Sword Brother, 4 Neophytes, 5 Initiates=160, 1 Sword Brother, 8 Neophytes, 11 Initiates=305
   • [Space Wolves] WOLF GUARD HEADTAKERS — composition (taille non « N model ») — barème MFM: 3 Wolf Guard Headtakers=85, 3 Wolf Guard Headtakers, 3 Hunting Wolves=115, 6 Wolf Guard Headtakers=170, 6 Wolf Guard Headtakers, 6 Hunting Wolves=230, 3 Wolf Guard Headtakers=95, 3 Wolf Guard Headtakers, 3 Hunting Wolves=125, 6 Wolf Guard Headtakers=180, 6 Wolf Guard Headtakers, 6 Hunting Wolves=240
   • [T'au Empire] TIDEWALL SHIELDLINE — composition (taille non « N model ») — barème MFM: 1 model=85, + 1 Tidewall Defence Platform=20

════ DRY-RUN ════

## Audit DP / Force Disposition (ÉCARTS)

✗ ÉCARTS DP/FD/UNIQUE (7) — à corriger via editor/lib/catalog.js :
  ✗ [adeptus-custodes] Auric Champions (Imperium - Adeptus Custodes.cat) : FD «Priority Assets»→«PURGE THE FOE»
  ✗ [adeptus-custodes] Emperor's Chosen (Imperium - Adeptus Custodes.cat) : FD «Take and Hold»→«PRIORITY ASSETS»
  ✗ [adeptus-custodes] Grav-Assault Force (Imperium - Adeptus Custodes.cat) : FD «Purge the Foe»→«RECONNAISSANCE»
  ✗ [adeptus-custodes] Guardians of the Throne (Imperium - Adeptus Custodes.cat) : FD «Purge the Foe»→«PRIORITY ASSETS / PURGE THE FOE»
  ✗ [adeptus-custodes] Lions of the Emperor (Imperium - Adeptus Custodes.cat) : FD «Take and Hold»→«DISRUPTION»
  ✗ [adeptus-custodes] Null Maiden Vigil (Imperium - Adeptus Custodes.cat) : FD «Reconnaissance»→«DISRUPTION»
  ✗ [adeptus-custodes] Shadowkeepers (Imperium - Adeptus Custodes.cat) : FD «Take and Hold»→«PURGE THE FOE»

## Audit surcoûts d'armes

✓ surcoûts d'armes conformes : 130
✓ aucun écart de surcoût d'arme détecté.

## Octrois de LEADER par amélioration

= adepta-sororitas :: PENITENT HOST / Catechism of Divine Penitence → Repentia Squad
= astra-militarum :: ABHUMAN AUXILIARIES / Exemplar of Duty (Upgrade) → Ogryn Squad, Bullgryn Squad
= astra-militarum :: GRIZZLED COMPANY / Abhuman Detail → Ogryn Squad, Bullgryn Squad
= chaos-space-marines :: MURDERTALON RAIDERS / Pact of Cursed Pinions → Warp Talons
= chaos-space-marines :: NIGHTMARE HUNT / Sorrowscent Vulture → Warp Talons
= emperors-children :: COURT OF THE PHOENICIAN / Exalted Patron → Flawless Blades
= orks :: TAKTIKAL BRIGADE / Kill Kommanda → Kommandos
= orks :: WRECKAS / Kaptin's Hat → Flash Gitz
= space-wolves :: SAGA OF THE BEASTSLAYER / Wolf-Touched → Wulfen, Wulfen with Storm Shields
= thousand-sons :: WARPMELD PACT / Bray Lord → Tzaangors
= world-eaters :: CULT OF BLOOD / Butcher Lord → Jakhals, Goremongers
= world-eaters :: KHORNE DAEMONKIN / Disciple of Khorne → Bloodcrushers, Flesh Hounds

12 amélioration(s) avec octroi LEADER, 0 lien(s) à ajouter.

(dry-run — relancer avec --apply pour écrire)

## Audit seuils de paliers

unités examinées : 350 · paliers déjà conformes : 299
── SEUILS À CORRIGER (0) — palier appliqué dès la taille listée au lieu de la précédente + 1 ──
── À VÉRIFIER À LA MAIN (6) — encodage non standard (sélecteur de taille, doublon de prix, coût de chapitre…) ──
  ? [aeldari] WINDRIDERS (Windriders) : palier 6=170 appliqué dès 1 modèles (ni 6 ni 4)
  ? [deathwatch] DECIMUS KILL TEAM (Decimus Kill Team) : palier 10=210 appliqué dès 1 modèles (ni 10 ni 6)
  ? [genestealer-cults] ATALAN JACKALS (Atalan Jackals) : palier 9=160 appliqué dès 1 modèles (ni 9 ni 6)
  ? [imperial-agents] AQUILA KILL TEAM (Aquila Kill Team) : palier 10=210 appliqué dès 1 modèles (ni 10 ni 6)
  ? [imperial-agents] AQUILA KILL TEAM (Aquila Kill Team) : palier 10=210 appliqué dès 1 modèles (ni 10 ni 6)
  ? [imperial-agents] INQUISITORIAL AGENTS (Inquisitorial Agents) : palier 12=120 → 0 modifier(s) à ce prix
