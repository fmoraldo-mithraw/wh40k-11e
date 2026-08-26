#!/usr/bin/env node
// apply.mjs — Phase 2 de l'intégration continue MFM (dry-run par défaut).
// Compare, pour chaque unité/amélioration MATCHÉE dans la matrice
// (editor/mfm/map/<slug>.json), les points MFM aux points ACTUELS de la bdd
// (champ `current` de la matrice), et imprime les DELTAS à appliquer. N'ÉCRIT
// RIEN : --dry est le seul mode implémenté ici (l'écriture réelle = phase 3,
// via editor/lib/catalog.js après ce diff validé).
//
// Garde-fous « ne rien insérer de douteux » — une proposition de changement
// n'est émise QUE si TOUTES ces conditions tiennent, sinon la ligne part en
// SKIP/REVIEW (jamais en delta appliquable) :
//   • chaque valeur MFM est un entier fini 0 < p ≤ 3000 ;
//   • le delta reste dans une fourchette plausible (|Δ| ≤ 200) ;
//   • la cible bdd a bien un coût du type attendu (base présente pour une base,
//     etc.) — un « nouveau coût » (cat sans base, MFM avec) part en REVIEW ;
//   • les unités à composition (tailles hors « N model ») et le dual-cost Agents
//     sont détectés et exclus de l'auto (REVIEW).
//
// Usage : node editor/mfm/apply.mjs <dir-json-mfm> [slug] [--changed-only]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const MAP_DIR = path.join(HERE, "map");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const pos = args.filter((a) => !a.startsWith("--"));
const mfmDir = pos[0];
const onlySlug = pos[1] || null;
const changedOnly = flags.has("--changed-only");
if (!mfmDir || !fs.existsSync(mfmDir)) {
  console.error("usage: node editor/mfm/apply.mjs <dir-json-mfm> [slug] [--changed-only]");
  process.exit(1);
}

const MAX_PTS = 3000, MAX_DELTA = 200;
// Valide un point MFM → entier sûr, ou lève (capté → REVIEW, jamais appliqué).
function safePts(raw, ctx) {
  const n = Number(raw);
  if (raw == null || !Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > MAX_PTS)
    throw new Error(`valeur MFM non sûre (${JSON.stringify(raw)}) — ${ctx}`);
  return n;
}
const sizeModels = (s) => { const m = String(s || "").match(/^(\d+)\s+model/i); return m ? Number(m[1]) : null; };

// Extrait de l'unité MFM une structure de coûts NORMALISÉE, ou signale pourquoi
// elle n'est pas automatisable (composition, dual-cost, valeur douteuse).
function mfmUnitCosts(u) {
  const profs = Array.isArray(u.profiles) ? u.profiles : [];
  // Toute taille non « N model(s) » (Gretchin « 1 Runtherd, 20 Gretchin », etc.)
  // → prix à composition : hors périmètre auto.
  const compPriced = profs.some((p) => p.size && sizeModels(p.size) == null && !/^per\b/i.test(p.size));
  if (compPriced) return { skip: "composition (taille non « N model »)" };
  const isRepeatTier = (t) => /\d+(ST|ND|RD|TH)/.test(t || "");
  const repeat = profs.some((p) => isRepeatTier(p.tier));
  // Regroupe (tier→[{models,pts}]). On ne garde que les profils à taille modèle.
  const byTier = new Map();
  for (const p of profs) {
    const n = sizeModels(p.size);
    if (n == null) continue;
    const pts = safePts(p.points, `${u.name} / ${p.tier} / ${p.size}`);
    if (!byTier.has(p.tier)) byTier.set(p.tier, []);
    byTier.get(p.tier).push({ models: n, pts });
  }
  if (byTier.size === 0) return { skip: "aucun profil à taille modèle" };
  const tiers = [...byTier.values()].map((arr) => arr.sort((a, b) => a.models - b.models));
  const first = tiers[0];                                   // 1er palier (ou l'unique)
  const basePts = first[0].pts;                             // plus petite taille
  const sizeTierPts = first.slice(1).map((x) => x.pts);     // tailles supérieures
  let repeatDelta = null;
  if (repeat && tiers.length >= 2) {
    // Δ répétition = prix (4TH+) − prix (1ST) à la MÊME (plus petite) taille.
    const later = tiers[1];
    const a = first.find((x) => x.models === later[0].models) || first[0];
    repeatDelta = later[0].pts - a.pts;
  }
  return { basePts, sizeTierPts, repeatDelta };
}

