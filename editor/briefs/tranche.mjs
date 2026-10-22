// tranche.mjs — découpe un extrait en lots de N (défaut 110) : lot.json → lot-1.json, lot-2.json…
import { readFileSync, writeFileSync } from "node:fs";
const [src, nArg] = process.argv.slice(2); const N = Number(nArg) || 110;
const list = JSON.parse(readFileSync(src, "utf8"));
let i = 0; for (let s = 0; s < list.length; s += N) { i++; const p = src.replace(/\.json$/, `-${i}.json`); writeFileSync(p, JSON.stringify(list.slice(s, s + N), null, 1)); console.log(p, list.slice(s, s + N).length); }
