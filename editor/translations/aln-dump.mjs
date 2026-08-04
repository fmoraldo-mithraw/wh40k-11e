#!/usr/bin/env node
// aln-dump.mjs — enregistreur de la base FRANÇAISE d'Army List Network (ALN).
//
// POURQUOI. 40k.armylistnetwork.com est un créateur de listes francophone : son
// catalogue (unités, armes, options) est déjà en français officiel. C'est la
// meilleure source connue pour translations/fr.json. Mais le site exige un
// COMPTE et son hébergeur refuse les robots — il faut donc le récupérer depuis
// TA machine, avec TA session, en naviguant normalement.
//
// CE QUE FAIT CE SCRIPT. Il ouvre un vrai navigateur (Playwright), te laisse te
// connecter à la main UNE fois (la session est conservée dans ./aln-profile),
// puis il enregistre TOUT ce que la page reçoit : réponses JSON des API, pages
// HTML, données embarquées. Rien n'est interprété ici — le but est de capturer
// la matière brute pour en déduire ensuite la structure exacte.
//
// USAGE
//   npm i playwright && npx playwright install chromium
//
//   node aln-dump.mjs                    # 1er lancement : navigateur visible,
//                                        #   tu te connectes, tu navigues, Ctrl+C
//   node aln-dump.mjs --crawl            # suit automatiquement les liens du
//                                        #   catalogue (après connexion)
//   node aln-dump.mjs --url https://40k.armylistnetwork.com/recherche/
//   node aln-dump.mjs --headless         # une fois la session enregistrée
//
// SORTIE  → ./aln-dump/
//   manifest.json      inventaire url → fichier → type → taille
//   json/NNN-*.json    chaque réponse JSON captée
//   html/NNN-*.html    chaque page HTML visitée
//   resume.txt         récapitulatif lisible (endpoints, volumes)
//
// ENSUITE : envoie-moi aln-dump/resume.txt et manifest.json (et 2-3 fichiers
// json/ représentatifs). J'écris alors l'extracteur qui aligne les noms FR sur
// les noms anglais de la base wh40k-11e.
//
// Aucune donnée n'est envoyée nulle part : tout reste dans ./aln-dump/.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const BASE = val("--url", "https://40k.armylistnetwork.com/");
const OUT = val("--out", "aln-dump");
const HEADLESS = flag("--headless");
const CRAWL = flag("--crawl");
const MAX_PAGES = Number(val("--max", "400"));
const PROFILE = val("--profile", "aln-profile");

let chromium;
try { ({ chromium } = await import("playwright")); }
catch {
  console.error(`\n  Playwright manquant. Installe-le d'abord :\n\n    npm i playwright && npx playwright install chromium\n`);
  process.exit(1);
}

await mkdir(join(OUT, "json"), { recursive: true });
await mkdir(join(OUT, "html"), { recursive: true });

const manifest = [];
let n = 0;
const seenUrls = new Set();

const slug = (u) =>
  u.replace(/^https?:\/\//, "").replace(/[^\w.-]+/g, "_").slice(0, 90);

async function save(kind, url, body, extra = {}) {
  if (!body) return;
  const id = String(++n).padStart(4, "0");
  const ext = kind === "json" ? "json" : "html";
  const file = join(OUT, kind, `${id}-${slug(url)}.${ext}`);
  await writeFile(file, body, "utf8");
  manifest.push({ id, kind, url, file, bytes: body.length, ...extra });
  const size = (body.length / 1024).toFixed(0) + " ko";
  console.log(`  [${kind}] ${size.padStart(8)}  ${url.slice(0, 110)}`);
}

console.log(`\n  ALN — enregistrement de la base française`);
console.log(`  profil de session : ./${PROFILE}   sortie : ./${OUT}\n`);

let ctx;
try {
  ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: HEADLESS,
    viewport: { width: 1400, height: 950 },
    locale: "fr-FR",
  });
} catch (e) {
  // Sous WSL sans WSLg (ou en SSH), aucun serveur d'affichage : le mode visible
  // ne peut pas s'ouvrir. La connexion manuelle a besoin d'une fenêtre — donc
  // soit on active l'affichage, soit on lance le script côté Windows.
  if (/display|DISPLAY|X server|xcb|GTK/i.test(String(e.message))) {
    console.error(`
  Pas d'affichage graphique disponible (${e.message.split("\n")[0]}).

  Trois issues, de la plus simple à la moins :
    1. Windows 11 + WSL2 : WSLg fournit l'affichage. Vérifie 'echo $DISPLAY'
       (doit valoir ':0'), puis 'wsl --update' côté Windows si c'est vide.
    2. Lance ce script depuis Windows directement (Node pour Windows,
       PowerShell), pas depuis WSL — c'est le chemin le plus fiable.
    3. Installe un serveur X (VcXsrv) et exporte DISPLAY vers lui.

  La connexion à ALN se fait à la main : une fenêtre est indispensable au
  premier lancement. Une fois ./${PROFILE} créé, les lancements suivants
  peuvent utiliser --headless.
`);
    process.exit(1);
  }
  throw e;
}

