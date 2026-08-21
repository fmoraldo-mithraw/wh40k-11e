# Règles d'arme conditionnelles à la cible — prompt autonome (application consommatrice, type cogitator-bellicum)

La 11ᵉ édition introduit (via le codex Orks, mais ce sont des **règles
universelles du jeu**) des variantes *conditionnées au type de la cible*
des aptitudes d'arme classiques : Lethal Hits, Sustained Hits,
Devastating Wounds, plus la restriction de ciblage **Hunter**. Le format
BattleScribe ne sait pas exprimer « seulement contre tel type de cible »
fonctionnellement : le dépôt les encode par un **double canal** que
l'application doit reconnaître et évaluer.

## Où vivent les règles

Les cinq règles sont dans `Warhammer 40,000.gst` → `<sharedRules>` (elles
ont d'abord vécu dans `Orks.cat` ; les ids n'ont pas changé). Toute
faction peut les référencer — la résolution des `infoLink` est
**inter-fichiers** (voir `SHARED_LIBRARY_RULES_APP_PROMPT.md`).

| Règle (nom du `<rule>`) | id (`targetId`) | Mot-clef canonique sur le profil d'arme |
|---|---|---|
| Lethal Hits (non-Monster/Vehicle) | `0d1a-9f3b-7c40-1c01` | `Lethal Hits (non-MONSTER/VEHICLE)` |
| Hunter (Monster/Vehicle) | `0d1a-9f3b-7c40-1c06` | `Hunter (MONSTER/VEHICLE)` |
| Devastating Wounds (Infantry) | `0d1a-9f3b-7c40-1c07` | `Devastating Wounds (INFANTRY)` |
| Devastating Wounds (Monster/Vehicle) | `0d1a-9f3b-7c40-1c08` | `Devastating Wounds (MONSTER/VEHICLE)` |
| Sustained Hits (Monster/Vehicle) | `0d1a-9f3b-7c40-1c09` | `Sustained Hits N (MONSTER/VEHICLE)` |

## Encodage : double canal

Sur chaque arme concernée (`selectionEntry` d'arme) :

1. **Canal texte** — la characteristic `Keywords` du profil
   (`typeId="7f1b-8591-2fcf-d01c"` tir, `"893f-9000-ccf7-648e"` mêlée)
   contient la chaîne canonique ci-dessus, dans la liste des mots-clefs.
   C'est le canal d'**affichage** (imprimer tel quel entre crochets).
2. **Canal structurel** — un `<infoLink type="rule" targetId="…"/>` vers
   l'id de la règle, posé sur la `selectionEntry` de l'arme. C'est le
   canal **sémantique** : c'est lui qui fait foi pour l'évaluation.

Regex de reconnaissance sur `Keywords` (tolérantes à la casse) :

```
/Lethal Hits \(non-MONSTER\/VEHICLE\)/i
/Hunter \(MONSTER\/VEHICLE\)/i          # graphie héritée possible : « Hunter: MONSTER/VEHICLE »
/Devastating Wounds \((INFANTRY|MONSTER\/VEHICLE)\)/i
/Sustained Hits (\d+) \(MONSTER\/VEHICLE\)/i
```

Attention aux **règles de base non conditionnelles** : `Lethal Hits`,
`Sustained Hits N`, `Devastating Wounds` *sans parenthèse de cible*
existent toujours (ids gst classiques) et s'appliquent à toute cible. Ne
jamais faire matcher la variante conditionnelle sur la forme simple.

## Sémantique (à évaluer avec les mots-clefs du DÉFENSEUR)

La cible se classe par ses catégories : `MONSTER`
(`9693-cf84-fe69-37a9`), `VEHICLE` (`dbd4-63-af05-998`), `INFANTRY`
(`cf47-a0d7-7207-29dc`) — après évaluation des éventuels grants
conditionnels de catégories.

- **Lethal Hits (non-M/V)** : une touche critique blesse automatiquement
  **seulement si** la cible n'est **ni** MONSTER **ni** VEHICLE. Aucun
  effet contre M/V.
- **Sustained Hits N (M/V)** : une touche critique génère N touches
  supplémentaires **seulement contre** une cible MONSTER **ou** VEHICLE.
- **Devastating Wounds (INFANTRY)** / **(M/V)** : une blessure critique
  inflige des Devastating Wounds (blessures mortelles égales à la
  characteristic D) **seulement contre** une cible du type indiqué.
- **Hunter (M/V)** : ce n'est pas un modificateur mais une **restriction
  de ciblage au niveau du profil** : un profil marqué Hunter ne peut être
  choisi/utilisé **que** contre une cible MONSTER/VEHICLE.

## Hunter × profils « ➤ un-au-choix »

Les profils Hunter apparaissent dans des armes multi-profils à
choix (préfixe `➤`, convention du dépôt : on choisit UN profil avant de
cibler — ex. Busta Rokkit Launcha Standard/Hunter des Tankbustas,
Beastchoppa Standard/Hunter). L'appli doit :
- en création de liste : afficher les deux profils normalement ;
- en résolution/simulation : **griser ou exclure** le profil Hunter si la
  cible n'est pas MONSTER/VEHICLE (et, symétriquement, il est souvent le
  meilleur choix quand elle l'est) ;
- ne jamais additionner les deux profils d'une même arme `➤`.

## Repli et audit

- La **donnée prime** : si le `Keywords` et l'`infoLink` divergent,
  suivre l'`infoLink` (canal sémantique) et loguer l'écart.
- Sentinelle d'audit côté appli : toute arme dont `Keywords` matche une
  des regex doit porter l'`infoLink` correspondant, et réciproquement
  (au chargement, compter les paires et alerter sur les orphelins).
- Ces règles étant dans le gst, une faction future peut les utiliser sans
  aucun changement côté appli : ne rien coder de spécifique aux Orks.
