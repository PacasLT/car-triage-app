// backend/klaidu-atsakai.js — kurios klaidos NĖRA serverio klaidos.
//
// v2.28.1 (Luko klaida Nr.52: „Ismete klaida iklijavus savo skelbima").
//
// Įklijavus mobile.de nuorodą vartotojas gaudavo HTTP 500 ir techninį tekstą
// „mobile.de skelbimo puslapis neprieinamas (apsauga)". Žurnale tai buvo
// `severity: error`, nors iš tiesų tai ŽINOMA, laikina portalo būsena: mobile.de
// anti-botų apsauga neleidžia perskaityti skelbimo puslapio, ir kodas tai
// specialiai aptinka (`MOBILEDE_NEPRIEINAMA`). 500 reiškia „mes sulūžom“, o čia
// nesulūžo niekas – tiesiog to vieno portalo giliai perskaityti negalim.
//
// Taisyklė: jei kodas žinomas, atsakymas turi pasakyti ŽMOGIŠKAI, kas atsitiko,
// ar tai laikina, ir ką galima padaryti vietoj to. Nežinomas kodas – 500, nes
// tada tikrai nežinom, kas nutiko, ir to nereikia gražinti.

const ZINOMI = {
  SKELBIMAS_NERASTAS: {
    status: 410,
    laikina: false,
    error: 'Šio skelbimo perskaityti nepavyko – greičiausiai automobilis parduotas, skelbimas ištrintas arba portalas jo neatiduoda. Kreditų nenurašėme. Kiti to paties portalo skelbimai veikia.',
  },
  MOBILEDE_NEPRIEINAMA: {
    status: 503,
    laikina: true,
    portalas: 'mobile.de',
    error: 'mobile.de šiuo metu neleidžia perskaityti skelbimo puslapio (portalo apsauga). '
      + 'Kreditų nenurašėme. Tą patį automobilį galime išanalizuoti iš autoplius, autogidas, '
      + 'autoscout24 ar otomoto nuorodos, o paprastoje paieškoje mobile.de sąrašus skaitom normaliai.',
  },
  // v2.28.2: atskira busena nuo MOBILEDE_NEPRIEINAMA. Ja grazinam, kai esam
  // PATYS sustoje po ankstesnio nesekmingo bandymo - tada sakyti „portalas
  // blokuoja" butu melas: pamatuota, kad portalas gali veikti puikiai, o
  // stabdis uzdetas del vieno negyvo skelbimo.
  MOBILEDE_PAUZE: {
    status: 503,
    laikina: true,
    portalas: 'mobile.de',
    error: 'mobile.de skelbimų puslapių laikinai neskaitom – po ankstesnio nepavykusio bandymo padarėme pauzę, '
      + 'kad nedegintume kreditų. Kreditų nenurašėme. Paieškoje mobile.de sąrašai skaitomi normaliai, '
      + 'o šį automobilį galime išanalizuoti iš autoplius, autogidas, autoscout24 ar otomoto nuorodos.',
  },
  MOBILEDE_ISJUNGTA: {
    status: 503,
    laikina: true,
    portalas: 'mobile.de',
    error: 'mobile.de gili analizė šiuo metu išjungta. Kreditų nenurašėme. '
      + 'Tą patį automobilį galime išanalizuoti iš kito portalo nuorodos.',
  },
  PORTALAS_NELEIDZIAMAS: {
    status: 400,
    laikina: false,
    error: 'Nuoroda ne iš palaikomo portalo. Palaikom autoplius, autogidas, autoscout24, otomoto ir mobile.de.',
  },
};

// Grąžina { status, kunas } – `kunas` eina tiesiai į res.json().
function atsakas(err) {
  const kodas = err && err.kodas;
  const z = kodas ? ZINOMI[kodas] : null;
  if (!z) {
    return {
      status: 500,
      kunas: { error: String((err && err.message) || 'Nežinoma klaida').slice(0, 200), kodas: kodas || null },
    };
  }
  const kunas = { error: z.error, kodas };
  if (z.laikina) kunas.laikina = true;
  if (z.portalas) kunas.portalas = z.portalas;
  return { status: z.status, kunas };
}

module.exports = { atsakas, ZINOMI };
