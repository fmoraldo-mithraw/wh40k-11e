// Récupération des pictos Wahapedia (pins de tour, icônes de phase des cartes
// de stratagèmes…) — À LANCER SUR TA MACHINE, comme fetch-wahapedia.js : la
// session distante ne peut pas atteindre wahapedia.ru (politique réseau +
// anti-bot). Node 18+ (fetch global), zéro dépendance.
//
//   node editor/fetch-wahapedia-pictos.mjs
//   node editor/fetch-wahapedia-pictos.mjs --url "https://wahapedia.ru/wh40k11ed/the-rules/core-rules/"
//   node editor/fetch-wahapedia-pictos.mjs --html page-sauvegardee.html
//
// Fonctionnement :
//   1. télécharge la ou les pages cibles (par défaut : règles de base + une
//      page de faction, là où vivent les cartes de stratagèmes) ;
//   2. y relève TOUTES les URL d'images (balises <img>, <source>, styles
//      inline, feuilles CSS liées → background-image) et les filtre sur les
//      chemins d'icônes (/img/, icon, strat, phase, turn, pin, .svg) ;
//   3. télécharge chaque asset dans editor/wahapedia/pictos/ (nom de fichier
//      = basename d'URL, dédupliqué) et écrit manifest.json (url → fichier).
//
// Si une page revient en « Just a moment… » (Cloudflare) : ouvre-la dans ton
// navigateur, Ctrl+S (« page web complète »), puis relance avec --html — le
// script extraira les URL du HTML sauvegardé et téléchargera les assets (ou
// les recopiera depuis le dossier _files/ si le navigateur les a déjà).
//
// Ensuite :
//   git add -f editor/wahapedia/pictos && git commit -m "Pictos Wahapedia" && git push
// … et dis-le : je les branche dans l'appli (badges de tour / icônes de phase).
// NB : ces pictos sont les assets de Wahapedia — usage personnel.

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "wahapedia", "pictos");
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const DEFAULT_PAGES = [
  "https://wahapedia.ru/wh40k11ed/the-rules/core-rules/",
  "https://wahapedia.ru/wh40k11ed/factions/space-marines/",
  // repli 10e si la 11e n'existe pas encore sous ce chemin
  "https://wahapedia.ru/wh40k10ed/the-rules/core-rules/",
];

const ICONISH = /(\/img\/|icon|strat|phase|turn|pin|badge|\.svg(\?|$))/i;
const ASSET_EXT = /\.(svg|png|webp|gif|jpe?g)(\?.*)?$/i;

async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://wahapedia.ru/" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

// Toutes les URL d'assets d'un HTML/CSS, résolues contre `base`.
function extractUrls(text, base) {
  const found = new Set();
  const push = (u) => {
    if (!u || u.startsWith("data:")) return;
    try { found.add(new URL(u, base).href); } catch { /* URL invalide : ignorer */ }
  };
  for (const m of text.matchAll(/<(?:img|source)\b[^>]*?(?:src|srcset)\s*=\s*["']([^"']+)["']/gi)) push(m[1].split(/\s+/)[0]);
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) push(m[1]);
  for (const m of text.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)) push(m[1]);
  return [...found];
}

const manifest = existsSync(join(OUT, "manifest.json")) ? JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8")) : {};
let nb = 0, skipped = 0, failed = [];

async function download(url) {
  if (manifest[url]) { skipped++; return; }
  let name = basename(new URL(url).pathname) || "asset";
  if (!extname(name)) name += ".bin";
  let file = name, i = 2;
  while (Object.values(manifest).includes(file)) file = name.replace(/(\.\w+)$/, `-${i++}$1`);
  try {
    const r = await get(url);
    writeFileSync(join(OUT, file), Buffer.from(await r.arrayBuffer()));
    manifest[url] = file; nb++;
    console.log("  ✓", file, "←", url);
  } catch (e) { failed.push(url + "  (" + e.message + ")"); }
}

async function harvest(html, base) {
  const urls = extractUrls(html, base);
  // 1er passage : feuilles CSS (les icônes de phase sont souvent en background)
  for (const u of urls.filter((u) => /\.css(\?|$)/i.test(u))) {
    try { const css = await (await get(u)).text(); for (const cu of extractUrls(css, u)) if (ICONISH.test(cu) && ASSET_EXT.test(cu)) await download(cu); }
    catch (e) { failed.push(u + "  (css: " + e.message + ")"); }
  }
  // 2e passage : images de la page elle-même
  for (const u of urls) if (ICONISH.test(u) && ASSET_EXT.test(u)) await download(u);
}

const htmlArg = argVal("--html");
if (htmlArg) {
  const html = readFileSync(htmlArg, "utf8");
  // page sauvegardée « complète » : recopier aussi le dossier _files s'il existe
  const filesDir = htmlArg.replace(/\.html?$/i, "_files");
  if (existsSync(filesDir)) {
    for (const f of readdirSync(filesDir)) if (ASSET_EXT.test(f) && ICONISH.test(f)) {
      copyFileSync(join(filesDir, f), join(OUT, f)); manifest["file://" + f] = f; nb++;
      console.log("  ✓", f, "← (dossier _files)");
    }
  }
  await harvest(html, "https://wahapedia.ru/");
} else {
  const pages = argVal("--url") ? [argVal("--url")] : DEFAULT_PAGES;
  for (const p of pages) {
    console.log("→", p);
    try {
      const html = await (await get(p)).text();
      if (/just a moment|cf-challenge/i.test(html)) { console.log("  ⚠ Cloudflare — sauvegarde la page depuis ton navigateur puis relance avec --html"); continue; }
      await harvest(html, p);
    } catch (e) { console.log("  ✗", e.message); }
  }
}

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`\n${nb} asset(s) téléchargés (${skipped} déjà en manifeste) → ${OUT}`);
if (failed.length) { console.log("Échecs :"); failed.slice(0, 10).forEach((f) => console.log("  ✗", f)); }
console.log('\nPuis : git add -f editor/wahapedia/pictos && git commit -m "Pictos Wahapedia" && git push');
