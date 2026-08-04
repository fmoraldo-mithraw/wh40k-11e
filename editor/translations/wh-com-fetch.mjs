#!/usr/bin/env node
// wh-com-fetch.mjs — récupère les noms officiels FRANÇAIS sur warhammer.com.
//
// À LANCER SUR TA MACHINE. warhammer.com est bloqué depuis le bac à sable
// (403 sur le CONNECT du proxy), comme nrdata.org et wahapedia.ru : c'est la
// même contrainte que editor/fetch-wahapedia.js documente déjà.
//
// ─── L'IDÉE ────────────────────────────────────────────────────────────────
// Le slug d'un produit est le MÊME dans toutes les langues : seul le segment de
// locale change. Mesuré sur une vraie fiche :
//
//     /fr-CH/shop/Death-Guard-Poxwalkers-2021
//     /en-GB/shop/Death-Guard-Poxwalkers-2021     ← même slug, locale échangée
//
// La contrepartie anglaise s'obtient donc par simple substitution, sans rien
// deviner. C'est le point capital : editor/translations/README.md documente
// qu'un rapprochement flou entre langues produit des faux grossiers
// (« Wraithcannon → Armes de mêlée »), et qu'un pack faux est pire qu'un pack
// partiel. La seule étape heuristique restante est produit→datasheet, À
// L'INTÉRIEUR de l'anglais, où l'erreur est visible et vérifiable.
//
// Deux hypothèses réfutées par le sondage du site réel, pour ne pas les
// rouvrir : l'appariement par identifiant numérique dans le slug (les URLs n'en
// portent pas — « 2021 » est l'année, pas une clef) et l'appariement par
// <link rel="alternate" hreflang> (le site n'en publie pas).
//
// ─── POURQUOI PLAYWRIGHT ───────────────────────────────────────────────────
// `fetch` reçoit un 202 de 2 475 octets titré « JavaScript is disabled » :
// warhammer.com sert un défi anti-robot à tout client qui n'est pas un
// navigateur, et aucun en-tête ne le contourne. Même situation qu'ALN, même
// remède (cf. aln-dump.mjs). Le profil de navigation est PERSISTANT, donc le
// défi n'est franchi qu'une fois.
//
//     npm i playwright && npx playwright install chromium
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
// Options : --lang fr-FR (ou fr-CH…) · --base https://www.warhammer.com
//           --limit N · --out wh-pairs.json · --slow (1 page à la fois)
//           --headed (navigateur visible — à essayer si le défi bloque)
//           --profile <dossier> (profil persistant, défaut editor/translations/wh-profile)
//
// Ne fais PAS circuler le dossier de profil : il contient les cookies de session.

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

// ── Accès au site : Playwright obligatoire ─────────────────────────────────
// Sondage du 2026-08-04 sur une vraie fiche : `fetch` reçoit un 202 de
// 2 475 octets titré « JavaScript is disabled ». warhammer.com sert un défi
// anti-robot à tout client qui n'est pas un navigateur — aucun en-tête ne le
// contourne. Même situation qu'ALN, même remède : un navigateur piloté
// (cf. aln-dump.mjs). Le contexte est PERSISTANT, donc le défi n'est résolu
// qu'une fois et le cookie resservira aux exécutions suivantes.
const PROFILE = val("--profile", join(ROOT, "editor", "translations", "wh-profile"));
const HEADED = has("--headed");
let CTX = null, PAGES = [];

async function browserUp(n = 1) {
  if (CTX) return;
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch {
    console.error(`\n  Playwright est requis (le site bloque les clients non-navigateur) :\n`
      + `      npm i playwright && npx playwright install chromium\n`);
    process.exit(1);
  }
  CTX = await chromium.launchPersistentContext(PROFILE, {
    headless: !HEADED,
    locale: LANG,
    userAgent: UA,
    viewport: { width: 1280, height: 900 },
  });
  PAGES = [CTX.pages()[0] || await CTX.newPage()];
  while (PAGES.length < n) PAGES.push(await CTX.newPage());
}
async function browserDown() { if (CTX) { await CTX.close().catch(() => {}); CTX = null; } }

// Un défi non résolu se reconnaît à sa page minuscule sans contenu produit.
const estDefi = (html) => html.length < 8000 && /javascript is disabled|enable javascript|checking your browser|challenge/i.test(html);

async function get(url, { page = null } = {}) {
  await browserUp();
  const p = page || PAGES[0];
  let status = 0;
  try {
    const resp = await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = resp ? resp.status() : 0;
    // Laisser le défi s'exécuter puis la fiche s'hydrater.
    await p.waitForTimeout(HEADED ? 1500 : 2500);
    let body = await p.content();
    if (estDefi(body)) { await p.waitForTimeout(6000); body = await p.content(); }
    return { status, ok: status > 0 && status < 400, body, url: p.url(), defi: estDefi(body) };
  } catch (e) {
    return { status, ok: false, body: String(e.message || e), url, defi: false };
  }
}

