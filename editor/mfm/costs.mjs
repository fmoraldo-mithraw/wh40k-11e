// costs.mjs — lecture des coûts d'une unité du MFM extrait (dump JSON), partagée
// par apply.mjs (deltas à appliquer à la bdd) et versions.mjs (écarts entre deux
// versions du MFM, pour le choix du MFM dans l'appli).
export const MAX_PTS = 4000;            // 4000 : Warlord Titan 3500 (barème titan-legions, MFM v1.6)
// Valide un point MFM → entier sûr, ou lève (capté → REVIEW, jamais appliqué).
export function safePts(raw, ctx) {
  const n = Number(raw);
  if (raw == null || !Number.isFinite(n) || !Number.isInteger(n) || n <= 0 || n > MAX_PTS)
    throw new Error(`valeur MFM non sûre (${JSON.stringify(raw)}) — ${ctx}`);
  return n;
}
export const sizeModels = (s) => { const m = String(s || "").match(/^(\d+)\s+model/i); return m ? Number(m[1]) : null; };

// Extrait de l'unité MFM une structure de coûts NORMALISÉE, ou signale pourquoi
// elle n'est pas automatisable (composition, dual-cost, valeur douteuse).
// nom d'arme normalisé, singulier naïf (« 2 Multi-meltas » ↔ « Multi-melta »)
const wNorm = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/s\b/g, "").replace(/^\d+ /, "").trim();
export function mfmUnitCosts(u) {
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

