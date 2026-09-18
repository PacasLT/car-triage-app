// versijos.js — CarTriige versijų istorija. VIENINTELĖ vieta, kur keičiama versija.
//
// TAISYKLĖ: po kiekvieno atnaujinimo pridedamas naujas įrašas SĄRAŠO VIRŠUJE
// (naujausia versija pirma) su šios dienos data ir trumpu pakeitimų sąrašu.
// Versijos numeris antraštėje ir langas „Versijų istorija“ generuojami iš šio sąrašo.
//
// Numeracija: X.Y.Z – Y keliamas už naują funkciją, Z už pataisymus.

window.CT_VERSIJOS = [
  {
    versija: '1.45.0', data: '2026-09-18', pavadinimas: '„Pro" nebekonkuruoja su apžvalgos mygtuku',
    pakeitimai: [
      'Antraštės „Pro" mygtukas nebe pilnai violetinis – liko tos pačios spalvos giminės, bet nebežiuri kaip pagrindinis veiksmas',
      'Priežastis: „Pro · 13 kr" ir „Pilna apžvalga · 2 kr" abu prašo pinigų, tad du violetiniai mygtukai viename ekrane konkuravo, ir pralaimėdavo tas, kurio jums reikia dabar',
    ],
  },
  {
    versija: '1.44.0', data: '2026-09-18', pavadinimas: 'Akcentas grįžo pagrindiniam veiksmui',
    pakeitimai: [
      'Skelbimo puslapyje violetinis mygtukas dabar yra „Pilna apžvalga · 2 kr", o ne nuoroda į portalą – vienintelis mygtukas, kuris išveda iš CarTriige, nebeatrodo kaip pagrindinis',
      'Pardavėjo varnelė nebe mėlyna – patvirtintą faktą visame produkte žymi žalia',
      '„Duomenys bus po analizės" gavo ⚪ ženklą – tas pats žinojimo lygis, kurį matote kortelėje',
      'Trynimo mygtukai gavo užuominą: užvedus pelę atsiranda paviršius, o naikinantis veiksmas paraustą',
      'Apžvalgos mygtukai skelbimo puslapyje tapo tokie pat kaip visur kitur – mygtukų skola sumažėjo nuo 28 iki 24',
    ],
  },
  {
    versija: '1.43.0', data: '2026-09-18', pavadinimas: 'Skelbimo puslapio viršus ir mėgstamiausių kainos kaita',
    pakeitimai: [
      'Skelbimo puslapio viršus perdarytas: pavadinimas ir ženkliukai kairėje, kaina ir rinkos blokas dešinėje – tas pats rinkos blokas, kurį matote kortelėje',
      '„GALIMAI DAUŽTAS“ įspėjimas dabar virš viso turinio, ne paslėptas skirtuke',
      'Kai panašių skelbimų mažiau nei 8, skirtumas nuo rinkos neberodomas visai – aštuonių skelbimų vidurkis nėra rinkos duomenys',
      'Mėgstamiausiuose kainos pokytis nuo išsaugojimo perkeltas į kainos eilutę – tai pagrindinis šio puslapio dalykas, ne dar vienas ženkliukas',
      '„Išsaugota – (ką tik)“ tapo „Išsaugota ką tik“',
    ],
  },
  {
    versija: '1.42.0', data: '2026-09-18', pavadinimas: 'Vienas mygtukų žodynas visuose puslapiuose',
    pakeitimai: [
      'Mėgstamiausiuose „Detali apžvalga“ tapo „Pilna apžvalga“ su kainos ženkleliu – tas pats veiksmas visur vadinasi vienodai',
      'Ataskaitose pagrindinis mygtukas yra „Atidaryti“, be rodyklės',
      '„Ištrinti“ ir „Pašalinti iš mėgstamiausių“ iškeltas iš veiksmų eilės į kortelės dešinįjį viršų – naikinantis mygtukas nebestovi šalia to, į kurį taikote',
      'Palyginime prie kiekvieno automobilio atsirado „Pašalinti“ – kryželis, ne šiukšlinė: skelbimas nuimamas nuo sąrašo, ne ištrinamas',
      'Piktogramų rinkinys papildytas dviem naujomis – žymės ir pašalinimo',
    ],
  },
  {
    versija: '1.41.0', data: '2026-09-18', pavadinimas: 'Dizainerio 16–18f skyriai ir keturi vienodi mygtukai',
    pakeitimai: [
      'Kortelėje rodomos keturios įverčio dedamosios – „Potencialas“ iš jos išimtas, nes be pilnos apžvalgos jis visada buvo tuščias; skelbimo puslapyje jis lieka',
      'Kaina nebe violetinė – violetinė reiškia „mūsų skaičiavimas“, o kaina yra portalo faktas',
      'Verdiktas rašomas sakinio raide, ne didžiosiomis – kortelėje nebešaukia dvi antraštės vienu metu',
      'Mygtukas „Ženkliukai, įranga, vieta“ tapo „Daugiau“ su skaičiumi, kiek dalykų atsiskleis',
      'Išskleidus mygtukas nebepraranda piktogramos – anksčiau visas jo vidus būdavo perrašomas tekstu',
      'Širdutė nebe rožinė – neutrali, kol neišsaugota, ir akcento spalvos, kai išsaugota',
      'Telefone įvertis grįžo: balas rodomas verdikto kairėje, o penkios dedamosios keliauja į trečią lygį',
    ],
  },
  {
    versija: '1.40.0', data: '2026-09-18', pavadinimas: 'Telefone veiksmų eilė nebeužlipa viena ant kitos',
    pakeitimai: [
      'Telefone kortelės apačioje mygtuko „Ženkliukai, įranga, vieta“ antraštė nebeuždengia „Palyginti“ – siaurieji mygtukai vėl gavo savo 44 px, platusis – likusį plotį',
      'Nieko nauja nepridėta: tai dizaino sistemos taisyklė, kuri buvo parašyta, bet nepasiekdavo mygtuko',
    ],
  },
  {
    versija: '1.39.0', data: '2026-09-18', pavadinimas: 'Paieška nebeparneša svetimų modelių',
    pakeitimai: [
      'Ieškant konkretaus modelio (pvz. BMW X4) nebepatenka kitų tos pačios markės automobilių – anksčiau į sąrašą prasprūsdavo BMW 520, X3 ar 320',
      'Jei portalo filtras nesuveikia, sistema tai pastebi pati, atfiltruoja ir žurnale parašo, kuris portalas suklydo',
      'Mažiau nereikalingų skelbimų reiškia mažesnes nuskaitymo ir analizės sąnaudas',
    ],
  },
  {
    versija: '1.38.0', data: '2026-09-18', pavadinimas: 'Mygtukai su piktogramomis, telefone trumpesnė kortelė',
    pakeitimai: [
      'Mygtukai gavo piktogramas, o „Pilna apžvalga“ – atskirą kainos ženklelį ir rodyklę',
      'Rodyklė rodoma tik ten, kur paspaudus atsidursite kitur – „Palyginti“ jos neturi',
      'Kai apžvalga jau padaryta, mygtukas pameta kainą ir gauna rodyklę',
      'Telefone kortelėje neberodomas CarTriige įvertis su dedamosiomis – pirmam sprendimui užtenka kainos, skirtumo nuo rinkos ir rizikos; įvertis lieka skelbimo puslapyje',
    ],
  },
  {
    versija: '1.37.0', data: '2026-09-18', pavadinimas: 'Mygtukų taisymai ir meniu atstatymas',
    pakeitimai: [
      'Skelbimo puslapyje violetinė juosta virš apžvalgos lygių dingo – tai buvo blokas, per klaidą paverstas mygtuku',
      'Mėgstamiausių širdutė ir paskyros meniu vėl veikia normaliai',
      'Kortelės mygtukai gavo vieną bendrą išvaizdą',
    ],
  },
  {
    versija: '1.36.1', data: '2026-09-18', pavadinimas: 'Skubus taisymas: atstatyti sugadinti stiliai',
    pakeitimai: [
      'Atstatyti puslapių stiliai – praeitame atnaujinime automatinis valymas sugadino dalį taisyklių, todėl dingo nuotraukos, iškrito mygtukai ir palyginimo ataskaita liko be apipavidalinimo',
      'Planų mygtukas antraštėje nebeišsitempia per visą plotį',
      'Mygtukų dydžiai laikinai grįžta į ankstesnius – vieną išvaizdą sugrąžinsime kitu atnaujinimu, šįkart be automatinio valymo',
    ],
  },
  {
    versija: '1.36.0', data: '2026-09-18', pavadinimas: 'Visi mygtukai produkte dabar vienodi',
    pakeitimai: [
      'Mygtukai visuose penkiuose puslapiuose gavo vieną išvaizdą – anksčiau jų buvo apie keturiasdešimt skirtingų variantų',
      'Kiekvienas mygtukas turi piktogramą, o mokami veiksmai – atskirą kainos ženklelį',
      'Rodyklė → dabar reiškia konkretų dalyką: kad paspaudus atsidursite kitur. „Palyginti“ jos nebeturi, nes jis tik prideda automobilį',
      'Kai apžvalga jau padaryta, tas pats mygtukas pameta kainą ir gauna rodyklę – nes dabar jis atidaro, o ne perka',
      '„Nepakanka kreditų“ mygtukas nebeišjungiamas – jis rodo problemą raudonai ir veda į papildymą',
      'Analizės metu mygtukas nebešokinėja: suktukas atsiranda piktogramos vietoje',
      'Dingo pulsuojanti animacija – mygtukas, kuris juda pats, konkuravo su įverčiu',
      'Telefone apžiūros režimo mygtukai tapo dideli apskritimai, pritaikyti nykščiui',
    ],
  },
  {
    versija: '1.35.0', data: '2026-09-18', pavadinimas: 'Rinkos skaičiai rodomi tik tada, kai jie kažką reiškia',
    pakeitimai: [
      'Kai panašių skelbimų rinkoje mažiau nei 8, kainos skirtumas nebėra rodomas – vietoj jo matote „per mažai“ su tikslų skelbimų skaičiumi',
      'Priežastis: iš šešių skelbimų „−12 %“ pasikeičia vien todėl, kad vienas skelbimas dingo. Toks skaičius skamba tiksliau, nei yra',
      'Medianai skaičiuoti riba lieka ta pati – keičiasi tik tai, ką rodome jums',
    ],
  },
  {
    versija: '1.34.0', data: '2026-09-18', pavadinimas: 'Ženkliukai ir mygtukai perėjo į dizaino sistemą',
    pakeitimai: [
      'Ženkliukai kortelėje (VIN, Istorija, vieta, Verslas) atrodo vienodai visuose puslapiuose ir įgavo aiškesnes spalvas pagal reikšmę',
      'Mygtukai gavo piktogramas, o „Pilna apžvalga“ – atskirą kainos ženklelį',
      'Kainos skirtumas („−12 %“) nebesilaužo į dvi eilutes',
      'Nuotraukų skaitiklis ir laiko rinkoje punktas perėjo į bendrą dizaino sistemą',
    ],
  },
  {
    versija: '1.33.0', data: '2026-09-18', pavadinimas: 'Laikas rinkoje tapo argumentu, o ne atskira juosta',
    pakeitimai: [
      'Atskira „Auto istorija“ juosta po kortele dingo – informacija persikėlė į kortelės vidų',
      'Šviežias skelbimas dabar rodomas kaip „Rinkoje 1 d. — geri pasiūlymai išgraibstomi per kelias dienas“ su geltonu tašku, nes tai spėjimas apie kitų pirkėjų elgesį, o ne faktas',
      'Užsibuvęs skelbimas rodomas žaliai: „Rinkoje 45 d., kaina mažinta — pardavėjas jau lankstosi“ – tai jūsų derybų argumentas',
      'Nuo 3 iki 29 dienų šis punktas nerodomas visai – tas intervalas nieko nepasako',
      'Priežasčių ir toliau lieka trys: laikas rinkoje užima vietą, o ne prisideda ketvirtas',
      'Likusios skelbimo istorijos pastabos persikėlė į „Ženkliukai, įranga, vieta“ – niekas neprarasta',
    ],
  },
  {
    versija: '1.32.0', data: '2026-09-18', pavadinimas: 'Dizaino taisyklės, kurių laikysimės ir toliau',
    pakeitimai: [
      'Dizaino sistema atskirta nuo mūsų pataisymų – naujos dizainerio versijos nebeištrins mūsų darbo, o mūsų pataisymai nebegadins jo sistemos',
      'Atsirado automatinis patikrinimas, kuris neleidžia grįžti prie kietai įrašytų spalvų ir šriftų',
      'Patikrinimas saugo ir produkto taisykles: neįvertinta lieka neįvertinta, o įspėjimai nevirsta gražesniais',
      'Nuotraukų skaitiklis vėl matomas – jį buvo paslėpusi viena per plati dizaino taisyklė',
    ],
  },
  {
    versija: '1.31.1', data: '2026-09-18', pavadinimas: 'Kortelės smulkmenos: skaitiklis, trumpesnis verdiktas',
    pakeitimai: [
      'Ant nuotraukos vėl matomas skaitiklis „1 / 28“ – žinote, kiek nuotraukų yra',
      'Nuotraukų rodyklės dabar veikia ir žemiau TOP penketo esančiose kortelėse',
      'Kortelėje rodomas tik pirmas verdikto sakinys – visą tekstą matote užvedę pelę arba skelbimo puslapyje',
    ],
  },
  {
    versija: '1.31.0', data: '2026-09-18', pavadinimas: 'Paieškos žurnalas nebeužstoja rezultatų',
    pakeitimai: [
      'Baigus paiešką žurnalas susiskleidžia pats – anksčiau dešimtys neatitikusių skelbimų nustumdavo rezultatus žemyn',
      'Žurnalo antraštėje dabar trys skaičiai: kiek rasta, kiek atitiko filtrus ir kiek perkopė įverčio slenkstį',
      'Išryškintas tik paskutinis skaičius – jis vienintelis atsako į klausimą „ar verta žiūrėti“; kai jis nulis, spalva neutrali, nes nulis nėra pasiekimas',
      'Nuimtas žalias rėmelis aplink žurnalą – rėmelio spalva dabar reiškia tik medalį arba riziką kortelėse',
      'Vykdant paiešką žurnalas lieka atviras, kaip ir anksčiau',
    ],
  },
  {
    versija: '1.30.1', data: '2026-09-18', pavadinimas: 'Kortelės apsauginis sluoksnis ir filtrų stiliai',
    pakeitimai: [
      'Kortelės išdėstymas apsaugotas nuo senų taisyklių – nuotrauka visada išlaiko proporcijas, balas lieka didelis, dedamųjų juostos matomos',
      'Pridėtas užrašas „Be nuotraukos“ skelbimams be foto ir perbraukta kaina be PVM',
      'Paruošti filtrų stiliai artimiausiam atnaujinimui',
    ],
  },
  {
    versija: '1.30.0', data: '2026-09-18', pavadinimas: 'Nauja rezultatų kortelė – trys skaitymo lygiai',
    pakeitimai: [
      'Kortelė dabar skaitoma trimis žingsniais: per sekundę matote nuotrauką, kainą ir skirtumą nuo rinkos; per penkias – įvertį, verdiktą ir kodėl; visa kita atsiveria mygtuku „Ženkliukai, įranga, vieta“',
      'CarTriige įvertis pakilo į antrą vietą iškart po kainos ir turi savo bloką – anksčiau jis buvo kortelės apačioje',
      'Trys geriausi paieškos rezultatai pažymėti medaliais (auksas, sidabras, bronza) – nuo ketvirtos vietos medalio nebėra, kad jie neprarastų reikšmės',
      'Skirtumas nuo rinkos rodomas atskiru bloku su suma eurais, ne tik procentais',
      'Kai kaina 30 % ar daugiau žemiau rinkos, skirtumas rodomas raudonai su prierašu „ĮTARTINAI“ – anksčiau −52 % atrodė lygiai taip pat kaip −12 %',
      'Neįvertintas rodiklis rodo dryžuotą juostą ir paaiškinimą, ko trūksta („sąrašo nėra“, „ataskaitos nėra“), o ne tuščią vietą',
      'Antraštė virš priežasčių pati persirašo pagal tai, ką žinome: „Kodėl šis auto?“, „Ką žinome ir ko ne“, „Ką būtina patikrinti“ arba „Kodėl atmesta“',
      'Priežasčių ne daugiau kaip trys, ženkliukų pirmame lygyje – šeši, tad kortelė nebeauga nuo skelbimo gausos',
      'Atmesti skelbimai naudoja tą pačią kortelę, tik prislopintą, su atmetimo priežastimi viršuje',
      'Viskas matoma be užvedimo pele – trečias lygis atidaromas mygtuku, tad veikia ir telefone',
    ],
  },
  {
    versija: '1.29.0', data: '2026-09-18', pavadinimas: 'Vieninga dizaino sistema – visi puslapiai atrodo kaip vienas produktas',
    pakeitimai: [
      'Visi penki puslapiai dabar naudoja tą pačią spalvų paletę, tipografiją ir tarpus – anksčiau kiekvienas turėjo savo',
      'Neįvertintas rodiklis („–“) dabar turi dryžuotą juostą, kad nebūtų palaikytas nuliu – tai ne blogas balas, o dar nežinoma sritis',
      'Tekstas ant tamsaus fono tapo šviesesnis ir geriau įskaitomas; smulkiausios etiketės padidintos iki 11 px',
      'Telefone mygtukai ir skirtukai gavo pilną 44 px paspaudimo zoną',
      'Skirtukų juosta telefone rodo, kad ji tęsiasi į šoną',
      'Nebeliko horizontalaus slinkimo ataskaitų ir mėgstamiausių puslapiuose telefone',
      'Klaviatūra naršant matomas aiškus fokuso žiedas',
      'Jei sistemoje įjungtas judesio mažinimas, animacijos nebegroja',
      'Pataisytos dvi tylios klaidos naršyklės konsolėje (tuščias nuotraukos adresas skelbimo ir galerijos languose)',
    ],
  },
  {
    versija: '1.28.0', data: '2026-09-17', pavadinimas: 'autogidas.lt nuskaitomas taip pat kruopščiai kaip autoplius',
    pakeitimai: [
      'autogidas skelbimuose dabar matote ir variklio galią (kW), ir tikslią vietą (miestas, šalis) – anksčiau šių duomenų iš šio portalo negaudavome',
      'Kiekvienas autogidas skelbimas turi tikslų laiką, kada paskutinį kartą atnaujintas – tai matosi kortelėje',
      'Rodome, kiek kartų skelbimas mokamai iškeltas į viršų (autogidas tam turi 1–6 lygius) – tai požymis, kad skelbimas kabo ilgai, o ne kokybės ženklas',
      'Į autogidas paiešką dabar keliauja visi jūsų filtrai: kuras, be defektų, tik su VIN, tik Lietuvoje, be aukcionų automobilių',
      'autogidas rezultatai rikiuojami nuo naujausių, kaip ir autoplius',
      'Portalo finansavimo skaičiuoklė („58 €/mėn.“) nebepainiojama su automobilio kaina',
      'Pigūs seni automobiliai iš autogidas nebežymimi klaidinga kaina',
    ],
  },
  {
    versija: '1.27.0', data: '2026-09-17', pavadinimas: 'Du apžvalgos lygiai, „galimai daužtas“ ženklas, tvarkingesni veiksmai',
    pakeitimai: [
      'Dabar galite rinktis: „Greita apžvalga“ (1 kr) – skelbimo tekstas, kaina prieš rinką, rizikos ir derybos; arba „Pilna apžvalga“ (2 kr) – papildomai vizualinis nuotraukų patikrinimas, pardavėjas, VIN ir pilna įranga',
      'Visur vienodas pavadinimas „Pilna apžvalga“ – nebeliko „Detalės“',
      'Skelbimas, kurio kaina 49 % ar daugiau žemiau rinkos vidurkio, žymimas „GALIMAI DAUŽTAS“ su paaiškinimu ir nebegali užimti pirmos vietos rekomendacijose',
      'Skelbimo puslapyje „Žiūrėti skelbimą“ ir „Palyginti“ perkelti į viršų, prie širdutės',
      'Pašalintas atsijungimo mygtukas apatiniame kairiajame kampe – atsijungiama per paskyros meniu',
      'Ištaisyti pasikartojantys portalo ir techninių duomenų ženkliukai skelbimo puslapyje',
    ],
  },
  {
    versija: '1.26.0', data: '2026-09-17', pavadinimas: 'Gamyklinė komplektacija pagal VIN',
    pakeitimai: [
      'VIN kortelėje – nuoroda į jūsų markės gamyklinės komplektacijos dekoderį (BMW/MINI – ///M Decoder, Mercedes – MBDecoder, VW/Audi/Škoda/SEAT – PR kodai, Porsche/Land Rover/Jaguar – VIN Analytics, kitoms markėms – universalus 7zap)',
      'BMW atveju nuoroda atsidaro iš karto su jūsų VIN; kitoms markėms VIN nukopijuojamas vienu paspaudimu',
      'Naujas nemokamas įrankis: įklijuokite gamyklinį komplektacijos sąrašą ir mes jį sulyginsime su skelbimu',
      '🟢 patvirtinta gamyklos duomenimis · 🔵 yra gamykloje, bet skelbime nepaminėta (argumentas deryboms) · 🟡 skelbime yra, gamykliniame sąraše nerasta',
      'Įspėjame, jei kelios skelbime deklaruotos įrangos pozicijos gamykliniame sąraše nerandamos – bet nekaltiname, nes pavadinimai gali skirtis',
      'Svetimų dekoderių automatiškai nenuskaitome – jų taisyklės to neleidžia, todėl sąrašą atidarote ir įklijuojate patys',
    ],
  },
  {
    versija: '1.25.0', data: '2026-09-17', pavadinimas: 'Galios ir varančiųjų filtrai, PVM kainoje, tvarkingi mėgstamiausi',
    pakeitimai: [
      'Nauji pagrindiniai filtrai: varančiųjų ratų tipas ir variklio galia (kW) – jie dabar šalia markės ir kuro, o ne paslėpti „Daugiau filtrų“',
      'Kortelėse matosi galia kW ir varantieji ratai – tai vieni svarbiausių vertinimo kriterijų',
      'Virš rezultatų aiškiai rašoma: kiek rasta portale, kiek atitiko visus jūsų filtrus, kiek rekomenduojama ir kiek atmesta',
      'PVM: jei skelbime kaina nurodyta be PVM, rodome „50 000 € + PVM = 60 500 € (galutinė)“ ir vertiname tik galutinę sumą',
      'Mėgstamiausių langas užvedus atsidaro iš karto su visais išsaugotais skelbimais – nebereikia paspausti antrą kartą',
      'Patvirtinimas prieš mėgstamiausių atnaujinimą rodomas pačiame lange, o ne pilku naršyklės langu',
      'Atidarius „Palyginimai“ pirmiausia matote, kuriuos automobilius šiuo metu lyginate, su mygtuku „Tęsti palyginimą“',
    ],
  },
  {
    versija: '1.24.0', data: '2026-09-17', pavadinimas: 'Naujas nuotraukų vertinimo standartas: matome – aprašome',
    pakeitimai: [
      'Nuotraukas peržiūri atskiras sluoksnis, kuris tik APRAŠO, kas matoma, ir niekada nedaro išvadų apie avarijas, ridos tikrumą ar gamyklinę komplektaciją',
      'Kiekvienas pastebėjimas turi lygį: 🟢 matoma nuotraukoje · 🟡 galimas signalas (ir paaiškinimą, kodėl neaišku)',
      'Prie pastebėjimo – mygtukas su nuotraukos numeriu: paspaudus atsidaro būtent ta nuotrauka',
      'Nauji du rodikliai: „Vizualinė būklė“ (kokia būklė tiek, kiek pavyko įvertinti) ir „Kiek galima įvertinti“ (ar nuotraukų apskritai pakanka)',
      'Trūkstamas rakursas nebemažina automobilio įvertinimo – jis virsta klausimu pardavėjui („paprašykite galo nuotraukos“)',
      'Kiekvienas galimas signalas virsta konkrečiu klausimu pardavėjui arba patikrinimo punktu apžiūros metu',
      'Įranga, matoma nuotraukoje IR nurodyta skelbimo sąraše, žymima žaliai; matoma tik nuotraukoje – geltonai, su prierašu, kad gamyklinė komplektacija nepatvirtinta',
      'Rodome prieštaravimus tarp skelbimo ir nuotraukų (pvz. „be defektų“, o nuotraukoje matomas įbrėžimas; skydelio rida nesutampa su skelbimu)',
      'Peržiūrima iki 10 nuotraukų vietoj 6, o brangiajam modeliui nuotraukos nebesiunčiamos – jis gauna tekstinę santrauką, todėl analizė kartu ir pigesnė',
      'Viršutinėje juostoje nebeliko nuorodų ir kituose puslapiuose – viskas paskyros meniu',
    ],
  },
  {
    versija: '1.23.1', data: '2026-09-17', pavadinimas: 'Tvarkingesnis meniu, palyginimo juosta ir mėgstamiausių atnaujinimas',
    pakeitimai: [
      'Nauja paslauga: „Atnaujinti visus" mėgstamiausiuose – vienu paspaudimu pertikriname kiekvieno išsaugoto skelbimo kainą ir būseną portale (1 kr už visą sąrašą, kartą per parą)',
      'Palyginimo juosta apačioje – dabar tvarkinga plaukiojanti kortelė su antrašte, išvalymo mygtuku ir aiškiu „pasirinkite dar 1"',
      '„Palyginimai" ir „Tęsti dabartinį palyginimą" sujungti į vieną eilutę paskyros meniu',
      'Paskyros meniu perpieštas pagal bendrą dizainą: atsidaro tiesiai po profilio mygtuku, suskirstytas į skiltis',
      'Viršutinė juosta išvalyta – „Paieška" ir „Ataskaitos" perkelti į paskyros meniu, paieška pasiekiama ir per logotipą',
      'VIN istorijos ataskaita rašoma žmogiškai: kas patikrinta ir ką tai reiškia, vietoj „rasta: false"',
      'Jei VIN paieška neįvyksta (šaltiniai neatsako), kreditas grąžinamas ir apie tai parašoma',
      'VIN paieška dabar tikrina ne tik JAV aukcionus, bet ir VIN agregatorius bei skelbimų archyvus',
    ],
  },
  {
    versija: '1.23.0', data: '2026-09-17', pavadinimas: 'Įranga sąraše, nemokamas VIN iššifravimas, pigesnė analizė',
    pakeitimai: [
      'Geriausių skelbimų kortelėse dabar matosi tikras įrangos kiekis ir kur automobilis stovi – šiuos duomenis nuskaitome atidarę patį skelbimą',
      'Naujas nemokamas VIN iššifravimas: gamintojas, surinkimo šalis, modelio metai pagal kodą, kontrolinis skaitmuo ir NHTSA duomenys – be kreditų',
      'Įspėjame, jei VIN užkoduoti metai ar gamintojas nesutampa su skelbimu, ir parodome, jei tą patį VIN jau matėme kitame skelbime',
      'Ištaisyta „Dingo iš portalo“ klaida – skelbimas nebežymimas parduotu vien todėl, kad nepateko į šios paieškos rezultatus ar nepavyko jo nuskaityti',
      'Pardavėjo kortelėje nebeteigiame „privatus pardavėjas“, kol to nežinome – parašome tik tai, ką iš tikrųjų matome',
      '„Istorija“ ir „Palyginti“ iš viršutinės juostos perkelti į paskyros meniu; skelbimo puslapyje palyginimo mygtukas dabar prie automobilio veiksmų',
      'Analizė pigesnė: pastovi užduoties dalis siunčiama tik kartą (podėlis), skelbimo tekstas trumpesnis, o ta pati analizė galioja 7 d., jei kaina nepasikeitė',
      'Prie AI analizės matosi, kada ji paruošta, ir yra mygtukas „Analizuoti iš naujo“ – nuskaitome skelbimą šviežiai (1 kr)',
      'Pardavėją, VIN būseną ir vietą matote skelbimo puslapyje jau prieš mokamą analizę – jei skelbimas pateko tarp geriausių paieškoje',
    ],
  },
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
