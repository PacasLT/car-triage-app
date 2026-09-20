#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
regitra-suvestine.py v2 - is Regitros atviru parko duomenu pasidaro CarTriige suvestine.

Paleidimas (is repo saknies):
    python3 tools/regitra-suvestine.py ~/Downloads/Atviri_TP_parko_duomenys.zip

Rezultatas: backend/duomenys/regitra-modeliai.json - viena eilute vienam baziniam
modeliui (>=30 vnt. Lietuvoje). Zalias failas yra ~945 MB CSV; jis NIEKADA nepatenka
nei i repo, nei i /data - i produkcija keliauja tik suvestine.

v2 (2026-09-21) prideta:
  - ridos kvartiliai P10/P25/P50/P75/P90 (vietoj vien medianos)
  - importas pagal menesi (36 men.) - TIK tikri importai, zr. TIKRAS_IMPORTAS
  - kuras / pavaru deze / kebulas pagal modeli
  - amziaus pjuvis: neleidziami TARP 15+ metu (neleid_pct vienas yra AMZIAUS matas)

BDAR: saugom TIK suvestines. Eilutes lygio duomenys (valdytojo gimimo metu
intervalas + savivaldybe + retas modelis) identifikuoja zmogu - ju nesaugom niekur.

TIKRAS_IMPORTAS: rida `PIRM_REG_DATA_LT > PIRM_REG_DATA` reiskia, kad automobilis
pirma karta registruotas uzsienyje, t. y. tikrai iveztas. Kai abi datos sutampa
(17,2 % M1), tai Lietuvoje pirma karta registruota masina - i importo statistika
jos DETI NEGALIMA.

IŠMATUOTA 2026-09-21 (visas failas, 2 468 363 eil.):
  - PIRM_REG_DATA_LT NEPERRASOMAS: 59,7 % irasu PASKUTINES_REG_DATA yra VELIAU uz ji,
    datos siekia 1974 m. Vadinasi importo statistika ir sezoniskumas patikimi.
  - PASKUTINES_REG_DATA EROZIJA: laikomas tik PASKUTINIS ivykis, tad senesni menesiai
    uztrinami. Pries 12 men. lieka ~70 %, pries 24 - ~55 %, pries 36 - ~43 %.
    TODEL is sio lauko sezoniskumo NEIMAM - tik 12 men. indeksa modeliams lyginti.
