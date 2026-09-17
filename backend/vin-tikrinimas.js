// vin-tikrinimas.js — NEMOKAMAS pirminis VIN patikrinimas (v1.23.0).
//
// Kodel atskirai: mokamas /api/vin-lookup daro AI web paieska po JAV aukcionu
// svetaines (Copart, IAAI ir pan.) ir kainuoja 1 kredita. Bet PRIES ta verta
// nemokamai atsakyti i klausimus, i kuriuos atsakymas yra pacio VIN kodo viduje:
//   - ar kodas is viso teisingas (formatas + kontrolinis skaitmuo),
//   - kas gamintojas ir kurioje salyje surinktas,
//   - kurie modelio metai uzkoduoti 10-oje pozicijoje,
//   - ar tai sutampa su tuo, kas parasyta skelbime (dazniausia apgaule),
//   - ka apie si VIN zino NHTSA (nemokama JAV valstybine baze),
//   - ar mes patys jau matem si VIN kitame skelbime (musu duomenys).

const axios = require('axios');

// Pirmas simbolis -> surinkimo regionas/salis
const SALYS = {
  A: 'Pietų Afrika', B: 'Angola', C: 'Benin', D: 'Egiptas', E: 'Etiopija', F: 'Gana',
  G: 'Gana', H: 'Tunisas', J: 'Japonija', K: 'Pietų Korėja', L: 'Kinija', M: 'Indija/Tailandas',
  N: 'Turkija', P: 'Filipinai/Singapūras', R: 'Taivanas/Vietnamas',
  S: 'Jungtinė Karalystė', T: 'Šveicarija/Čekija/Vengrija', U: 'Rumunija/Slovakija',
  V: 'Prancūzija/Ispanija/Austrija', W: 'Vokietija', X: 'Rusija/Latvija', Y: 'Švedija/Suomija/Belgija',
  Z: 'Italija', 1: 'JAV', 2: 'Kanada', 3: 'Meksika', 4: 'JAV', 5: 'JAV', 6: 'Australija',
  7: 'Naujoji Zelandija', 8: 'Argentina/Čilė', 9: 'Brazilija',
};

// WMI (pirmi 3 simboliai) -> gamintojas. Sarasas orientuotas i tai, kas realiai
// prekiaujama Lietuvoje; nezinomas WMI nera klaida - tiesiog nedekoduojam.
const WMI = {
  WBA: 'BMW', WBS: 'BMW M', WBX: 'BMW (X modeliai)', WBY: 'BMW i', '4US': 'BMW (JAV)', '5UX': 'BMW (JAV)', '5YM': 'BMW M (JAV)',
  WVW: 'Volkswagen', WV1: 'Volkswagen (komercinis)', WV2: 'Volkswagen (mikroautobusas)', WVG: 'Volkswagen (SUV)', '1VW': 'Volkswagen (JAV)', '3VW': 'Volkswagen (Meksika)',
  WAU: 'Audi', WA1: 'Audi (SUV)', WUA: 'Audi Sport', TRU: 'Audi (Vengrija)',
  WDB: 'Mercedes-Benz', WDC: 'Mercedes-Benz (SUV)', WDD: 'Mercedes-Benz', W1K: 'Mercedes-Benz', W1N: 'Mercedes-Benz (SUV)', W1V: 'Mercedes-Benz (komercinis)', WMX: 'Mercedes-AMG', '4JG': 'Mercedes-Benz (JAV)',
  WP0: 'Porsche', WP1: 'Porsche (SUV)',
  WF0: 'Ford (Europa)', WF1: 'Ford (Europa)', '1FA': 'Ford (JAV)', '1FM': 'Ford (JAV, SUV)', '1FT': 'Ford (JAV, pikapas)', '3FA': 'Ford (Meksika)',
  VF1: 'Renault', VF3: 'Peugeot', VF7: 'Citroën', VR1: 'DS', VR7: 'Citroën', VR3: 'Peugeot',
  VSS: 'SEAT', TMB: 'Škoda', TMP: 'Škoda',
  YV1: 'Volvo', YV4: 'Volvo (SUV)', LYV: 'Volvo (Kinija)', YS3: 'Saab',
  ZFA: 'Fiat', ZAR: 'Alfa Romeo', ZFF: 'Ferrari', ZAM: 'Maserati', ZHW: 'Lamborghini',
  SAL: 'Land Rover', SAJ: 'Jaguar', SAD: 'Jaguar', SCC: 'Lotus', SCB: 'Bentley',
  JTD: 'Toyota', JTM: 'Toyota (SUV)', JTH: 'Lexus', JTJ: 'Lexus', SB1: 'Toyota (Europa)', VNK: 'Toyota (Turkija)',
  JHM: 'Honda', SHH: 'Honda (Europa)', JHL: 'Honda (SUV)',
  JN1: 'Nissan', JN8: 'Nissan (SUV)', SJN: 'Nissan (Europa)', VSK: 'Nissan (Ispanija)',
  KMH: 'Hyundai', KM8: 'Hyundai (SUV)', TMA: 'Hyundai (Čekija)', KNA: 'Kia', KND: 'Kia (SUV)', U5Y: 'Kia (Slovakija)',
  JMZ: 'Mazda', JM1: 'Mazda', JM3: 'Mazda (SUV)',
  JF1: 'Subaru', JF2: 'Subaru (SUV)',
  '5YJ': 'Tesla', '7SA': 'Tesla', LRW: 'Tesla (Kinija)', XP7: 'Tesla (Vokietija)',
  '1G1': 'Chevrolet', '1GC': 'Chevrolet (pikapas)', '2G1': 'Chevrolet (Kanada)', '1GY': 'Cadillac', '1GK': 'GMC',
  '1C4': 'Jeep/Chrysler', '1C6': 'RAM', '3C4': 'Chrysler (Meksika)', ZAC: 'Jeep (Italija)',
  VSE: 'Opel/Vauxhall', W0L: 'Opel', W0V: 'Opel', VXK: 'Opel (Ispanija)',
  XTA: 'Lada', X7L: 'Renault (Rusija)', X9F: 'Ford (Rusija)',
  LSV: 'Volkswagen (Kinija)', LGB: 'Dongfeng', LVS: 'Ford (Kinija)', L6T: 'Geely',
};

