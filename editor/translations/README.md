# Traductions des données (`translations/<lang>.json`)

`translations/<lang>.json` (racine du dépôt) : dictionnaires « chaîne anglaise →
traduction » appliqués par l'appli (cogitator-bellicum) en COUCHE D'AFFICHAGE.
Les `.cat` restent anglais — ids, exports YellowScribe et PDF inchangés, parce
que des mods TTS et les outils d'autres joueurs s'appuient sur les chaînes
canoniques.

Format consommé par `vite-plugin-bsdata` :

```json
{ "meta": { "system", "language", "builtAt", "source", "totalStrings" },
  "strings": { "<chaîne anglaise exacte>": "<traduction>" } }
```

Côté appli : `dataName()` pour les noms, `dataText()` pour la prose (même table),
`GlossTerm` affiche traduit tout en restant clefé sur l'anglais.

## D'où viennent les traductions

Par priorité décroissante — une source plus forte écrase toujours une plus
faible :

1. **Corrections locales** commitées dans `translations/fr.json`. Elles gagnent
   sur tout : c'est le moyen de figer un choix éditorial.
2. **Noms officiels Games Workshop** relevés sur `warhammer.com` et
   `warhammer-community.com/fr-fr`, avec URL de preuve et niveau de confiance.
   L'accès direct à ces sites est bloqué (403) : seuls les titres et extraits
   remontés par la recherche web sont exploitables.
3. **Army List Network** (`40k.armylistnetwork.com`), créateur de listes
   francophone dont la base est BILINGUE : chaque entrée porte sa forme
   française et sa version originale anglaise dans le même champ. Source la plus
   dense — voir ci-dessous.
4. **Traduction sous contrat de glossaire** pour tout le reste : un glossaire
   canonique fixe la terminologie, les accords, la casse, le balisage à
   préserver et les termes à laisser en anglais.

Les traductions issues d'ALN sont le fruit du travail bénévole de cette
communauté. Si ce dépôt est publié, la source doit être créditée.

## Récupérer ALN

Le site exige un compte et refuse les robots : la récupération se fait depuis une
machine au réseau ouvert, session ouverte à la main.

```sh
npm i playwright && npx playwright install chromium

node editor/translations/aln-dump.mjs      # 1. connexion manuelle + capture
node editor/translations/aln-fetch.mjs     # 2. récolte complète
node editor/translations/aln-probe.mjs --page "<url d'une liste en édition>"
                                           #    diagnostic si un endpoint casse
```

`aln-fetch.mjs` produit `aln-pairs.json` (couples EN→FR attestés) et
`aln-units.json` (fiches groupées avec leurs libellés). Ne jamais faire circuler
`aln-profile/` : il contient la session de connexion.

Endpoints (tous en GET, avec `X-Requested-With: XMLHttpRequest` et un `Referer`
`/form/unite.php`) :

| Endpoint | Contenu |
| --- | --- |
| `/form/ajax_select_unite.php?f_id_section=S&f_id_codex=C` | liste des unités d'une section |
| `/form/ajax_set_unite.php?f_id_codexunite=<id>` | fiche complète (armes, capacités, mots-clefs) |
| `/form/ajax_set_detachement.php?f_id_codexdetachement=<id>` | détachement + stratagèmes |

Le champ décisif est `option_data`, qui porte les deux langues d'un coup :

```
value="Pistolet bolter|1|1968|0|14049|Bolt pistol|Armes de Tir"
       └── FR ───────┘ │  │    │  └id┘ └── VO ──┘ └ catégorie ┘
                     type figure          (1=arme 2=capacité 3=mot-clef 4=faction)
```

`/form/unite.php` ne sert PAS ses listes déroulantes hors session de liste
ouverte : le récupérateur se rabat sur un balayage `codex × sections`, qui est
le mode nominal en pratique.

Les fiches dont ALN ne donne pas la version anglaise sont rattachées à leur
datasheet par RECOUVREMENT DE LIBELLÉS (deux fiches partageant plusieurs armes
décrivent le même objet), en deux passes : les cas nets d'abord, puis les
restants avec le champ des candidats restreint au bon fichier — la
correspondance codex ALN ↔ fichier du dépôt se déduisant par vote de la première
passe.