"""

import zipfile, csv, io, collections, datetime, re, statistics, json, sys, os

MIN_PARKAS = 30          # mazesni modeliai i suvestine nepatenka
MIN_MEDIANAI = 20        # tiek ridos irasu reikia medianai
MIN_SENU = 30            # tiek 15+ metu automobiliu reikia amziaus pjuviui
MIN_MENESIAMS = 300      # menesine importo eilute tik stambesniems modeliams
SENAS_METAI = 15         # kiek metu = „senas"
MENESIU = 36

MARKES = {'VOLKSWAGEN. VW': 'VW', 'VOLKSWAGEN': 'VW', 'MERCEDES-BENZ': 'MERCEDES',
          'MERCEDES BENZ': 'MERCEDES', 'LAND-ROVER': 'LAND ROVER'}


def marke_norm(mk):
    mk = (mk or '').strip().upper()
    return MARKES.get(mk, mk.replace('.', ' ').strip())


def modelis_dalys(mk, md):
    """('BMW', 'X5 XDRIVE30D') -> ('X5', 'X5 XDRIVE30D').

    SVARBU: si funkcija turi ATITIKTI backend/regitra.js baziniModelis().
    Taisant viena - taisyti abi; backend/testai/regitra.test.js tai tikrina."""
    mkn = marke_norm(mk)
    md = (md or '').strip().upper().replace('.', ' ')
    dal = [x for x in re.split(r'[\s,/]+', md) if x]
    mk_zodziai = set(mkn.split())
    while dal and dal[0] in mk_zodziai:
        dal.pop(0)
    if not dal:
        return None, None
    return dal[0], ' '.join(dal)


def data(s):
    try:
        return datetime.date(int(s[0:4]), int(s[5:7]), int(s[8:10]))
    except Exception:
        return None


def kvantilis(surusiuotas, p):
    """p nuo 0 iki 100. Sarasas turi buti surusiuotas."""
    if not surusiuotas:
        return None
    i = min(len(surusiuotas) - 1, int(len(surusiuotas) * p / 100.0))
    return int(surusiuotas[i])


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    zip_kelias = os.path.expanduser(sys.argv[1])
    siandien = datetime.date.today()
    senas_riba = siandien.year - SENAS_METAI

    # 12 men. langas skaiciuojamas NE nuo siandien, o nuo duomenu pabaigos.
    # Failas yra ketvirtinis momentinis vaizdas (pvz. 2026-06-30), tad
    # „paskutiniai 12 men." nuo siandien duotu ~9 men. duomenu ir visus
    # rodiklius sistemingai sumazintu. Pabaiga randam is pačiu duomenu.
    def men_nr(d):
        return d.year * 12 + (d.month - 1)

    def naujas():
        return {'parkas': 0, 'neleid': 0,
                'ridos': [], 'kmmet': [], 'kilme': collections.Counter(),
                'variantai': set(), 'seni': 0, 'seni_neleid': 0,
                'degalai': collections.Counter(), 'deze': collections.Counter(),
                'kebulas': collections.Counter(),
                'imp_men': collections.Counter(), 'apyv_men': collections.Counter(),
                'kilme_men': collections.Counter()}

    BAZ = collections.defaultdict(naujas)
    zf = zipfile.ZipFile(zip_kelias)
    fh = io.TextIOWrapper(zf.open(zf.namelist()[0]), encoding='utf-8-sig', errors='replace')
    r = csv.reader(fh)
    hdr = next(r)
    # KEB_PAVADINIMAS, ne KEB_KODAS: kodas uzpildytas 100 %, bet jo reiksme
    # daugumoje eiluciu yra „---". Prasme nesa tik zodinis pavadinimas (45,5 %).
    butini = ['MARKE', 'KOMERCINIS_PAV', 'KATEGORIJA_KLASE', 'RIDA', 'PIRM_REG_DATA',
              'PIRM_REG_DATA_LT', 'PASKUTINES_REG_DATA', 'DAE_STATUSAS', 'KILMES_SALIS',
              'DEGALAI', 'PAVARU_DEZES_TIPAS', 'KEB_PAVADINIMAS']
    truksta = [k for k in butini if k not in hdr]
    if truksta:
        print('KLAIDA: faile nera stulpeliu: %s' % ', '.join(truksta))
        print('Regitra pakeite formata - patikrinkite metaduomenis.')
        sys.exit(1)
    I = {k: hdr.index(k) for k in butini}

    n = n_m1 = nuasm = 0
    pabaiga_men = 0                    # naujausias menuo, kuri duomenys apskritai turi
    for row in r:
        n += 1
        if len(row) < len(hdr) or row[I['KATEGORIJA_KLASE']] != 'M1':
            continue
        n_m1 += 1
        mk = row[I['MARKE']].strip().upper()
        if mk.startswith('NUASMENINT'):
            nuasm += 1
            continue
        baz, pilnas = modelis_dalys(mk, row[I['KOMERCINIS_PAV']])
        if not baz:
            continue
        s = BAZ[marke_norm(mk) + ' ' + baz]
        s['parkas'] += 1
        s['variantai'].add(pilnas)

        d_lt = data(row[I['PIRM_REG_DATA_LT']])
        d_p = data(row[I['PIRM_REG_DATA']])
        d_pask = data(row[I['PASKUTINES_REG_DATA']])

        # TIKRAS importas: pirma registracija buvo uzsienyje
        if d_lt and d_p and d_lt > d_p:
            mn = men_nr(d_lt)
            s['imp_men'][mn] += 1
            salis = row[I['KILMES_SALIS']].strip()
            if salis:
                s['kilme_men'][(mn, salis)] += 1
            if mn > pabaiga_men:
                pabaiga_men = mn
        if d_pask:
            mn = men_nr(d_pask)
            s['apyv_men'][mn] += 1
            if mn > pabaiga_men:
                pabaiga_men = mn
        nel = row[I['DAE_STATUSAS']] == 'N'
        if nel:
            s['neleid'] += 1
        if d_p and d_p.year <= senas_riba:
            s['seni'] += 1
            if nel:
                s['seni_neleid'] += 1

        for laukas, kur in (('DEGALAI', 'degalai'), ('PAVARU_DEZES_TIPAS', 'deze'),
                            ('KEB_PAVADINIMAS', 'kebulas')):
            v = row[I[laukas]].strip()
            if v and v not in ('---', '--', '-'):
                s[kur][v] += 1

        rd = row[I['RIDA']].strip()
        if rd.isdigit():
            v = int(rd)
            if 1000 < v < 1500000:
                s['ridos'].append(v)
                if d_p and d_pask:
                    amz = (d_pask - d_p).days / 365.25
                    if 0.5 < amz < 30:
                        s['kmmet'].append(v / amz)

    # Duomenu pabaiga rasta. Paskutinis menuo faile beveik visada DALINIS
    # (failas sugeneruotas menesio viduryje ar pabaigoje), tad i 12 men. langa
    # jo NEIMAM - kitaip kas ketvirti langas butu kitokio ilgio.
    pask_pilnas = pabaiga_men - 1
    langas = set(range(pask_pilnas - 11, pask_pilnas + 1))     # 12 pilnu menesiu
    asis = list(range(pask_pilnas - MENESIU + 1, pask_pilnas + 1))

    def men_tekstas(mn):
        return '%04d-%02d' % (mn // 12, mn % 12 + 1)

    def dalys(cnt, kiek=3):
        """[['Dyzelinas', 78], ...] - PROCENTAI nuo uzpildytu, plius n."""
        visas = sum(cnt.values())
        if not visas:
            return [], 0
        return [[k, round(100.0 * v / visas)] for k, v in cnt.most_common(kiek)], visas

    eil = []
    for k, s in BAZ.items():
        if s['parkas'] < MIN_PARKAS:
            continue
        ridos = sorted(s['ridos'])
        kmmet = sorted(s['kmmet'])
        pakanka_r = len(ridos) >= MIN_MEDIANAI
        pakanka_km = len(kmmet) >= MIN_MEDIANAI
        deg, deg_n = dalys(s['degalai'])
        dez, dez_n = dalys(s['deze'], 2)
        keb, keb_n = dalys(s['kebulas'], 2)
        imp12 = sum(v for mn, v in s['imp_men'].items() if mn in langas)
        apyv12 = sum(v for mn, v in s['apyv_men'].items() if mn in langas)
        kilme = collections.Counter()
        for (mn, salis), v in s['kilme_men'].items():
            if mn in langas:
                kilme[salis] += v
        e = {
            'modelis': k,
            'parkas': s['parkas'],
            'variantu': len(s['variantai']),
            'imp12': imp12,
            'apyv12': apyv12,
            'apyv_pct': round(100.0 * apyv12 / s['parkas'], 1),
            'neleid_pct': round(100.0 * s['neleid'] / s['parkas'], 1),
            # amziaus pjuvis: TIK sitas yra patvarumo matas
            'senu_n': s['seni'],
            'senu_dalis_pct': round(100.0 * s['seni'] / s['parkas'], 1),
            'neleid15_pct': (round(100.0 * s['seni_neleid'] / s['seni'], 1)
                             if s['seni'] >= MIN_SENU else None),
            'rida_n': len(ridos),
            'rida_med': kvantilis(ridos, 50) if pakanka_r else None,
            'rida_kv': ([kvantilis(ridos, p) for p in (10, 25, 50, 75, 90)]
                        if pakanka_r else None),
            'kmmet_n': len(kmmet),
            'kmmet_med': kvantilis(kmmet, 50) if pakanka_km else None,
            'kmmet_kv': ([kvantilis(kmmet, p) for p in (10, 25, 50, 75, 90)]
                         if pakanka_km else None),
            'kilme': kilme.most_common(3),
            'degalai': deg, 'degalai_n': deg_n,
            'deze': dez, 'deze_n': dez_n,
            'kebulas': keb, 'kebulas_n': keb_n,
        }
        if s['parkas'] >= MIN_MENESIAMS:
            e['imp_men'] = [s['imp_men'].get(mn, 0) for mn in asis]
        eil.append(e)
    eil.sort(key=lambda x: -x['parkas'])

    saknis = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kat = os.path.join(saknis, 'backend', 'duomenys')
    os.makedirs(kat, exist_ok=True)
    isvestis = os.path.join(kat, 'regitra-modeliai.json')
    with open(isvestis, 'w', encoding='utf-8') as f:
        json.dump({
            'versija': 2,
            'saltinis': 'Regitra, atviri iregistruotu TP parko duomenys',
            'failas': os.path.basename(zip_kelias),
            'sugeneruota': siandien.isoformat(),
            'eiluciu_zaliam': n,
            'lengvuju_m1': n_m1,
            'nuasmeninta_m1': nuasm,
            'modeliu': len(eil),
            'duomenu_pabaiga': men_tekstas(pabaiga_men),
            'langas_12men': [men_tekstas(min(langas)), men_tekstas(max(langas))],
            'menesiu_asis': [men_tekstas(mn) for mn in asis],
            'modeliai': eil,
        }, f, ensure_ascii=False, separators=(',', ':'))

    print('Duomenu pabaiga     : %s (dalinis menuo neskaiciuojamas)' % men_tekstas(pabaiga_men))
    print('12 men. langas      : %s .. %s' % (men_tekstas(min(langas)), men_tekstas(max(langas))))
    print('Eiluciu perskaityta : %d (is ju M1: %d)' % (n, n_m1))
    # Procentas VISADA nuo M1, ne nuo visu eiluciu - kitaip skaitiklis ir vardiklis
    # is skirtingu aibiu, ir skaicius atrodo maziau nei yra.
    print('Nuasmeninta M1      : %d (%.2f%% nuo M1)' % (nuasm, 100.0 * nuasm / n_m1))
    print('Baziniu modeliu     : %d (>=%d vnt.)' % (len(eil), MIN_PARKAS))
    print('Ridos irasu         : %d' % sum(e['rida_n'] for e in eil))
    print('Irasyta             : %s (%d KB)' % (isvestis, os.path.getsize(isvestis) // 1024))
    print('\nTop 10:')
    for e in eil[:10]:
        print('  %-18s parkas %6d | apyv %5.1f%% | neleid %5.1f%% -> 15+ %6s | km/met %s'
              % (e['modelis'][:18], e['parkas'], e['apyv_pct'], e['neleid_pct'],
                 ('%.1f%%' % e['neleid15_pct']) if e['neleid15_pct'] is not None else '-',
                 e['kmmet_med'] or '-'))


if __name__ == '__main__':
    main()