// 10-oji pozicija -> modelio metai. Ciklas kartojasi kas 30 metu, todel imam
// naujesni varianta (2010+), o senesni pridedam kaip alternatyva.
const METU_KODAI = 'ABCDEFGHJKLMNPRSTVWXY123456789';
function metaiIsKodo(c) {
  const idx = METU_KODAI.indexOf(c);
  if (idx < 0) return null;
  // A=1980..Y=2000 (raidės), 1..9 = 2001..2009, tada A=2010..Y=2030
  const senas = idx < 21 ? 1980 + idx : 1980 + idx; // 1980..2009
  const naujas = senas + 30;                        // 2010..2039
  const dabar = new Date().getFullYear();
  return { tiketini: naujas <= dabar + 1 ? [naujas, senas] : [senas], naujas: naujas <= dabar + 1 ? naujas : senas };
}

const RAIDZIU_VERTES = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const SVORIAI = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Kontrolinis skaitmuo (9-a pozicija). Privalomas Siaures Amerikoje pagamintiems
// automobiliams; europieciai ji daznai turi "atsitiktini", todel klaida cia nera
// irodymas, kad VIN netikras - tik signalas patikrinti simbolius dar karta.
function kontrolinis(vin) {
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const v = /[0-9]/.test(c) ? parseInt(c, 10) : RAIDZIU_VERTES[c];
    if (v == null) return { tinka: false, priezastis: 'neleistinas simbolis' };
    suma += v * SVORIAI[i];
  }
  const liekana = suma % 11;
  const laukiamas = liekana === 10 ? 'X' : String(liekana);
  return { tinka: vin[8] === laukiamas, laukiamas, rastas: vin[8] };
}

function formatas(vin) {
  const v = String(vin || '').toUpperCase().replace(/[\s-]/g, '');
  if (v.length !== 17) return { ok: false, vin: v, klaida: `VIN turi būti 17 simbolių (dabar ${v.length})` };
  if (/[IOQ]/.test(v)) return { ok: false, vin: v, klaida: 'VIN kode nebūna raidžių I, O ir Q – patikrinkite, ar tai ne skaičiai 1 ir 0' };
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return { ok: false, vin: v, klaida: 'VIN gali būti tik raidės ir skaičiai' };
  return { ok: true, vin: v };
}

// Vietinis dekodavimas – momentinis ir nemokamas.
function dekoduoti(vinRaw) {
  const f = formatas(vinRaw);
  if (!f.ok) return { ok: false, klaida: f.klaida, vin: f.vin };
  const vin = f.vin;
  const wmi = vin.slice(0, 3);
  const metai = metaiIsKodo(vin[9]);
  const kd = kontrolinis(vin);
  return {
    ok: true,
    vin,
    wmi,
    gamintojas: WMI[wmi] || null,
    salis: SALYS[vin[0]] || null,
    metai: metai ? metai.naujas : null,
    metuVariantai: metai ? metai.tiketini : [],
    gamyklosKodas: vin[10],
    serija: vin.slice(11),
    kontrolinis: kd,
    // Siaures Amerikos VIN kontrolinis skaitmuo privalomas
    kontrolinisPrivalomas: ['1', '2', '3', '4', '5'].includes(vin[0]),
  };
}

