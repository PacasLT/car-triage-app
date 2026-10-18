// pigumo-patikra.test.js — kodėl skelbimas per pigus (v2.25.0).
//
//     node backend/testai/pigumo-patikra.test.js
//
// Kodėl sargas: šis modulis leidžia PINIGUS (kiekvienas 2 pakopos kvietimas –
// tikra sąskaita) ir kalba apie DAUŽTUS automobilius. Todėl tikrinam tris
// dalykus, kurių sulūžimo nesimatytų niekur: (1) pigesnė pakopa eina pirma ir
// brangesnės nekviečia; (2) viena nuotrauka niekada nepasako „daužtas“;
// (3) „per pigus“ skaičiuojamas tik nuo patikimos medianos.
const p = require('../pigumo-patikra');
const fs = require('fs');
const path = require('path');
let klaidu = 0, n = 0;
const T = (c, s) => { n++; console.log((c ? '  ok   ' : '  BLOGAI ') + s); if (!c) klaidu++; };

// ── 1 pakopa · tekstas (0 €) ────────────────────────────────────────────────
const tp = (t, extra) => p.tekstoPriezastys(Object.assign({ rawText: t }, extra || {}));
T(tp('Automobilis dauztas, reikia remonto').some((x) => x.kodas === 'zala'), 'LT „dauztas“');
T(tp('Automobilis daužtas priekis').some((x) => x.kodas === 'zala'), 'LT su diakritikais („daužtas“)');
T(tp('Unfallschaden vorne links').some((x) => x.kodas === 'zala'), 'DE „Unfallschaden“');
T(tp('Samochod powypadkowy').some((x) => x.kodas === 'zala'), 'PL „powypadkowy“');
T(tp('Salvage title, damaged').some((x) => x.kodas === 'zala'), 'EN „damaged“');
T(tp('Parduodamas dalimis').some((x) => x.kodas === 'dalimis'), 'dalimis');
T(tp('Mėnesinė įmoka nuo 149 EUR, lizingas').some((x) => x.kodas === 'lizingas'), 'lizingo įmoka');
T(tp('Kaina be PVM, eksportui').some((x) => x.kodas === 'eksportas'), 'kaina be PVM');
T(tp('Be TA, reikia pravaryti').some((x) => x.kodas === 'beTA'), 'be TA');
T(tp('Iš Amerikos aukciono, Copart').some((x) => x.kodas === 'aukcionas'), 'aukcionas');
T(tp('Motorschaden, nicht fahrbereit').some((x) => x.kodas === 'neveikia'), 'DE variklio gedimas');
T(tp('Tvarkingas, servisuotas, viena savininke').length === 0, 'tvarkingas skelbimas – jokios priežasties');
// Kelios priežastys viena kitos nepaneigia
T(tp('Dauztas, parduodamas dalimis, be TA').length === 3, 'trys priežastys vienu metu');
// Kryžminis skelbimas PIGIAU – pardavėjas pats parodė tikrą kainą
T(tp('Tvarkingas', { kaina: 10000, kryzminiaiSkelbimai: [{ kaina: 8500 }] })
  .some((x) => x.kodas === 'kryzminis'), 'kryžminis skelbimas 15 % pigiau – priežastis');
T(!tp('Tvarkingas', { kaina: 10000, kryzminiaiSkelbimai: [{ kaina: 9800 }] })
  .some((x) => x.kodas === 'kryzminis'), 'ta pati kaina kitame portale – NE priežastis');

const v1 = p.tekstoVerdiktas(tp('Automobilis dauztas'));
T(v1 && v1.pakopa === 1 && v1.lygis === 'tekste', '1 pakopos verdiktas: lygis „tekste“');
T(v1 && v1.reikiaPilnos === false, '1 pakopa pilnos analizės NEPRAŠO – priežastis jau žinoma');
T(v1 && v1.usage === null, '1 pakopa nieko nekainuoja (usage null)');
T(p.tekstoVerdiktas([]) === null, 'be priežasčių – nėra verdikto (eina 2 pakopa)');

