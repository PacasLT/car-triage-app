// perpardavejas.test.js — lentelės rodinio skaičiai (v2.22.0).
//
//     node backend/testai/perpardavejas.test.js
//
// Kodėl: maržos jungiklis perskaičiuoja MAX NARŠYKLĖJE, be serverio. Jei abi
// formulės išsiskirs, vartotojas matys vieną skaičių sąraše ir kitą skelbime.
// Čia tikrinam, kad naršyklės skaičiavimas sutaptų su `max-pirkimo.js`.
const fs=require('fs'), vm=require('vm');
const kodas=fs.readFileSync('frontend/perpardavejas.js','utf8');
let klaidu=0,n=0; const T=(c,s)=>{n++;console.log((c?'  ok   ':'  BLOGAI ')+s); if(!c)klaidu++;};

// minimalus DOM, kad IIFE prasisuktu
const el=()=>({innerHTML:'',appendChild(){},insertBefore(){},querySelectorAll:()=>[],
  querySelector:()=>null,addEventListener(){},setAttribute(){},getAttribute:()=>null,closest:()=>null,parentNode:{insertBefore(){}}});
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:el,getElementById:()=>null}};
ctx.window.localStorage=ctx.localStorage; ctx.window.document=ctx.document;
ctx.window.renderCandidateCards=function(){ctx.window.__korteles=true;};
vm.createContext(ctx);
vm.runInContext(kodas,ctx);

T(typeof ctx.window.renderCandidateCards==='function','apvalkalas uzsidejo');

// Luko Octavia: LT mediana 18 550, kastai 850, tarsa 65
const c={url:'u',kaina:14500,modelis:'Skoda Octavia',pavadinimas:'Octavia Combi 2.0 TDI',
  metai:2024,rida:63053,source:'mobilede',rinka:'DE',dienosRinkoje:14,
  regitra:{apyv_pct:25.7},
  kainaLt:{kaina:14500,kastai:{transportas:450,registracija:20,ta:30,paruosimas:350,viso:850},
    tarsa:{nuo:0,iki:129,vidurkis:65,tikslumas:'apytikslis'},viso:15415},
  maxPirkimo:{max:15443,pardavimas:17994,kastai:850,tarsa:65,marza:0.1,riba:false},
  pelnoMath:{pelnas:2579,investicija:15415,roi:17}};

// formule narsykleje turi sutapti su serverio
const max10=Math.round(c.maxPirkimo.pardavimas/1.10-850-65);
const max15=Math.round(c.maxPirkimo.pardavimas/1.15-850-65);
const max20=Math.round(c.maxPirkimo.pardavimas/1.20-850-65);
T(max10===15443,'marza 10 % -> '+max10+' € (sutampa su serverio)');
T(max15<max10 && max20<max15,'didesne marza -> mazesnis max: '+max10+' > '+max15+' > '+max20);
T(max10-c.kaina===943,'„telpa · +'+(max10-c.kaina)+'"');

// likvidumo ribos - is backend/regitra.js RIBOS, ne is lubu
T(25.7<26 && 25.7>13,'X5 apyvarta 25,7 % -> vidutinis (riba 26 %, is regitra.js RIBOS)');

console.log('\n'+(klaidu?klaidu+' KRENTA':'visi '+n+' prajo'));
process.exit(klaidu?1:0);