## Ce qu'ALN ne donne pas

Mesuré sur la base 11e (14 094 noms) : ALN en couvre ~37 %, très inégalement.

| Catégorie | Couverture |
| --- | --- |
| Capacités | 52 % |
| Armes / équipement | 47 % |
| Unités / modèles | 32 % |
| Mots-clefs | 13 % |
| Groupes d'options | 5 % |
| Règles / stratagèmes | 4 % |

Les creux sont structurels, pas un défaut de récolte : un créateur de listes n'a
pas besoin de nommer les groupes d'options techniques du format BattleScribe, et
ses stratagèmes n'ont pas de version originale. Inutile de récolter davantage.

De même, les libellés ALN privés de version anglaise ne s'apparient PAS aux
chaînes anglaises orphelines d'une même fiche : les taxonomies des deux systèmes
diffèrent (45 % de ces libellés sont la nomenclature interne d'ALN — « Armes de
Tir », « Faction », « Base »), et l'essai a produit des faux grossiers du genre
« Wraithcannon → Armes de mêlée ». Piste fermée : un pack faux est pire qu'un
pack partiel.

**Troisième impasse, mesurée sur la récolte réelle : rattacher les fiches ALN à
leur datasheet ne comble pas le trou des noms d'unité.** `aln-attach.mjs`
établit le chiffre et sert à ne pas rouvrir la piste. Ce que la récolte contient
vraiment, sur la fiche [2931] « Véroleux » prise comme cas d'école :

```
{"fr":"Chaos","type":"mot-clef"}        ← les MOTS-CLEFS sont en anglais
{"fr":"Poxwalkers","type":"mot-clef"}   ← le nom anglais est là
{"fr":"Véroleux","type":"profil"}       ← le nom français
{"fr":"Arme improvisée","type":"profil"}
{"fr":"Armes de Mêlée","type":"groupe"} ← taxonomie interne d'ALN
```

Deux enseignements. ALN laisse les mots-clefs en anglais : les couples attestés
sont donc inutiles pour rapprocher une fiche d'une datasheet, ses mots-clefs
suffisent. Et l'appariement par recouvrement d'ARMES est condamné — ALN écrit
« Arme improvisée » au singulier là où la base a « Improvised weapons » au
pluriel, et l'écart est la règle plutôt que l'exception.

Reste que les mots-clefs d'une variante contiennent ceux du générique : la fiche
« Land Raider des Grey Knights » porte le mot-clef « Land Raider » et se
rattache au mauvais datasheet. Même en pondérant par la rareté du mot-clef et en
exigeant une marge nette, le résultat plafonne : **10 noms nouveaux pour 69 %
d'accord** là où la traduction est déjà connue. Les désaccords ne sont pas tous
des erreurs (Bibliothécaire / Archiviste est un choix éditorial), mais certains
le sont franchement — « Firestorm Redoubt → Primaris Redoubt ». À ce taux,
fusionner injecterait des faux : `aln-attach.mjs --merge` refuse donc sous 90 %
d'accord, et il faut relire `aln-names.json` ligne à ligne pour passer outre.

Piège à connaître si la piste est reprise : ALN préfixe ses noms de balises de
collection (`[Legends] [SW] Gardes Loups`). Une première version prenait ces
noms tels quels et produisait 82 « traductions » dont **60 n'étaient que le
texte anglais avec la balise déplacée**. Un nom qui, balises retirées, égale
l'anglais n'est pas une traduction.

Deux autres impasses vérifiées, pour éviter de les rouvrir : le miroir
`NewRecruitEU/translations` ne contient que 2 chaînes pour ce système, et le fork
`shobu13/warhammer-40000-8th-edition-fr` est resté à l'état d'ébauche (une
faction, 8ᵉ édition). `nrdata.org`, `wahapedia`, `warhammer.com` et les wikis FR
sont bloqués au niveau réseau depuis un bac à sable.