// ── capture de toutes les réponses utiles ────────────────────────────────────
ctx.on("response", async (res) => {
  try {
    const url = res.url();
    if (!res.ok()) return;
    const ct = (res.headers()["content-type"] || "").toLowerCase();
    const isJson = ct.includes("json") || /\.json(\?|$)/.test(url);
    if (!isJson) return;
    if (seenUrls.has(url)) return;
    seenUrls.add(url);
    const body = await res.text();
    if (body.length < 40) return;                 // réponses vides / accusés
    await save("json", url, body, { status: res.status(), contentType: ct });
  } catch { /* réponse déjà consommée ou navigation en cours */ }
});

const page = ctx.pages()[0] || (await ctx.newPage());

// Certaines applis embarquent leur catalogue dans le HTML (__NEXT_DATA__,
// window.__DATA__, <script type="application/json">) : on garde la page entière.
async function capturePage(url) {
  if (seenUrls.has("page:" + url)) return [];
  seenUrls.add("page:" + url);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch { /* réseau lent : on garde ce qu'on a */ }
  await page.waitForTimeout(600);
  const html = await page.content();
  await save("html", url, html, { title: await page.title().catch(() => "") });

  // liens internes candidats (catalogue, factions, unités, recherche)
  return await page.$$eval("a[href]", (as) => as.map((a) => a.href));
}

async function run() {
  const links = await capturePage(BASE);

  if (!HEADLESS && !CRAWL) {
    console.log(`
  ────────────────────────────────────────────────────────────────────
  1. CONNECTE-TOI dans la fenêtre qui vient de s'ouvrir.
  2. Ouvre la création de liste et parcours PLUSIEURS factions, puis
     déplie des unités (les armes/options se chargent souvent à la
     demande — c'est ce qu'on veut capturer).
  3. Tout ce qui passe s'enregistre ci-dessous en direct.
  4. Quand tu as fait le tour : Ctrl+C.

  Astuce : relance ensuite  node aln-dump.mjs --crawl  pour que le
  script parcoure seul le reste du catalogue avec ta session.
  ────────────────────────────────────────────────────────────────────
`);
    await new Promise(() => {});                  // on laisse la main à l'humain
  }

  if (CRAWL) {
    const host = new URL(BASE).host;
    const interesting = /liste|list|faction|armee|army|unit|datasheet|catalog|recherche|regle|rule/i;
    const queue = links.filter((h) => { try { return new URL(h).host === host; } catch { return false; } });
    const done = new Set();
    while (queue.length && manifest.filter((m) => m.kind === "html").length < MAX_PAGES) {
      const url = queue.shift();
      if (done.has(url) || !interesting.test(url)) continue;
      done.add(url);
      const more = await capturePage(url);
      for (const h of more) {
        try { if (new URL(h).host === host && !done.has(h) && interesting.test(h)) queue.push(h); } catch { /* href exotique */ }
      }
    }
  }
}

async function finish() {
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1), "utf8");
  const byHost = {};
  for (const m of manifest.filter((x) => x.kind === "json")) {
    const p = new URL(m.url).pathname.replace(/\/\d+(?=\/|$)/g, "/:id");
    byHost[p] = (byHost[p] || 0) + 1;
  }
  const resume = [
    `ALN — récapitulatif de capture`,
    `date        : ${new Date().toISOString()}`,
    `base        : ${BASE}`,
    `pages HTML  : ${manifest.filter((m) => m.kind === "html").length}`,
    `réponses JSON : ${manifest.filter((m) => m.kind === "json").length}`,
    `octets JSON : ${manifest.filter((m) => m.kind === "json").reduce((s, m) => s + m.bytes, 0)}`,
    ``,
    `ENDPOINTS JSON (chemin normalisé → nombre de réponses)`,
    ...Object.entries(byHost).sort((a, b) => b[1] - a[1]).map(([p, c]) => `  ${String(c).padStart(4)}  ${p}`),
    ``,
    `Les 25 plus grosses réponses JSON :`,
    ...manifest.filter((m) => m.kind === "json").sort((a, b) => b.bytes - a.bytes).slice(0, 25)
      .map((m) => `  ${(m.bytes / 1024).toFixed(0).padStart(7)} ko  ${m.url}`),
  ].join("\n");
  await writeFile(join(OUT, "resume.txt"), resume + "\n", "utf8");
  console.log(`\n${resume}\n\n  → ${OUT}/manifest.json et ${OUT}/resume.txt écrits.`);
  await ctx.close().catch(() => {});
}

process.on("SIGINT", async () => { await finish(); process.exit(0); });
await run();
await finish();
