#!/usr/bin/env node
// aln-probe.mjs — diagnostic : trouver COMMENT interroger les endpoints d'ALN.
//
// aln-fetch.mjs a reçu 150 erreurs sur 150 : l'endpoint refuse la requête telle
// qu'on la formule. Plutôt que de tâtonner en aveugle sur le site de quelqu'un,
// cette sonde essaie UNE poignée de variantes sur UN seul identifiant connu
// pour exister, et affiche le vrai code de retour et le début du corps.
//
// USAGE
//   node aln-probe.mjs
//   node aln-probe.mjs --page "https://40k.armylistnetwork.com/liste/…"   ← LE PLUS UTILE
//   node aln-probe.mjs --id 4654
//
// --page : l'URL de la page où tu ajoutes des unités (copie-la depuis la barre
// d'adresse pendant que tu édites une liste). Avec elle, la sonde peut émettre
// la requête DEPUIS la page, exactement comme le fait le site : mêmes cookies,
// même Referer, même état de session. C'est la variante qui a le plus de
// chances de marcher.
//
// Envoie-moi la sortie complète : elle dit quelle variante retenir.

import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const BASE = val("--base", "https://40k.armylistnetwork.com");
const PROFILE = val("--profile", "aln-profile");
const ID = val("--id", "4654");
const PAGE = val("--page", "");
const PATH = `/form/ajax/set_unite.php`;
const URL_GET = `${BASE}${PATH}?f_id_codexunite=${ID}`;

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { console.error("\n  npm i playwright\n"); process.exit(1); }
if (!existsSync(PROFILE)) { console.error(`\n  Session absente : ${PROFILE}/ — relance aln-dump.mjs et connecte-toi.\n`); process.exit(1); }

const ctx = await chromium.launchPersistentContext(PROFILE, { headless: !PAGE ? true : false, locale: "fr-FR" });
const apercu = (s) => String(s).replace(/\s+/g, " ").slice(0, 220);

async function essai(nom, fn) {
  try {
    const { status, body, note } = await fn();
    const verdict = body && body.length > 200 && body.trim().startsWith("{") ? "✅ EXPLOITABLE" : "❌";
    console.log(`\n── ${nom}\n   ${verdict}  statut ${status}  ${body ? body.length : 0} octets ${note || ""}`);
    console.log(`   ${apercu(body)}`);
  } catch (e) {
    console.log(`\n── ${nom}\n   ❌ exception : ${e.message.split("\n")[0]}`);
  }
}

console.log(`\n  Sonde ALN — identifiant ${ID}\n  ${URL_GET}`);

// 1) Les cookies de session sont-ils bien là ?
const cookies = await ctx.cookies(BASE);
console.log(`\n  cookies pour ${BASE} : ${cookies.length}` +
  (cookies.length ? ` (${cookies.map((c) => c.name).join(", ")})` : "  ← AUCUN : la session n'a pas été enregistrée"));

const api = ctx.request;

await essai("GET nu (ce que fait aln-fetch.mjs)", async () => {
  const r = await api.get(URL_GET, { timeout: 30000 });
  return { status: r.status(), body: await r.text() };
});

await essai("GET + en-têtes XHR + Referer", async () => {
  const r = await api.get(URL_GET, {
    timeout: 30000,
    headers: { "X-Requested-With": "XMLHttpRequest", Referer: BASE + "/", Accept: "application/json, text/javascript, */*; q=0.01" },
  });
  return { status: r.status(), body: await r.text() };
});

await essai("POST formulaire", async () => {
  const r = await api.post(`${BASE}${PATH}`, {
    timeout: 30000,
    headers: { "X-Requested-With": "XMLHttpRequest", Referer: BASE + "/" },
    form: { f_id_codexunite: ID },
  });
  return { status: r.status(), body: await r.text() };
});

await essai("POST avec l'identifiant aussi en query", async () => {
  const r = await api.post(URL_GET, {
    timeout: 30000,
    headers: { "X-Requested-With": "XMLHttpRequest", Referer: BASE + "/" },
    form: { f_id_codexunite: ID },
  });
  return { status: r.status(), body: await r.text() };
});

// 2) Depuis la page elle-même — la variante la plus fidèle au site.
if (PAGE) {
  const page = await ctx.newPage();
  await page.goto(PAGE, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log(`\n  page ouverte : ${page.url()}\n  titre : ${await page.title().catch(() => "?")}`);

  await essai("fetch() DEPUIS la page (GET)", async () => {
    const r = await page.evaluate(async (u) => {
      const res = await fetch(u, { headers: { "X-Requested-With": "XMLHttpRequest" }, credentials: "include" });
      return { status: res.status, body: (await res.text()).slice(0, 4000) };
    }, URL_GET);
    return r;
  });

  await essai("fetch() DEPUIS la page (POST)", async () => {
    const r = await page.evaluate(async ({ u, id }) => {
      const res = await fetch(u, {
        method: "POST", credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/x-www-form-urlencoded" },
        body: "f_id_codexunite=" + id,
      });
      return { status: res.status, body: (await res.text()).slice(0, 4000) };
    }, { u: `${BASE}${PATH}`, id: ID });
    return r;
  });

  // 3) Que fait VRAIMENT le site ? On espionne ses propres requêtes pendant que
  //    tu cliques : c'est la source de vérité sur la méthode et les paramètres.
  console.log(`\n  ─────────────────────────────────────────────────────────────
  Dernière étape, la plus instructive : dans la fenêtre ouverte, AJOUTE
  une unité à la liste. Chaque requête que le site émet vers /form/ajax/
  s'affiche ci-dessous avec sa méthode et ses paramètres exacts.
  Ctrl+C quand tu en as capturé deux ou trois.
  ─────────────────────────────────────────────────────────────\n`);
  page.on("request", (req) => {
    const u = req.url();
    if (!u.includes("/form/") && !u.includes("ajax")) return;
    console.log(`  ${req.method().padEnd(5)} ${u}`);
    const d = req.postData();
    if (d) console.log(`        corps : ${d.slice(0, 300)}`);
    const h = req.headers();
    console.log(`        en-têtes utiles : ${["x-requested-with", "content-type", "referer"].map((k) => h[k] ? `${k}=${h[k]}` : "").filter(Boolean).join(" · ") || "(aucun)"}`);
  });
  await new Promise(() => {});
}

await ctx.close();
console.log(`\n  Fin. Si aucune variante n'est ✅, relance avec --page "<URL de ta page d'édition de liste>".\n`);
