# MFM v1.3 — reste à traiter (en)

TOUT EST APPLIQUÉ. Vérification finale contre les faction packs (Drive) :
les améliorations réputées « absentes » existaient TOUTES en base
(Upgrades rattachées aux unités, invisibles du parseur d'améliorations de
l'appli — trou de parseur, pas de donnée), prix tous conformes au MFM.
Seule vraie correction : Archraider (Reaper's Wager), entrée orpheline à
35 pts → 15 pts (MFM) et branchée au menu central comme ses trois sœurs.

Suivi restant (hors données de points) :
  • parseur appli (scripts/bsdata-parser.mjs) : faire remonter dans `enhs`
    les Upgrades rattachées aux datasheets du tronc SM partagé (Fierce
    Example, Death in the Dark, Fervent Exemplars…) pour que le matcheur
    MFM et l'appli les voient — sans quoi chaque MFM les re-signalera ;
  • intégration des Rules Updates (texte rouge/barré) des 17 faction packs
    du Drive/`editor/mfm/rules-updates/` — diff-check fiche par fiche
    (beaucoup sont déjà à jour en base) ;
  • Orks : MFM v1.3 antérieur au codex en base — ne jamais appliquer.
