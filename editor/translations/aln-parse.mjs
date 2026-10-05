// aln-parse.mjs — lecture des réponses brutes d'Army List Network (ALN).
//
// Partagé par aln-fetch.mjs (récolte en ligne) et aln-extract.mjs (relecture
// hors ligne d'un dossier brut/ déjà récolté). Aucune requête ici : on ne fait
// que lire les réponses JSON/HTML d'ALN.
//
// Ce qu'une fiche ALN (`/form/ajax_set_unite.php`) contient vraiment :
//   config             → points par effectif ({"5":190,"10":380})
//   tpl_profil         → une table par profil : figurines (type 1 : M E SV PV
//                        CD CO, la SV portant l'invulnérable « 2+/4++ ») et
//                        armes (Portée A C/T F PA D Capacités)
//   tpl_option         → options ; champ caché option_data =
//                        "FR|type|figure|0|id|VO|catégorie" (type 1 = arme,
//                        2 = capacité, 3 = mot-clef, 4 = faction), plus :
//                          data_profil_<opt> : profils d'arme (JSON, en FR)
//                          data_desc_<opt>   : TEXTE COMPLET de la capacité (FR)
// Un détachement (`/form/ajax_set_detachement.php`) porte cout (PD),
// libelle/libelleVO, description (règle), disposition, stratagemes et
// optimisations (HTML, texte complet en français).
//
// Les textes sont en FRANÇAIS : ALN ne donne la version originale que des
// NOMS (champ VO). Ils servent donc aux traductions (translations/fr.json) et
// au contrôle des valeurs, pas au texte anglais de la base.

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç", ocirc: "ô", icirc: "î", ucirc: "û", ugrave: "ù", euml: "ë", iuml: "ï", rsquo: "’", lsquo: "‘", laquo: "«", raquo: "»", hellip: "…", ndash: "–", mdash: "—", Eacute: "É", Egrave: "È", Agrave: "À" };
export const dec = (s) => String(s ?? "")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m);
// HTML → texte : <br> et <li> deviennent des retours à la ligne / puces.
export const texte = (h) => dec(String(h ?? "")
  .replace(/<br\s*\/?>/gi, "\n").replace(/<li[^>]*>/gi, "\n■ ").replace(/<\/(p|div|li|ul)>/gi, "\n")
  .replace(/<[^>]+>/g, "")).replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();

const TYPES = { 1: "arme", 2: "capacite", 3: "mot-clef", 4: "faction" };

// Fiche d'unité (réponse JSON déjà parsée).
export function parseUnite(j) {
  const opt = [...Object.values(j.tpl_option || {})].join("\n");
  const prof = String(j.tpl_profil || "");
  const out = { points: j.config || null, modeles: [], armes: [], capacites: [], options: [] };

  // Options : armes, capacités, mots-clefs…
  for (const m of opt.matchAll(/name="f_select_option_data\[(\d+)\]"\s*value="([^"]*)"/g)) {
    const id = m[1], p = dec(m[2]).split("|");
    const o = { id, fr: p[0], vo: p[5] || "", type: TYPES[+p[1]] || p[1], groupe: p[6] || "" };
    const desc = opt.match(new RegExp(`id="data_desc_${id}">([\\s\\S]*?)</span>`));
    if (desc) o.texte = texte(desc[1]);
    const dp = opt.match(new RegExp(`id="data_profil_${id}">([\\s\\S]*?)</span>`));
    if (dp) { try { o.profils = JSON.parse(dec(dp[1])); } catch { /* profil illisible : ignoré */ } }
    const def = opt.match(new RegExp(`name="f_select_option_defaut\\[${id}\\]"\\s*value="(\\d+)"`));
    if (def) o.defaut = +def[1];
    const cout = opt.match(new RegExp(`data-idtl="${id}"[^>]*f_cout="([^"]*)"`));
    if (cout && +cout[1]) o.cout = +cout[1];
    out.options.push(o);
    if (o.type === "capacite") out.capacites.push({ fr: o.fr, vo: o.vo, texte: o.texte || "" });
  }

  // Profils : figurines (type 1) et armes (autres types), avec leurs valeurs.
  const vo = Object.fromEntries(out.options.map((o) => [o.id, o]));
  for (const blk of prof.split(/<div id="profil_\d+"/).slice(1)) {
    const typ = (blk.match(/f_profil_id_type\[\d+\]" value="(\d+)"/) || [])[1] || "";
    const nom = dec((blk.match(/f_profil_libelle\[\d+\]" value="([^"]*)"/) || [])[1] || "");
    const oid = (blk.match(/f_profil_option\[\d+\]" value="(\d*)"/) || [])[1] || "";
    const val = {};
    for (const m of blk.matchAll(/name="f_profil_carac\[\d+\]\[(\w+)\]"[^>]*value="([^"]*)"/g)) val[m[1]] = dec(m[2]);
    if (typ === "1") {
      const [sv, inv] = String(val.SV || "").split("/");
      out.modeles.push({ nom, M: val.M, T: val.T, SV: sv, invu: inv ? inv.replace(/\+\+$/, "+") : null, W: val.W, LD: val.LD, OC: val.OC });
    } else {
      const o = vo[oid] || {};
      out.armes.push({ nom, option: o.fr || "", vo: o.vo || "", ...val });
    }
  }
  return out;
}

// Détachement (réponse JSON déjà parsée).
export function parseDetachement(j) {
  const items = (h) => [...String(h || "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => {
    const titre = dec(((m[1].match(/<b>([\s\S]*?)<\/b>/) || [])[1] || "").replace(/<[^>]+>/g, "")).trim();
    const pc = ((m[1].match(/<\/b>\s*\(([^)]*)\)/) || [])[1] || "").trim();
    const corps = texte(m[1].replace(/<b>[\s\S]*?<\/b>\s*(\([^)]*\))?/, ""));
    return { fr: titre.replace(/^\[[^\]]*\]\s*/, ""), cp: pc || undefined, texte: corps };
  });
  return {
    fr: dec(j.libelle || ""), vo: dec(j.libelleVO || ""), pd: j.cout ?? null,
    dispositions: String(j.disposition || "").split(",").map((s) => dec(s).trim()).filter(Boolean),
    regle: texte(j.description || ""),
    strats: items(j.stratagemes), ameliorations: items(j.optimisations),
  };
}