// NHTSA vPIC – nemokama JAV valstybine baze, veikia ir europietiskiems VIN
// (dazniausiai atpazista marke, modeli, kebula, varikli, gamykla).
async function nhtsa(vin) {
  try {
    const { data } = await axios.get(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { timeout: 8000 }
    );
    const r = (data && data.Results && data.Results[0]) || null;
    if (!r) return null;
    const imk = (v) => (v && String(v).trim() && !/^not applicable$/i.test(v) ? String(v).trim() : null);
    const out = {
      marke: imk(r.Make), modelis: imk(r.Model), metai: imk(r.ModelYear),
      kebulas: imk(r.BodyClass), variklioTuris: imk(r.DisplacementL),
      cilindrai: imk(r.EngineCylinders), galiaAG: imk(r.EngineHP), kuras: imk(r.FuelTypePrimary),
      pavara: imk(r.DriveType), gamykla: [imk(r.PlantCity), imk(r.PlantCountry)].filter(Boolean).join(', ') || null,
      serija: imk(r.Series), apdaila: imk(r.Trim),
      klaida: imk(r.ErrorText),
    };
    return Object.values(out).some((v) => v && v !== out.klaida) ? out : null;
  } catch (e) {
    return null; // nemokamas saltinis - jei neatsako, tiesiog praleidziam
  }
}

// Sulyginam VIN duomenis su tuo, kas parasyta skelbime. Cia ir slypi didziausia
// nauda: neatitikimas tarp VIN uzkoduotu metu ir skelbimo metu yra rimtas signalas.
function palyginti(dek, nh, skelbimas) {
  const pastabos = [];
  const s = skelbimas || {};
  const vinMetai = (nh && nh.metai && parseInt(nh.metai, 10)) || dek.metai;
  if (s.metai && vinMetai && Math.abs(vinMetai - s.metai) >= 1) {
    pastabos.push({
      svarba: Math.abs(vinMetai - s.metai) >= 2 ? 'auksta' : 'vidutine',
      tekstas: `VIN kode užkoduoti ${vinMetai} m., o skelbime nurodyta ${s.metai} m. Paklauskite pardavėjo, kuo paaiškinamas skirtumas (dažnai tai pirmos registracijos ir pagaminimo metų skirtumas, bet gali būti ir kito automobilio VIN).`,
    });
  }
  const vinMarke = (nh && nh.marke) || dek.gamintojas;
  if (s.modelis && vinMarke) {
    const pirmasZodis = String(s.modelis).split(/\s+/)[0].toLowerCase();
    if (pirmasZodis.length > 2 && !String(vinMarke).toLowerCase().includes(pirmasZodis) && !pirmasZodis.includes(String(vinMarke).toLowerCase().split(/[\s(]/)[0])) {
      pastabos.push({ svarba: 'auksta', tekstas: `VIN priklauso gamintojui „${vinMarke}“, o skelbime – „${s.modelis}“. Tai gali būti ne to automobilio VIN kodas.` });
    }
  }
  if (dek.kontrolinisPrivalomas && dek.kontrolinis && !dek.kontrolinis.tinka) {
    pastabos.push({ svarba: 'auksta', tekstas: `Kontrolinis skaitmuo netinka (turėtų būti „${dek.kontrolinis.laukiamas}“, o yra „${dek.kontrolinis.rastas}“). Šis automobilis surinktas Šiaurės Amerikoje, ten kontrolinis skaitmuo privalomas – greičiausiai kodas nurašytas su klaida.` });
  } else if (dek.kontrolinis && !dek.kontrolinis.tinka) {
    pastabos.push({ svarba: 'zema', tekstas: 'Kontrolinis skaitmuo nesutampa, bet Europoje pagamintiems automobiliams tai įprasta – savaime tai nėra klaidos požymis.' });
  }
  if (/JAV|Meksika|Kanada/.test(dek.salis || '')) {
    pastabos.push({ svarba: 'vidutine', tekstas: `VIN rodo, kad automobilis surinktas: ${dek.salis}. Verta patikrinti aukcionų istoriją (Copart/IAAI) ir ar buvo deklaruota žala.` });
  }
  return pastabos;
}

async function pilnasPatikrinimas(vinRaw, skelbimas) {
  const dek = dekoduoti(vinRaw);
  if (!dek.ok) return { ok: false, klaida: dek.klaida, vin: dek.vin };
  const nh = await nhtsa(dek.vin);
  return {
    ok: true,
    vin: dek.vin,
    dekodavimas: {
      gamintojas: dek.gamintojas, salis: dek.salis, metai: dek.metai,
      metuVariantai: dek.metuVariantai, wmi: dek.wmi, gamyklosKodas: dek.gamyklosKodas,
      kontrolinisTinka: dek.kontrolinis ? dek.kontrolinis.tinka : null,
    },
    nhtsa: nh,
    pastabos: palyginti(dek, nh, skelbimas),
  };
}

module.exports = { formatas, dekoduoti, kontrolinis, nhtsa, pilnasPatikrinimas };