// ── Ar apskritai „per pigus" ────────────────────────────────────────────────
T(p.arPigus({ diffPct: 30, marketCount: 8 }, 25, 5), '30 % nuo 8 skelbimų – pigus');
T(!p.arPigus({ diffPct: 30, marketCount: 3 }, 25, 5), 'plona imtis (3) – NE pigus, nors −30 %');
T(!p.arPigus({ diffPct: 10, marketCount: 40 }, 25, 5), '10 % – NE pigus');
T(!p.arPigus({ diffPct: null, marketCount: 40 }, 25, 5), 'be medianos – NE pigus');
T(!p.arPigus(null, 25, 5), 'null skelbimas – NE pigus');

// ── 2 pakopa · uždraustų frazių sargas ──────────────────────────────────────
const bazė = { tas_pats: true, kebulas: 'sedanas', rodoma: 'priekis', matoma: [],
  zalos_pozymiai: 'nera', nuotraukos_kokybe: 'gera', pigumo_priezastis: 'kokybe' };
const su = (o) => p.apdoroti(Object.assign({}, bazė, o));

let v = su({ kodel: 'Automobilis daužtas, todėl pigus', pigumo_priezastis: 'zala', zalos_pozymiai: 'matomi' });
T(!/dauž|dauz/i.test(v.tekstas), '„daužtas“ iš nuotraukos IŠKERPAMAS');
T(/neteiktinas teiginys/.test(v.tekstas), 'pasakoma, kad teiginys pašalintas');
T(v.lygis === 'galimas', 'žala iš vienos nuotraukos – tik „galimas“, niekada „matoma“');

v = su({ kodel: 'Rida tikriausiai atsukta', pigumo_priezastis: 'rida' });
T(!/atsukt/i.test(v.tekstas), '„atsukta rida“ iškerpama');

v = su({ kodel: 'Nuotraukos tamsios ir neryškios', nuotraukos_kokybe: 'neryski' });
T(/tamsios/.test(v.tekstas), 'leistinas tekstas NEKEIČIAMAS');

v = su({ matoma: ['Variklis tvarkingas', 'Matomas kitas dažų atspalvis ant sparno'], kodel: 'Matosi perdažymas' });
T(!/variklis tvarkingas/i.test(v.matoma.join(' ')), '„variklis tvarkingas“ išimtas ir iš `matoma`');
T(v.matoma.some((x) => /atspalvis/.test(x)), 'faktas apie atspalvį lieka');

// ── 2 pakopa · verdikto logika ──────────────────────────────────────────────
v = su({ tas_pats: false, pigumo_priezastis: 'kokybe' });
T(v.priezastis === 'neatitinka', 'ne tas automobilis nugali modelio priežastį');
T(v.lygis === 'matoma', 'neatitikimas YRA matomas – jam viena nuotrauka užtenka');
T(v.reikiaPilnos === true, 'neatitikimas prašo pilnos apžvalgos');
T(v.zyma === 'Nuotr. ≠ aprašymas', 'žyma lentelei');

v = su({ nuotraukos_kokybe: 'ne_automobilis' });
T(v.priezastis === 'ne_automobilis', 'nuotraukoje ne automobilis');

v = su({ pigumo_priezastis: 'nepaaiskinta', kodel: '' });
T(v.priezastis === 'nepaaiskinta' && v.reikiaPilnos === true, '„nepaaiškinta“ – vienintelis kelias į 3 pakopą');
T(/nesimato/.test(v.tekstas), 'tuščias modelio atsakymas gauna savo sakinį');
T(v.antraste === 'PRIEŽASTIS NESIMATO', 'antraštė kortelei');

v = su({ pigumo_priezastis: 'modifikacija', zalos_pozymiai: 'nera', nuotraukos_kokybe: 'gera', kodel: 'Ne gamykliniai ratlankiai' });
T(v.reikiaPilnos === false, 'paaiškinta ir nuotrauka gera – pilnos NEPRAŠO (3 pakopa nekviečiama)');

v = su({ pigumo_priezastis: 'kaina klaida', kodel: 'kazkas' });
T(v.priezastis === 'nepaaiskinta', 'nežinoma priežasties reikšmė nukreipiama į „nepaaiškinta“');

// ── Kaina ───────────────────────────────────────────────────────────────────
const e = p.kainaEur('claude-haiku-4-5', { input_tokens: 1000000, output_tokens: 0 });
T(Math.abs(e - 0.92) < 0.001, '1 mln. Haiku įeinančių tokenų = 0,92 €');
T(p.kainaEur('claude-haiku-4-5', { input_tokens: 700, output_tokens: 200 }) < 0.003,
  'tipinė 2 pakopa (700 in / 200 out) – mažiau nei 0,003 €');
