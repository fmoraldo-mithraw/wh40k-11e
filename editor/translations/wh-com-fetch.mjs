#!/usr/bin/env node
// wh-com-fetch.mjs — récupère les noms officiels FRANÇAIS sur warhammer.com.
//
// À LANCER SUR TA MACHINE. warhammer.com est bloqué depuis le bac à sable
// (403 sur le CONNECT du proxy), comme nrdata.org et wahapedia.ru : c'est la
// même contrainte que editor/fetch-wahapedia.js documente déjà.
//
// ─── L'IDÉE ────────────────────────────────────────────────────────────────
// Chaque fiche produit DÉCLARE elle-même ses équivalents dans les autres
// langues, par les balises que les sites multilingues publient pour les moteurs
// de recherche :
//
//     <link rel="alternate" hreflang="en-GB" href="…">
//
// On lit la fiche française, on suit son alternate anglais, et on tient le
// couple. L'appariement est donc EXACT et déclaré par le site, jamais deviné —
// et il survit à un changement de forme d'URL. C'est le point capital :
// editor/translations/README.md documente qu'un rapprochement flou entre
// langues produit des faux grossiers (« Wraithcannon → Armes de mêlée »), et
// qu'un pack faux est pire qu'un pack partiel. La seule étape heuristique
// restante est produit→datasheet, À L'INTÉRIEUR de l'anglais, où l'erreur est
// visible et vérifiable.
//
// (Première version : appariement par identifiant numérique commun aux deux
// URLs. Le sondage du site réel l'a réfutée — les URLs n'en portent pas.)
//
// ─── CE QUE ÇA PEUT ET NE PEUT PAS COUVRIR ─────────────────────────────────
// La boutique vend des BOÎTES, pas des datasheets. Elle donne donc des noms
// d'UNITÉ, et rien d'autre. L'écart actuel du pack se répartit ainsi :
//
//     unités    359 manquantes (26 %)   ← atteignable ici
//     armes     549 manquantes (21 %)   ← hors de portée : jamais sur la boutique
//     mots-clefs 460 manquantes (32 %)  ← hors de portée
//     capacités  92 manquantes  (4 %)   ← hors de portée
//
// Le script affiche à la fin combien de trous il comble réellement. Ne compte
// pas sur lui pour les 26 % de TOUT : compte sur lui pour la part « unités »,
// et encore, seulement pour les unités effectivement vendues en boîte (ni les
// Legends, ni les variantes qui partagent une boîte).
//
// ─── USAGE ─────────────────────────────────────────────────────────────────
//   node editor/translations/wh-com-fetch.mjs --probe --url "<URL d'une fiche>"
//                                                         ← COMMENCE PAR ÇA
//   node editor/translations/wh-com-fetch.mjs             ← récolte → wh-pairs.json
//   node editor/translations/wh-com-fetch.mjs --merge     ← applique dans translations/fr.json
//
// --probe n'écrit rien. Avec --url il dissèque UNE fiche produit réelle et dit
// si le site publie bien ses alternates hreflang et quel nom on en extrait :
// c'est la mesure qui fige les sélecteurs. Sans --url il essaie les stratégies
// de découverte et ouvre trois pages pour dire si ce sont des fiches ou des
// catégories. Le site étant bloqué depuis ma session, envoie-moi la sortie.
//
// Options : --lang fr-FR · --base https://www.warhammer.com · --limit N
//           --out wh-pairs.json · --slow (1 req/s au lieu de 4 en parallèle)

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const has = (n) => args.includes(n);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const BASE = val("--base", "https://www.warhammer.com");
const LANG = val("--lang", "fr-FR");
const REF = "en-GB";
const OUT = val("--out", join(ROOT, "editor", "translations", "wh-pairs.json"));
const LIMIT = Number(val("--limit", "0")) || 0;
const SLOW = has("--slow");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const log = (...a) => console.log(...a);
const short = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").slice(0, 180);

