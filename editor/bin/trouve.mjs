#!/usr/bin/env node
// trouve.mjs — localiser une entrée dans les .cat/.gst SANS lire le XML :
// une ligne par résultat, `Fichier:ligne  <tag type> "nom" id=… [→ cible]`.
// La ligne sert ensuite à un Read ciblé (offset) ou à `montre.mjs <id>`.
//
//   node editor/bin/trouve.mjs "Tallyband"                 # nom (regex, insensible à la casse)
//   node editor/bin/trouve.mjs "^Plaguebearers$" --tag selectionEntry
//   node editor/bin/trouve.mjs "Kill Team" --file Deathwatch --max 20
//   node editor/bin/trouve.mjs --id 69e5-13c7-06bf-d454          # définition(s) de l'id
//   node editor/bin/trouve.mjs --id 69e5-13c7-06bf-d454 --refs   # + toutes les références
//
// Tags par défaut : selectionEntry, selectionEntryGroup, entryLink, categoryEntry,
// categoryLink, rule, profile, infoLink, forceEntry, catalogueLink.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const id = opt("--id");
const refs = has("--refs");
const max = Number(opt("--max", 40));
const fileF = opt("--file");
const tags = (opt("--tag") || "selectionEntry,selectionEntryGroup,entryLink,categoryEntry,categoryLink,rule,profile,infoLink,forceEntry,catalogueLink").split(",");
const pat = args.find((a, i) => !a.startsWith("--") && !["--id", "--max", "--file", "--tag"].includes(args[i - 1]));
if (!id && !pat) { console.log("usage: trouve.mjs <regex-nom> [--tag a,b] [--file x] [--max N] | --id ID [--refs]"); process.exit(2); }
const re = pat ? new RegExp(pat, "i") : null;
const tagRe = new RegExp(`<(${tags.join("|")})\\s([^>]*)>`);
const attr = (s, k) => { const m = new RegExp(`\\b${k}="([^"]*)"`).exec(s); return m ? m[1].replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&") : ""; };

const files = readdirSync(ROOT).filter((f) => /\.(cat|gst)$/.test(f) && (!fileF || f.toLowerCase().includes(fileF.toLowerCase())));
const out = [];
for (const f of files) {
  const lines = readFileSync(join(ROOT, f), "utf8").split("\n");
  const stack = []; // entrées englobantes (pour dire OÙ se trouve une référence)
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const op = /<(selectionEntry|selectionEntryGroup|entryLink|categoryEntry|forceEntry)\s([^>]*?)(\/?)>/.exec(L);
    if (op && !op[3]) stack.push(attr(op[2], "name"));
    if (/<\/(selectionEntry|selectionEntryGroup|entryLink|categoryEntry|forceEntry)>/.test(L) && !(op && !op[3])) stack.pop();
    if (id) {
      const def = L.includes(`id="${id}"`);
      const ref = refs && !def && L.includes(id);
      if (!def && !ref) continue;
      const m = /<(\w+)\s([^>]*)/.exec(L) || [];
      const a = m[2] || "";
      out.push(`${f}:${i + 1}  ${def ? "DÉF" : "réf"} <${m[1] || "?"}${attr(a, "type") ? " " + attr(a, "type") : ""}> ${attr(a, "name") ? '"' + attr(a, "name") + '"' : ""}${!def ? " " + (/(\w+)="[^"]*$/.exec(L.slice(0, L.indexOf(id))) || [])[1] + "= dans \"" + (stack[stack.length - 1] || "?") + "\"" : ""}`.replace(/\s+/g, " ").trim());
      continue;
    }
    const m = tagRe.exec(L);
    if (!m) continue;
    const name = attr(m[2], "name");
    if (!name || !re.test(name)) continue;
    const t = attr(m[2], "type"), tid = attr(m[2], "targetId"), eid = attr(m[2], "id"), tn = attr(m[2], "typeName");
    out.push(`${f}:${i + 1}  <${m[1]}${t ? " " + t : ""}${tn ? " " + tn : ""}> "${name}" id=${eid}${tid ? " → " + tid : ""}${attr(m[2], "hidden") === "true" ? " (hidden)" : ""}`);
  }
}
for (const l of out.slice(0, max)) console.log(l.length > 200 ? l.slice(0, 197) + "…" : l);
if (out.length > max) console.log(`… +${out.length - max} autres (--max N, --file, --tag pour filtrer)`);
if (!out.length) console.log("aucun résultat");
