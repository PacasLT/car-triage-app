// versijos.js — CarTriige versijų istorija. VIENINTELĖ vieta, kur keičiama versija.
//
// TAISYKLĖ: po kiekvieno atnaujinimo pridedamas naujas įrašas SĄRAŠO VIRŠUJE
// (naujausia versija pirma) su šios dienos data ir trumpu pakeitimų sąrašu.
// Versijos numeris antraštėje ir langas „Versijų istorija“ generuojami iš šio sąrašo.
//
// Numeracija: X.Y.Z – Y keliamas už naują funkciją, Z už pataisymus.

window.CT_VERSIJOS = [
  {
    versija: '1.22.0', data: '2026-09-17', pavadinimas: 'Privatus pardavėjas, VIN įvedimas, pilna įranga ir vieta',
    pakeitimai: [
      'Privatus pardavėjas atpažįstamas teisingai – vietoje atsitiktinio teksto rodome „Privatus pardavėjas“ su miestu, telefonu ir patarimais, į ką atkreipti dėmesį',
      'VIN: kai skelbime jis paslėptas už mygtuko „Rodyti“, apie tai parašome ir siūlome įklijuoti VIN, gautą iš pardavėjo – patikrinsime iš karto',
      'Įvestas VIN tikrinamas vietoje: 17 simbolių, be I/O/Q, ir sulyginamas su skelbime matoma pradžia, kad nepatikrintumėte svetimo automobilio',
      'Įranga nebesako „nepakankamai duomenų“ – rodome pilną komplektacijos sąrašą tiesiai iš skelbimo, sugrupuotą pagal kategorijas',
      'Techninių duomenų kortelėje atsirado ir pardavėjo aprašymas iš skelbimo',
      'Matosi, kur automobilis stovi – vieta rodoma po pavadinimu ir pardavėjo kortelėje',
      'Visa skelbimo lentelė ir įranga perduodama AI analizei – vertinimas remiasi visais skelbimo duomenimis, ne tik aprašymu',
    ],
  },
  {
    versija: '1.21.0', data: '2026-09-17', pavadinimas: 'Pardavėjas, VIN, nuotraukos ir švaresnis įvertis',
    pakeitimai: [
      'Pardavėjas nuskaitomas tiksliai: pavadinimas, partnerio lygis, tapatybės patvirtinimas, miestas, reitingas ir atsiliepimų skaičius – nebeliko „Pardavėjas nenurodyta“',
      'VIN: kai portalas rodo tik pradžią (reikia prisijungti), rodome „◐ VIN (dalinis)“ ir paaiškiname, kaip pamatyti visą',
      'Istorijos ataskaita atidaroma tiesiogine Autoistorija.lt nuoroda iš skelbimo',
      'Ištaisytos dingusios nuotraukos – 18 iš 20 skelbimų naudoja kitokį galerijos išdėstymą, dabar nuskaitomos visos (iki 6 vienoje kortelėje)',
      'Pašalinta pasikartojanti signalų juosta; rizikos lygis ir duomenų patikimumas perkelti prie „CarTriige įvertis“',
      'Įverčio juostos visada tos pačios penkios – ko neįvertinome, rodome brūkšnį, kad korteles būtų galima lyginti',
      'Iš skelbimo puslapio nuskaitomi ir techniniai laukai (pirma registracija, variklis, varantieji ratai, spalva)',
    ],
  },
  {
    versija: '1.20.1', data: '2026-09-17', pavadinimas: 'Tikslus autoplius nuskaitymas ir nauji filtrai',
    pakeitimai: [
      'Patikrinta gyvuose skelbimuose: sena pigi mašina (pvz. 1998 m. už 1 300 €) nebežymima klaidinga kaina – įspėjame tik kai maža kaina rodoma naujam automobiliui',
      'Ženklelis „iškeltas“ rodomas tik dažnai keliamiems skelbimams – požymis, kad skelbimas kabo ilgai',
      'Markė ir modelis siunčiami autoplius tikrais ID – nebegauname svetimų modelių ir aksesuarų, paieška pigesnė',
      'Skaitome nuo naujausio skelbimo: mokamai iškelti skelbimai nebeužstoja šviežių pasiūlymų',
      'Kortelėse matosi, prieš kiek laiko skelbimas įkeltas ir ar jis mokamai iškeltas į viršų',
      'Kai rodoma mėnesinė lizingo įmoka – naudojama reali skelbimo kaina, apie tai parašoma',
      'Įtartinai maža kaina (iki 4 000 €) pažymima „Patikrinkite kainą“ ir neiškreipia rinkos vidurkio',
      'Nauji filtrai: varantieji ratai, išskyrus JAV, tik su VIN, tik su istorijos ataskaita, be defektų, be vairo dešinėje, tik Lietuvoje',
      'Iš skelbimo sąrašo nuskaitomi ir kėbulas, miestas, pagaminimo mėnuo, garantijos tipas, pardavėjo reitingas',
    ],
  },
  {
    versija: '1.19.0', data: '2026-09-17', pavadinimas: 'Paskyros meniu, nuotraukų didinimas, pelno skaičiuoklė',
    pakeitimai: [
      'Paskyros meniu po profilio mygtuku: mėgstamiausi, ataskaitos, palyginimai, paieškų istorija, planas, versija',
      'Detalioje apžvalgoje nuotraukos didinamos – paspaudus atsidaro per visą ekraną, naršoma rodyklėmis ar braukiant',
      'Reklaminės nuotraukos ir logotipai (ne automobilio) nebeanalizuojami ir nerodomi; pardavėjo logotipas – prie pardavėjo',
      'Pelno skaičiuoklė: pirkimo kaina, remontas, išlaidos, pardavimo kaina → pelnas, marža, ROI (užpildyta iš AI vertinimo)',
      'Paaiškinta „Istorijos ataskaita“: tai pardavėjo prie skelbimo pridėta Autoistorija.lt ataskaita, su nuoroda į ją',
      'Išsami analizė detalės puslapyje nebeužsakoma automatiškai – tik paspaudus mygtuką (kreditas nenuskaitomas netikėtai)',
      'Rezultatų santrauka virš skelbimų – ryški juosta su skaičiais; „Pagrindinis“ ženklelis pašalintas, Tinder – tik telefone',
      'Portalų mygtukas rodo, kurie portalai pasirinkti; kai netelpa – trumpiniais',
      '„Kiti skelbimai“ – vienas išskleidžiamas blokas su visais likusiais skelbimais; kiekvienas su ♥ ir nuoroda į skelbimą',
    ],
  },
  {
    versija: '1.18.0', data: '2026-09-17', pavadinimas: 'Mėgstamiausi – širdutė antraštėje',
    pakeitimai: [
      'Vietoj žvaigždutės ir žymeklio – širdutė ♥; detalioje apžvalgoje mygtukas pagaliau rodo, ar skelbimas išsaugotas',
      'Antraštėje prie profilio – širdutė su skaičiumi; užvedus ar paspaudus atsidaro visų mėgstamiausių sąrašas',
      'Prie kiekvieno išsaugoto skelbimo: kada išsaugojote, kada pastebėtas rinkoje, kada paskutinį kartą tikrintas',
      'Kainos pokytis nuo išsaugojimo, kartotiniai mažinimai, ridos augimas, dingęs skelbimas – matosi sąraše',
      'Išsaugoti iš detalios apžvalgos skelbimai dabar saugomi ir prie paskyros',
      'Meniu punktas „Mėgstamiausi“ pašalintas – viską pakeičia širdutė',
    ],
  },
  {
    versija: '1.17.0', data: '2026-09-17', pavadinimas: 'Progreso panelės, senos paieškos, versijų istorija',
    pakeitimai: [
      'Detali apžvalga rodo tą pačią progreso panelę kaip paieška – žingsniai, procentai, juosta',
      'Paspaudus seną paiešką filtrai atsinaujina iš karto (įskaitant kurą ir pavarų dėžę), sąrašas užsidaro',
      'Kai paieška negalima pagal planą – rodoma priežastis, o ne „Paleidžiama…“',
      'Versijos numeris antraštėje – paspaudus atsidaro ši istorija',
      'Serveris netinkamam užklausos JSON atsako 400, o ne lūžta',
    ],
  },
  {
    versija: '1.16.0', data: '2026-09-17', pavadinimas: 'Planai, kreditai, mėgstamiausi ir ataskaitos',
    pakeitimai: [
      'Trys planai – Bandomasis, Pro, Verslas – ir kreditai gilioms analizėms, VIN, pardavėjo patikrai, palyginimui',
      'Planų langas su kreditų likučiu antraštėje; administravimo skydelis planams priskirti',
      'Mėgstamiausi saugomi prie paskyros – atskiras puslapis, matomas iš bet kurio įrenginio',
      'Visos sugeneruotos ataskaitos (analizės, palyginimai, VIN, pardavėjai) – puslapyje „Ataskaitos“',
      'Filtrai įrašomi į adresą – nuoroda dalinama, perkrovus filtrai lieka',
    ],
  },
  {
    versija: '1.15.0', data: '2026-09-17', pavadinimas: 'Stabilumas ir kaštai',
    pakeitimai: [
      'Ištaisyta Railway atminties klaida – skelbimų HTML nebesaugomas diske, tik ribotas podėlis atmintyje',
      'Pilna kodo revizija: JWT raktas, 9 apsaugoti maršrutai, AI kaštai vienai paieškai sumažinti ~99 %',
      'Paieškos būsenos apklausa atlaiko laikinus serverio trikdžius (502, sesijos pabaigą)',
      'Senų paieškų sąrašas su laiku, „+N naujų“ ženkleliais ir trynimu',
      'Automobilio istorija be VIN nebeteigia, kad tai tas pats automobilis',
    ],
  },
  {
    versija: '1.14.0', data: '2026-09-17', pavadinimas: 'Naujas kortelių ir mobilus dizainas',
    pakeitimai: [
      'Kortelių dizainas iš Claude Design: ženklelių hierarchija, signalų tinklelis, miniatiūra telefone',
      'Palyginimo ataskaita atskirame puslapyje; palyginimo modalo taisymai',
      'Naujas paieškos progreso baras su žingsniais ir procentais',
      'Portalų pasirinkimas vienu mygtuku; pašalintas naršymo režimas ir „Išsaugoti paiešką“',
      'Likusių skelbimų sąrašas be TOP dublikatų, su rinkos mediana ir nuolaida',
    ],
  },
  {
    versija: '1.13.0', data: '2026-09-17', pavadinimas: 'Triažo variklis ir automobilio istorija',
    pakeitimai: [
      'Galimybių balas, duomenų patikimumas ir rizika – trys atskiri signalai; nežinoma reikšmė nebebaudžia',
      'Automobilio istorijos sekimas: kainos ir ridos laiko juosta, kasdienis pertikrinimas, VIN iš nuotraukų',
      'Gilus AI palyginimas išsaugotų automobilių',
      'Mobilus dizainas visam puslapiui',
      'Filtrai sutvarkyti: kuras, „Daugiau filtrų“, atmesti skelbimai rodomi su priežastimis',
    ],
  },
  {
    versija: '1.12.0', data: '2026-09-16', pavadinimas: 'Naujos kortelės ir paskyros',
    pakeitimai: [
      'TOP 5 kortelės ir kompaktiškos standartinės kortelės',
      'Vartotojų prisijungimas su kvietimo kodais',
      'Trys paieškos režimai: perpardavėjas / asmeninis / naršymas',
      'Duomenų bazė Railway diske – vartotojai nebedingsta po atnaujinimo',
    ],
  },
  {
    versija: '1.11.0', data: '2026-09-16', pavadinimas: 'Nuotraukos ir gili analizė',
    pakeitimai: ['Nuotraukų tikrinimas; otomoto ir autoscout24 skaitomi per pilną atvaizdavimą', 'TOP 7 gili analizė'],
  },
  { versija: '1.9.0', data: '2026-09-16', pavadinimas: 'AI nuotraukų analizė', pakeitimai: ['AI nuotraukų analizės rezultatai rodomi detalės puslapyje'] },
  { versija: '1.8.0', data: '2026-09-16', pavadinimas: 'Pataisymai', pakeitimai: ['Ištaisyta AI nuotraukų analizė (paveikslėlių formatai)', 'Detalės puslapio atidarymo klaida'] },
  { versija: '1.7.0', data: '2026-09-16', pavadinimas: 'Daugiau nuotraukų', pakeitimai: ['autoscout24 ir otomoto nuotraukos', 'AI analizė iki 12 nuotraukų', 'Perdaryta pardavėjo kortelė'] },
  { versija: '1.6.0', data: '2026-09-16', pavadinimas: 'Podėlis ir istorija', pakeitimai: ['Rezultatų podėlis, nuotraukos, AI nuotraukų analizės mygtukas', 'Paieškų istorija iškleidžiamame sąraše, portalų logotipai'] },
  { versija: '1.0.0', data: '2026-09-15', pavadinimas: 'Pirmoji versija', pakeitimai: ['Paieška autoplius, autogidas, autoscout24, otomoto', 'AI triažas ir rinkos palyginimas', 'Detalės puslapis'] },
];

