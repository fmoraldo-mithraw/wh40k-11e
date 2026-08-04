#!/usr/bin/env node
// wh-com-fetch.mjs — récupère les noms officiels FRANÇAIS sur warhammer.com.
//
// À LANCER SUR TA MACHINE. warhammer.com est bloqué depuis le bac à sable
// (403 sur le CONNECT du proxy), comme nrdata.org et wahapedia.ru : c'est la
// même contrainte que editor/fetch-wahapedia.js documente déjà.
//
// ─── L'IDÉE ────────────────────────────────────────────────────────────────
// warhammer.com sert le MÊME catalogue produit dans chaque langue, et l'URL
// d'un produit porte un identifiant stable partagé par toutes les locales :
//
//     /en-GB/shop/death-guard-poxwalkers-2019      ← même identifiant
//     /fr-FR/shop/death-guard-veroleux-2019        ←
//
// L'appariement anglais↔français est donc EXACT, jamais deviné. C'est le point
// capital : editor/translations/README.md documente qu'un rapprochement flou
// entre langues produit des faux grossiers (« Wraithcannon → Armes de mêlée »),
// et qu'un pack faux est pire qu'un pack partiel. Ici la seule étape heuristique
// est produit→datasheet, À L'INTÉRIEUR de l'anglais, où l'erreur est visible et
// vérifiable.
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
//   node editor/translations/wh-com-fetch.mjs --probe     ← COMMENCE PAR ÇA
//   node editor/translations/wh-com-fetch.mjs             ← récolte → wh-pairs.json
//   node editor/translations/wh-com-fetch.mjs --merge     ← applique dans translations/fr.json
//
// --probe n'écrit rien : il essaie chaque stratégie de découverte sur le site
// réel et dit laquelle répond. Je n'ai PAS pu valider les sélecteurs depuis ma
// session (site bloqué) : envoie-moi la sortie de --probe et j'ajuste.
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

const STRATEGIES = [
  {
    id: "sitemap",
    why: "le plan de site expose toutes les fiches produit sans crawler la boutique",
    async run(lang) {
      const urls = new Set();
      const seen = new Set();
      const queue = [`${BASE}/sitemap.xml`, `${BASE}/${lang}/sitemap.xml`];
      while (queue.length && urls.size < 100000) {
        const u = queue.shift();
        if (seen.has(u)) continue;
        seen.add(u);
        let r; try { r = await get(u); } catch { continue; }
        if (!r.ok) continue;
        // index de sitemaps → on empile ; sinon on ramasse les <loc>
        for (const m of r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
          const loc = m[1];
          if (/\.xml(\.gz)?$/i.test(loc)) { if (loc.includes(lang) || !loc.includes("-")) queue.push(loc); }
          else if (loc.includes(`/${lang}/`) && /\/shop\//i.test(loc)) urls.add(loc);
        }
      }
      return [...urls];
    },
  },
  {
    id: "search-api",
    why: "la boutique alimente ses listes par un endpoint JSON paginé",
    async run(lang) {
      const urls = new Set();
      for (let page = 1; page <= 200; page++) {
        const u = `${BASE}/${lang}/api/search/products?page=${page}&pageSize=100`;
        let r; try { r = await get(u, { json: true }); } catch { break; }
        if (!r.ok || !r.body.trim().startsWith("{")) break;
        let j; try { j = JSON.parse(r.body); } catch { break; }
        const items = j.products || j.items || j.results || j.data || [];
        if (!items.length) break;
        for (const it of items) {
          const href = it.url || it.href || it.slug || "";
          if (href) urls.add(href.startsWith("http") ? href : `${BASE}/${lang}/shop/${String(href).replace(/^\/+/, "")}`);
        }
      }
      return [...urls];
    },
  },
  {
    id: "category-crawl",
    why: "repli : parcourir les pages de catégorie et ramasser les liens /shop/",
    async run(lang) {
      const urls = new Set();
      const roots = [
        `${BASE}/${lang}/shop/warhammer-40000`,
        `${BASE}/${lang}/browse/warhammer-40-000`,
      ];
      for (const root of roots) {
        for (let page = 1; page <= 100; page++) {
          let r; try { r = await get(`${root}?page=${page}`); } catch { break; }
          if (!r.ok) break;
          const before = urls.size;
          for (const m of r.body.matchAll(/href="([^"]*\/shop\/[^"?#]+)"/gi)) {
            const href = m[1];
            urls.add(href.startsWith("http") ? href : BASE + href);
          }
          if (urls.size === before) break; // page sans nouveauté → fin de pagination
        }
      }
      return [...urls];
    },
  },
];

// L'identifiant partagé entre locales, extrait de l'URL. warhammer.com termine
// ses slugs produit par un identifiant numérique ; on retient le dernier groupe
// de chiffres. À défaut, on retombe sur le slug entier privé de sa locale, ce
// qui n'apparie que si les deux langues partagent le slug (rare, mais gratuit).
function productKey(url) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const slug = path.split("/").pop() || "";
    const m = slug.match(/(\d{3,})$/);
    return m ? `id:${m[1]}` : `slug:${slug}`;
  } catch { return null; }
}

