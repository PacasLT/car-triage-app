// autogidas nuskaitymo testas su TIKRU puslapio HTML (paimta 2026-09-17, BMW X5 paieška).
// Paleidimas:  node backend/testai/autogidas.test.js
const fs = require('fs'), path = require('path');
const cheerio = require('cheerio');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// Iš server.js išsitraukiam tik reikiamas funkcijas – taip testas nepaleidžia viso serverio
function imk(vardas) {
  const i = src.indexOf('function ' + vardas + '(');
  if (i < 0) throw new Error('Nerasta funkcija: ' + vardas);
  let gylis = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') gylis++;
    else if (src[k] === '}') { gylis--; if (!gylis) return src.slice(i, k + 1); }
  }
  throw new Error('Nepavyko iškirpti: ' + vardas);
}
const konst = (src.match(/const KURO_FILTRAS = \{[\s\S]*?\n\};/) || [''])[0]
  + (src.match(/const AUTOGIDAS_PARAM = \{[\s\S]*?\n\};/) || [''])[0]
  // v2.7.2: buildAutogidasUrl kviecia papFiltras (kebulas, pardavejas) - be jo testas luzo (rado tools/sargai.sh).
  + (src.match(/const PAPILDOMI_FILTRAI = \{[\s\S]*?\n\};/) || [''])[0];
const ribos = 'const MIN_REALI_KAINA = 4000; const SENAS_METAI = new Date().getFullYear() - 10; const SENAS_RIDA = 200000;';
const kodas = ribos + konst + ['extractField', 'kainosPatikra', 'papFiltras', 'extractAutogidasListings', 'buildAutogidasUrl'].map(imk).join('\n')
  + '\nreturn { extractAutogidasListings, buildAutogidasUrl };';
const { extractAutogidasListings, buildAutogidasUrl } = new Function('cheerio', 'URL', kodas)(cheerio, URL);

let ok = 0, blogai = 0;
const t = (pav, salyga, info) => salyga
  ? (ok++, console.log('  ✓ ' + pav))
  : (blogai++, console.log('  ✗ ' + pav + (info !== undefined ? ' → ' + JSON.stringify(info) : '')));

const html = '<html><body>' + fs.readFileSync(path.join(__dirname, 'autogidas-x5.html'), 'utf8') + '</body></html>';
const r = extractAutogidasListings(html, 'https://autogidas.lt/');

console.log('1. SĄRAŠO NUSKAITYMAS');
t('nuskaityti visi 6 skelbimai', r.length === 6, r.length);
t('kaina iš data-price', r[0].kaina === 16300 && r[5].kaina === 10500, [r[0].kaina, r[5].kaina]);
t('metai', r.map((x) => x.metai).join() === '2014,2003,2005,2005,2009,2011', r.map((x) => x.metai));
t('rida', r[0].rida === 286000 && r[5].rida === 217400, [r[0].rida, r[5].rida]);
t('kuras su tarpais ir be jų', r[0].kuras === 'Dyzelinas' && r[4].kuras === 'Benzinas/Dujos', [r[0].kuras, r[4].kuras]);
t('pavarų dėžė', r.every((x) => x.pavarai === 'Automatinė'));
t('variklis ir galia („3.0 L, 190 kW“)', r[0].variklioTuris === 3 && r[0].galia === 190, [r[0].variklioTuris, r[0].galia]);
t('variklis ir galia su brūkšniu („3.0 L / 225 kW“)', r[5].variklioTuris === 3 && r[5].galia === 225, [r[5].variklioTuris, r[5].galia]);
t('vieta ir miestas', r[0].vieta === 'Plungė, Lietuva' && r[0].miestas === 'Plungė', [r[0].vieta, r[0].miestas]);
t('vieta nepainiojama su kuru ar dėže', !r.some((x) => /Dyzelinas|Benzinas|Automatinė/.test(x.vieta || '')), r.map((x) => x.vieta));
t('nuoroda pilna', r[0].url.startsWith('https://autogidas.lt/skelbimas/'), r[0].url);
t('nuotrauka', r.every((x) => (x.photo || '').includes('img.autogidas.lt')));

