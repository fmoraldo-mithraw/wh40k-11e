# Traductions des noms de données (New Recruit / nrdata)

`translations/<lang>.json` (racine du dépôt) : dictionnaires « chaîne anglaise →
traduction » appliqués par l'appli (cogitator-bellicum) en COUCHE D'AFFICHAGE —
les `.cat` restent anglais (ids, exports, YellowScribe inchangés).

## Récupération / mise à jour

```sh
node editor/translations/fetch-nr.mjs              # fr depuis nrdata.org
node editor/translations/fetch-nr.mjs fr es de it  # plusieurs langues
node editor/translations/fetch-nr.mjs --github fr  # repli miroir GitHub
```

Source : la base collaborative New Recruit (https://nrdata.org, système
`BSData/wh40k-10e`) ; repli : le miroir `NewRecruitEU/translations`. La fusion
préserve les corrections locales commitées ; seules les chaînes réellement
traduites (non vides, ≠ de l'anglais, `translated:true`) sont retenues.

NOTE : nrdata.org peut être bloqué par certains proxys d'entreprise/sandbox —
lancer le script depuis une machine au réseau ouvert.

## Consommation côté appli

vite-plugin-bsdata (cogitator) récupère `translations/*.json` avec les `.cat`,
les inclut dans l'empreinte de version (rafraîchissement auto des clients) et
les expose en chunks paresseux `virtual:bsdata-i18n/<lang>` ; `dataName()`
traduit à l'affichage quand la langue de l'UI a un pack.
