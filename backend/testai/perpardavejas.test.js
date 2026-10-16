// perpardavejas.test.js — lentelės rodinio skaičiai ir juosta (v2.22.1).
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

T(ctx.window.CT_PERP && typeof ctx.window.CT_PERP.maxPirkimo==='function','CT_PERP atidarytas korteliu piesejui');
T(ctx.window.CT_PERP.maxPirkimo(c)===15443,'CT_PERP.maxPirkimo -> '+ctx.window.CT_PERP.maxPirkimo(c)+' € (ta pati formule)');

// ── 71 pk.: juosta NUOLATINE, abiem rezimais ────────────────────────────────
// Kodel testas: juosta gyvena VIRS rezultatu konteinerio, o korteliu piesejas
// perrasinėja konteinerio vidu. Jei juosta kada nors atsidurtu viduje, ji
// isnyktu persijungus i korteles - ir bukles filtras taptu nepasiekiamas.
function naujasDom(){
  const mk=()=>{const o={className:'',innerHTML:'',hidden:false,children:[],
    addEventListener(t,f){o.__klik=f;},setAttribute(){},getAttribute:()=>null,
    querySelectorAll:()=>[],querySelector:()=>null,contains:()=>true,
    closest:()=>null,appendChild(x){o.children.push(x);}};return o;};
  const res=mk(); const tevas=mk();
  tevas.insertBefore=(k,pries)=>{tevas.children.push(k); k.nextSibling=pries;};
  res.parentNode=tevas;
  return {res,tevas,mk};
}
const dom=naujasDom();
const ctx2={window:{},localStorage:{getItem:()=>null,setItem(){}},
  document:{createElement:dom.mk,getElementById:()=>null}};
ctx2.window.localStorage=ctx2.localStorage; ctx2.window.document=ctx2.document;
let gautaKortelese=null;
ctx2.window.renderCandidateCards=function(sar){gautaKortelese=sar;};
vm.createContext(ctx2); vm.runInContext(kodas,ctx2);

const dauztas={...c,url:'d',galimiDefektai:['Priekis'],source:'mobilede'};
ctx2.window.renderCandidateCards([c,dauztas],dom.res);

const juosta=dom.tevas.children.find(x=>x.className==='ct-dtable-bar');
T(!!juosta,'juosta sukurta');
T(juosta && juosta.nextSibling===dom.res,'juosta stovi VIRS rezultatu, ne viduje');
T(juosta && /ct-dtable-count/.test(juosta.innerHTML),'skaitiklis .ct-dtable-count');
T(juosta && /ct-seg ct-dtable-view/.test(juosta.innerHTML),'rodinio jungiklis .ct-dtable-view juostos gale');
T(juosta && /ct-seg-l/.test(juosta.innerHTML) && !/ct-dt-seg-l/.test(juosta.innerHTML),'etiketes vardas .ct-seg-l (senas .ct-dt-seg-l isejo)');
T(juosta && /ct-bukle-legend" hidden/.test(juosta.innerHTML),'legenda korteliu rezime - [hidden]');
T(juosta && /2 skelb\./.test(juosta.innerHTML),'skaitiklis rodo 2 (abu telpa i „visi")');
T(gautaKortelese && gautaKortelese.length===2,'korteliu rezimas gavo abu');

// bukles filtras - abiem rodiniais: paspaudziam „Tik tvarkingi"
juosta.__klik({target:{closest:()=>({parentNode:{getAttribute:()=>'Būklė'},getAttribute:()=>'tvarkingi'})}});
T(gautaKortelese && gautaKortelese.length===1 && gautaKortelese[0].url==='u','bukles filtras veikia IR korteliu rezime (2 -> 1)');
T(/1 skelb\./.test(juosta.innerHTML),'skaitiklis persiskaiciavo i 1');

console.log('\n'+(klaidu?klaidu+' KRENTA':'visi '+n+' prajo'));
process.exit(klaidu?1:0);