// Un delta plausible ? (garde-fou contre une extraction aberrante)
const saneDelta = (d) => Number.isInteger(d) && Math.abs(d) <= MAX_DELTA;

const slugs = fs.readdirSync(MAP_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .filter((s) => !onlySlug || s === onlySlug);

let tot = { units: 0, deltas: 0, review: 0, enhDeltas: 0 };
const lines = [];

// Détection de conflit sur datasheet PARTAGÉE : un même bsId (le tronc Space
// Marines importé par plusieurs chapitres) peut recevoir un prix DIFFÉRENT
// selon la faction — c'est un coût spécifique de chapitre
// (MARINE_CHAPTER_COST_APP_PROMPT), à encoder par modifier conditionné
// primary-catalogue, JAMAIS par une écriture brute sur l'entrée partagée qui
// écraserait les autres factions. Pré-passe : on collecte toutes les valeurs
// cibles proposées par (bsId, champ) à travers TOUTES les factions ; celles qui
// divergent sont marquées conflictuelles → REVIEW pour tout le monde.
const proposalsByKey = new Map();                          // `${bsId}|${field}` → Set(valeurs cibles)
function recordProposal(bsId, field, to) {
  const k = bsId + "|" + field;
  if (!proposalsByKey.has(k)) proposalsByKey.set(k, new Set());
  proposalsByKey.get(k).add(JSON.stringify(to));
}
function isConflicted(bsId, field) {
  const s = proposalsByKey.get(bsId + "|" + field);
  return s && s.size > 1;
}

// Pré-passe : collecte des valeurs cibles par (bsId, champ), toutes factions.
for (const slug of slugs) {
  const map = JSON.parse(fs.readFileSync(path.join(MAP_DIR, slug + ".json"), "utf8"));
  const mfmPath = path.join(mfmDir, slug + ".json");
  if (!fs.existsSync(mfmPath)) continue;
  const mfm = JSON.parse(fs.readFileSync(mfmPath, "utf8"));
  const seen = new Set();
  for (const mu of mfm.units) {
    const entry = map.matched[mu.name];
    if (!entry || seen.has(mu.name)) continue; seen.add(mu.name);
    let costs; try { costs = mfmUnitCosts(mu); } catch { continue; }
    if (costs.skip) continue;
    for (const tgt of entry.targets) {
      if (costs.basePts != null && tgt.current.basePts) recordProposal(tgt.bsId, "base", costs.basePts);
      const mfmTierPts = [...(costs.sizeTierPts || [])].sort((a, b) => a - b);
      if (mfmTierPts.length) recordProposal(tgt.bsId, "tiers", mfmTierPts);
      if (costs.repeatDelta != null) recordProposal(tgt.bsId, "repeat", costs.repeatDelta);
    }
  }
}

// Passe principale : émission (dédup les écritures identiques d'un même bsId
// vue depuis plusieurs factions ; met en REVIEW les bsId conflictuels).
const emittedWrite = new Set();                            // `${bsId}|${field}` déjà émis en Δ
const actions = [];                                        // { cat, faction, name, detail } — « à me renvoyer »
for (const slug of slugs) {
  const map = JSON.parse(fs.readFileSync(path.join(MAP_DIR, slug + ".json"), "utf8"));
  const mfmPath = path.join(mfmDir, slug + ".json");
  if (!fs.existsSync(mfmPath)) continue;
  const mfm = JSON.parse(fs.readFileSync(mfmPath, "utf8"));

  const facLines = [];                                      // uniquement les Δ auto-applicables
  const review = (cat, name, detail) => { actions.push({ cat, faction: map.faction, name, detail }); tot.review++; };
  // ── unités ────────────────────────────────────────────────────────────────
  const seen = new Set();                                   // dédup dual-cost (nom vu 1×)
  for (const mu of mfm.units) {
    const entry = map.matched[mu.name];
    if (!entry) continue;                                   // non-mappé → traité via map.unmapped plus bas
    if (seen.has(mu.name)) continue; seen.add(mu.name);
    if (changedOnly && !mu.changed) continue;
    tot.units++;
    // Étiquettes de changement portées par la carte MFM (le site les matérialise
    // en clair : « UPDATED », « WARGEAR COSTS REMOVED »…). Elles sont dans le
    // dump (change_tags) — on les EXPLOITE ici au lieu de les laisser mourir :
    //  · WARGEAR COSTS REMOVED → toutes les options d'armes payantes de la
    //    fiche passent à 0 (listées une à une, avec leurs ids, en Δ auto) ;
    //  · toute autre étiquette inconnue → ligne de review, pour qu'un futur
    //    MFM n'introduise jamais un type de changement silencieusement ignoré.
    for (const tag0 of (mu.change_tags || [])) {
      const tagU = String(tag0).toUpperCase();
      if (tagU === "UPDATED") continue;                      // porté par les deltas eux-mêmes
      if (tagU === "WARGEAR COSTS REMOVED") {
        for (const tgt of entry.targets) {
          const paid = (tgt.weaponOptions || []).filter((o) => Number(o.pts) > 0);
          if (!paid.length) { facLines.push(`  ✓ ${mu.name} : WARGEAR COSTS REMOVED — aucune option payante en bdd, déjà aligné`); continue; }
          for (const o of paid) { facLines.push(`  Δ ${mu.name} OPTION « ${o.name} » (${o.id}): ${o.pts} → 0  [WARGEAR COSTS REMOVED]`); tot.deltas++; }
        }
      } else review("etiquette-mfm", mu.name, `étiquette « ${tag0} » non exploitée — vérifier la carte`);
    }
    let costs;
    try { costs = mfmUnitCosts(mu); }
    catch (e) { review("valeur-douteuse", mu.name, e.message); continue; }
    if (costs.skip) { review("composition", mu.name, costs.skip + ` — barème MFM: ${(mu.profiles || []).map((p) => p.size + "=" + p.points).join(", ")}`); continue; }

    for (const tgt of entry.targets) {
      const cur = tgt.current;
      const tag = entry.targets.length > 1 ? ` [${tgt.catName}]` : "";
      // base : compare le coût EFFECTIF (cur.basePts, résolu par le parser) au
      // MFM. Coût effectif 0/absent + MFM>0 → porté par les modèles (④).
      if (cur.basePts == null || cur.basePts === 0) {
        if (costs.basePts != null) review("modele-porte", mu.name + tag, `coût unité ${cur.basePts == null ? "absent" : "0"} (probablement porté par les modèles de composition), MFM base=${costs.basePts}`);
      } else if (costs.basePts !== cur.basePts) {
        const d = costs.basePts - cur.basePts;
        if (isConflicted(tgt.bsId, "base")) review("cout-chapitre", mu.name + tag, `datasheet partagée, prix divergent selon la faction (bdd ${cur.basePts} → MFM ${costs.basePts})`);
        else if (!saneDelta(d)) review("hors-bornes", mu.name + tag, `BASE Δ${d} implausible (bdd ${cur.basePts} → MFM ${costs.basePts})`);
        else if (cur.baseOnNode == null) review("base-imbriquee", mu.name + tag, `coût effectif ${cur.basePts} porté hors de l'entrée unité (modèle/imbriqué), MFM=${costs.basePts} — écriture manuelle`);
        else if (emittedWrite.has(tgt.bsId + "|base")) { /* écriture partagée déjà émise */ }
        else { facLines.push(`  Δ ${mu.name}${tag} BASE: ${cur.basePts} → ${costs.basePts} (${d > 0 ? "+" : ""}${d})`); emittedWrite.add(tgt.bsId + "|base"); tot.deltas++; }
      }
      // Paliers : chaque prix de taille MFM doit être ATTEIGNABLE par la bdd
      // (base ou l'un des paliers connus, union des deux lectures). On ne
      // signale que les prix MFM qu'aucun palier/base actuel ne produit — ce
      // qui évite les faux positifs dus aux idiomes d'encodage des paliers. Un
      // coût porté par les modèles (base 0) est déjà traité en ④, on n'y ajoute
      // pas de bruit de palier.
      if (cur.basePts) {
        const achievable = new Set([cur.basePts, ...((cur.tierPrices) || (cur.tiers || []).map((x) => x.pts))]);
        const missing = [...new Set(costs.sizeTierPts || [])].filter((p) => !achievable.has(p));
        if (missing.length) {
          if (isConflicted(tgt.bsId, "tiers")) review("cout-chapitre", mu.name + tag, `paliers divergents selon la faction (MFM ${JSON.stringify(missing)} non produits par la bdd ${JSON.stringify([...achievable].sort((a, b) => a - b))})`);
          else review("palier-structure", mu.name + tag, `prix de taille MFM ${JSON.stringify(missing)} non atteignable(s) par la bdd (paliers actuels ${JSON.stringify([...achievable].sort((a, b) => a - b))})`);
        }
      }
      if (costs.repeatDelta != null) {
        const curD = cur.repeat ? cur.repeat.delta : null;
        if (curD == null) review("repeat-absent", mu.name + tag, `MFM a un prix par répétition (Δ=${costs.repeatDelta}) que la bdd n'encode pas`);
        else if (curD !== costs.repeatDelta) {
          if (isConflicted(tgt.bsId, "repeat")) review("cout-chapitre", mu.name + tag, `répétition divergente selon la faction (bdd Δ${curD} vs MFM Δ${costs.repeatDelta})`);
          else if (!saneDelta(costs.repeatDelta)) review("hors-bornes", mu.name + tag, `RÉPÉTITION Δ${costs.repeatDelta} implausible`);
          else if (emittedWrite.has(tgt.bsId + "|repeat")) { /* déjà émise */ }
          else { facLines.push(`  Δ ${mu.name}${tag} RÉPÉTITION: Δ${curD} → Δ${costs.repeatDelta}`); emittedWrite.add(tgt.bsId + "|repeat"); tot.deltas++; }
        }
      }
    }
  }
  // ── améliorations ───────────────────────────────────────────────────────────
  for (const det of (Array.isArray(mfm.detachments) ? mfm.detachments : [])) {
    for (const me of (det.enhancements || [])) {
      // Clef primaire « DET / NOM » (un même nom peut vivre dans deux
      // détachements à des prix différents) ; repli nom-seul pour les
      // matrices générées avant ce changement de contrat.
      const em = map.enhancements && (map.enhancements[det.name + " / " + me.name] || map.enhancements[me.name]);
      if (!em) continue;                                    // non-mappée → traité via map.enhUnmapped
      let p; try { p = safePts(me.points, `enh ${me.name}`); } catch (e) { review("valeur-douteuse", "enh " + me.name, e.message); continue; }
      if (em.currentPts == null) { review("enh-cout-absent", "enh " + me.name + " (" + em.det + ")", `coût bdd absent, MFM=${p}`); continue; }
      if (p !== em.currentPts) {
        const d = p - em.currentPts;
        if (saneDelta(d)) { facLines.push(`  Δ enh ${me.name} (${em.det}): ${em.currentPts} → ${p} (${d > 0 ? "+" : ""}${d})`); tot.enhDeltas++; }
        else review("hors-bornes", "enh " + me.name, `Δ${d} implausible`);
      }
    }
  }
  // ── résidu de la matrice (Phase 1) : noms/amél. non-mappés, erreurs ─────────
  for (const n of (map.unmapped || [])) actions.push({ cat: "nom-non-mappe", faction: map.faction, name: n, detail: "aucune datasheet .cat pour ce nom MFM" });
  for (const n of (map.enhUnmapped || [])) actions.push({ cat: "enh-non-mappee", faction: map.faction, name: n, detail: "aucune amélioration bdd pour ce nom MFM" });
  for (const e of (map.errors || [])) {
    if (/déjà mappé/.test(e.why)) continue;                 // dual-cost Agents : bénin, ignoré
    actions.push({ cat: "erreur", faction: map.faction, name: e.name || "?", detail: e.why });
  }

  if (facLines.length) lines.push(`\n═══ ${map.faction} ═══\n` + facLines.join("\n"));
}

// ── 1) ce qui s'applique tout seul ──────────────────────────────────────────
console.log("╔══ DELTAS AUTO-APPLICABLES (dry-run) ══╗");
console.log(lines.length ? lines.join("\n") : "  (aucun — la bdd est alignée sur ce MFM)");

// ── 2) ce que TU dois m'envoyer (non traité automatiquement) ────────────────
// Un bloc par catégorie d'action, avec l'instruction concrète de ce qu'il faut
// fournir. C'est LA liste à me renvoyer.
const CAT = {
  "nom-non-mappe":   { icon: "①", titre: "NOMS MFM SANS DATASHEET — envoie-moi le nom EXACT de la datasheet .cat (ou son bsId) : j'ajoute l'alias." },
  "enh-non-mappee":  { icon: "②", titre: "AMÉLIORATIONS MFM SANS ENTRÉE BDD — envoie le nom exact en base, ou confirme qu'elle manque dans les données." },
  "cout-chapitre":   { icon: "③", titre: "COÛT DE CHAPITRE (datasheet partagée, prix divergent) — confirme les prix par chapitre : j'encode un modifier primary-catalogue." },
  "modele-porte":    { icon: "④", titre: "COÛT PORTÉ PAR LES MODÈLES (unité à 0, prix sur les modèles) — confirme le barème par modèle de composition." },
  "base-imbriquee":  { icon: "④", titre: "COÛT DE BASE IMBRIQUÉ (hors entrée unité) à changer — confirme la nouvelle valeur (écriture manuelle sur le modèle)." },
  "composition":     { icon: "⑤", titre: "PRIX À COMPOSITION (tailles spéciales : Runtherds…) — le barème MFM est donné ci-dessous, confirme l'encodage voulu." },
  "palier-structure":{ icon: "⑥", titre: "PALIER DE TAILLE ABSENT/DIFFÉRENT en base — confirme si on ajoute le palier (taille→pts)." },
  "repeat-absent":   { icon: "⑦", titre: "PRIX PAR RÉPÉTITION absent en base — confirme le seuil et le delta à encoder." },
  "enh-cout-absent": { icon: "⑧", titre: "AMÉLIORATION SANS COÛT en base — confirme la valeur." },
  "hors-bornes":     { icon: "⚠", titre: "DELTA IMPLAUSIBLE (|Δ|>200) — vérifie l'extraction MFM / le nom apparié." },
  "valeur-douteuse": { icon: "⚠", titre: "VALEUR MFM NON EXPLOITABLE — vérifie la source." },
  "erreur":          { icon: "✗", titre: "ERREUR DE RÉSOLUTION EN BASE — à investiguer." },
};
const order = Object.keys(CAT);
const byCat = new Map();
for (const a of actions) { if (!byCat.has(a.cat)) byCat.set(a.cat, []); byCat.get(a.cat).push(a); }

console.log("\n╔══ ⚑ À ME RENVOYER — non traité automatiquement ══╗");
if (!actions.length) {
  console.log("  (rien — tout est soit appliqué automatiquement, soit déjà aligné)");
} else {
  for (const cat of order) {
    const items = byCat.get(cat);
    if (!items || !items.length) continue;
    const c = CAT[cat];
    console.log(`\n${c.icon} ${c.titre}  [${items.length}]`);
    for (const it of items) console.log(`   • [${it.faction}] ${it.name} — ${it.detail}`);
  }
  // toute catégorie non prévue (garde-fou)
  for (const [cat, items] of byCat) if (!CAT[cat]) for (const it of items) console.log(`\n? ${cat}: [${it.faction}] ${it.name} — ${it.detail}`);
}

console.log(`\n════ DRY-RUN ════`);
console.log(`Unités examinées: ${tot.units} · deltas points auto: ${tot.deltas} · deltas améliorations auto: ${tot.enhDeltas} · À ME RENVOYER: ${actions.length}`);
console.log(`Aucune écriture (dry-run). Applique le bloc AUTO en Phase 3 ; renvoie-moi le bloc « ⚑ À ME RENVOYER » pour le reste.`);
