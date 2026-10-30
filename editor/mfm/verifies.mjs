// verifies.mjs — lignes de revue MFM DÉJÀ VÉRIFIÉES conformes (editor/mfm/verifies.json), lues par
// apply.mjs (④ coût porté par les modèles, ⑤ prix à composition), tier-audit.mjs (« ? » encodage non
// standard) et phase3.mjs (« ? » paliers en nombre différent).
//
// Une entrée vaut pour UN nom MFM d'UN slug et pour les seules SORTES de lignes qu'elle liste ; elle porte
// l'EMPREINTE du barème MFM de l'unité (tier / taille / points de toutes ses occurrences dans le dump :
// les Agents en ont deux, prix armée et prix alliés). Tant que l'empreinte est identique, la ligne sort en
// « ℹ déjà vérifié le … » (hors décompte « À ME RENVOYER ») ; si le barème change, elle redevient une
// demande, avec la mention « barème MFM changé depuis la vérification du … ».
//
// Sortes de lignes : "apply:modele-porte" (④), "apply:base-imbriquee" (④), "apply:composition" (⑤),
//                    "tier-audit" (« ? »), "phase3:paliers" (« ? »).
//
// CLI : node editor/mfm/verifies.mjs [dir-dump]                → état de chaque entrée (à jour / barème changé / absente)
//       node editor/mfm/verifies.mjs [dir-dump] "slug::NOM" … → empreinte actuelle de ces unités (pour ajouter une entrée)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const VERIFIES_PATH = path.join(HERE, "verifies.json");
export const KINDS = new Set(["apply:modele-porte", "apply:base-imbriquee", "apply:composition", "tier-audit", "phase3:paliers"]);

// Empreinte du barème : toutes les occurrences du nom dans le dump du slug, profils (tier, taille, points) dans
// l'ordre du dump. 12 caractères hexadécimaux de sha1.
export function empreinte(mfm, name) {
  const occ = (mfm.units || []).filter((u) => u && u.name === name).map((u) => (u.profiles || []).map((p) => [p.tier ?? null, p.size ?? null, p.points ?? null]));
  if (!occ.length) return null;
  return crypto.createHash("sha1").update(JSON.stringify([name, occ])).digest("hex").slice(0, 12);
}

// loadVerifies() → { check(slug, mfm, name, kind) → null | { ok, le, motif, attendue, actuelle }, errors[] }
//   null : pas d'entrée pour (slug, nom, sorte) ; ok=true : barème inchangé (ℹ) ; ok=false : barème changé.
export function loadVerifies(file = VERIFIES_PATH) {
  const errors = []; let j = {};
  try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { if (e.code !== "ENOENT") errors.push(`${path.basename(file)} illisible (${e.message}) : aucune vérification prise en compte`); }
  const bySlug = new Map();
  for (const [slug, v] of Object.entries(j)) {
    if (slug.startsWith("_")) continue;
    if (!v || typeof v !== "object" || Array.isArray(v)) { errors.push(`verifies.json : « ${slug} » n'est pas un objet { nom: vérification }`); continue; }
    const m = new Map();
    for (const [name, e] of Object.entries(v)) {
      const bad = !e || typeof e !== "object" || !/^\d{4}-\d{2}-\d{2}$/.test(e.le || "") || !/^[0-9a-f]{12}$/.test(e.empreinte || "") || !Array.isArray(e.lignes) || !e.lignes.length;
      if (bad) { errors.push(`verifies.json : ${slug} / ${name} — attendu { le: AAAA-MM-JJ, empreinte: 12 hex, lignes: [...], motif }`); continue; }
      const unk = e.lignes.filter((k) => !KINDS.has(k)); if (unk.length) errors.push(`verifies.json : ${slug} / ${name} — sorte(s) de ligne inconnue(s) : ${unk.join(", ")}`);
      m.set(name, e);
    }
    bySlug.set(slug, m);
  }
  const check = (slug, mfm, name, kind) => {
    const e = (bySlug.get(slug) || new Map()).get(name);
    if (!e || !e.lignes.includes(kind)) return null;
    const now = empreinte(mfm, name);
    return { ok: now === e.empreinte, le: e.le, motif: e.motif || "", attendue: e.empreinte, actuelle: now };
  };
  return { check, errors, bySlug };
}

// Libellés communs aux trois outils.
export const infoLine = (v) => `déjà vérifié le ${v.le}${v.motif ? ` — ${v.motif}` : ""}`;
export const staleNote = (v) => ` — ⚠ barème MFM changé depuis la vérification du ${v.le} (editor/mfm/verifies.json : empreinte ${v.attendue} → ${v.actuelle ?? "unité absente"}) : revérifier, puis mettre l'entrée à jour`;

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const DUMP = args[0] && !args[0].includes("::") ? args.shift() : path.join(HERE, "dump", "en");
  const dump = (slug) => { try { return JSON.parse(fs.readFileSync(path.join(DUMP, slug + ".json"), "utf8")); } catch { return null; } };
  if (args.length) {
    for (const a of args) { const [slug, name] = a.split("::"); const d = dump(slug); console.log(`${slug} :: ${name} → ${d ? empreinte(d, name) ?? "absente du dump" : "slug absent du dump"}`); }
  } else {
    const V = loadVerifies(); let n = 0, stale = 0;
    for (const e of V.errors) console.log("✗", e);
    for (const [slug, m] of V.bySlug) for (const [name, e] of m) {
      n++; const d = dump(slug); const now = d ? empreinte(d, name) : null;
      if (now === e.empreinte) console.log(`  ✓ ${slug} :: ${name} (${e.lignes.join(", ")}) — vérifié le ${e.le}`);
      else { stale++; console.log(`  ⚠ ${slug} :: ${name} — barème changé (${e.empreinte} → ${now ?? "absente"}) : revérifier`); }
    }
    console.log(`${n} entrée(s), ${stale} à revérifier`);
    if (stale || V.errors.length) process.exitCode = 1;
  }
}
