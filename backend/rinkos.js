// backend/rinkos.js — rinka (šalis), iš kurios skelbimas, ir apytikslė kaina Lietuvoje.
//
// KODĖL (PERPARDAVEJO-APLINKA.md §1, §2 A punktas): iki šiol mediana buvo
// skaičiuojama iš VISŲ portalų kartu. „−18 % žemiau rinkos" vokiškam skelbimui
// reiškė tik tai, kad Vokietijoje pigiau nei Lietuvoje — ne kad radai gerą
// pasiūlymą. Ir atvirkščiai: geras LT skelbimas skendo, nes mediana patempta
// žemyn užsienio kainų. Nuo v2.17.0 kiekvienas skelbimas pirmiausia lyginamas
// su SAVO rinkos mediana.
//
// KODĖL autoscout24 nėra „DE": mūsų adresas prašo cy=D,A,B,E,F,I,L,NL —
// Vokietija, Austrija, Belgija, Ispanija, Prancūzija, Italija, Liuksemburgas,
// Nyderlandai. Tai mišri Vakarų Europos imtis, todėl ji turi savo rinką (EU),
// o ne dedama kartu su mobile.de.

const PORTALO_RINKA = {
  autoplius: 'LT',
  autogidas: 'LT',
  mobilede: 'DE',
  autoscout24: 'EU',
  otomoto: 'PL',
};

const RINKU_VARDAI = {
  LT: 'Lietuva',
  DE: 'Vokietija',
  EU: 'Vakarų Europa',
  PL: 'Lenkija',
};

// ---------------------------------------------------------------------------
// APYTIKSLIAI PARSIVEŽIMO KAŠTAI
//
// ŠIE SKAIČIAI YRA PRADINIAI ORIENTYRAI, NE SĄMATA. Lukas juos patikslins
// (KL-1016-KASTAI). Iki tol rodom su žyma „apytiksliai" ir niekur neteigiam,
// kad tai tiksli kaina.
//
// Į sumą NEĮSKAIČIUOTA ir sąmoningai neskaičiuojama, kol nėra duomenų:
//   • taršos (registracijos) mokestis — priklauso nuo CO₂, bus atskirai;
//   • PVM — priklauso nuo to, ar pirkimas per įmonę ir ar sąskaita su PVM;
//   • remontas — priklauso nuo konkretaus auto būklės.
// ---------------------------------------------------------------------------
const KASTAI = {
  LT: { transportas: 0,   registracija: 0,   paruosimas: 150 },
  DE: { transportas: 650, registracija: 150, paruosimas: 250 },
  EU: { transportas: 900, registracija: 150, paruosimas: 250 },
  PL: { transportas: 400, registracija: 150, paruosimas: 250 },
};

const NEISKAICIUOTA = ['taršos mokestis', 'PVM', 'remontas'];

function rinkaPagalPortala(portalas) {
  return PORTALO_RINKA[portalas] || null;
}

function rinkosVardas(rinka) {
  return RINKU_VARDAI[rinka] || rinka || null;
}

// kastai('DE') -> { transportas: 650, registracija: 150, paruosimas: 250, viso: 1050 }
function kastai(rinka) {
  const k = KASTAI[rinka];
  if (!k) return null;
  return { ...k, viso: k.transportas + k.registracija + k.paruosimas };
}

// Apytikslė kaina Lietuvoje: skelbimo kaina + parsivežimo kaštai.
// Grąžina null, jei kainos ar rinkos nežinom — geriau nerodyti nieko,
// nei rodyti išgalvotą skaičių.
function kainaLietuvoje(kaina, rinka) {
  const k = kastai(rinka);
  if (!Number.isFinite(kaina) || kaina <= 0 || !k) return null;
  return {
    kaina,
    rinka,
    rinkosVardas: rinkosVardas(rinka),
    kastai: k,
    viso: kaina + k.viso,
    apytiksle: true,
    neiskaiciuota: NEISKAICIUOTA,
  };
}

module.exports = {
  PORTALO_RINKA, RINKU_VARDAI, KASTAI, NEISKAICIUOTA,
  rinkaPagalPortala, rinkosVardas, kastai, kainaLietuvoje,
};
