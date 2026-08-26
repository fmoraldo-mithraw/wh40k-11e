# MFM v1.3 — reste à traiter (en)

Mis à jour après l'application Phase 3 du 2026-08-26 : les 100 deltas de
points, 22 deltas de répétition, ~20 jeux de paliers, 13 améliorations et les
coûts imbriqués (War Walkers, Myphitic, Kapricus, Beasts of Nurgle) sont
APPLIQUÉS en base. Orks exclu (codex plus récent que le MFM v1.3). Ne restent
ici que les points exigeant une décision ou les dumps.

② AMÉLIORATIONS RÉELLEMENT ABSENTES DE LA BASE  [11]
   (les 26 autres lignes de l'ancien rapport existaient sous un nom suffixé
   « (Aura) » — le matcheur corrigé les résout ; prix re-comparés au prochain run)
   • [Dark Angels] Pennant of Remembrance (Unforgiven Task Force) — dét présent, amélioration absente
   • [Agents of the Imperium] Decoy Targets / Esoteric Explosives / Introneural Biotech / Micromelta Rounds (Veiled Blade Elimination Force) — dét présent, 4 améliorations absentes
   • [Necrons] Animus Damper / Quantum Goad / Reletavistic Tether / Singularity Matrix (Pantheon of Woe) — dét présent, 4 améliorations absentes
   • [Drukhari] Archraider (Reaper's Wager) — DÉTACHEMENT entier absent de la base
   • [Necrons] Mortality Shroud (The Phaeron's Armoury) — DÉTACHEMENT entier absent de la base
   → il faut les règles (prose) pour les ajouter — le MFM ne porte que les points.

③ COÛT DE CHAPITRE (datasheet partagée, prix divergent) — confirme, j'encode primary-catalogue  [15]
   • [Blood Angels] Assault Intercessor Squad 75→80 ; Assault Intercessors with Jump Packs 85→95 (palier 180) ;
     Bladeguard Veteran Squad 80→85 (palier 170) ; Captain with Jump Pack 75→80 ; Chaplain with Jump Pack 75→80 ;
     Vanguard Veteran Squad with Jump Packs 105→110 (palier 220)
   • [BA/DA/DW/SW] Repulsor Executioner 255→230 (SM garde 255 ?)
   • [SM/DW] Centurion Devastator Squad : palier MFM 365 (bdd 175/350)

④ COÛT PORTÉ PAR LES MODÈLES (unité à 0 partout en base — actuellement GRATUITES)  [4 familles]
   • [Adeptus Mechanicus] Ironstrider Ballistarii — MFM base 80
   • [Astra Militarum] Hippogriff AFV — MFM base 70
   • [SM + chapitres] Firestrike Servo-turrets — MFM base 75
   • [Necrons] Lokhust Heavy Destroyers — MFM base 50
   → besoin du barème par taille (dumps) pour poser les coûts par modèle.

⑤ PRIX À COMPOSITION (barème non « N models »)  [8 hors Orks]
   • Crusader Squad (BT), Outrider Squad (BT/BA/DA/DW/SM/SW), Wolf Guard
     Headtakers (SW), Tidewall Shieldline (T'au) — confirme l'encodage voulu.

⑥ PALIERS COMPLEXES restants (twins de répétition / multi-tailles)  [4]
   • [Adeptus Custodes] Allarus Custodians : MFM [280,340] vs bdd [110,165,275,330]
   • [Black Templars] Sword Brethren Squad : MFM [125,225,250] vs bdd (base+rép déjà à jour)
   • [Grey Knights] Paladin Squad : MFM [460] vs bdd [170,215,360,450]
   • [Necrons] Lokhust Destroyers : MFM [175] vs bdd [40,55,80,170]
   → besoin des dumps pour lever l'ambiguïté taille↔prix.

⑦ PRIX PAR RÉPÉTITION nouveaux (le seuil manque dans le rapport)  [8]
   • Allarus Custodians Δ30, Vertus Praetors Δ25, Servitor Battleclade Δ10,
     Contorted Epitome Δ10, Fiends Δ15, Poxbringer Δ10, Ravenwing Black
     Knights Δ10, Kapricus Defenders Δ10 — besoin des seuils (dumps).

── Pour tout finir d'un coup : le .gitignore accepte désormais
   editor/mfm/dump/en/*.json — relance run.sh (ou `git add editor/mfm/dump/en`)
   et pousse : les dumps me donnent les barèmes, seuils et prix manquants.
