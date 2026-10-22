// Résumés « initiation » des capacités (briefs/<lang>.json) — bibliothèque commune
// à l'extracteur, au fusionneur et à l'audit.
//
// Format : { meta: { language, builtAt, totalStrings }, strings: { "<nom exact de
// la capacité>": { src: "<empreinte du texte source>", brief: "<résumé>" } } }.
// Clef = nom du profil Abilities (3 149 noms distincts, aucun homonyme à texte
// différent dans la base). `src` = empreinte du texte anglais canonique : un
// errata qui change la prose rend le résumé PÉRIMÉ (signalé par l'audit) sans
// qu'on ait jamais à toucher les .cat.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const LANGS = ["en", "fr"];

const unesc = (s) => s.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
export const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
export const hashOf = (text) => createHash("sha1").update(norm(text)).digest("hex").slice(0, 10);

// Capacités STRUCTURELLES, jamais résumées : la fiche PDF les rend depuis les
// données (Mène : …, invu, Transport, Endommagé) ou par leur seul nom (règles de
// base). Leader seul compte 32 textes différents (la liste des unités menées).
export const SKIP = /^(Leader|Invulnerable Save.*|Supreme Commander|Support|Damaged:.*|Attached Unit|Transport|Deadly Demise.*|Feel No Pain.*|Scouts \d.*|Deep Strike|Infiltrators|Lone Operative|Stealth|Fights First|Firing Deck.*|Hover)$/i;

// Clef dans briefs/<lang>.json : le nom seul, sauf homonymes à textes différents
// (76 noms : Fire Support, Face of Death, Hunter's Eye…) → "nom#empreinte".
// `homonyms` = Set des noms portant plusieurs textes dans TOUTE la base.
export const keyOf = (a, homonyms) => (homonyms && homonyms.has(a.name) ? `${a.name}#${a.src}` : a.name);

// Toutes les capacités d'un .cat : [{ name, text, src }] — dédoublonnées par
// nom + texte, capacités structurelles exclues.
export function abilitiesOf(file) {
  const xml = readFileSync(file, "utf8");
  const out = new Map();
  // Attributs dans un ordre quelconque (769 profils portent id= avant name=).
  const re = /<profile\b([^>]*)>([\s\S]*?)<\/profile>/g;
  const attr = (s, k) => { const mm = new RegExp("\\b" + k + '="([^"]*)"').exec(s); return mm ? mm[1] : ""; };
  let m;
  while ((m = re.exec(xml))) {
    if (attr(m[1], "typeName") !== "Abilities") continue;
    const d = /<characteristic name="Description"[^>]*>([\s\S]*?)<\/characteristic>/.exec(m[2]);
    const name = unesc(attr(m[1], "name")).trim();
    const text = unesc(d ? d[1] : "").trim();
    if (!name || !text || SKIP.test(name)) continue;
    const src = hashOf(text);
    if (out.has(name + "#" + src)) continue;
    out.set(name + "#" + src, { name, text, src });
  }
  return [...out.values()];
}
// Capacités telles que l'APPLI les voit (parseur embarqué editor/mfm/vendor) :
// par faction, les `abilities` de chaque fiche (+ options des sections à choix).
// Couvre ce que les profils seuls ratent — règles d'unité liées par infoLink
// (Dark Pacts, Veterans of the Long War), capacités de sections — c'est ce que
// le PDF « initiation » imprime. Même SKIP, même empreinte.
let _parsed = null;
export async function parsedAbilitiesByFaction() {
  if (_parsed) return _parsed;
  const { parseAllCatalogues } = await import("../mfm/vendor/bsdata-parser.mjs");
  const log = console.log; console.log = () => {};
  let d; try { d = await parseAllCatalogues(ROOT); } finally { console.log = log; }
  const out = new Map();
  for (const [fac, x] of Object.entries(d || {})) {
    const m = new Map();
    const add = (name, text) => { const n = String(name || "").trim(), t = String(text || "").trim(); if (!n || !t || SKIP.test(n)) return; const src = hashOf(t); const k = n + "#" + src; if (!m.has(k)) m.set(k, { name: n, text: t, src }); };
    for (const u of x.units || []) for (const a of u.abilities || []) { if (!a) continue; add(a[0], a[1]); for (const o of a[2] || []) if (o) add(o[0], o[1]); }
    // Règles d'armée, règles de détachement et stratagèmes (mode initiation du
    // PDF : encadrés et tables simplifiés). `kind` guide la rédaction (un
    // stratagème se résume « quand, cible : effet ») ; même clef nom(#empreinte).
    const addK = (kind, name, text) => { const before = m.size; add(name, text); if (m.size > before) [...m.values()].pop().kind = kind; };
    for (const r of x.armyRules || []) addK("army", r.name, r.desc);
    for (const dt of x.dets || []) {
      const rl = Array.isArray(dt.rules) && dt.rules.length ? dt.rules : (dt.rule ? [{ name: dt.ruleName || dt.name, desc: dt.rule }] : []);
      for (const r of rl) addK("det", r.name, r.desc);
      for (const st of dt.strats || []) addK("strat", st.name, st.description);
    }
    out.set(fac, [...m.values()]);
  }
  _parsed = out;
  return out;
}