## Noms officiels GW : `wh-com-fetch.mjs`

`wh-com-fetch.mjs` récolte les noms officiels français sur `warhammer.com`. Le
slug d'un produit est **identique dans toutes les langues**, seul le segment de
locale change (`/fr-CH/shop/Death-Guard-Poxwalkers-2021` ↔
`/en-GB/shop/Death-Guard-Poxwalkers-2021`) : la contrepartie anglaise s'obtient
par simple substitution, sans rien deviner. La seule étape heuristique est
produit→datasheet, à l'intérieur de l'anglais, où une erreur se voit. C'est ce
qui distingue cette source de l'impasse documentée plus haut (apparier des
libellés entre langues fabrique des faux).

```sh
npm i playwright && npx playwright install chromium

node editor/translations/wh-com-fetch.mjs --probe --url "<une fiche produit>"
node editor/translations/wh-com-fetch.mjs           # récolte → wh-pairs.json
node editor/translations/wh-com-fetch.mjs --merge   # ne comble que les trous
```

Playwright est obligatoire : `fetch` reçoit un 202 de 2 475 octets titré
« JavaScript is disabled ». Le site sert un défi anti-robot à tout client qui
n'est pas un navigateur, et aucun en-tête ne le contourne — même situation
qu'ALN. Le profil de navigation est persistant (`editor/translations/wh-profile/`,
ignoré par git : il contient des cookies de session) ; si le défi bloque,
relancer avec `--headed`.