// Le slug est le MÊME dans toutes les langues — mesuré sur
// /fr-CH/shop/Death-Guard-Poxwalkers-2021, qui reprend le slug anglais. La
// contrepartie s'obtient donc en remplaçant le segment de locale : ni
// identifiant, ni hreflang (le site n'en publie pas).
function swapLocale(url, from, to) {
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith(`/${from}/`)) return "";
    u.pathname = u.pathname.replace(`/${from}/`, `/${to}/`);
    u.search = ""; // les paramètres de tracking (srsltid…) ne servent à rien
    return u.toString();
  } catch { return ""; }
}
const localeOf = (url) => { try { const m = /^\/([a-z]{2}-[A-Z]{2})\//.exec(new URL(url).pathname); return m ? m[1] : ""; } catch { return ""; } };

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
    const loc = localeOf(URL_TEST) || LANG;
    log(`  Dissection de ${URL_TEST}`);
    log(`  locale détectée : ${loc}  (navigateur ${HEADED ? "visible" : "sans interface"})\n`);
    const r = await get(URL_TEST);
    log(`  statut ${r.status} ${r.ok ? "✅" : "❌"} · ${r.body.length} octets · URL finale ${r.url}`);
    if (r.defi) {
      log(`  ⚠ défi anti-robot NON résolu. Relance avec --headed : la première visite`);
      log(`    demande parfois une interaction, et le cookie obtenu est conservé dans`);
      log(`    ${PROFILE}\n`);
      await browserDown(); return;
    }
    if (!r.ok) { log(`  ${short(r.body)}\n`); await browserDown(); return; }
    log(`  reconnue comme fiche produit : ${estFicheProduit(r.body) ? "✅ oui" : "❌ NON (aucun prix / JSON-LD Product / og:type=product)"}`);
    log(`  nom JSON-LD : ${JSON.stringify(jsonLdName(r.body)) || "—"}`);
    log(`  nom retenu  : ${JSON.stringify(productName(r.body))}`);
    log(`  sans préfixe de gamme : ${JSON.stringify(stripRange(productName(r.body)))}`);
    const alt = hreflangAlternates(r.body);
    log(`  alternates hreflang : ${Object.keys(alt).length ? `✅ ${Object.keys(alt).length}` : "aucune (sans importance : on échange la locale)"}`);
    const enUrl = alt[REF.toLowerCase()] || alt["en"] || swapLocale(r.url, loc, REF);
    log(`\n  contrepartie ${REF} : ${enUrl || "introuvable"}`);
    if (enUrl) {
      const re = await get(enUrl);
      log(`  statut ${re.status}${re.defi ? " ⚠ défi non résolu" : ""}`);
      const nEn = productName(re.body), nFr = productName(r.body);
      log(`  nom ${REF} : ${JSON.stringify(nEn)}`);
      log(`\n  → COUPLE : ${JSON.stringify(stripRange(nEn))}  ↔  ${JSON.stringify(stripRange(nFr))}`);
      const { missing } = await missingNames();
      const cible = missing.find((m) => norm(m) === norm(stripRange(nEn)));
      log(`  → datasheet visée : ${cible ? JSON.stringify(cible) + " ✅" : "aucune correspondance dans les trous du pack"}`);
    }
    log(`\n  Renvoie-moi ce bloc : il fige les sélecteurs pour de bon.\n`);
    await browserDown(); return;
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
  log(`  2/4 · lecture des fiches, contrepartie ${REF} par échange de locale`);
  const out = [];
  let done = 0, cat = 0, defis = 0;
  const worker = async (queue, page) => {
    while (queue.length) {
      const u = queue.shift();
      try {
        const rFr = await get(u, { page });
        if (rFr.defi) defis++;
        else if (rFr.ok && estFicheProduit(rFr.body)) {
          const alt = hreflangAlternates(rFr.body);
          const enUrl = alt[REF.toLowerCase()] || alt["en"] || swapLocale(rFr.url, localeOf(rFr.url) || LANG, REF);
          if (enUrl) {
            const rEn = await get(enUrl, { page });
            const nFr = productName(rFr.body), nEn = productName(rEn.body);
            if (nEn && nFr && nEn !== nFr && !rEn.defi) out.push({ en: nEn, fr: nFr, url: rFr.url });
          }
        } else cat++;
      } catch { /* une page illisible n'arrête pas la récolte */ }
      if (++done % 10 === 0) process.stdout.write(`\r        ${done}/${cand.length}  (couples ${out.length}, catégories ${cat})`);
      if (SLOW) await new Promise((r) => setTimeout(r, 1000));
    }
  };
  const queue = cand.slice();
  const nWorkers = SLOW ? 1 : 3;
  await browserUp(nWorkers);
  await Promise.all(PAGES.slice(0, nWorkers).map((p) => worker(queue, p)));
  process.stdout.write(`\r        ${done}/${cand.length}  (couples ${out.length}, catégories ${cat})\n`);
  if (defis) log(`        ⚠ ${defis} pages bloquées par le défi anti-robot — relance avec --headed`);
  if (!out.length) { log(`\n  ✗ aucune fiche appariée. Lance --probe --url "<une fiche>" et envoie la sortie.\n`); await browserDown(); process.exit(1); }

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

// Le navigateur persistant ne se ferme pas tout seul : sans ça le process
// resterait suspendu après la récolte.
try {
  if (has("--probe")) await probe();
  else if (has("--merge")) await merge();
  else await harvest();
} finally {
  await browserDown();
}
