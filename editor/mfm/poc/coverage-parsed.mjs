// POC #2 : matcher contre les données PARSÉES par l'app (imports résolus).
import fs from "node:fs";
import path from "node:path";
import { parseAllCatalogues } from "/home/user/cogitator-bellicum/scripts/bsdata-parser.mjs";
const MFM_DIR = "/tmp/claude-0/-home-user/e6808ee9-9a31-5363-bc21-7bf61aad50fb/scratchpad/mfm-drop/en/json";
const norm = (s) => String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’‘`]/g,"'").replace(/[–—]/g,"-").replace(/\bw\/\s*/gi,"with ").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim();
// MFM slug → nom de faction tel que l'app le parse.
const SLUG_TO_FACTION = {
  "orks":"Orks","necrons":"Necrons","tyranids":"Tyranids","space-marines":"Space Marines",
  "space-wolves":"Space Wolves","blood-angels":"Blood Angels","dark-angels":"Dark Angels",
  "black-templars":"Black Templars","deathwatch":"Deathwatch","imperial-knights":"Imperial Knights",
  "adeptus-mechanicus":"Adeptus Mechanicus","adepta-sororitas":"Adepta Sororitas","adeptus-custodes":"Adeptus Custodes",
  "astra-militarum":"Astra Militarum","grey-knights":"Grey Knights","imperial-agents":"Agents of the Imperium",
  "chaos-space-marines":"Chaos Space Marines","death-guard":"Death Guard","thousand-sons":"Thousand Sons",
  "world-eaters":"World Eaters","chaos-daemons":"Chaos Daemons","chaos-knights":"Chaos Knights",
  "emperors-children":"Emperor's Children","genestealer-cults":"Genestealer Cults","leagues-of-votann":"Leagues of Votann",
  "tau-empire":"T'au Empire","aeldari":"Aeldari","drukhari":"Drukhari",
};
const all = await parseAllCatalogues("/home/user/cogitator-bellicum/node_modules/.cache/bsdata");
let tot={mfm:0,matched:0,unmapped:0};
const worst=[];
for (const f of fs.readdirSync(MFM_DIR)) {
  if (!f.endsWith(".json") || f==="all.json") continue;
  const slug=f.replace(/\.json$/,"");
  const facName=SLUG_TO_FACTION[slug]; if(!facName){continue;}
  const fac=all[facName]; if(!fac){console.log("NO PARSE:",slug,"→",facName);continue;}
  const mfm=JSON.parse(fs.readFileSync(path.join(MFM_DIR,f),"utf8"));
  const byNorm=new Map(); for(const u of fac.units) if(!byNorm.has(norm(u.name))) byNorm.set(norm(u.name),u);
  let um=0; const umList=[];
  for(const mu of mfm.units){ tot.mfm++; if(byNorm.has(norm(mu.name))){tot.matched++;} else {tot.unmapped++;um++;umList.push(mu.name);} }
  if(um) worst.push(`${facName}: ${um} non-mappés → ${umList.slice(0,8).join(", ")}${umList.length>8?"…":""}`);
}
console.log(worst.join("\n"));
console.log(`\nTOTAL: ${tot.mfm} MFM units | matchés ${tot.matched} (${(100*tot.matched/tot.mfm).toFixed(1)}%) | non-mappés ${tot.unmapped}`);
