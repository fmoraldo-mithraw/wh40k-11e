# editor/mfm-source/ — OBSOLÈTE, ne pas relancer

Ancienne chaîne MFM d'**avant la 11e** (source « MFM marines » du 2026-06-17) :
textes `*.txt` par faction et outils `_tools/*.js` (`apply.js`, `leader_write.js`,
`leader_analyze.js`, `extract_unique.js`, `capcheck.js`).

**Ne pas relancer ces outils** : leurs textes listent comme fiches normales des
unités aujourd'hui **Legends** (Centurion Assault/Devastator Squad, Whirlwind,
Hammerfall Bunker, Predators SM, Vindicator, Valerian, Burna Boyz…). Les relancer
réintroduirait des cibles Legends, alors que la base n'en contient **aucune**
(décision du 2026-10-29 ; garde-fou `editor/audit/legends.mjs`).

Référence actuelle : `editor/mfm/dump/` (MFM v1.6, barème par faction) et
`editor/mfm/legends.json` (section LEGENDS) — outils dans `editor/mfm/`
(`editor/mfm/README.md`, guide `editor/MFM_PROMPT.md`).

Suppression du dossier : **à décider par l'utilisateur** (conservé en attendant).