console.log('2. LAIKAS IR IŠKĖLIMAS');
t('data-updated → tikslus laikas', r[0].ikeltaLaikas === 1789152292000, r[0].ikeltaLaikas);
t('visi turi laiką (autoplius to neturi)', r.every((x) => x.ikeltaLaikas > 0));
t('„Prieš 7 val.“ ženklas', r[2].ikeltaTekstas === 'Prieš 7 val.', r[2].ikeltaTekstas);
t('„Prieš 6 min.“ (new-badge)', r[4].ikeltaTekstas === 'Prieš 6 min.', r[4].ikeltaTekstas);
t('iškėlimo lygis iš .level', r[0].iskeltas === 6 && r[5].iskeltas === 3, [r[0].iskeltas, r[5].iskeltas]);
t('„Žiūrėjote“ nepalaikoma laiko ženklu', !r.some((x) => /Žiūrėjote/.test(x.ikeltaTekstas || '')));

console.log('3. VIN IR KAINOS SVEIKATA');
t('VIN ženklelis atpažintas', r[1].turiVin === true && r[0].turiVin === false, r.map((x) => x.turiVin));
t('finansavimo „€/mėn.“ nepalaikomas lizingo įmoka', !r.some((x) => x.kainosIspejimas && x.kainosIspejimas.tipas === 'lizingo-imoka'), r.filter((x) => x.kainosIspejimas).map((x) => x.kainosIspejimas));
t('senas pigus automobilis nežymimas klaidinga kaina', !r[3].kainosIspejimas, r[3].kainosIspejimas);
t('lizingo opcija pažymėta', r.every((x) => x.turiLizingoOpcija === true));

console.log('4. PAIEŠKOS ADRESAS');
const u = buildAutogidasUrl({ marke: 'BMW', modelis: 'X5', metaiNuo: 2018, kainaIki: 60000, ridaIki: 150000,
  kuras: 'dyzelis', pavaru_deze: 'Automatinė', beDefektu: true, tikSuVin: true, tikLietuvoje: true, beJav: true });
t('markė ir modelis', /f_1\[0\]=BMW/.test(u) && /f_model_14\[0\]=X5/.test(u), u);
t('metai, kaina, rida', /f_41=2018/.test(u) && /f_216=60000/.test(u) && /f_66=150000/.test(u));
// v2.4.3: sis testas anksciau TIKRINO KLAIDA - `kuras: 'Dyzelinas'` (sasaja
// tokios reiksmes niekada nesiuncia, ji siuncia 'dyzelis') ir formata
// `f_2[1]=1`, kuris gyvame autogide grazina 0 skelbimu. Testas buvo zalias, nes
// tikrino kodo sutapima su savimi, o ne su portalu (Z-67).
t('kuro filtras (f_2[1]=Dyzelinas, iš sąsajos reikšmės „dyzelis")', decodeURIComponent(u).includes('f_2[1]=Dyzelinas'), u);
t('be defektų (f_46)', /f_46=Be%20defekt/.test(u));
t('tik su VIN / tik Lietuvoje / be aukcionų', /ac_3=1/.test(u) && /ac_4=1/.test(u) && /ac_5=1/.test(u));
t('rikiuojama nuo naujausių', /f_50=naujausi_asc/.test(u));
const tuscias = buildAutogidasUrl({ marke: 'BMW' });
t('be papildomų filtrų adresas lieka tvarkingas', tuscias.includes('f_1[0]=BMW') && tuscias.includes('f_50='), tuscias);

console.log('\n' + ok + ' praėjo, ' + blogai + ' nepavyko');
process.exit(blogai ? 1 : 0);
