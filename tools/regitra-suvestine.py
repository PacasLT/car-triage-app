#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
regitra-suvestine.py - is Regitros atviru parko duomenu pasidaro CarTriige suvestine.

Paleidimas (is repo saknies):
    python3 tools/regitra-suvestine.py ~/Downloads/Atviri_TP_parko_duomenys.zip

Rezultatas: backend/duomenys/regitra-modeliai.json - viena eilute vienam baziniam
modeliui (>=30 vnt. Lietuvoje). Zalias failas yra ~945 MB CSV; jis NIEKADA nepatenka
nei i repo, nei i /data - i produkcija keliauja tik suvestine (~350 KB).

BDAR: saugom TIK suvestines. Eilutes lygio duomenys (valdytojo gimimo metu
intervalas + savivaldybe + retas modelis) identifikuoja zmogu - ju nesaugom niekur.

Atnaujinimas: Regitra skelbia kas ketvirti. Paleidus is naujo su nauju zip -
failas perrasomas. Seno archyvuoti nebutina: `PIRM_REG_DATA_LT` neša visa importo
istorija viename faile.
"""

import zipfile, csv, io, collections, datetime, re, statistics, json, sys, os

MIN_PARKAS = 30          # mazesni modeliai i suvestine nepatenka (ir statistiskai betiksliai)
MIN_MEDIANAI = 20        # tiek ridos irasu reikia, kad medianai apskritai butu prasme

MARKES = {'VOLKSWAGEN. VW': 'VW', 'VOLKSWAGEN': 'VW', 'MERCEDES-BENZ': 'MERCEDES',
          'MERCEDES BENZ': 'MERCEDES', 'LAND-ROVER': 'LAND ROVER'}


def marke_norm(mk):
    mk = (mk or '').strip().upper()
    return MARKES.get(mk, mk.replace('.', ' ').strip())


def modelis_dalys(mk, md):
    """('BMW', 'X5 XDRIVE30D') -> ('X5', 'X5 XDRIVE30D').

    Registre markes vardas daznai pakartotas ir modelio lauke
    ('TOYOTA' + 'TOYOTA RAV4'), o komerciniame pavadinime slypi variantas.
    Be sito BMW X5 skyla i 140 atskiru „modeliu"."""
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


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    zip_kelias = os.path.expanduser(sys.argv[1])
    siandien = datetime.date.today()
    pries_12m = siandien - datetime.timedelta(days=365)

    def naujas():
        return {'parkas': 0, 'imp12': 0, 'apyv12': 0, 'neleid': 0, 'rida_yra': 0,
                'ridos': [], 'kmmet': [], 'kilme': collections.Counter(), 'variantai': set()}

    BAZ = collections.defaultdict(naujas)
    zf = zipfile.ZipFile(zip_kelias)
    vardas = zf.namelist()[0]
    fh = io.TextIOWrapper(zf.open(vardas), encoding='utf-8-sig', errors='replace')
    r = csv.reader(fh)
    hdr = next(r)
    butini = ['MARKE', 'KOMERCINIS_PAV', 'KATEGORIJA_KLASE', 'RIDA', 'PIRM_REG_DATA',
              'PIRM_REG_DATA_LT', 'PASKUTINES_REG_DATA', 'DAE_STATUSAS', 'KILMES_SALIS']
    truksta = [k for k in butini if k not in hdr]
    if truksta:
        print('KLAIDA: faile nera stulpeliu: %s' % ', '.join(truksta))
        print('Regitra pakeite formata - patikrinkite metaduomenis.')
        sys.exit(1)
    I = {k: hdr.index(k) for k in butini}

    n = n_m1 = nuasm = 0
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
        if d_lt and d_lt >= pries_12m:
            s['imp12'] += 1
            salis = row[I['KILMES_SALIS']].strip()
            if salis:
                s['kilme'][salis] += 1
        if d_pask and d_pask >= pries_12m:
            s['apyv12'] += 1
        if row[I['DAE_STATUSAS']] == 'N':
            s['neleid'] += 1
        rd = row[I['RIDA']].strip()
        if rd.isdigit():
            v = int(rd)
            if 1000 < v < 1500000:
                s['rida_yra'] += 1
                s['ridos'].append(v)
                if d_p and d_pask:
                    amz = (d_pask - d_p).days / 365.25
                    if 0.5 < amz < 30:
                        s['kmmet'].append(v / amz)

    eil = []
    for k, s in BAZ.items():
        if s['parkas'] < MIN_PARKAS:
            continue
        eil.append({
            'modelis': k,
            'parkas': s['parkas'],
            'variantu': len(s['variantai']),
            'imp12': s['imp12'],
            'apyv12': s['apyv12'],
            'apyv_pct': round(100.0 * s['apyv12'] / s['parkas'], 1),
            'neleid_pct': round(100.0 * s['neleid'] / s['parkas'], 1),
            'rida_n': s['rida_yra'],
            'rida_med': int(statistics.median(s['ridos'])) if len(s['ridos']) >= MIN_MEDIANAI else None,
            'kmmet_med': int(statistics.median(s['kmmet'])) if len(s['kmmet']) >= MIN_MEDIANAI else None,
            'kilme': s['kilme'].most_common(3),
        })
    eil.sort(key=lambda x: -x['parkas'])

    saknis = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    kat = os.path.join(saknis, 'backend', 'duomenys')
    os.makedirs(kat, exist_ok=True)
    isvestis = os.path.join(kat, 'regitra-modeliai.json')
    with open(isvestis, 'w', encoding='utf-8') as f:
        json.dump({
            'saltinis': 'Regitra, atviri iregistruotu TP parko duomenys',
            'failas': os.path.basename(zip_kelias),
            'sugeneruota': siandien.isoformat(),
            'eiluciu_zaliam': n,
            'lengvuju_m1': n_m1,
            'nuasmeninta_m1': nuasm,
            'modeliu': len(eil),
            'modeliai': eil,
        }, f, ensure_ascii=False, separators=(',', ':'))

    print('Eiluciu perskaityta : %d (is ju M1: %d)' % (n, n_m1))
    # Procentas VISADA nuo M1, ne nuo visu eiluciu - kitaip skaitiklis ir vardiklis
    # is skirtingu aibiu, ir skaicius atrodo maziau nei yra.
    print('Nuasmeninta M1      : %d (%.2f%% nuo M1)' % (nuasm, 100.0 * nuasm / n_m1))
    print('Baziniu modeliu     : %d (>=%d vnt.)' % (len(eil), MIN_PARKAS))
    print('Irasyta             : %s (%d KB)' % (isvestis, os.path.getsize(isvestis) // 1024))
    print('\nTop 10:')
    for e in eil[:10]:
        print('  %-20s parkas %6d | apyv %5.1f%% | neleid %5.1f%% | %s km/met'
              % (e['modelis'][:20], e['parkas'], e['apyv_pct'], e['neleid_pct'],
                 e['kmmet_med'] or '-'))


if __name__ == '__main__':
    main()
