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
const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},
  document:{createElement:el,getElementById:()=>null,body:el()}};
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
ctx2.document.body = dom.mk();
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

// ── K-72: bukles zyma pagal DOMENA, ne trumpaji varda ───────────────────────
// `c.source` is serverio ateina kaip „mobile.de" / „autoscout24.com", todel
// senasis STRUKTURINIAI[c.source] niekada nesutapdavo ir KIEKVIENAS dauztas
// auto gaudavo punktyrine „~ dauztas?" zyma, net kai portalas pats pazymejo.
{
  const dom = { ...c, url: 'z', source: 'mobile.de', galimiDefektai: ['Priekis'] };
  const trump = { ...c, url: 'z2', source: 'mobilede', galimiDefektai: ['Priekis'] };
  const ap = { ...c, url: 'z3', source: 'autoplius.lt', galimiDefektai: ['Priekis'] };
  const b = ctx.window.CT_PERP.bukle;
  T(b(dom) && b(dom).saltinis === 'portalas', '„mobile.de" (domenas) -> tvirta zyma „Dauztas"');
  T(b(trump) && b(trump).saltinis === 'portalas', '„mobilede" (trumpas) irgi veikia');
  T(b(ap) && b(ap).saltinis === 'aprasymas', '„autoplius.lt" -> punktyrine „~ dauztas?" (struktūrinio lauko nera)');
  T(b({ ...c, url: 'z4' }) === null, 'tvarkingas -> jokios zymos');
}

// ── Errata 19: viena juosta, rusiavimo busena bendra ────────────────────────
// Kodel sargas: `#sort-bar` istrintas, o `.ct-sort` meniu ir „Analizuoti
// modeli" PERKELIAMI i juosta. Jei perkelimo vietos dings is markupo, juostoje
// nebeliks rusiavimo - ir to nesimatys niekur, isskyrus gyva puslapi.
{
  const kodas2 = fs.readFileSync('frontend/perpardavejas.js', 'utf8');
  T(/data-vieta="sort"/.test(kodas2), 'juostoje yra vieta rusiavimo meniu');
  T(/data-vieta="modelis"/.test(kodas2), 'juostoje yra vieta „Analizuoti modeli"');
  T(/data-mode="cards"/.test(kodas2), '„Rusiuoti" etikete pazymeta data-mode="cards"');
  T(/sort\.hidden = busena\.rodinys === 'lentele'/.test(kodas2), 'lenteles rezime meniu slepiamas');

  const idx = fs.readFileSync('frontend/index.html', 'utf8');
  T(!/id="sort-bar"/.test(idx), '`#sort-bar` markupo nebera');
  T(/id="ct-juostos-dalys"/.test(idx), 'perkeliamieji laikomi sandelyje');
  T(/id="ct-sort"/.test(idx) && /id="ct-modelio-btn"/.test(idx) && /id="sort-select"/.test(idx),
    'visi trys elementai issaugoti (meniu, modelio mygtukas, busenos laukas)');

  const css = fs.readFileSync('frontend/ct-dizainas.css', 'utf8');
  T(!/^\.ct-sortbar/m.test(css), '`.ct-sortbar*` taisykliu nebera');
  T(/\.ct-dtable-bar > \.ct-sort:not\(\[hidden\]\)/.test(css), '51b papildymas idiegtas');
  T(/@media \(max-width: 640px\) \{ \.ct-check \{ min-height: var\(--tap-min\); \} \}/.test(css),
    'K-23a: `.ct-check` telefone 44 px (21 sk.)');
  const pr = fs.readFileSync('frontend/ct-priedai.css', 'utf8');
  T(!/\.ct-fld-pop > \.ct-check \{ min-height/.test(pr), 'ir is priedu 25 bloko ta eilute isimta');
}

// ── K-73: skydelio `display` su :not([hidden]) ──────────────────────────────
// Kodel sargas: `hidden` atributas BE `:not([hidden])` nieko nepaslepia, nes
// bazine `display: flex` (0,1,0) nugali bendra `:where([hidden])` (0,0,0).
// Mano ankstesnis sargas tikrino ATRIBUTA, ne apskaiciuota `display` - ir
// praleido. Dabar tikrinam pati CSS.
{
  const pr = fs.readFileSync('frontend/ct-priedai.css', 'utf8');
  T(/\.ct-fld-pop:not\(\[hidden\]\)\s*\{/.test(pr), '`.ct-fld-pop` display rasytas su :not([hidden])');
  T(!/^\.ct-fld-pop\s*\{/m.test(pr), 'bazines `.ct-fld-pop {` be :not([hidden]) nebera');
}

// ── Be nuotraukos – i apacia (Luko prasymas) ────────────────────────────────
{
  const su1 = { ...c, url: 'p1', photo: 'a.jpg', pelnoMath: { pelnas: 100, investicija: 1, roi: 1 } };
  const be  = { ...c, url: 'p2', photo: null,    pelnoMath: { pelnas: 9999, investicija: 1, roi: 9 } };
  const su2 = { ...c, url: 'p3', photo: 'b.jpg', pelnoMath: { pelnas: 50, investicija: 1, roi: 1 } };
  let gauta = null;
  const dom2 = naujasDom();
  const ctx3 = { window: {}, localStorage: { getItem: () => null, setItem() {} },
    document: { createElement: dom2.mk, getElementById: () => null, body: dom2.mk() } };
  ctx3.window.localStorage = ctx3.localStorage; ctx3.window.document = ctx3.document;
  ctx3.window.renderCandidateCards = function (sar) { gauta = sar; };
  vm.createContext(ctx3); vm.runInContext(kodas, ctx3);
  ctx3.window.renderCandidateCards([su1, be, su2], dom2.res);
  T(gauta && gauta.length === 3, 'visi trys lieka – skelbimas neismetamas');
  T(gauta && gauta[2].url === 'p2', 'be nuotraukos nukeliavo i APACIA, nors jo pelnas didziausias');
  T(gauta && gauta[0].url === 'p1' && gauta[1].url === 'p3', 'kitu tvarka nepakito');

  const kodas3 = fs.readFileSync('frontend/perpardavejas.js', 'utf8');
  T(/function beNuotr/.test(kodas3), 'lenteles rikiavimas turi ta pati sargyba');
  const srv = fs.readFileSync('backend/server.js', 'utf8');
  T(/\(a\.beNuotraukos - b\.beNuotraukos\)/.test(srv), 'serveris rikiuoja kandidatus taip pat');
  T(/if \(!l\.photo && Array\.isArray\(l\.photos\) && l\.photos\.length\) l\.photo = l\.photos\[0\]/.test(srv),
    'pries tai patikrinam `photos[0]` – ar tikrai nera');
  T(/primary\.photoIsKito/.test(srv), 'ir pasiskolinam is kryzminio skelbimo');
  T(/beNuotraukos: !!l\.beNuotraukos/.test(srv), 'laukas patenka i baltaji sarasa (be jo iki sasajos nenukeliautu)');
}

console.log('\n'+(klaidu?klaidu+' KRENTA':'visi '+n+' prajo'));
process.exit(klaidu?1:0);
