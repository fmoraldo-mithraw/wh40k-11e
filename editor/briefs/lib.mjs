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
  const re = /<profile name="([^"]*)"[^>]*typeName="Abilities"[^>]*>([\s\S]*?)<\/profile>/g;
  let m;
  while ((m = re.exec(xml))) {
    const d = /<characteristic name="Description"[^>]*>([\s\S]*?)<\/characteristic>/.exec(m[2]);
    const name = unesc(m[1]).trim();
    const text = unesc(d ? d[1] : "").trim();
    if (!name || !text || SKIP.test(name)) continue;
    const src = hashOf(text);
    if (out.has(name + "#" + src)) continue;
    out.set(name + "#" + src, { name, text, src });
  }
  return [...out.values()];
}
// Noms portant plusieurs textes différents dans toute la base.
export function homonymsOf() {
  const by = new Map();
  for (const f of catFiles()) for (const a of abilitiesOf(path.join(ROOT, f))) { if (!by.has(a.name)) by.set(a.name, new Set()); by.get(a.name).add(a.src); }
  return new Set([...by].filter(([, s]) => s.size > 1).map(([n]) => n));
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