async function get(url, { json = false } = {}) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": json ? "application/json,text/plain,*/*" : "text/html,application/xhtml+xml",
      "Accept-Language": `${LANG},fr;q=0.9,en;q=0.8`,
    },
    redirect: "follow",
  });
  const body = await r.text();
  return { status: r.status, ok: r.ok, body, url: r.url };
}

// ── Découverte des URLs produit ────────────────────────────────────────────
// Trois stratégies, de la moins intrusive à la plus lourde. La première qui
// rend des URLs gagne ; --probe les essaie toutes et rapporte.

// Sondage réel du 2026-08-04 (merci) : l'accueil répond 200, le plan de site et
// l'endpoint JSON devinés ne rendent rien, et le parcours de catégories ramasse
// bien 200 URLs — mais ce sont des pages de CATÉGORIE et des pages utilitaires
// (/shop/cart, /shop/warhammer-40000/terrain), pas des fiches produit, et
// aucune ne porte d'identifiant numérique. L'appariement par identifiant partagé
// est donc mort : remplacé par les balises hreflang, qui donnent la
// correspondance inter-langues OFFICIELLE au lieu de la deviner.
const NON_PRODUIT = /\/(cart|basket|panier|checkout|account|compte|search|recherche|wishlist|store-finder|gift|bons-cadeaux|gw-bons)/i;

const STRATEGIES = [
  {
    id: "sitemap",
    why: "le plan de site, localisé via robots.txt (les emplacements devinés ne rendaient rien)",
    async run(lang) {
      const urls = new Set();
      const seen = new Set();
      const queue = [];
      // robots.txt DÉCLARE ses plans de site : on ne devine plus.
      try {
        const rb = await get(`${BASE}/robots.txt`);
        for (const m of rb.body.matchAll(/^\s*sitemap:\s*(\S+)/gim)) queue.push(m[1]);
      } catch { /* pas de robots.txt → on retombe sur les emplacements usuels */ }
      queue.push(`${BASE}/sitemap.xml`, `${BASE}/sitemap_index.xml`, `${BASE}/${lang}/sitemap.xml`);
      while (queue.length && seen.size < 200) {
        const u = queue.shift();
        if (!u || seen.has(u)) continue;
        seen.add(u);
        let r; try { r = await get(u); } catch { continue; }
        if (!r.ok) continue;
        for (const m of r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
          const loc = m[1];
          if (/\.xml(\.gz)?$/i.test(loc)) queue.push(loc);
          else if (loc.includes(`/${lang}/`) && !NON_PRODUIT.test(loc)) urls.add(loc);
        }
      }
      return [...urls];
    },
  },
  {
    id: "category-crawl",
    why: "parcourir les catégories PUIS descendre dans les fiches qu'elles listent",
    async run(lang) {
      const cats = new Set([`${BASE}/${lang}/shop/warhammer-40000`, `${BASE}/${lang}/browse/warhammer-40-000`]);
      const produits = new Set();
      const vus = new Set();
      // Deux niveaux : les racines listent des sous-catégories, qui listent les
      // fiches. On distingue une fiche d'une catégorie a posteriori (voir
      // estFicheProduit) plutôt que sur la forme de l'URL, qui nous a trompés.
      for (let profondeur = 0; profondeur < 3 && cats.size; profondeur++) {
        const vague = [...cats].filter((c) => !vus.has(c));
        if (!vague.length) break;
        for (const c of vague) {
          vus.add(c);
          for (let page = 1; page <= 40; page++) {
            let r; try { r = await get(page === 1 ? c : `${c}?page=${page}`); } catch { break; }
            if (!r.ok) break;
            const avant = produits.size + cats.size;
            for (const m of r.body.matchAll(/href="([^"]*\/(?:shop|browse)\/[^"?#]+)"/gi)) {
              const href = m[1].startsWith("http") ? m[1] : BASE + m[1];
              if (!href.includes(`/${lang}/`) || NON_PRODUIT.test(href)) continue;
              (href.split("/").length > 6 ? produits : cats).add(href);
            }
            if (produits.size + cats.size === avant) break;
          }
        }
      }
      return [...produits, ...cats].filter((u) => !NON_PRODUIT.test(u));
    },
  },
];