À lancer depuis une machine au réseau ouvert : `warhammer.com` est bloqué depuis
un bac à sable. Deux hypothèses d'appariement ont été **réfutées** par le sondage
du site réel, inutile de les rouvrir : l'identifiant numérique dans le slug (il
n'y en a pas — le « 2021 » de `Death-Guard-Poxwalkers-2021` est l'année) et les
balises `hreflang` (le site n'en publie pas). Ce qui marche est plus simple : le
slug est identique dans toutes les langues, seul le segment de locale change.

**Rendement attendu, mesuré.** Un échantillon de 13 des 128 noms d'unité encore
anglais a été passé en recherche web : **une seule vraie traduction** (Blood
Claws → Griffes Sanglantes), douze noms que Games Workshop garde en anglais
(Genestealers, Talos, Venom, Hellions, Boyz, Nobz, Kommandos, Benefictus,
Locus, Cronos, Mek). Soit ~8 %. La méthode elle-même est
sûre — validée d'abord sur des noms dont le pack connaissait la réponse, Warp
Talons et Poxwalkers, tous deux retrouvés — mais le gisement est mince : ces
« trous » n'en sont pas, l'omission du pack est correcte puisque `dataName()`
retombe sur l'anglais. Ne pas surestimer ce que cette source peut rendre.

**Seconde salve, 2026-08-04 : le classement par TYPE de nom.** Le premier
échantillon penchait vers les xenos ; la salve suivante a couvert les 23 noms
Black Templars, les autres chapitres Space Marines, puis les gros paquets
restants (Sororitas, Custodes, Orks, Drukhari, Tyranids, Genestealer Cults,
Votann, T'au). Résultat : **zéro traduction côté Space Marines**, et deux
seulement sur tout le reste. Ce n'est pas un échec de la méthode, c'est une
régularité — Games Workshop France garde en anglais les **noms de véhicules**
(Rhino, Razorback, Impulsor, Repulsor, Vindicator, Whirlwind, Gladiator
Lancer/Reaper/Valiant, Storm Speeder Hailstrike/Hammerstrike/Thunderstrike,
Land Raider Crusader, Sagitaur, Devilfish…), les **grades** (Castellan,
Lieutenant, Techmarine), le **latin** (Palatine, Dogmata, Dialogus, Immolator,
Castigator, Biophagus, Clamavus, Sanctus, Primus, Nexos) et l'**argot ork**
(Boyz, Nobz, Mek, Kommandos). Elle traduit les **noms communs descriptifs** :
Poxwalkers → Véroleux, Warp Talons → Serres du Warp, Blood Claws → Griffes
Sanglantes, Witchseekers → Répurgatrices, Venomcrawler → Métaragne. Trier les
candidats par ce critère avant de chercher : c'est là qu'est le rendement, et
la prédiction « les Space Marines rendront davantage » était fausse.

Les deux prises de cette salve, et une **erreur du relevé précédent** :

- *Eightbound* → **Octoliés** (fiches produit françaises concordantes portant
  les deux noms : `lesdesmaskes.fr/…exalted-eightbound-octolies-exaltes`,
  `oupi.eu/…exalted-eightbound-eightbound…` titré « Octoliés Exaltés /
  Octoliés », plus rart.fr, trollune.fr, antretemps.com, vpc-forge.fr,
  mondes-fantastiques.com). Le pack se contredisait lui-même : il avait déjà
  `Eightbound Champion → Champion Octolié` mais rendait *Exalted Eightbound*
  par « Eightbound Exaltés ». Corrigé, et propagé aux chaînes de prose.
- *Myphitic Blight-hauler* → **Semi-chenillé Méphitique**. C'est le titre de la
  fiche **warhammer.com** elle-même (`Etb-Death-Guard-Myphitic-Blight-hauler-2020`
  en français), confirmé par une dizaine de revendeurs. Le relevé du premier
  échantillon le rangeait à tort parmi les noms gardés en anglais : la ligne
  ci-dessus a été corrigée. Le pack contenait déjà le pluriel, mal orthographié
  (« Semi-chenillé méphytique ») — réparé, et le nom substitué au terme anglais
  resté dans deux règles de détachement Death Guard.

**Portée.** La boutique vend des boîtes : elle donne des noms d'**unité**, et
rien d'autre. Sur les 1 460 chaînes sans traduction (359 unités, 549 armes,
460 mots-clefs, 92 capacités), seule la part « unités » est atteignable ici, et
seulement pour les unités vendues en boîte. Le script chiffre en fin de course
la proportion de trous réellement comblés.

## Le pack se relit lui-même : `atteste-conserve.mjs`

La meilleure source n'est pas sur le web, elle est **dans le pack**. Celui-ci
contient des dizaines de milliers de chaînes de PROSE traduites, et un terme
absent en tant que clef y apparaît très souvent à l'intérieur d'une autre clef
traduite. La valeur française tranche alors toute seule :

    "Signum Array"           → "Panoplie de Signums"          ⇒ Signum est CONSERVÉ
    "Voidraven Bomber"       → "Bombardier Korvide"           ⇒ Voidraven se TRADUIT
    "Faction: Blood Legions" → "Faction : Légions du Sang"    ⇒ idem

C'est gratuit, instantané, et bien plus fiable qu'une recherche web. Le script
classe chaque terme sans entrée en quatre verdicts — **conservé** (omission
correcte, à sortir du décompte des trous), **traduit ailleurs** (vrai trou, avec
le candidat français en main), **mixte**, **inconnu** — et n'écrit que
`atteste.json`.

Mesuré sur 717 termes : **258 conservés attestés** (36 %), 22 traduits ailleurs,
64 mixtes, 373 inconnus. Autrement dit, plus d'un tiers du décompte des « trous »
n'en était pas.

**La fusion automatique est interdite, et ce n'est pas de la prudence de façade.**
Deux pièges mesurés :

- **Stormlord** — mot-clef d'un char des Genestealer Cults (variante de
  Baneblade). La seule preuve du pack est « Imotekh the Stormlord » → « Imotekh
  le Seigneur des Tempêtes », qui parle du Necron. Une fusion aurait renommé le
  char.
- **Aggressors** — « Optimised Aggressors » → « Agresseurs Optimisés » donne un
  verdict TRADUIT net et faux : le pack rend « Aggressor Squad » par « Escouade
  Aggressor ». D'où le **contrôle de nombre** : le script interroge aussi le
  singulier/pluriel et rétrograde en MIXTE dès qu'il contredit. Une preuve unique
  ne suffit jamais.

