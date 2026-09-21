// versijos.js — CarTriige versijų istorija. VIENINTELĖ vieta, kur keičiama versija.
//
// TAISYKLĖ: po kiekvieno atnaujinimo pridedamas naujas įrašas SĄRAŠO VIRŠUJE
// (naujausia versija pirma) su šios dienos data ir trumpu pakeitimų sąrašu.
// Versijos numeris antraštėje ir langas „Versijų istorija“ generuojami iš šio sąrašo.
//
// Numeracija: X.Y.Z – Y keliamas už naują funkciją, Z už pataisymus.

window.CT_VERSIJOS = [
  {
    versija: '2.5.2', data: '2026-09-21', pavadinimas: 'Mėgstamiausių atnaujinimas ir stabilesnė paieška',
    pakeitimai: [
      'Mėgstamiausių puslapyje „Atnaujinti visus" vėl veikia - rodo patvirtinimą ir rezultatą',
      'Paieška nebenutrūksta ties 94 % dėl netvarkingo skelbimo duomenų',
      'Otomoto ir AutoScout24 skelbimų gili analizė pigesnė (1 kreditas vietoj 10)',
    ],
  },
  {
    versija: '2.5.1', data: '2026-09-21', pavadinimas: 'Visi portalai skaitomi nuo naujausio',
    pakeitimai: [
      'AutoScout24, Otomoto ir mobile.de dabar skaitomi nuo naujausio skelbimo, kaip autoplius ir autogidas - rinkos vidurkis nebeiškreiptas',
      'Otomoto kainos eurais skaičiuojamos pagal šios dienos ECB kursą (buvo pastovus 4,25)',
      'Paieškos mygtukai vienodo pločio ir sulygiuoti vienoje linijoje',
    ],
  },
  {
    versija: '2.5.0', data: '2026-09-21', pavadinimas: 'Veiksmų mygtukai šalia paieškos',
    pakeitimai: [
      '„Daugiau filtrų" ir „Paskutinės paieškos" perkelti į apatinę eilę šalia „Ieškoti ir analizuoti"',
      'Abi filtrų eilės vienodo aukščio - antra eilė nebeišsitempia',
    ],
  },
  {
    versija: '2.4.7', data: '2026-09-21', pavadinimas: 'mobile.de skelbimų gili analizė',
    pakeitimai: [
      'mobile.de skelbimams renkama įranga, nuotraukos, aprašymas, pardavėjo reitingas ir mobile.de kainų ribos - kaip kituose portaluose',
      'Autogido aukciono skelbimai (pradinė aukciono kaina) ir autoplius „Parduota!" skelbimai nebeiškreipia rinkos kainos ir nerodomi kaip pigūs pasiūlymai',
      'Otomoto: rodoma galia ir miestas, modelio pavadinimas toks pat kaip kituose portaluose; AutoScout24: miestas ir šalis',
    ],
  },
  {
    versija: '2.4.6', data: '2026-09-21', pavadinimas: 'mobile.de ir sutvarkyta paieška keliuose portaluose',
    pakeitimai: [
      'Naujas portalas: mobile.de (Vokietija) - pažymėkite jį portalų sąraše',
      'Pataisyta: nuo ankstesnio atnaujinimo autogidas, AutoScout24 ir Otomoto skelbimai paieškoje nebuvo rodomi - vėl rodomi',
      'mobile.de skelbimai rodomi su kaina, rida, metais ir rinkos palyginimu; gilios skelbimo analizės jiems kol kas nėra',
    ],
  },
  {
    versija: '2.4.4', data: '2026-09-21', pavadinimas: 'Kompaktiskesne filtru panele sone',
    pakeitimai: [
      'Metu, kainos ir galios diapazonai sone vel uzima po puse eiles - visi filtrai telpa be slinkimo',
      'Paieskos panele pries paieska vel per visa ekrano ploti',
    ],
  },
  {
    versija: '2.4.3', data: '2026-09-21', pavadinimas: 'Kuro filtras veikia visuose portaluose',
    pakeitimai: [
      'Autogide kuro filtras dabar tikrai perduodamas portalui - anksciau jis buvo ignoruojamas',
      'AutoScout24 ir Otomoto dabar gauna kuro, pavaru dezes ir ridos filtrus',
      'Hibridai visuose portaluose - ir benzino, ir dyzelino, iskaitant plug-in',
    ],
  },
  {
    versija: '2.4.2', data: '2026-09-21', pavadinimas: 'Tikslesnis skelbimu nuskaitymas',
    pakeitimai: [
      'Hibridu ir elektromobiliu rida nebesumaisoma su elektriniu nuotoliu (pvz. 160 000 km nebevirsta 86 km)',
      'Kai skelbime kaina sumazinta, imama dabartine kaina, o sena parodoma atskirai',
      'Elektromobiliu kuras nebeskaidomas pagal baterijos talpa',
      'Autogido skelbimai su reklama antrasteje atpazistami pagal tikra modeli',
    ],
  },
  {
    versija: '2.4.1', data: '2026-09-21', pavadinimas: 'Pigesne paieska Lenkijos ir Europos portaluose',
    pakeitimai: [
      'Otomoto ir AutoScout24 skelbimai skaitomi pigesniu budu - paieska juose kainuoja apie 10 kartu maziau',
    ],
  },
  {
    versija: '2.4.0', data: '2026-09-21', pavadinimas: 'Teisingesne rinkos kaina ir rusiavimas visam sarasui',
    pakeitimai: [
      'Rinkos kaina nebeiskreipiama lizingo imoku, daliu ir aiskiai netikru kainu - normalus skelbimai nebeatrodo brangesni, nei yra',
      'Pasirinktas rusiavimas dabar taikomas ir „Kitiems skelbimams", ne tik virsutinems kortelems',
      'Uz rinkos ribu stipriai pigesni skelbimai (galimai dauzti) patikimiau atpazistami',
    ],
  },
  {
    versija: '2.3.2', data: '2026-09-21', pavadinimas: 'Svarus isjungimas atnaujinant',
    pakeitimai: [
      'Atnaujinant programa serveris isjungiamas tvarkingai ir issaugo sukauptus duomenis',
      'Railway nebesiuncia klaidingo pranesimo apie kritima po kiekvieno atnaujinimo',
    ],
  },
  {
    versija: '2.3.1', data: '2026-09-21', pavadinimas: '35 paketas: filtru etiketes ir statistikos juosta sone',
    pakeitimai: [
      'Markes ir modelio filtruose vel matomos piktogramos, o etikete visur stovi virs laukelio',
      'Statistikos juosta soniniame stulpelyje nebeislenda uz krasto',
    ],
  },
  {
    versija: '2.3.0', data: '2026-09-21', pavadinimas: 'Ridos palyginimas pagal automobilio amziu',
    pakeitimai: [
      'Rida lyginama tik su TOKIO PAT amziaus to modelio automobiliais - anksciau jauni automobiliai gaudavo klaidinga ispejima',
      'Kai tokio amziaus duomenu registre per mazai, taip ir parasoma, o ne speliojama',
      'Nurasymu ispejimas rodomas nuo 12 metu automobiliams, riba 40 %',
    ],
  },
  {
    versija: '2.2.1', data: '2026-09-21', pavadinimas: 'Automatinis sekimas laikinai isjungtas',
    pakeitimai: [
      'Kasdienis sekamu skelbimu tikrinimas laikinai sustabdytas, kol pertvarkomas skenavimas',
    ],
  },
  {
    versija: '2.2.0', data: '2026-09-21', pavadinimas: 'Skelbimu archyvas',
    pakeitimai: [
      'Pradedame kaupti skelbimu istorija: kada skelbimas atsirado, kaip keitesi kaina, kada dingo',
      'Duomenys saugomi atskiroje duomenu bazeje, kuri islieka po atnaujinimu',
      'Sukaupti duomenys nebegali dingti, jei serveris sustoja rasymo metu',
    ],
  },
  {
    versija: '2.1.0', data: '2026-09-21', pavadinimas: 'Registro skaiciai pataisyti ir patikslinti',
    pakeitimai: [
      'Ankstesnes versijos skaiciai buvo per mazi: 12 menesiu langas realiai denge 9,3 menesio',
      'Ridos palyginimas dabar sako konkreciai: „patenka tarp 10 % maziausiai vaziavusiu si modeli"',
      'Nurasymu ispejimas rodomas tik senesniems automobiliams - jaunam jis nieko nereiske',
      'Naujas punktas: kai Lietuvoje toks kuras retas, perparduoti bus sunkiau',
    ],
  },
  {
    versija: '2.0.0', data: '2026-09-21', pavadinimas: 'Lietuvos registro duomenys skelbimuose',
    pakeitimai: [
      'Paspaudus „Daugiau" matysite, kaip greitai sis modelis parduodamas Lietuvoje',
      'Parodoma, jei skelbimo rida gerokai mazesne, nei iprasta tam modeliui - kaip klausimas pardavejui, ne kaltinimas',
      'Ispejama apie retus modelius ir tokius, kuriu daug nebeleidziama eisme',
      'Kai duomenu apie modeli nera, taip ir parasoma - vietoj nulio',
      'Balo sie punktai nekeicia',
    ],
  },
  {
    versija: '1.99.0', data: '2026-09-21', pavadinimas: 'Siaurame stulpelyje traukiasi tekstas, ne zenklai',
    pakeitimai: [
      'Filtru juostoje piktogramos nebesusispaudzia - anksciau kai kurios butu likusios 4 px vietoj 12',
      'Telefone kelios piktogramos buvo 10 px vietoj 14 - irgi sutvarkyta',
      'Ilgi uzrasai siauroje vietoje dabar trumpinami trimis taskais, o ne stumia turini',
      'Dvi musu laikinos atsvaros pakeistos viena dizaino sistemos taisykle',
    ],
  },
  {
    versija: '1.98.0', data: '2026-09-21', pavadinimas: 'Prisijungimas: didziosios raides ir bandymu riba',
    pakeitimai: [
      'Prisijungiant nebesvarbu, ar rasote Vardas@ ar vardas@ - anksciau tai buvo dvi skirtingos paskyros',
      'Esami el. pastai sutvarkomi automatiskai; jei kas nors turi dvi panasias paskyras, nieko neliecia ir praneša',
      'Penki nepavyke bandymai is to paties kompiuterio - ir prisijungimas stabdomas 15 minuciu',
      'Svetimos paskyros uzrakinti neimanoma: riba galioja bandziusiam, ne savininkui',
      'Slaptazodziu apsauga sustiprinta, ir senos paskyros perkeliamos automatiskai prisijungus',
    ],
  },
  {
    versija: '1.97.0', data: '2026-09-21', pavadinimas: 'Filtru juosta nebeslenka i sona',
    pakeitimai: [
      'Sonine filtru juosta turejo paslepta horizontalu slinkima - dalis turinio buvo uz kraso',
      'Priezastis nebuvo „Kiti skelbimai": tas mygtukas tik pailgina puslapi tiek, kad juosta tampa matoma',
      'Portalu mygtukas platesniuose ekranuose isejo 56 px uz juostos; dabar uzrasas trumpinamas, o zenklai lieka',
      'Siauresniuose ekranuose ta pati dare statistikos juosta - 182 px',
    ],
  },
  {
    versija: '1.96.0', data: '2026-09-21', pavadinimas: 'Pasibaigusi sesija pagaliau pasisako',
    pakeitimai: [
      'Anksciau pasibaigus prisijungimui puslapis atrode veikiantis, o viskas tyliai nustodavo veikti',
      'Dabar atsidarius puslapi prisijungimas patikrinamas, ir pasibaiges - pasakoma aiskiai',
      'Skelbimo ir palyginimo puslapiai nebelieka tusti: anksciau jie apie tai nepranesdavo niekaip',
      'Atsijungiant isvalomi ir rezultatai bei analiziu podelis - kitas zmogus tame paciame kompiuteryje ju nebemato',
      'Analizei priimamos tik keturiu palaikomu portalu nuorodos',
    ],
  },
  {
    versija: '1.95.0', data: '2026-09-20', pavadinimas: 'Metu, kainos ir galios laukai sone tapo iskaitomi',
    pakeitimai: [
      'Ivedus „15000" buvo matyti tik dalis skaitmenu - dabar visi seši laukai rodo iverta reiksme',
      'Trys diapazonai sone dabar uzima visa eilute; juosta del to paaugo iki 644 px',
      'Siaurame ekrane (1280x720) juosta del to slenka 45 px - dizaineriui perduota, ar taip paliekam',
      'Valymo kryzelis nebeatima vietos tuscioje dezuteje',
    ],
  },
  {
    versija: '1.94.0', data: '2026-09-20', pavadinimas: 'Markes ir modelio laukai sone pagaliau matosi',
    pakeitimai: [
      'Siauroje filtru juostoje markes ir modelio pasirinkimai buvo 0 px plocio - ju paprasciausiai nebuvo',
      'Juostos aukstis del to uzaugo 484 -> 532 px, bet vis tiek telpa (riba 599)',
      'Filtru juostos aprasymas buvo dviejose vietose; sujungtas i viena, ir paaiskejo, kad pusė jo negyva',
      'Istrinti astuoni spalvu ir dydziu vardai, kuriu niekas nenaudojo nuo ju parasymo',
    ],
  },
  {
    versija: '1.93.0', data: '2026-09-20', pavadinimas: 'Avataro mygtukas visur vienodas',
    pakeitimai: [
      'Paieskos puslapio avataro mygtukas buvo 32x32, o skelbimo puslapyje - 38x38',
      'Priezastis: index.html buvo likusi viena papildoma klase `ct-btn-sm`, nuimta ne visur',
      'Dabar visi penki puslapiai nesa tas pacias avataro klases ir ta pati 38x38 dydi',
    ],
  },
  {
    versija: '1.92.0', data: '2026-09-20', pavadinimas: 'Filtru piktogramos pagaliau matosi',
    pakeitimai: [
      'Filtru piktogramos atsirado ekrane - iki siol ju vietoje buvo tuscia vieta',
      'Priezastis: piktogramos buvo idetos tik i saltinio faila, o kiekvienas puslapis nesa savo kopija',
      'Pridėta patikra, kuri neleis tam pasikartoti: tikrina, ar kiekviena naudojama piktograma yra to puslapio rinkinyje',
    ],
  },
  {
    versija: '1.91.0', data: '2026-09-20', pavadinimas: 'Klaidu sarase matyti, kas svarbiausia',
    pakeitimai: [
      'Kiekvienas pranesimas gavo prioriteta: trys taskai ir vardas - Svarbu, Vidutinis, Zemas',
      'Prioritetas surenkamas is to, kas jau irasyta: svarba, pasikartojimai ir kiek dienu kabo neuzdarytas',
      'Penkis kartus pasikartojes pranesimas nebeatrodo taip pat kaip parasytas viena karta',
    ],
  },
  {
    versija: '1.90.0', data: '2026-09-20', pavadinimas: 'Hero juosta vienoje vietoje, klaidu prioritetas',
    pakeitimai: [
      'Hero juostos aukstis dabar aprasytas vienoje vietoje - anksciau buvo dvi kopijos, ir senoji negyva',
      'Istrintos 27 negyvos taisykles, likusios nuimus hero teksta - tarp ju ta, kuri butu tyliai grazinusi 600 px juosta',
      'Administravime klaidos gauna prioriteto zenkla: trys taskai pagal svarba ir pasikartojimus',
      'Portalu skydelis sone gavo teisinga ploti',
    ],
  },
  {
    versija: '1.89.0', data: '2026-09-20', pavadinimas: 'Filtru lauku vidus perimtas i dizaino sistema',
    pakeitimai: [
      'Laukeliu vidines dezutes tvarkomos vienoje vietoje, o ne atskirais irasais - isvaizda nepasikeite nė vienu pikseliu',
      'Vienas laikinas musu pataisymas istrintas - dizaino sistema tai daro pati',
    ],
  },
  {
    versija: '1.88.0', data: '2026-09-20', pavadinimas: 'Filtrai rodo, kas nustatyta',
    pakeitimai: [
      'Kiekvienas filtras dabar pasako tris dalykus: kas jis, kokia reiksme ir AR ji nustatyta - nustatyti laukai paryskinti',
      'Virs filtru atsirado „NUSTATYTA N · Isvalyti" - matyti, pagal ka ieskoma, ir galima viska atlaisvinti vienu paspaudimu',
      'Kiekvienas laukas turi savo piktograma ir kryzeliuka pavienei reiksmei isvalyti',
      'Filtru stulpelis susitrauke iki 484 px - telpa su didele atsarga',
    ],
  },
  {
    versija: '1.87.0', data: '2026-09-20', pavadinimas: 'Filtru laukai nebespaudziami i kampa',
    pakeitimai: [
      'METAI ir KAINA laukeliai issitiese per visa langelio ploti - anksciau buvo prispausti kaireje, o desineje likdavo tuscia',
      'Rida ir galia nebeturi savo remelio remelyje - isvaizda atkeliauja is dizaino sistemos, ne is atskiru irasu',
    ],
  },
  {
    versija: '1.86.0', data: '2026-09-20', pavadinimas: 'Panele stovi lygiai ant juostos, statistika persikele zemiau',
    pakeitimai: [
      'Paieskos panele pagaliau stovi lygiai ant hero juostos - tarpo nebera',
      'Statistikos juosta („12 480 skelbimu per diena") persikele PO paieskos laukais, o po paieskos dingsta',
      'Abu dvylikto langelio mygtukai vienodo aukscio - vienas ju buvo 44 px vietoj 30',
    ],
  },
  {
    versija: '1.85.0', data: '2026-09-20', pavadinimas: 'Atnaujinimo mygtukas megstamiausiuose, tvarkingesnis dvyliktas langelis',
    pakeitimai: [
      'Megstamiausiu skiltyje atsirado „Atnaujinti visus" - anksciau ji buvo tik antrastes iskleidziamame meniu',
      'Dvyliktas langelis su „Daugiau filtru" ir „Paskutinemis paieskomis" gavo savo isvaizda: be remelio, kad nesimaisytu su filtru laukais',
      'Istrinta negyva eilute, kuri butu tyliai numetusi hero juosta 96 px, jei kas nors butu isvales kita',
    ],
  },
  {
    versija: '1.84.0', data: '2026-09-20', pavadinimas: 'Filtru eiles susilygino, skirtuku juosta pasalinta',
    pakeitimai: [
      'Filtrai dabar lygiai dvi eiles po sesis - paskutine eile nebeturi skyles',
      '„Daugiau filtru" ir „Paskutines paieskos" persikele i dvylikta langeli, prie pat filtru',
      'Skirtuku juosta po panele pasalinta - ji atrode nuo paneles atplysusi',
    ],
  },
  {
    versija: '1.83.0', data: '2026-09-18', pavadinimas: 'Hero juosta pagaliau 220 px, filtru stulpelis telpa',
    pakeitimai: [
      'Hero tapo tikra 220 px juosta (telefone 180) - nuotrauka nebeuzeina ant filtru virsaus',
      'Sesios papildomos zymos grazintos i „Daugiau filtru" - filtru stulpelis susitrauke 728 -> 568 px ir telpa be slinkimo',
      'Filtru eile vel lygi: 11 langeliu dviem eilemis',
    ],
  },
  {
    versija: '1.82.0', data: '2026-09-18', pavadinimas: 'Hero tapo juosta, visi filtrai matomi is karto',
    pakeitimai: [
      'Hero tekstas isimtas, hero tapo 220 px juosta (telefone 180), o paieskos panele stovi lygiai ant jos',
      'Visi 12 filtru matomi is karto dviem eilemis - rida, puslapiu kiekis, portalai ir papildomos zymos nebeslepiamos',
      'Keturi nauji filtrai nekainavo nė vieno pikselio aukscio: 8 langeliai uzeme 2 eiles, 12 uzima irgi 2',
      '„Visi varantys (4x4)" sutrumpintas iki „Visi varantys" - ilgesnis tekstas siaurame langelyje nusikirpdavo',
    ],
  },
  {
    versija: '1.81.0', data: '2026-09-18', pavadinimas: 'Vartotojo ekranas administravime',
    pakeitimai: [
      'Paspaudus vartotoja atsidaro jo ekranas: kreditai, planas ir kreditu zurnalas vienoje vietoje',
      'Keiciant plana rodoma, ka tai TIKRAI padarys - plano kreditai gali ir sumazeti, o paieskos nuzeruojamos',
      'Kreditu zurnale matyti nemokami pakartojimai, grazinimai ir plano keitimai',
      'Vartotoju sarase planas ir registracijos data rodesi neteisingai - taisyta',
    ],
  },
  {
    versija: '1.80.0', data: '2026-09-18', pavadinimas: 'Komentarai prie klaidu, antraste susitvarke, admin lentele telefone',
    pakeitimai: [
      'Tikrinant pataisyma galima prirasyti komentara prie to paties pranesimo - nebereikia kurti naujo',
      'Parasius komentara „laukia patikros" pranesimas pats grizta i „patvirtinta", t.y. atgal i darba',
      'Antrastes desinys blokas vel stovi prie desinio krasto, ne prie logotipo',
      'Administravimo lentele telefone virsta kortelėmis: kiekviena reiksme su savo vardu',
    ],
  },
  {
    versija: '1.79.0', data: '2026-09-18', pavadinimas: 'Filtrai i sona keliauja tik po paieskos',
    pakeitimai: [
      'Tusciame puslapyje paieskos forma vel per visa ploti - siauras stulpelis atsiranda tik paleidus paieska',
      'Paieska be rezultatu filtru is sono nebeismeta: salyga yra paieska, ne rezultatu skaicius',
      'Portalu sarasas sone atsidaro i desine nuo mygtuko ir telpa stulpelyje',
    ],
  },
  {
    versija: '1.78.0', data: '2026-09-18', pavadinimas: 'Prioritetas su spalvomis, administravimo sarasas atsinaujina pats',
    pakeitimai: [
      'Pranesime apie klaida „kiek trukdo" pakeista i prioriteta: Svarbu raudonas, Vidutinis geltonas, Maziausiai svarbu zalias',
      'Administravimo sarasas atsinaujina grizus i skirtuka - busena, pakeista telefone, nebelieka sena kompiuteryje',
      'Ankstesniu pranesimu duomenys nepasikeite: pasikeite tik uzrasai ir spalvos',
    ],
  },
  {
    versija: '1.77.0', data: '2026-09-18', pavadinimas: 'Portalu sarasas nebenukerpamas, dekoracija is filtru pasalinta',
    pakeitimai: [
      'Renkantis portala sarasas nebeiskrenta uz filtru stulpelio - tekstas matomas visas',
      'Is „Daugiau filtru" pasalinta „Search across Europe" juosta su veleveliu emoji - ji buvo tik dekoracija',
      'Apatines eiles mygtukai sone laužosi i dvi eilutes, o ne islenda uz krasto',
    ],
  },
  {
    versija: '1.76.0', data: '2026-09-18', pavadinimas: 'Skelbimo skirtukai vel veikia, filtru stulpelis susitvarke',
    pakeitimai: [
      'Skelbimo puslapyje skirtukai (Technine iranga, Rizikos, Istorija, Rinka, Pardavejas) vel persijungia - funkcija buvo dingusi ir kiekvienas paspaudimas metė klaida',
      'Telefone pranesimo mygtukas nebeuzlipa ant sirdeles skelbimo puslapyje',
      'Filtru stulpelis sutrumpejo 746 -> 540 px ir telpa be slinkimo nuo 1180 px',
      'Skirtukai „Ieskoti / Paskutines paieskos" persikele virs rezultatu, portalu pasirinkimas - i „Daugiau filtru"',
    ],
  },
  {
    versija: '1.75.0', data: '2026-09-18', pavadinimas: 'Filtrai persikele i sona, ekranas naudojamas iki 1600 px',
    pakeitimai: [
      'Nuo 1180 px filtrai stovi kaireje ir lieka matomi slenkant - nebereikia grizti i virsu',
      'Placiuose ekranuose turinys tesiasi iki 1600 px: ties 2364 px kortele platesne 1200 -> 1560 px',
      'Antrastes aukstis nustojo buti spejimas - 65 / 69 / 97 px pamatuoti ir sudeti i viena vieta',
      'Ties 1280x720 filtru stulpelis dar slenka: telpa 599 px, reikia 746 - dizaineriui perduota su skaiciais',
    ],
  },
  {
    versija: '1.74.0', data: '2026-09-18', pavadinimas: 'Mygtukai planšetėje nebesusispaudžia',
    pakeitimai: [
      'Liečiamoje planšetėje veiksmų mygtukai atgavo įprastą plotį – užrašai vėl telpa',
      'Telefone lieka trys vienodi 44 px mygtukai, kompiuteryje niekas nesikeičia',
      'Du laikini mūsų pataisymai ištrinti – dizaino sistema tai daro pati',
    ],
  },
  {
    versija: '1.73.0', data: '2026-09-18', pavadinimas: 'Formos laukai gavo savo išvaizdą',
    pakeitimai: [
      'Pasirinkimo ir teksto laukai nebeatrodo kaip naršyklės numatytieji – tas pats stilius kaip mygtukų',
      'Liečiamame ekrane laukas 44 px aukščio, kaip ir mygtukai',
      'Paruošta filtrų vieta šone plačiuose ekranuose – pats perkėlimas bus kitame žingsnyje',
    ],
  },
  {
    versija: '1.72.0', data: '2026-09-18', pavadinimas: 'Lizingo įmoka atpažįstama pagal formą, ne pagal sumą',
    pakeitimai: [
      'ISTAISYTA: skelbimai, kur vietoj kainos rodoma „739 € / mėn.", nebuvo pažymimi, jei suma didesnė už ribą',
      'Dabar žiūrima, ar prie pačios kainos stovi „/ mėn." – suma nebesvarbi',
      'Skelbimai, kurie rodo tikrą kainą, o šalia siūlo lizingą, nežymimi – patikrinta aštuoniais atvejais',
    ],
  },
  {
    versija: '1.71.0', data: '2026-09-18', pavadinimas: 'Širdelė nebeslepia savęs',
    pakeitimai: [
      'Užvedus pelę mėgstamiausių sąrašas atsidaro kaip anksčiau – spausti nereikia',
      'O paspaudus dabar nuveda į visą mėgstamiausių sąrašą, o ne uždaro tai, ką ką tik atidarėte',
      'Telefone niekas nesikeičia: paspaudimas atidaro sąrašą, o iš jo veda nuoroda „Visi →"',
    ],
  },
  {
    versija: '1.70.0', data: '2026-09-18', pavadinimas: 'Matosi, kuria versija ištaisyta',
    pakeitimai: [
      'Klaidų sąraše prie pranešimo dabar dvi versijos: kurioje rasta ir kuria ištaisyta',
      'Ištaisyta rodoma žaliai – neištaisyta geltonai su dabartine versija, tad matosi, kiek versijų prabėgo',
    ],
  },
  {
    versija: '1.69.0', data: '2026-09-18', pavadinimas: 'Galima parodyti, kur sugedo',
    pakeitimai: [
      'Pranešime naujas mygtukas „Parodyti vietą ekrane" – langas pasitraukia, jūs bakstelėjate į sugedusią vietą',
      'Paspaudimas perimamas, tad rodydami į „Pilna apžvalga" jos nepaleisite ir kreditas nenusirašys',
      'Naujas langelis „Perkroviau puslapį – liko taip pat"',
      'Ir klausimas, kada pirmą kartą pastebėjote – šiandien, šią savaitę ar seniai',
    ],
  },
  {
    versija: '1.68.0', data: '2026-09-18', pavadinimas: 'Pranešimo langas tikslesnis',
    pakeitimai: [
      'Klaidos rūšis renkama iš sąrašo – trylika aiškių pasirinkimų vietoj šešių ženkliukų',
      'Tarp jų ir „Turiu pasiūlymą / patobulinimą" – pranešti galima ne tik apie klaidas',
      'Pagal pasirinkimą užduodamas tikslus klausimas: „o koks skaičius turėjo būti?", „kaip turėjo atrodyti?"',
      'Prie pranešimo automatiškai pridedamas skelbimas, kurį tuo metu matėte',
    ],
  },
  {
    versija: '1.67.0', data: '2026-09-18', pavadinimas: 'Veiksmų mygtukai kortelėje susitvarkė',
    pakeitimai: [
      'Telefone visi trys antriniai mygtukai vienodi – anksčiau vidurinis buvo penkis kartus platesnis',
      'Pranešimo apie klaidą mygtukas telefone padidintas iki 44 px',
      'Liečiamuose ekranuose mygtukai visur pakyla iki 44 px, o pele valdomuose lieka kaip buvo',
    ],
  },
  {
    versija: '1.66.0', data: '2026-09-18', pavadinimas: 'Mygtukai telefone visur vienodi',
    pakeitimai: [
      'Antraštės mygtukai 44 px ne tik pagrindiniame puslapyje, bet ir ataskaitose, mėgstamiausiuose ir administravime',
      'Anksčiau pataisiau tik vieną puslapį, nors antraštė bendra penkiems',
    ],
  },
  {
    versija: '1.65.0', data: '2026-09-18', pavadinimas: 'Antraštė telefone nebesusispaudžia',
    pakeitimai: [
      'ISTAISYTA: po praeito atnaujinimo pagrindinė nuotrauka iškrito iš vietos ir dešinėje liko juodas plotas',
      'Antraštės mygtukai telefone padidinti iki 44 px – anksčiau buvo 32 px ir sunkiai pataikomi',
      'Meniu juosta pašalinta: nuorodos jau gyvena kitur, o tuščia juosta tik spaudė mygtukus',
      'Klaidų sąraše prie kiekvieno pranešimo matosi versija, kurioje jis parašytas',
      'Jei pranešimas senesnis už dabartinę versiją – tai pažymima, nes galėjo būti jau ištaisyta',
    ],
  },
  {
    versija: '1.64.0', data: '2026-09-18', pavadinimas: 'Išplėtus nebesikartoja tas pats',
    pakeitimai: [
      'ISTAISYTA: paspaudus „Daugiau" apačioje pasirodydavo tie patys ženkliukai, kurie jau matomi viršuje',
      'Dabar rodomi tik tie, kurių viršuje nesimatė – o jei tokių nėra, skiltis visai neatsiranda',
      'Antraštė „VISI SKELBIMO ŽENKLIUKAI" pakeista į „DAUGIAU ŽENKLIUKŲ" – dabar ji sako tiesą',
    ],
  },
  {
    versija: '1.63.0', data: '2026-09-18', pavadinimas: 'Meniu juosta pagaliau turi nuorodas',
    pakeitimai: [
      'Antraštės juosta užpildyta: Paieška · Palyginimas · Ataskaitos – visuose puslapiuose',
      'Telefone ji nebeslepiama, o nusileidžia po antrašte kaip antra eilė',
      'ISTAISYTA: aktyvi nuoroda visada švietė pirmoji, nesvarbu kuriame puslapyje esate',
      'Skelbimo duomenų sąrašas perimtas į dizaino sistemą – išvaizda nepakitusi',
      'Pagrindinė nuotrauka telefone nebeapkerpama – matosi visas automobilis',
    ],
  },
  {
    versija: '1.62.0', data: '2026-09-18', pavadinimas: 'Matosi, kiek duomenų sukaupta',
    pakeitimai: [
      'Administravimo „Matavimai" rodo, kiek skelbimų sekama, kiek jų gyvų, kiek dingusių ir kiek su VIN',
      'Plius kiek kainų istorijos linijų ir kiek modelių rinkos archyve',
      'Anksčiau apie kaupyklą buvo galima tik spėti – dabar matyti skaičiai',
    ],
  },
  {
    versija: '1.61.0', data: '2026-09-18', pavadinimas: 'Nuotrauką galima pamatyti',
    pakeitimai: [
      'Pridėtą nuotrauką galima atidaryti per visą ekraną, o antru paspaudimu – tikru dydžiu',
      'Esc uždaro tik peržiūrą – surašytas tekstas ir nuotrauka lieka',
      'ISTAISYTA: administravime nuotraukos visai nebuvo matomos (grąžindavo 401) – dabar rodomos ir atidaromos atskirai',
    ],
  },
  {
    versija: '1.60.0', data: '2026-09-18', pavadinimas: 'Klaidų pranešimai pagaliau išsaugomi',
    pakeitimai: [
      'ISTAISYTA: klaidų pranešimai niekada nebuvo įrašomi į diską ir dingdavo per kiekvieną atnaujinimą',
      'Nuotraukos taip pat – dabar išsaugomos ir matomos',
      'Administravimo skiltyje „Matavimai" dabar matosi, kur guli duomenys ir ar jie išlieka po atnaujinimo',
      'Kainos patikros riba pakelta iki 4500 € – pro 4000 € prasprūsdavo mėnesinės lizingo įmokos',
      'Kainos patikros riba pakelta iki 4500 € – pro 4000 € prasprūsdavo mėnesinės lizingo įmokos',
      'Prie tokio skelbimo klientas mato „PATIKRINKITE KAINĄ" su paaiškinimu, kas būtent įtartina',
      'Sena ar daug važiuota mašina už tikrai mažą kainą nežymima – patikrinta šešiais atvejais',
    ],
  },
  {
    versija: '1.59.0', data: '2026-09-18', pavadinimas: 'Nuo pranešimo iki klaidos – vienas paspaudimas',
    pakeitimai: [
      'Prie kiekvieno pranešimo mygtukas „Atkurti" – atidaro tą patį puslapį tokio pat dydžio lange kaip pranešusiojo ekranas',
      '„Patikrinti užklausas" parodo, ar nepavykusios užklausos vis dar neveikia, ar jau sutvarkytos',
      'Mokamos užklausos (analizė, VIN, pardavėjas, palyginimas) rodomos, bet NIEKADA nekviečiamos automatiškai – kreditai lieka jūsų',
      '„Kopijuoti" – visas pranešimas su diagnostika į iškarpinę',
    ],
  },
  {
    versija: '1.58.0', data: '2026-09-18', pavadinimas: 'Neišsiųstas pranešimas nebedingsta',
    pakeitimai: [
      'Jei pranešimo išsiųsti nepavyksta, jis išsaugomas ir išsiunčiamas automatiškai kitą kartą atidarius puslapį',
      'Būtent taip praradome pirmuosius pranešimus – klaida grįžo, o tekstas dingdavo kartu su ja',
      'Nepavykus dėl dydžio, nuotrauka numetama, o tekstas išlieka',
      'Sąraše matosi, kad pranešimas vėluoja – kad laikas nebūtų palaikytas įvykio laiku',
    ],
  },
  {
    versija: '1.57.0', data: '2026-09-18', pavadinimas: 'Klaidų sąrašas vienu žvilgsniu',
    pakeitimai: [
      'Administravimo puslapyje naujas rodinys „Viskas tekstu" – visi pranešimai su visa diagnostika vienoje vietoje',
      'Atidaromas ir tiesiogiai adresu `/admin.html?tekstas=1`',
      'Prie kiekvieno pranešimo dabar matosi, po kiek laiko nuo puslapio įkėlimo įvyko klaida',
      'Ir ar tuo metu buvo ryšys – „serveris neatsako" nebesupainiojama su „telefonas neteko ryšio"',
    ],
  },
  {
    versija: '1.56.0', data: '2026-09-18', pavadinimas: 'Teksto apkarpymas grįžo ten, kur priklauso',
    pakeitimai: [
      'Administravimo lentelėje ilgo teksto langelis nebeišsiskiria iš eilutės – rėmelis vėl vienoje linijoje',
      'Apkarpymas iki dviejų eilučių dabar yra atskira dizaino sistemos dalis, o ne lentelės ypatybė',
      'Laikinas mūsų pataisymas ištrintas – dizaino sistema tai daro pati',
    ],
  },
  {
    versija: '1.55.0', data: '2026-09-18', pavadinimas: 'Klaidų sąrašas pasiekiamas ir iš išorės',
    pakeitimai: [
      'Klaidų pranešimus dabar gali perskaityti ne tik žmogus naršyklėje – taisytojas gauna juos su visa diagnostika',
      'Naujas raktas `KLAIDU_RAKTAS` (tik Railway Variables) atrakina TIK klaidas ir matavimus',
      'Raktu negalima nei ištrinti pranešimo, nei prieiti prie vartotojų, planų ar kreditų',
      'Nenustačius rakto arba jam esant trumpesniam nei 32 simboliai, antraštė nepriimama visai',
    ],
  },
  {
    versija: '1.54.0', data: '2026-09-18', pavadinimas: 'Klaidų pranešimai su nuotraukomis',
    pakeitimai: [
      'ISTAISYTA: pranešimas su nuotrauka grąžindavo „Užklausa per didelė" ir dingdavo – dabar išsiunčiamas',
      'Nuotrauka sumažinama pačioje naršyklėje iki 1600 taškų; jei vis tiek per didelė – suspaudžiama dar kartą',
      'Jei serveris atmeta dėl dydžio, parašoma būtent tai, o ne bendra klaida',
      'Administravimo puslapio klaidų sąrašas perdarytas į tankią lentelę',
      'Skubios eilutės žymimos linija kairėje, uždarytos – prigesinamos',
      'Trys skirtingos tuščios būsenos: nieko dar nebuvo, nėra ką taisyti, ir paslėpta filtro',
    ],
  },
  {
    versija: '1.53.0', data: '2026-09-18', pavadinimas: 'Administravimo puslapis',
    pakeitimai: [
      'Naujas puslapis `/admin.html`: klaidų sąrašas, nuskaitymo matavimai ir vartotojai vienoje vietoje',
      'Klaidos būseną galima perjungti paspaudimu – nebereikia komandinės eilutės',
      '„Laukia patikros" įrašai pažymimi ir keliami į viršų: tai vienintelė būsena, kur laukiama jūsų',
      'Prie kiekvieno pranešimo matosi, ką žmogus spaudė prieš tai, ir visa techninė diagnostika',
      'Puslapis pilnai veikia ir telefone',
    ],
  },
  {
    versija: '1.52.0', data: '2026-09-18', pavadinimas: 'Skelbimo puslapis nebeprieštarauja pats sau',
    pakeitimai: [
      'ISTAISYTA: skelbimo puslapio rinkos skiltis rodė „+12 %" raudonai, nors viršuje tas pats skaičius buvo „−12 %" žaliai – t. y. gera žinia atrodė kaip bloga',
      'Pranešimo apie klaidą langas perdarytas pagal dizaino sistemą – savo stilių turėjusių eilučių nebeliko',
      'Klaidos pranešimas dabar rodomas prie to klausimo, kurio neatsakėte, o ne lango apačioje',
      'Plaukiojantis mygtukas gavo savo paviršių – ant nuotraukos jis nebeišnyksta',
      'Trys naujos piktogramos: pranešimo, sistemos klaidos ir siųstuvo',
      'Nuotraukos užrašas peržiūros duomenyse nebenukerpamas',
    ],
  },
  {
    versija: '1.51.0', data: '2026-09-18', pavadinimas: 'Klaidų sąrašas rodo, kieno dabar ėjimas',
    pakeitimai: [
      'Klaida turi kelią, ne dvi būsenas: rasta → patvirtinta → tvarkoma → laukia patikros → sutvarkyta',
      'Atskira būsena „nepasitvirtino" – kai klaida neatsikartoja arba jau buvo ištaisyta anksčiau',
      '„Laukia patikros" visada sąrašo viršuje: tai vienintelė būsena, kur laukiama jūsų patvirtinimo',
      'Pataisyta klaida iš sąrašo nebedingsta tol, kol nepatvirtinate, kad produkcijoje veikia',
      'Kiekvienas perjungimas įrašo, kas, kada, kokia versija ir kodėl – matosi visas kelias',
    ],
  },
  {
    versija: '1.50.0', data: '2026-09-18', pavadinimas: 'Pranešimas apie klaidą pasako, kurį mygtuką spaudėte',
    pakeitimai: [
      'Prie pranešimo automatiškai prisegama, ką spaudėte prieš tai – paskutiniai 12 veiksmų su tikslais mygtukų pavadinimais',
      'Galima pasakyti, kokia tai klaida: atrodo ne taip, nieko neįvyko, neteisingas skaičius, nusirašė kreditas, užstringa ar neleidžia prisijungti',
      'Pažymėjus „neteisingas skaičius" atsiranda laukas „o ką turėjo rodyti" – be to klausimo tokias klaidas taisyti sunkiausia',
      'Galima nurodyti, kiek trukdo, ir pažymėti, kad taip jau buvo anksčiau',
      'Sutvarkytos klaidos iš sąrašo dingsta pačios',
      'Skelbimo puslapio naršymo juosta gavo tinkamą stilių',
    ],
  },
  {
    versija: '1.49.0', data: '2026-09-18', pavadinimas: 'Pranešimas apie klaidą iš bet kurio puslapio',
    pakeitimai: [
      'Apatiniame dešiniajame kampe atsirado mygtukas „Klaida" – veikia ir kompiuteryje, ir telefone, visuose penkiuose puslapiuose',
      'Užtenka parašyti vieną sakinį: techninę informaciją sistema prideda pati – versiją, ekrano plotį, naršyklę ir paskutines klaidas, kurios įvyko prieš tai',
      'Galima prisegti ekrano nuotrauką arba įklijuoti ją iš atminties',
      'Prieš siunčiant matote, kas tiksliai bus išsiųsta – nieko neslėpiama',
      'Prisijungti nebūtina: pranešti galima ir tada, kai neveikia pats prisijungimas',
    ],
  },
  {
    versija: '1.48.0', data: '2026-09-18', pavadinimas: 'Skelbimo puslapyje – galerija ir įverčio skydelis',
    pakeitimai: [
      'Skelbimo puslapis gavo tikrą galeriją: visos nuotraukos juostoje, aktyvi pažymėta, o ten, kur AI ką nors mato, uždegtas spalvotas taškas',
      'Šalia galerijos – įverčio skydelis: balas, verdiktas, rizika, penkios dedamosios ir „ką būtina patikrinti"',
      'ISTAISYTA: tas pats automobilis kortelėje rodė vieną įvertį, o skelbimo puslapyje – kitą. Dabar abu rodo tą patį skaičių',
      'Santrauka nebenutrūksta ties „2022 m." – taškas po trumpinio nebelaikomas sakinio pabaiga',
      'Neturint pilnos apžvalgos matosi, kiek patikrinimo punktų dar atsivers – vietoj tuščios vietos',
    ],
  },
  {
    versija: '1.47.0', data: '2026-09-18', pavadinimas: 'Matuojame, ar atsarginis nuskaitymo kelias apskritai veikia',
    pakeitimai: [
      'Sistema dabar pati fiksuoja, kuris nuskaitymo būdas davė rezultatą ir kiek kartų teko griebtis paskutinio atsarginio',
      'Tai reikalinga vienam sprendimui: ar verta laikyti sunkią naršyklę serveryje, ar ji tik verčia vieną klaidą kita',
      'Naudotojui nieko nesikeičia – tai tik matavimas, jokio elgsenos pakeitimo',
    ],
  },
  {
    versija: '1.46.0', data: '2026-09-18', pavadinimas: 'Serveris nebestringa per paiešką, duomenys nebeauga be ribos',
    pakeitimai: [
      'Paieškos metu serveris nebenustoja atsakinėti – skelbimų istorija dabar įrašoma vieną kartą po visko, o ne 80 kartų iš eilės',
      'Seni, seniai dingę skelbimai automatiškai išvalomi po 180 dienų – anksčiau duomenys kaupėsi be jokios ribos ir būtų anksčiau ar vėliau nuvertę serverį',
      'Kreditų nurašymas apvilktas duomenų bazės transakcija – dvigubas nurašymas nebeįmanomas net ir pakeitus kodą ateityje',
      'Registracija nebeturi viešo atsarginio kvietimo kodo',
      'Telefone skelbimo puslapyje apžvalgos mygtukai nebeišlipa už ekrano; antraštė nebeišsiplečia ataskaitų ir mėgstamiausių puslapiuose',
      'Įrašytas priklausomybių sąrašas (package-lock.json) – nuo šiol diegimas atkartojamas ir saugumo spragas galima patikrinti',
    ],
  },
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