// ── Appariement inter-langues par hreflang ─────────────────────────────────
// <link rel="alternate" hreflang="en-GB" href="…"> est la correspondance que le
// site DÉCLARE lui-même. C'est exact par construction, contrairement à un
// identifiant extrait du slug — et ça survit à un changement de forme d'URL.
function hreflangAlternates(html) {
  const out = {};
  for (const m of html.matchAll(/<link\b[^>]*rel=["']alternate["'][^>]*>/gi)) {
    const tag = m[0];
    const lg = /hreflang=["']([^"']+)["']/i.exec(tag);
    const hf = /href=["']([^"']+)["']/i.exec(tag);
    if (lg && hf) out[lg[1].toLowerCase()] = hf[1].startsWith("http") ? hf[1] : BASE + hf[1];
  }
  return out;
}

// Une fiche produit porte un prix et/ou un bloc JSON-LD de type Product. Une
// page de catégorie n'en a pas. C'est le seul test fiable ici, la forme des
// URLs ne distinguant pas les deux.
function estFicheProduit(html) {
  if (/"@type"\s*:\s*"Product"/i.test(html)) return true;
  if (/itemprop=["']price["']/i.test(html)) return true;
  if (/<meta[^>]+property=["']og:type["'][^>]+content=["']product["']/i.test(html)) return true;
  return false;
}

// Nom produit, JSON-LD d'abord : c'est le champ le plus propre du lot.
function jsonLdName(html) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      for (const node of Array.isArray(data) ? data : [data]) {
        if (node && /product/i.test(String(node["@type"] || "")) && node.name) return String(node.name);
      }
    } catch { /* un bloc illisible n'empêche pas de lire les suivants */ }
  }
  return "";
}

// Nom du produit. JSON-LD d'abord : c'est le seul champ qui porte le nom SEUL,
// sans suffixe de marque ni fil d'Ariane. og:title, h1 et title ensuite.
function productName(html) {
  const pick = (re) => { const m = html.match(re); return m ? m[1] : ""; };
  const raw =
    jsonLdName(html) ||
    pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(raw.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ")
    .replace(/\s*[|–-]\s*Warhammer.*$/i, "").trim();
}
function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
}

// La boutique préfixe souvent la gamme : « Death Guard: Poxwalkers ». La
// datasheet, elle, s'appelle « Poxwalkers ». On coupe au dernier « : ».
const stripRange = (s) => {
  const t = String(s || "").trim();
  const i = t.lastIndexOf(":");
  return (i > 0 && i < t.length - 1) ? t.slice(i + 1).trim() : t;
};
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[’'`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

// ── Les chaînes à combler ──────────────────────────────────────────────────
// Noms de datasheet présents dans les .cat mais absents du pack. Lecture
// directe du XML : pas de dépendance au parser de l'appli.
async function missingNames() {
  const packPath = join(ROOT, "translations", "fr.json");
  const pack = existsSync(packPath) ? JSON.parse(await readFile(packPath, "utf-8")).strings || {} : {};
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(ROOT)).filter((f) => f.endsWith(".cat"));
  const names = new Set();
  for (const f of files) {
    const xml = await readFile(join(ROOT, f), "utf-8");
    // Les datasheets sont les selectionEntry de type model/unit.
    for (const m of xml.matchAll(/<selectionEntry\b[^>]*\btype="(?:model|unit)"[^>]*>/gi)) {
      const nm = /\bname="([^"]+)"/.exec(m[0]);
      if (nm) names.add(decodeEntities(nm[1]));
    }
  }
  const missing = [...names].filter((n) => pack[n] === undefined);
  return { pack, names, missing };
}

// ── Sonde ──────────────────────────────────────────────────────────────────
async function probe() {
  log(`\nSonde warhammer.com — base ${BASE}\n`);

  // --url : dissèque UNE fiche produit réelle. C'est la mesure qui vaut toutes
  // les suppositions — ouvre une fiche dans ton navigateur, copie l'URL.
  const URL_TEST = val("--url", "");
  if (URL_TEST) {
    log(`  Dissection de ${URL_TEST}\n`);
    const r = await get(URL_TEST);
    log(`  statut ${r.status} ${r.ok ? "✅" : "❌"} · ${r.body.length} octets · URL finale ${r.url}`);
    if (!r.ok) { log(`  ${short(r.body)}\n`); return; }
    log(`  reconnue comme fiche produit : ${estFicheProduit(r.body) ? "✅ oui" : "❌ NON (aucun prix / JSON-LD Product / og:type=product)"}`);
    log(`  nom JSON-LD : ${JSON.stringify(jsonLdName(r.body)) || "—"}`);
    log(`  nom retenu  : ${JSON.stringify(productName(r.body))}`);
    const alt = hreflangAlternates(r.body);
    const n = Object.keys(alt).length;
    log(`  alternates hreflang : ${n ? `✅ ${n}` : "❌ aucune — l'appariement devra passer par autre chose"}`);
    for (const [lg, href] of Object.entries(alt).slice(0, 8)) log(`     ${lg.padEnd(7)} ${href}`);
    const enHref = alt[REF.toLowerCase()] || alt["en"] || "";
    if (enHref) {
      const re = await get(enHref);
      log(`\n  contrepartie ${REF} : statut ${re.status}`);
      log(`  nom ${REF} : ${JSON.stringify(productName(re.body))}`);
      log(`  → couple : ${JSON.stringify(productName(re.body))}  ↔  ${JSON.stringify(productName(r.body))}`);
    }
    log(`\n  Renvoie-moi ce bloc : il fige les sélecteurs pour de bon.\n`);
    return;
  }

  const r0 = await get(`${BASE}/${LANG}/`).catch((e) => ({ status: 0, body: e.message, ok: false }));
  log(`  accueil ${LANG} : statut ${r0.status} ${r0.ok ? "✅" : "❌"} ${r0.ok ? "" : short(r0.body)}`);
  if (!r0.ok) log(`  ⚠ si c'est un 403, le site refuse les robots : il faudra passer par Playwright\n     (voir aln-dump.mjs, même situation résolue avec un navigateur piloté).`);
  for (const st of STRATEGIES) {
    process.stdout.write(`\n── ${st.id} — ${st.why}\n`);
    try {
      const urls = await st.run(LANG);
      log(`   ${urls.length ? "✅" : "❌"} ${urls.length} URL candidates`);
      // Les URLs seules ne disent pas si c'est une fiche : on en ouvre trois.
      for (const u of urls.slice(0, 3)) {
        let verdict = "?";
        try { const rr = await get(u); verdict = estFicheProduit(rr.body) ? `FICHE · ${short(productName(rr.body)).slice(0, 40)}` : "catégorie"; } catch { verdict = "illisible"; }
        log(`      ${u}\n         → ${verdict}`);
      }
    } catch (e) { log(`   ❌ exception : ${e.message.split("\n")[0]}`); }
  }
  const { names, missing } = await missingNames();
  log(`\n  datasheets dans les .cat : ${names.size} — sans traduction : ${missing.length}`);
  log(`  exemples : ${missing.slice(0, 6).join(" · ")}`);
  log(`\n  ⇒ Relance avec  --url "<URL d'une vraie fiche produit>"  pour figer les sélecteurs.\n`);
}

// ── Récolte ────────────────────────────────────────────────────────────────
async function harvest() {
  const { pack, missing } = await missingNames();
  log(`\n  0/4 · ${missing.length} noms de datasheet sans traduction`);

  log(`  1/4 · découverte des pages ${LANG}`);
  let cand = [], used = null;
  for (const st of STRATEGIES) {
    try {
      const a = await st.run(LANG);
      if (a.length) { cand = a; used = st.id; break; }
      log(`        ${st.id} : 0 URL`);
    } catch (e) { log(`        ${st.id} : échec (${e.message.split("\n")[0]})`); }
  }
  if (!used) { log(`\n  ✗ aucune stratégie n'a rendu d'URL. Lance --probe et envoie la sortie.\n`); process.exit(1); }
  if (LIMIT) cand = cand.slice(0, LIMIT);
  log(`        stratégie « ${used} » : ${cand.length} URL candidates`);

  // On ne devine plus l'appariement : chaque page FR déclare elle-même sa
  // contrepartie anglaise via hreflang. Les pages de catégorie sont écartées
  // ici, sur leur CONTENU — la forme des URLs ne les distingue pas.
  log(`  2/4 · lecture des pages, tri des fiches, appariement par hreflang`);
  const out = [];
  let done = 0, cat = 0, sansAlt = 0;
  const worker = async (queue) => {
    while (queue.length) {
      const u = queue.shift();
      try {
        const rFr = await get(u);
        if (rFr.ok && estFicheProduit(rFr.body)) {
          const alt = hreflangAlternates(rFr.body);
          const enHref = alt[REF.toLowerCase()] || alt["en"] || "";
          if (enHref) {
            const rEn = await get(enHref);
            const nFr = productName(rFr.body), nEn = productName(rEn.body);
            if (nEn && nFr && nEn !== nFr) out.push({ en: nEn, fr: nFr, url: u });
          } else sansAlt++;
        } else cat++;
      } catch { /* une page illisible n'arrête pas la récolte */ }
      if (++done % 25 === 0) process.stdout.write(`\r        ${done}/${cand.length}  (fiches ${out.length}, catégories ${cat})`);
      if (SLOW) await new Promise((r) => setTimeout(r, 1000));
    }
  };
  const queue = cand.slice();
  await Promise.all(Array.from({ length: SLOW ? 1 : 4 }, () => worker(queue)));
  process.stdout.write(`\r        ${done}/${cand.length}  (fiches ${out.length}, catégories ${cat})\n`);
  if (sansAlt) log(`        ⚠ ${sansAlt} fiches sans alternate ${REF} — non appariables`);
  if (!out.length) { log(`\n  ✗ aucune fiche appariée. Lance --probe --url "<une fiche>" et envoie la sortie.\n`); process.exit(1); }

  log(`  4/4 · rapprochement produit → datasheet (en ANGLAIS uniquement)`);
  const missByNorm = new Map(missing.map((n) => [norm(n), n]));
  const strings = {};
  const unmatched = [];
  for (const { en: nEn, fr: nFr, url } of out) {
    const candEn = [nEn, stripRange(nEn)];
    const candFr = [nFr, stripRange(nFr)];
    let hit = null;
    for (let i = 0; i < candEn.length; i++) {
      const t = missByNorm.get(norm(candEn[i]));
      if (t) { hit = { target: t, fr: candFr[i] || candFr[0] }; break; }
    }
    if (hit && hit.fr && norm(hit.fr) !== norm(hit.target)) strings[hit.target] = hit.fr;
    else if (!hit) unmatched.push({ en: nEn, fr: nFr, url });
  }
  const payload = {
    meta: {
      source: `${BASE} (${REF} ↔ ${LANG})`, strategy: used,
      builtAt: new Date().toISOString().slice(0, 10),
      products: out.length, matched: Object.keys(strings).length, missingBefore: missing.length,
    },
    strings,
  };
  await writeFile(OUT, JSON.stringify(payload, null, 1));
  const pct = missing.length ? Math.round((100 * Object.keys(strings).length) / missing.length) : 0;
  log(`\n  → ${OUT}`);
  log(`     ${Object.keys(strings).length} noms officiels récoltés, soit ${pct}% des ${missing.length} trous de datasheet`);
  log(`     ${unmatched.length} produits sans datasheet correspondante (boîtes, accessoires, lots) — normal`);
  log(`\n  Relis wh-pairs.json, puis :  node editor/translations/wh-com-fetch.mjs --merge\n`);
}

// ── Fusion dans le pack ────────────────────────────────────────────────────
// Ne remplit QUE les trous : une entrée déjà présente est une décision
// éditoriale (README, priorité 1) et n'est jamais écrasée.
async function merge() {
  if (!existsSync(OUT)) { log(`\n  ✗ ${OUT} absent — lance la récolte d'abord.\n`); process.exit(1); }
  const add = JSON.parse(await readFile(OUT, "utf-8")).strings || {};
  const packPath = join(ROOT, "translations", "fr.json");
  const pack = JSON.parse(await readFile(packPath, "utf-8"));
  let added = 0, kept = 0;
  for (const [k, v] of Object.entries(add)) {
    if (pack.strings[k] === undefined) { pack.strings[k] = v; added++; } else kept++;
  }
  pack.meta.totalStrings = Object.keys(pack.strings).length;
  // Indentation 1 : c'est la forme du fichier, la préserver garde le diff lisible.
  await writeFile(packPath, JSON.stringify(pack, null, 1));
  log(`\n  → translations/fr.json : +${added} noms officiels (${kept} déjà décidés, laissés tels quels)`);
  log(`     total ${pack.meta.totalStrings} chaînes\n`);
}

if (has("--probe")) await probe();
else if (has("--merge")) await merge();
else await harvest();
