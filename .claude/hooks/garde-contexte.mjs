#!/usr/bin/env node
// Hook PreToolUse — garde de contexte, IDENTIQUE dans cogitator-bellicum et wh40k-11e
// (les deux dépôts travaillent en paire : chaque session peut toucher l'autre).
//
// Bloque (code de sortie 2, le message part à Claude, pas à l'utilisateur) :
//   1. tout accès aux secrets (.env, clés, profils de navigation) ;
//   2. la lecture et l'édition des fichiers générés (node_modules, dist, caches, dumps…) ;
//   3. l'édition à la main des fichiers committés mais produits par un script ;
//   4. la lecture complète d'un gros fichier texte (> SEUIL lignes) sans offset/limit ;
//   5. les balayages shell qui traversent node_modules (grep -r, find .).
// Toute erreur interne laisse passer l'appel (fail-open) : ce hook économise, il ne sécurise pas.
// Pour ajouter une règle : compléter les tableaux ci-dessous, une ligne + la raison.

import fs from "node:fs";
import path from "node:path";

const SEUIL = 1500; // lignes ; App.jsx (9 k), bsdata-parser (7,4 k), .cat (10–40 k), fixtures (17–31 k)

// 1. Secrets — jamais lus, jamais cités dans une commande.
const SECRETS = [
  { re: /(^|[\/\s'"=])\.env(?!\.example)(\.[\w.-]+)?(?=$|[\s'";|&)\/])/, why: "fichier d'environnement (secrets)" },
  { re: /deepseek\.key/, why: "clé d'API DeepSeek" },
  { re: /aln-profile(\/|\b)/, why: "session de connexion ALN (CLAUDE.md de wh40k-11e)" },
  { re: /wh-profile(\/|\b)/, why: "profil Playwright avec cookies de session" },
];

// 2. Fichiers générés, non committés : ni lus, ni modifiés.
const GENERES = [
  { re: /\/node_modules\//, why: "dépendances npm" },
  { re: /\/(dist|dist-ssr|dist\.new|dist\.prev|build|coverage|\.vite|\.cache|\.nyc_output|\.gradle|\.parcel-cache)\//, why: "sortie de build / cache" },
  { re: /\.(apk|aab|tsbuildinfo)$/, why: "binaire / artefact de build" },
  { re: /\/package-lock\.json$/, why: "lockfile npm (géré par npm, illisible utilement)" },
  { re: /(?<!\/editor)\/wahapedia\//, why: "dump Wahapedia transitoire" },
  { re: /\/editor\/mfm\/dump\/(?!en\/)/, why: "dump MFM brut transitoire" },
  { re: /\/(aln-(pairs|units|names|state)|wh-pairs|atteste)\.json$/, why: "récolte locale (jamais commitée)" },
  { re: /\/bsdata_dump[^/]*\.json$|\.golden$|\/dg_golden\.txt$/, why: "dump / golden master local" },
  { re: /\.log$/, why: "journal (utiliser tail -n 50)" , lectureOk: true },
];

// 3. Committés mais produits par un script : lecture ciblée OK, édition interdite.
const REGENERES = [
  { re: /\/data\/leadgraph\.json$/, cmd: "npm run gen:leadgraph" },
  { re: /\/tests\/fixtures\/leadgraph-golden\.json$/, cmd: "npm run gen:leadgraph-fixture" },
  { re: /\/editor\/mfm\/map\/[^/]+\.json$/, cmd: "node editor/mfm/build-map.mjs" },
  { re: /\/editor\/mfm\/dump\/en\/[^/]+\.json$/, cmd: "le scraper MFM (editor/mfm/run.sh)" },
];

const BINAIRES = /\.(png|jpe?g|gif|webp|ico|svg|pdf|woff2?|ttf|zip|gz|br|apk|ipynb)$/i;
const LECTEURS = new Set(["cat", "less", "more", "nl", "bat", "jq", "strings", "xxd", "od", "head", "tail", "grep", "egrep", "fgrep", "rg", "ag", "sed", "awk", "wc"]);
const LECTEURS_COMPLETS = new Set(["cat", "less", "more", "nl", "bat"]);

function refuse(msg) {
  process.stderr.write(`[garde-contexte] ${msg}\n`);
  process.exit(2);
}

function norm(p, cwd) {
  if (!p || typeof p !== "string") return "";
  const abs = path.isAbsolute(p) ? p : path.resolve(cwd, p);
  return abs.replace(/\\/g, "/");
}

function secret(s) {
  return SECRETS.find((r) => r.re.test(s));
}

function genere(p, lecture) {
  return GENERES.find((r) => r.re.test(p) && !(lecture && r.lectureOk));
}

function lignes(p) {
  try {
    const st = fs.statSync(p);
    if (!st.isFile() || st.size < SEUIL * 30 || BINAIRES.test(p)) return 0;
    const buf = fs.readFileSync(p);
    let n = 0;
    for (let i = 0; i < buf.length; i++) if (buf[i] === 10) n++;
    return n;
  } catch {
    return 0;
  }
}

function conseilGros(p, n) {
  const astuce = /\.(cat|gst)$/.test(p)
    ? "`node editor/bin/trouve.mjs` puis `montre.mjs`, puis Read avec offset/limit"
    : "`grep -n` (ou l'outil Grep) pour localiser, puis Read avec offset/limit";
  return `${path.basename(p)} fait ${n} lignes (> ${SEUIL}) : ne pas le lire en entier. Utiliser ${astuce}.`;
}

// Découpage shell volontairement simple (garde-fou, pas un parseur complet).
function commandes(cmd) {
  return cmd
    .split(/\|\||&&|[|;\n]|\$\(|`/)
    .map((c) => (c.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((t) => t.replace(/^["']|["']$/g, "")))
    .filter((t) => t.length);
}

function contientNodeModules(dir) {
  try {
    return fs.existsSync(path.join(dir, "node_modules"));
  } catch {
    return false;
  }
}

function verifBash(cmd, cwd) {
  const s = secret(cmd);
  if (s) refuse(`commande refusée : elle touche un ${s.why}. Ne jamais lire ni afficher ce fichier.`);

  for (let toks of commandes(cmd)) {
    while (toks.length && (/^\w+=/.test(toks[0]) || ["sudo", "env", "time", "nice"].includes(toks[0]))) toks = toks.slice(1);
    if (!toks.length) continue;
    const nom = path.basename(toks[0]);
    const args = toks.slice(1);
    const chemins = args.filter((a) => !a.startsWith("-"));

    if (LECTEURS.has(nom)) {
      for (const a of chemins) {
        const p = norm(a, cwd);
        const g = genere(p + (a.endsWith("/") ? "" : "/"), true) || genere(p, true);
        if (g) refuse(`\`${nom}\` sur ${a} refusé : ${g.why}. Lire la source, pas l'artefact.`);
      }
    }

    if (LECTEURS_COMPLETS.has(nom)) {
      for (const a of chemins) {
        const p = norm(a, cwd);
        const n = lignes(p);
        if (n > SEUIL) refuse(conseilGros(p, n) + " (head/tail/sed -n 'a,bp' bornés sont acceptés)");
      }
    }

    const recursif = args.some((a) => /^-[a-zA-Z]*[rR][a-zA-Z]*$/.test(a) || a === "--recursive");
    if (["grep", "egrep", "fgrep"].includes(nom) && recursif && !/--exclude-dir|node_modules/.test(cmd)) {
      const dirs = chemins.slice(1).map((a) => norm(a, cwd)).filter((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
      if (!dirs.length || dirs.some(contientNodeModules)) {
        refuse("grep récursif sans --exclude-dir=node_modules : il va lister les dépendances. Utiliser l'outil Grep (il respecte .gitignore) ou viser un sous-dossier (src/, scripts/, editor/).");
      }
    }

    if (nom === "find" && !/node_modules|-prune/.test(cmd)) {
      const debut = [];
      for (const a of args) { if (a.startsWith("-") || a === "(" || a === "!") break; debut.push(a); }
      const dirs = (debut.length ? debut : ["."]).map((a) => norm(a, cwd));
      if (dirs.some(contientNodeModules)) {
        refuse("find depuis la racine sans exclure node_modules. Utiliser l'outil Glob, ou ajouter `-path '*/node_modules' -prune -o … -print`.");
      }
    }
  }
}

let entree = "";
process.stdin.on("data", (d) => (entree += d));
process.stdin.on("end", () => {
  try {
    const { tool_name: outil, tool_input: ti = {}, cwd: c } = JSON.parse(entree);
    const cwd = c || process.env.CLAUDE_PROJECT_DIR || process.cwd();

    if (outil === "Bash") return verifBash(String(ti.command || ""), cwd);

    const cible = norm(ti.file_path || ti.notebook_path || ti.path || "", cwd);
    const motif = String(ti.pattern || ti.glob || "");
    const s = secret(cible) || (outil === "Glob" && secret(motif));
    if (s) refuse(`${outil} refusé : ${s.why}. Ne jamais lire ce fichier.`);

    const ecriture = ["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(outil);
    const g = genere(cible, !ecriture) || genere(cible + "/", !ecriture) || (outil === "Glob" && /node_modules|(^|\/)dist\//.test(motif) && GENERES[0]);
    if (g) {
      refuse(ecriture
        ? `${path.basename(cible)} est généré (${g.why}) : modifier la source, puis régénérer.`
        : `${outil} sur un artefact généré refusé (${g.why}). Chercher dans les sources.`);
    }

    if (ecriture) {
      const r = REGENERES.find((x) => x.re.test(cible));
      if (r) refuse(`${path.basename(cible)} est produit par un script : ne pas l'éditer à la main, relancer \`${r.cmd}\`.`);
    }

    if (outil === "Read" && ti.offset == null && ti.limit == null) {
      const n = lignes(cible);
      if (n > SEUIL) refuse(conseilGros(cible, n));
    }
  } catch {
    // fail-open
  }
  process.exit(0);
});