// Noms portant plusieurs textes différents dans toute la base (profils + parseur).
export async function homonymsOf() {
  const by = new Map();
  const put = (a) => { if (!by.has(a.name)) by.set(a.name, new Set()); by.get(a.name).add(a.src); };
  for (const f of catFiles()) for (const a of abilitiesOf(path.join(ROOT, f))) put(a);
  for (const list of (await parsedAbilitiesByFaction()).values()) for (const a of list) put(a);
  return new Set([...by].filter(([, s]) => s.size > 1).map(([n]) => n));
}
// Entrée d'un pack pour une capacité : « nom#empreinte » d'abord, puis le nom
// seul si son empreinte correspond (même règle que l'appli, src/lib/briefs.js).
export const entryOf = (strings, a) => strings[`${a.name}#${a.src}`] || (strings[a.name] && strings[a.name].src === a.src ? strings[a.name] : undefined);
// Un nom devenu homonyme (nouveau texte ailleurs) garde son résumé : la clef
// simple est renommée « nom#empreinte ».
export function rekeyPack(data, homonyms) {
  let n = 0;
  for (const [k, v] of Object.entries(data.strings)) if (homonyms.has(k) && v && v.src) { delete data.strings[k]; data.strings[`${k}#${v.src}`] = v; n++; }
  return n;
}
// Source d'un lot : « <fichier.cat> » (profils) ou « faction:<Nom> » (parseur).
export async function abilitiesOfSource(src) {
  if (/^faction:/i.test(src)) { const fac = src.replace(/^faction:/i, ""); const m = await parsedAbilitiesByFaction(); if (!m.has(fac)) throw new Error("faction inconnue : " + fac + " (connues : " + [...m.keys()].join(", ") + ")"); return m.get(fac); }
  return abilitiesOf(path.isAbsolute(src) ? src : path.join(ROOT, src));
}
export const catFiles = () => readdirSync(ROOT).filter((f) => f.endsWith(".cat")).sort((a, b) => a.localeCompare(b, "en"));

export function loadBriefs(lang) {
  const p = path.join(ROOT, "briefs", lang + ".json");
  if (!existsSync(p)) return { meta: { language: lang, builtAt: "", totalStrings: 0 }, strings: {} };
  return JSON.parse(readFileSync(p, "utf8"));
}
export function saveBriefs(lang, data) {
  const keys = Object.keys(data.strings).sort((a, b) => a.localeCompare(b, "en"));
  const strings = {};
  for (const k of keys) strings[k] = data.strings[k];
  const meta = { language: lang, builtAt: new Date().toISOString().slice(0, 10), totalStrings: keys.length };
  writeFileSync(path.join(ROOT, "briefs", lang + ".json"), JSON.stringify({ meta, strings }, null, 1) + "\n");
}