Retenus après relecture (2026-08-04, 20 entrées) : *Voidraven* → **Korvide**,
*Ossefactor* → **Ossefacteur**, *Helstalker* → **Métarôdeur**, *Dark Talon* →
**Darktalon**, *Cyberwolf* → **Cyberloup**, *Abominant* → **Abominable**,
*Earthshakers* → **Trembleterres**, *Tesseract Ark* → **Arche Tesseract**,
*Iron-master* → **Maître-Fer**, *Tyranids* → **Tyranides**, les trois Legions
(*Plague* → **de Peste**, *Blood* → **du Sang**, *Scintillating* →
**Scintillantes**) et six armes Custodes/Ork (*Adrasite spear* → **Lance
adrasite**, *Lastrum bolt cannon* → **Canon bolter Lastrum**, *Adrathic
devastator* → **Dévastateur adrathic**, *Twin las-pulsar* → **Las-pulsar
jumelé**, *Infernus firepike* → **Pique de feu Infernus**, *Venatari lance* →
**Lance Venatari**, *Krusha kannon* → **Kannon Krusha**). Écartés : les termes
suffixés `[Legends]` (le suffixe fausse la preuve), et les écarts de simple casse
ou d'apostrophe (*Aun'shi*, *Shas'o R'alai*, *Bio-plasma*), qui ne sont pas des
traductions.

**Le cas des noms d'amélioration.** Les 33 restants ne sont PAS du texte
descriptif comme on pouvait le croire : ce sont des néologismes néo-latins —
*Praesidius*, *Admonimortis*, *Panoptispex*, *Spiritus Ferrum*, *Incandaeum*,
*Ignis Judicium*, *Cornucophagus*, *Pharmacophex*, *Vox-Diabolus*… Le script en
certifie quatre comme conservés (*Immolator*, *Fusillade*, *Prescience*,
*Skjald*), les autres n'apparaissent nulle part ailleurs dans le pack. La
structure appuie la même lecture : ce sont des **singletons isolés dans des
détachements par ailleurs entièrement traduits** (« Spectacle of Spite » 3/4,
« Grand Coven » 3/4, « Librarius Conclave » 3/5…), c'est-à-dire ce que le
traducteur a laissé parce qu'il n'y avait rien à traduire. La seule exception,
*Explorator Maniple* des Adeptus Mechanicus (0/4), porte quatre titres du culte
— Magos, Genetor, Logis, Artisan — que le français garde aussi.

## Ancienne source : New Recruit

`fetch-nr.mjs` aspire les traductions communautaires New Recruit (`nrdata.org`,
repli sur le miroir GitHub). Conservé, mais la base vivante est inaccessible
depuis un environnement isolé et le miroir est quasi vide.

## Assemblage et contrôle du pack

Le pack est assemblé à partir des lots de traduction, puis passé au crible avant
commit. Trois choses sont à savoir avant d'y toucher.

**Arbitrage des sources.** Une chaîne traduite par plusieurs sources est tranchée
par rang : corrections vérifiées > corrections locales déjà commitées > noms
officiels GW > ALN attesté > ALN déduit par fiche > lots de noms > lots de prose.
L'arbitrage se fait à l'assemblage, pas à l'écriture des lots : deux producteurs
écrivant le même fichier ne dépendent ainsi d'aucun ordre. Une traduction égale à
l'anglais est écartée du pack — `dataName()` retombe déjà sur la chaîne source.

**Corrections vérifiées.** Deux formes, toutes deux au-dessus de l'arbitrage :

- par chaîne entière, pour figer un nom (`Zarakynel [Legends]`, pas
  `Shalaxi Helbane` : deux Gardiens des Secrets différents) ;
- par terme, en remplacement sur toutes les valeurs FR, pour un mot tranché mais
  dispersé dans des dizaines de chaînes de prose. C'est le cas de la capacité
  *Infiltrators* → **Infiltrateurs** (comme Scouts → Éclaireurs, Stealth →
  Furtivité), avec exclusion des contextes où le mot est un NOM D'UNITÉ, qui
  reste en anglais : `Escouade d'Infiltrators`, `Infiltrators Sicarian`,
  mot-clef entre `^^** **^^`.