// Nom du produit : <title> nettoyé, sinon og:title, sinon <h1>.
function productName(html) {
  const pick = (re) => { const m = html.match(re); return m ? m[1] : ""; };
  const raw =
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
  const r0 = await get(`${BASE}/${LANG}/`).catch((e) => ({ status: 0, body: e.message, ok: false }));
  log(`  accueil ${LANG} : statut ${r0.status} ${r0.ok ? "✅" : "❌"} ${r0.ok ? "" : short(r0.body)}`);
  if (!r0.ok) log(`  ⚠ si c'est un 403, le site refuse les robots : il faudra passer par Playwright\n     (voir aln-dump.mjs, même situation résolue avec un navigateur piloté).`);
  for (const st of STRATEGIES) {
    process.stdout.write(`\n── ${st.id} — ${st.why}\n`);
    try {
      const urls = await st.run(LANG);
      log(`   ${urls.length ? "✅" : "❌"} ${urls.length} URL produit`);
      for (const u of urls.slice(0, 3)) log(`      ${u}   clef=${productKey(u)}`);
    } catch (e) { log(`   ❌ exception : ${e.message.split("\n")[0]}`); }
  }
  const { names, missing } = await missingNames();
  log(`\n  datasheets dans les .cat : ${names.size} — sans traduction : ${missing.length}`);
  log(`  exemples : ${missing.slice(0, 6).join(" · ")}`);
  log(`\n  Envoie-moi cette sortie complète : elle dit quelle stratégie retenir.\n`);
}

// ── Récolte ────────────────────────────────────────────────────────────────
async function harvest() {
  const { pack, missing } = await missingNames();
  log(`\n  0/4 · ${missing.length} noms de datasheet sans traduction`);

  log(`  1/4 · découverte des fiches produit`);
  let en = [], fr = [], used = null;
  for (const st of STRATEGIES) {
    try {
      const a = await st.run(REF);
      const b = await st.run(LANG);
      if (a.length && b.length) { en = a; fr = b; used = st.id; break; }
      log(`        ${st.id} : ${a.length} EN / ${b.length} FR — insuffisant`);
    } catch (e) { log(`        ${st.id} : échec (${e.message.split("\n")[0]})`); }
  }
  if (!used) { log(`\n  ✗ aucune stratégie n'a rendu de fiches. Lance --probe et envoie la sortie.\n`); process.exit(1); }
  log(`        stratégie « ${used} » : ${en.length} EN · ${fr.length} FR`);

  log(`  2/4 · appariement par identifiant produit`);
  const byKey = new Map();
  const slot = (k) => { if (!byKey.has(k)) byKey.set(k, {}); return byKey.get(k); };
  for (const u of en) { const k = productKey(u); if (k) slot(k).en = u; }
  for (const u of fr) { const k = productKey(u); if (k) slot(k).fr = u; }
  let pairs = [...byKey.values()].filter((p) => p.en && p.fr);
  if (LIMIT) pairs = pairs.slice(0, LIMIT);
  log(`        ${pairs.length} produits présents dans les DEUX langues`);
  if (!pairs.length) { log(`\n  ✗ aucun identifiant commun : la forme d'URL a changé, revois productKey().\n`); process.exit(1); }

  log(`  3/4 · lecture des fiches (${pairs.length} × 2)`);
  const out = [];
  let done = 0;
  const worker = async (queue) => {
    while (queue.length) {
      const p = queue.shift();
      try {
        const [a, b] = await Promise.all([get(p.en), get(p.fr)]);
        const nEn = productName(a.body), nFr = productName(b.body);
        if (nEn && nFr && nEn !== nFr) out.push({ en: nEn, fr: nFr, url: p.fr });
      } catch { /* une fiche illisible n'arrête pas la récolte */ }
      if (++done % 25 === 0) process.stdout.write(`\r        ${done}/${pairs.length}`);
      if (SLOW) await new Promise((r) => setTimeout(r, 1000));
    }
  };
  const queue = pairs.slice();
  await Promise.all(Array.from({ length: SLOW ? 1 : 4 }, () => worker(queue)));
  process.stdout.write(`\r        ${done}/${pairs.length}\n`);

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