window.CT_APP_VERSION = 'v' + window.CT_VERSIJOS[0].versija;

(function () {
  var CSS = '.ct-ver-btn{flex:none;align-self:center;height:22px;padding:0 8px;border-radius:6px;border:1px solid var(--accent-border,rgba(124,92,255,.35));'
    + 'background:var(--accent-dim,rgba(124,92,255,.12));color:var(--accent-light,#a99cff);font:700 10px/1 var(--font-mono,monospace);letter-spacing:.06em;'
    + 'cursor:pointer;margin-left:10px;white-space:nowrap;transition:background .15s,color .15s}'
    + '.ct-ver-btn:hover{background:var(--accent,#7c5cff);color:#fff}'
    + '@media (max-width:640px){.ct-ver-btn{margin-left:8px;height:20px;padding:0 6px;font-size:9px}}'
    + '#ct-ver-modal{display:none;position:fixed;inset:0;z-index:1600;background:rgba(0,0,0,.85);overflow-y:auto;padding:20px}'
    + '#ct-ver-modal.open{display:block}'
    + '#ct-ver-inner{max-width:720px;margin:0 auto;background:var(--bg-surface,#12151e);border:1px solid var(--border-light,rgba(255,255,255,.12));border-radius:16px;overflow:hidden}'
    + '.ct-ver-head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}'
    + '.ct-ver-head h2{margin:0;font:700 17px var(--font,sans-serif);color:var(--text-primary,#fff);flex:1}'
    + '.ct-ver-head small{font:500 11px var(--font-mono,monospace);color:var(--text-dim,#777)}'
    + '.ct-ver-close{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--text-muted,#aaa);font-size:16px;display:grid;place-items:center;cursor:pointer}'
    + '.ct-ver-body{padding:6px 20px 22px}'
    + '.ct-ver-eil{display:grid;grid-template-columns:118px 1fr;gap:16px;padding:16px 0;border-bottom:1px solid var(--border,rgba(255,255,255,.08));position:relative}'
    + '.ct-ver-eil:last-child{border-bottom:none}'
    + '.ct-ver-kair{display:flex;flex-direction:column;gap:6px;align-items:flex-start}'
    + '.ct-ver-nr{font:700 12px/1 var(--font-mono,monospace);letter-spacing:.04em;padding:5px 9px;border-radius:7px;background:var(--bg-elevated,#1a1e2a);border:1px solid var(--border-light,rgba(255,255,255,.12));color:var(--text-primary,#fff)}'
    + '.ct-ver-eil.dabartine .ct-ver-nr{background:var(--accent-dim,rgba(124,92,255,.12));border-color:var(--accent-border,rgba(124,92,255,.35));color:var(--accent-light,#a99cff)}'
    + '.ct-ver-data{font:500 11px/1 var(--font-mono,monospace);color:var(--text-dim,#777);letter-spacing:.04em}'
    + '.ct-ver-zym{font:700 8.5px/1 var(--font-mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--success,#3ddc97);background:var(--success-dim,rgba(61,220,151,.12));border:1px solid var(--success-border,rgba(61,220,151,.3));padding:4px 6px;border-radius:5px}'
    + '.ct-ver-pav{font:700 14px/1.3 var(--font,sans-serif);color:var(--text-primary,#fff);margin:2px 0 8px}'
    + '.ct-ver-eil ul{margin:0;padding:0;list-style:none}'
    + '.ct-ver-eil li{font:400 12.5px/1.6 var(--font,sans-serif);color:var(--text-secondary,#c9cbd3);padding-left:16px;position:relative}'
    + '.ct-ver-eil li::before{content:"";position:absolute;left:3px;top:9px;width:5px;height:5px;border-radius:50%;background:var(--accent,#7c5cff)}'
    + '@media (max-width:640px){#ct-ver-modal{padding:10px}.ct-ver-eil{grid-template-columns:1fr;gap:8px}.ct-ver-kair{flex-direction:row;align-items:center;flex-wrap:wrap}}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function uztikrinti() {
    if (!document.getElementById('ct-ver-css')) { var st = document.createElement('style'); st.id = 'ct-ver-css'; st.textContent = CSS; document.head.appendChild(st); }
    var m = document.getElementById('ct-ver-modal');
    if (m) return m;
    m = document.createElement('div'); m.id = 'ct-ver-modal';
    var n = window.CT_VERSIJOS.length, gal = (n % 10 === 1 && n % 100 !== 11) ? 'a' : ((n % 10 >= 2 && n % 10 <= 9 && !(n % 100 >= 12 && n % 100 <= 19)) ? 'os' : 'ų');
    m.innerHTML = '<div id="ct-ver-inner"><div class="ct-ver-head"><h2>Versijų istorija</h2><small>' + n + ' versij' + gal + '</small>'
      + '<button class="ct-ver-close" type="button" aria-label="Uždaryti">✕</button></div><div class="ct-ver-body"></div></div>';
    m.addEventListener('click', function (e) { if (e.target === m) window.ctUzdarytiVersijas(); });
    m.querySelector('.ct-ver-close').addEventListener('click', window.ctUzdarytiVersijas);
    document.body.appendChild(m);
    return m;
  }

  window.ctVersijuModalas = function () {
    var m = uztikrinti();
    m.querySelector('.ct-ver-body').innerHTML = window.CT_VERSIJOS.map(function (v, i) {
      return '<div class="ct-ver-eil' + (i === 0 ? ' dabartine' : '') + '">'
        + '<div class="ct-ver-kair"><span class="ct-ver-nr">v' + esc(v.versija) + '</span><span class="ct-ver-data">' + esc(v.data) + '</span>' + (i === 0 ? '<span class="ct-ver-zym">Dabartinė</span>' : '') + '</div>'
        + '<div><div class="ct-ver-pav">' + esc(v.pavadinimas) + '</div><ul>' + (v.pakeitimai || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>'
        + '</div>';
    }).join('');
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.ctUzdarytiVersijas = function () {
    var m = document.getElementById('ct-ver-modal'); if (!m) return;
    m.classList.remove('open');
    document.body.style.overflow = '';
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = document.getElementById('ct-ver-modal'); if (m && m.classList.contains('open')) window.ctUzdarytiVersijas(); }
  });

  // Antrastes mygtukas: tekstas is saraso, paspaudimas atidaro langa
  function prijungti() {
    if (!document.getElementById('ct-ver-css')) { var st = document.createElement('style'); st.id = 'ct-ver-css'; st.textContent = CSS; document.head.appendChild(st); }
    var b = document.getElementById('app-version'); if (!b) return;
    b.textContent = window.CT_APP_VERSION;
    b.title = 'Versijų istorija – ' + window.CT_VERSIJOS[0].data;
    if (!b.getAttribute('onclick')) b.addEventListener('click', function (e) { e.preventDefault(); window.ctVersijuModalas(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prijungti); else prijungti();
})();