- *Blood Claws* → **Griffes Sanglantes** (2026-08-04, relevé sur la fiche
  produit d'un revendeur français dont l'URL porte les deux noms :
  `antretemps.com/space-wolves-griffes-sanglantes-warhammer-40k`).
- *Eightbound* → **Octoliés**, *Exalted Eightbound* → **Octoliés Exaltés**,
  *Lord of the Eightbound* → **Seigneur des Octoliés** (2026-08-04).
- *Myphitic Blight-hauler* → **Semi-chenillé Méphitique** (2026-08-04, titre de
  la fiche warhammer.com en français).
- **Déclinaisons de nombre** (2026-08-04, 32 clefs). Le pack connaissait le nom
  dans UN nombre, la composition l'affiche dans l'AUTRE : la ligne de groupe dit
  « Blood Claws » (traduit) et la ligne de figurine « Blood Claw » (anglais).
  Ces 32 clefs sont les formes manquantes, déclinées **à la main** : la
  morphologie française n'est pas mécanisable — « Griffes Sanglantes » s'accorde
  aux deux mots, « Tout-terrain Achilles » est invariable, « Motoch'nill' » ne
  bouge pas. Deux candidats ont été **écartés** : *Vyper*, dont le français est
  identique à l'anglais (règle du pack), et *Infiltrator*, parce que le pack
  réserve « Infiltrateurs » à la CAPACITÉ et garde le nom d'unité en anglais
  (voir la correction par terme ci-dessus) — décliner aurait cassé cette règle.
- *Poxwalker(s)* → **Véroleux** (2026-08-04, nom GW rapporté par le mainteneur).
  Contrairement à *Infiltrators*, celui-ci se traduit PARTOUT, y compris comme
  nom d'unité et comme mot-clef : le pack le laissait en anglais aussi bien dans
  la prose que dans le nom de datasheet. « Véroleux » étant invariable, singulier
  et pluriel donnent la même forme. 12 valeurs de prose reprises (balisage
  `^^ **` conservé) et 2 clefs ajoutées, `Poxwalkers` et la composition
  `10-20 Poxwalkers`.

Chaque correction porte sa preuve et sa date : ce sont des choix éditoriaux, ils
doivent pouvoir être rediscutés sans être redécouverts.

**Contrôle des opérateurs de règles.** Une nuance perdue sur `must`/`can`,
`within`/`wholly within` ou une valeur de dé ne donne pas une traduction
maladroite, elle donne une **règle fausse** : ces contrôles sont bloquants, le
reste de la QA est indicatif. Pièges rencontrés, tous vérifiés :

- Le corpus GW contient des **espaces insécables au milieu des mots** (`each
  time`, 1 182 clefs). Elles viennent des `.cat` et doivent y rester : les clefs
  du pack sont les chaînes sources à l'octet près. Mais tout `\b…\b` bâti sur une
  espace ordinaire les traverse sans rien voir — un vérificateur doit normaliser
  pour COMPARER, jamais pour écrire.
- `D3XP` est un D3, pas un 3 : lire les dés avant les chiffres.
- La modalité française a plusieurs formes légitimes — « ne peut **plus** », « ne
  peuvent **normalement** pas », « les figurines **pouvant** embarquer ». Exiger
  `ne peut pas` produit des faux positifs, pas des erreurs.
- « wholly within *une zone* » se rend « entièrement dans … », jamais « … ou
  moins », qui est réservé aux distances (`within 6"` → « à 6" ou moins »).

Un écart connu subsiste, assumé : une règle de Croisade dont l'anglais dit
« roll a number of **6** » là où la suite du texte (« for each roll of 6 », « for
each roll of 1 ») impose de lire **D6**. Le français traduit la règle telle
qu'elle se joue, et diverge donc de la coquille de la source.

## Consommation côté appli

`vite-plugin-bsdata` (cogitator) récupère `translations/*.json` avec les `.cat`,
les inclut dans l'empreinte de version (rafraîchissement automatique des
clients) et les expose en chunks paresseux `virtual:bsdata-i18n/<lang>`.