T(p.kainaEur('claude-sonnet-4-5', { input_tokens: 1000, output_tokens: 1000 })
  > p.kainaEur('claude-haiku-4-5', { input_tokens: 1000, output_tokens: 1000 }), 'Sonnet brangesnis už Haiku');
T(p.kainaEur('nera-tokio-modelio', { input_tokens: 0, output_tokens: 0 }) === 0, 'nežinomas modelis nenukrenta');

// ── Serverio pusė: pakopų eiliškumas ir baltasis sąrašas ────────────────────
const srv = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
T(/const antrai = pigus\.filter\(\(c\) => !c\.pigumas && c\.photo\)/.test(srv),
  '2 pakopa kviečiama TIK tiems, kurių 1 pakopa neatsakė (brangesnė eina paskui)');
T(/\.slice\(0, PIGUMO_MAX\)/.test(srv), '2 pakopa turi ribą vienai paieškai');
T(/PIGUMO_PILNA \|\| '1'/.test(srv), '3 pakopa ĮJUNGTA (Luko sprendimas KL-1019-0100)');
T(/PIGUMO_PILNA_MAX \|\| '3'/.test(srv), '…bet ne daugiau 3 per paiešką – kitaip 0,062 € × 34');
T(/const pilnosVerti = PIGUMO_PILNA[\s\S]{0,200}reikiaPilnos\)\.slice\(0, PIGUMO_PILNA_MAX\)/.test(srv),
  '3 pakopa tik tiems, kuriems 2 pakopa neatsakė');
// Kešo tarifai: be jų sąskaita būtų nuvertinta ten, kur tokenų daugiausia
T(p.kainaEur('claude-sonnet-4-5', { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1000000 })
  < p.kainaEur('claude-sonnet-4-5', { input_tokens: 1000000, output_tokens: 0 }), 'kešo skaitymas pigesnis už įprastą įėjimą');
T(p.kainaEur('claude-sonnet-4-5', { cache_creation_input_tokens: 1000000 })
  > p.kainaEur('claude-sonnet-4-5', { input_tokens: 1000000 }), 'kešo įrašymas brangesnis');
T(/async function aiKvietimas/.test(srv), 'visi AI kvietimai eina per vieną vietą (ATSARGA.ai)');
T(!/[^_]anthropic\.messages\.create\(/.test(srv.replace('const r = await anthropic.messages.create(opts);', '')),
  'nė vieno AI kvietimo pro apskaitą');
T(/pigumas: l\.pigumas \|\| null,/.test(srv), 'verdiktas yra baltajame `allListingsBase` sąraše');
T(/ai: \{ kvietimai: 0, in: 0, out: 0, eur: 0 \}/.test(srv), 'AI sąnaudos skaičiuojamos (ATSARGA.ai)');
T(/delete v\.usage;/.test(srv), 'tokenai į sąsają nekeliauja');
// Uždraustų frazių sąrašas produkte turi būti VIENAS
T(/require\('\.\/nuotrauku-analize'\)/.test(fs.readFileSync(path.join(__dirname, '..', 'pigumo-patikra.js'), 'utf8')),
  'uždraustų frazių sąrašas imamas iš `nuotrauku-analize.js`, ne kopijuojamas');

// ── Sąsaja: žyma ir eilutė ──────────────────────────────────────────────────
const perp = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'perpardavejas.js'), 'utf8');
T(/c\.pigumas && c\.pigumas\.zyma/.test(perp), 'lentelė rodo žymą');
T(/c\.pigumas\.lygis === 'tekste' \|\| c\.pigumas\.lygis === 'matoma' \? 'is-portal' : 'is-guess'/.test(perp),
  'punktyras spėjimui, tvirta žyma šaltiniui (52 sk. prasmė)');
const idx = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'index.html'), 'utf8');
T(/c\.pigumas && c\.pigumas\.tekstas/.test(idx), 'kortelė rodo priežastį');
T(/esc\(c\.pigumas\.tekstas\)/.test(idx), 'tekstas eina per `esc` (K-74 pamoka)');

console.log('\n' + (klaidu ? klaidu + ' KRENTA' : 'visi ' + n + ' prajo'));
process.exit(klaidu ? 1 : 0);
