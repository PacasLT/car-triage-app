#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ta-suvestine.py - techninės apžiūros (TA) duomenų suvestinė CarTriige.

Paleidimas (iš repo šaknies):
    python3 tools/ta-suvestine.py ~/Downloads
    python3 tools/ta-suvestine.py ~/Downloads/ta-bandymas-bmw-x5.csv --isvestis /tmp/ta.json   # bandymas

ETAPAI. Darbas eina per DuckDB failą diske (--db, numatyta ~/ta-darbas.duckdb -
NE repo ir NE Downloads). Kiekvienas etapas įrašo savo lentelę; paleidus iš naujo
atlikti etapai praleidžiami. Įprastai viskas vyksta vienu paleidimu (~5-15 min.).
--iki-laiko S: sustoti po S sekundžių ties etapo riba ir grąžinti kodą 3 („tęsti") -
Claude apvalkalui, kuriame vienas kvietimas ribotas 180 s ir fono procesai miršta.
--is-naujo: ištrinti darbo DB ir pradėti nuo nulio (pvz. atsiuntus naujus duomenis).

Argumentas - katalogas su *.csv arba vienas .csv failas.
Rezultatas - backend/duomenys/ta-modeliai.json. Reikia: pip install duckdb

═══════════════════════════════════════════════════════════════════════════
ŠALTINIS
  data.gov.lt 2721 „Transporto priemonių techninės apžiūros duomenys",
  TRANSEKSTA. Licencija CC BY 4.0 - sąsajoje PRIVALOMA nurodyti šaltinį.
  API: https://get.data.gov.lt/datasets/gov/transeksta/ctadb/Apziura
  Iš viso ~15,8 mln. apžiūrų; M1 + M1G ~12,2 mln. Atnaujinama kas savaitę.

═══════════════════════════════════════════════════════════════════════════
KAIP GAUTI DUOMENIS (darbo sistema v2: naršyklė TIK parsisiunčia į Downloads)

  Claude aplinkos apvalkalai get.data.gov.lt nepasiekia (tinklo politika, 403).
  Pasiekia naršyklės polangis. Parsisiunčiama dalimis po 100 000 eilučių:

    .../Apziura/:format/csv
      ?tp_klase.startswith("M1")
      &select(_id,tp_id,tp_marke,tp_modelis,tp_klase,tp_pag_metai,tp_kuras,
              tp_rida_km,ta_tipas,ar_ta_islaikyta,ta_savaites_data)
      &sort(_id)
      &_id>"<paskutinės dalies paskutinis _id>"      <- pirmai daliai šito nėra
      &limit(100000)

  Failai: ~/Downloads/ta-apziuros/ta-apziuros-0001.csv, -0002.csv ...
  Baigiama, kai dalis grąžina < 100 000 eilučių. ~123 dalys, ~1,6 GB, ~30 min.

  KODĖL TAIP (patikrinta gyvai 2026-09-22):
  - select() be jo 10 000 eil. = 7,4 MB (viskas ~9 GB); su juo 0,94 MB.
  - BET su select() Spinta NEGRĄŽINA `_page.next` - įprastas puslapiavimas
    nutrūksta po pirmo puslapio. Todėl puslapiuojam PATYS per `_id` (unikalus
    UUID): sort(_id) + _id>"...". Tai ir 3x greičiau už sort(tp_id) su žetonais.
  - Serveris lūžta skubinamas (HTTP 500). Tarp dalių - pauzė, po 500/429 - kartoti.
  - Nebaigtas „Apziura.csv.crdownload" Downloads'e yra rankinio bandymo likutis
    (visi stulpeliai, visos klasės, nutrūkęs) - šitam skriptui netinka.

═══════════════════════════════════════════════════════════════════════════
SPĄSTAI - visi jau kainavę

  1. VISUREIGIAI YRA M1G, NE M1.
     TA laukas tp_klase visureigius žymi „M1G". Filtras tp_klase = 'M1'
     išmeta 43,5 % BMW X5, 35,3 % Audi Q5, 27,4 % Volvo XC60. Taip vieną kartą
     gautas „jauni premium visureigiai TA neišlaiko 40-52 %" - tikras skaičius
     28-30 %. TEISINGAS FILTRAS: LIKE 'M1%' (ir API: startswith("M1")).
     Regitroje tas pats kitaip: KATEGORIJA_KLASE visiems 'M1', o „G" tik
     KATEGORIJA_PILNAI ('M1G-'). Kas perkelia filtrą tarp rinkinių - dėmesio.

  2. SKAITIKLIO KEITIMAS NĖRA ATSUKIMAS.
     Rida tarp apžiūrų sumažėjo > 10 000 km:
       nauja >= 0,2 x buvusi  -> „atsukimas" (atsukimo pavidalas)
       nauja <  0,2 x buvusi  -> „nusinulinimas" (skaitiklio keitimas,
                                  persivertimas, įvedimo klaida)
     Neatskyrus senų VW Golf „atsukimų" buvo 3,8 %, atskyrus 1,9 % (+2,0 %
     nusinulinimų). Dėl to modeliams su nusinulinimu >= 1 % 21-40 m. juosta
     ridos normai netinka (Golf P10 ten tik 2 948 km/metus).

  3. SKAITIKLIS IR VARDIKLIS - IŠ TOS PAČIOS AIBĖS.
     Analitikas šią klaidą padarė tris kartus. Kiekvienas procentas čia:
       neislaike  = neišlaikytos / VISOS pirminės to modelio x juostos apžiūros
       atsukimas  = automobiliai su atsukimu / automobiliai su >= 2 ridos įrašais
       iki20      = tas pats, tik tarp automobilių, kurių paskutinė apžiūra < 20 m.

  4. TIK AMŽIAUS JUOSTOS.
     Neišlaikymą ir ridą lemia amžius (X5: 26 % -> 54 %; Passat km/metus
     29 055 -> 13 684). Sudėtiniai skaičiai modeliui būtų amžiaus matas.

  5. ATSUKIMAI PRIEŠ ĮVEŽIMĄ TA NEMATOMI.
     Trajektorija tęsiasi nuo atsuktos reikšmės. Matomi tik atsukti Lietuvoje.

═══════════════════════════════════════════════════════════════════════════
BDAR
  tp_id / tp_vin_nr yra pseudonimizuoti, bet vis tiek - eilučių lygio duomenys
  lieka TIK Downloads. Į repo ir /data keliauja tik agregatai pagal modelį.

NORMALIZAVIMAS
  Raktas („BMW X5") imamas iš tools/regitra-suvestine.py marke_norm() ir
  modelis_dalys() - importuojama, NE kopijuojama. Taisant normalizavimą,
  TA gauna pataisą automatiškai.
"""

import sys, os, json, glob, datetime, importlib.util, tempfile, time, argparse

try:
    import duckdb
except ImportError:
    print('Reikia DuckDB: pip install duckdb')
    sys.exit(2)

MIN_AUTOMOBILIU = 30     # modelis į suvestinę - tik nuo tiek automobilių (kaip Regitroje)
MIN_JUOSTAI = 50         # juosta - tik nuo tiek įrašų
MIN_RIDA = 1000          # mažesnė rida - įvedimo klaida arba naujas
ATSUKIMO_RIBA = 10000    # km; mažesnis sumažėjimas - triukšmas (31 % X5 turi kokį nors)
NUSINULINIMO_DALIS = 0.2 # nauja < 0,2 x buvusi -> skaitiklio keitimas, ne atsukimas
KLASE = 'M1%'            # M1 IR M1G - žr. SPĄSTAI 1
MIN_KURO_JUOSTAI = 100   # K-34: kuro juosta - tik nuo tiek apžiūrų (kaip RIBOS.taJuostaMinN)

# K-34 (A-36, 2026-09-22): kuras - antra ridos normos dimensija.
# Pamatuota (11,1 mln. apžiūrų, 4+ m.): pagal MODELIO P10 žemiau patenka
# benzininių 23,0 %, dyzelinių 5,9 %, benzinas/dujos 14,0 % (turėtų būti 10 %).
# BMW 3 16-20 m.: benzininių 36,8 %, dyzelinių 3,5 %. Modelio norma = dyzelio norma.
# Raktai - kaip backend/regitra.js kuroRaktas(): mažosios, kablelis -> '/'.
# 'benzinas,dujos,elektra' paliekamas atskiru raktu (retas, juostų beveik nebus).
# Automobilis, kurio kuras skirtingose apžiūrose skiriasi (~4,6 tūkst.), kuro juostose
# neskaičiuojamas; modelio juostose lieka.

JUOSTOS = [(0, 3), (4, 6), (7, 9), (10, 12), (13, 15), (16, 20), (21, 40)]

# Piloto (2026-09-22, M1+M1G, 8 modeliai, naršyklėje) skaičiai - priėmimo testui.
# TA atnaujinamas kas savaitę, o pilotas modelius rinko per contains(), todėl
# leistina paklaida: kiekiams ir km ±5 %, procentams ±1,5 p. p.
PILOTAS = {
    'BMW X5':         {'automobiliu': 11953, 'km_10-12_P50': 20689, 'neislaike_13-15': 40.8,
                       'atsukimas_pct': 1.9, 'nulinimas_pct': 0.2},
    'VW PASSAT':      {'automobiliu': 127529, 'km_4-6_P50': 29055, 'neislaike_13-15': 50.4},
    'VW GOLF':        {'automobiliu': 92368, 'atsukimas_pct': 1.9, 'nulinimas_pct': 2.0},
    'TOYOTA COROLLA': {'automobiliu': 43013, 'km_4-6_P50': 15203, 'neislaike_13-15': 47.9},
    'SKODA OCTAVIA':  {'automobiliu': 30925, 'neislaike_13-15': 52.1},
    'AUDI A6':        {'automobiliu': 72538, 'km_10-12_P50': 21900},
    'AUDI Q5':        {'automobiliu': 7601, 'neislaike_4-6': 23.3},
    'VOLVO XC60':     {'automobiliu': 14845, 'neislaike_13-15': 40.8},
}


def normalizavimas():
    """marke_norm ir modelis_dalys iš tools/regitra-suvestine.py - viena vieta."""
    kelias = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'regitra-suvestine.py')
    spec = importlib.util.spec_from_file_location('regitra_suvestine', kelias)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.marke_norm, mod.modelis_dalys


import re as _re

# TA šaltinio rašybos triukšmas (išmatuota 2026-09-22 visame rinkinyje). Valoma ČIA,
# prieš bendrą normalizavimą, kad nebūtų keičiama modelis_dalys(), kurią naudoja ir
# Regitra, ir backend/regitra.js. Be šito ~84 tūkst. VW automobilių (3,3 %) krito į
# raktus „VOLKSWAGEN, VW PASSAT", „VW PASSAT;", „VW VOLKSWAGEN":
#   markė: 'VOLKSWAGEN, VW' 60 667 · 'VOLKSWAGEN-VW' 22 587 · 'VOLKSWAGEN - VW' 293
#          · rašybos klaidos 'VOLSKSWAGEN', 'VOKSWAGEN', 'WOLKSWAGEN', 'MERSEDES - BENZ' ...
#   modelis: 2 169 automobiliai su ';', modelio lauke kartojama 'VOLKSWAGEN'.
_BENZ = _re.compile(r'^MER[CS]*[EA]DES$')


def _zodziai(t):
    return [x for x in _re.split(r'[^0-9A-ZĄČĘĖĮŠŲŪŽ]+', (t or '').upper()) if x]


def ta_valymas(marke, modelis):
    z = _zodziai(marke)
    if 'VW' in z or any('WAGEN' in x or 'VAGEN' in x or 'WAGN' in x for x in z):
        marke = 'VW'
    elif any(_BENZ.match(x) for x in z) and 'BENZ' in z:
        marke = 'MERCEDES-BENZ'
    elif z[:2] == ['LAND', 'ROVER']:
        marke = 'LAND-ROVER'
    elif len(z) > 1 and (',' in (marke or '') or ';' in (marke or '')):
        marke = z[0]                                   # 'MG,ROEWE' -> 'MG'
    md = (modelis or '').upper().replace(';', ' ')
    if marke == 'VW':
        dal = md.split()
        while dal and (dal[0].strip(',.-') in ('VW', 'VOLKSWAGEN') or 'WAGEN' in dal[0]):
            dal.pop(0)
        md = ' '.join(dal)
    return marke, md


def juostos_sql(stulpelis):
    salygos = ' '.join("WHEN %s >= %d AND %s < %d THEN '%d-%d'" % (stulpelis, l, stulpelis, h + 1, l, h)
                       for l, h in JUOSTOS)
    return 'CASE %s END' % salygos


ETAPU_EILE = ['ikelti', 'patikra', 'raktai', 'ir', 'kuras', 'km', 'kmk', 'fail', 'traj', 'rasyti']


def main():
    ap = argparse.ArgumentParser(description='TA suvestinė')
    ap.add_argument('saltinis', help='katalogas (ta-apziuros-*.csv), šablonas su * arba failas')
    ap.add_argument('--db', default='~/ta-darbas.duckdb')
    ap.add_argument('--isvestis', default=None)
    ap.add_argument('--iki-laiko', type=float, default=None)
    ap.add_argument('--is-naujo', action='store_true')
    a = ap.parse_args()
    pradzia = time.time()

    saltinis = os.path.expanduser(a.saltinis)
    # NE „*.csv" kataloge: Downloads'e guli ir kiti CSV (kitų stulpelių) bei bandomieji failai.
    if '*' in saltinis:
        failai = sorted(glob.glob(saltinis))
    elif os.path.isdir(saltinis):
        failai = sorted(glob.glob(os.path.join(saltinis, 'ta-apziuros-*.csv')))
    else:
        failai = [saltinis]
    failai = [f for f in failai if os.path.isfile(f)]
    if not failai:
        print('KLAIDA: nerasta .csv failų: %s' % saltinis)
        sys.exit(1)

    db = os.path.expanduser(a.db)
    if a.is_naujo:
        for f in (db, db + '.wal'):
            if os.path.exists(f):
                os.remove(f)
    tmp = tempfile.mkdtemp(prefix='ta-duckdb-')
    con = duckdb.connect(db)
    con.execute("PRAGMA temp_directory='%s'" % tmp)
    # Be ribos DuckDB užima visą atmintį, ir 3,8 GB VM procesą nužudo be jokios
    # žinutės (2026-09-22, 12,2 mln. eil.). Su riba - išsilieja į diską.
    con.execute("SET memory_limit = '1500MB'")
    con.execute("SET threads = 2")
    con.execute("SET preserve_insertion_order = false")
    con.execute("CREATE TABLE IF NOT EXISTS etapai (vardas VARCHAR PRIMARY KEY, baigta TIMESTAMP)")
    con.execute("CREATE TABLE IF NOT EXISTS meta (raktas VARCHAR PRIMARY KEY, reiksme VARCHAR)")

    def atlikta(v):
        return con.execute("SELECT count(*) FROM etapai WHERE vardas = ?", [v]).fetchone()[0] > 0

    def pazymeti(v):
        con.execute("INSERT OR REPLACE INTO etapai VALUES (?, now())", [v])
        con.execute("CHECKPOINT")
        print('  [etapas %s baigtas, %.0f s]' % (v, time.time() - pradzia), flush=True)

    def meta(k, v=None):
        if v is None:
            r = con.execute("SELECT reiksme FROM meta WHERE raktas = ?", [k]).fetchone()
            return json.loads(r[0]) if r else None
        con.execute("INSERT OR REPLACE INTO meta VALUES (?, ?)", [k, json.dumps(v)])

    def laikas_baigesi():
        if a.iki_laiko and time.time() - pradzia > a.iki_laiko:
            print('TĘSTI: laiko riba (%.0f s). Paleiskite tą pačią komandą dar kartą.' % (time.time() - pradzia))
            con.execute("CHECKPOINT")
            sys.exit(3)

    # ── 1. Įkėlimas: tik reikalingi stulpeliai, tik M1% (SPĄSTAI 1), po kelis failus ──
    if not atlikta('ikelti'):
        con.execute("""CREATE TABLE IF NOT EXISTS zali (
            _id VARCHAR, tp_id VARCHAR, tp_marke VARCHAR, tp_modelis VARCHAR, tp_klase VARCHAR,
            metai INTEGER, rida DOUBLE, pirmine BOOLEAN, neislaike BOOLEAN, d DATE)""")
        con.execute("CREATE TABLE IF NOT EXISTS ikelta (failas VARCHAR PRIMARY KEY, eiluciu BIGINT, ne_m1 BIGINT)")
        jau = {r[0] for r in con.execute("SELECT failas FROM ikelta").fetchall()}
        likę = [f for f in failai if os.path.basename(f) not in jau]
        print('Failų: %d, iš jų dar neįkelta: %d' % (len(failai), len(likę)), flush=True)
        for f in likę:
            laikas_baigesi()
            kel = f.replace("'", "''")
            visu, ne_m1 = con.execute("""
                SELECT count(*), count(*) FILTER (WHERE coalesce(tp_klase, '') NOT LIKE '%s')
                FROM read_csv('%s', header = true, all_varchar = true)""" % (KLASE, kel)).fetchone()
            con.execute("""
                INSERT INTO zali
                SELECT _id, tp_id, tp_marke, tp_modelis, tp_klase,
                       TRY_CAST(tp_pag_metai AS INTEGER), TRY_CAST(tp_rida_km AS DOUBLE),
                       ta_tipas = 'Techninė apžiūra', ar_ta_islaikyta = 'False',
                       TRY_CAST(ta_savaites_data AS DATE)
                FROM read_csv('%s', header = true, all_varchar = true)
                WHERE tp_klase LIKE '%s'""" % (kel, KLASE))
            con.execute("INSERT INTO ikelta VALUES (?, ?, ?)", [os.path.basename(f), visu, ne_m1])
        pazymeti('ikelti')

    # ── 2. Pilnumas ir dublikatai ────────────────────────────────────────────
    if not atlikta('patikra'):
        laikas_baigesi()
        visi, unik = con.execute("SELECT count(*), count(DISTINCT _id) FROM zali").fetchone()
        if unik != visi:
            print('Dublikatų pagal _id: %d - šalinami' % (visi - unik), flush=True)
            con.execute("CREATE TABLE zali2 AS SELECT * FROM zali QUALIFY row_number() OVER (PARTITION BY _id) = 1")
            con.execute("DROP TABLE zali")
            con.execute("ALTER TABLE zali2 RENAME TO zali")
            visi = unik
        klases = dict(con.execute("SELECT tp_klase, count(*) FROM zali GROUP BY 1").fetchall())
        ne_m1 = con.execute("SELECT sum(ne_m1) FROM ikelta").fetchone()[0] or 0
        meta('visi', visi); meta('klases', klases)
        print('Įrašų (M1%%): %d | M1: %d | M1G: %d | ne M1 (išmesti įkeliant): %d'
              % (visi, klases.get('M1', 0), klases.get('M1G', 0), ne_m1))
        # API ?tp_klase.startswith("M1")&count() 2026-09-22 = 12 212 462.
        # Rinkinys neatnaujintas nuo 2025-05-28, tad skaičius turėtų sutapti.
        if visi > 1000000:
            tikimasi = 12212462
            skirt = 100.0 * (visi - tikimasi) / tikimasi
            print('Pilnumas: %d iš %d (%+.2f %%)%s' % (visi, tikimasi, skirt,
                  '' if abs(skirt) < 0.1 else '  <-- TRŪKSTA ARBA PERTEKLIUS, patikrinti dalis'))
        pazymeti('patikra')

    # ── 3. Raktai: normalizuojam tik skirtingas poras, ne 12 mln. eilučių ──────
    if not atlikta('raktai'):
        laikas_baigesi()
        marke_norm, modelis_dalys = normalizavimas()
        poros = con.execute("SELECT DISTINCT tp_marke, tp_modelis FROM zali").fetchall()
        raktai = []
        for mk, md in poros:
            if not mk or not any(c.isalpha() for c in mk):
                continue                               # pvz. „021-11-254" - ne markė
            mk2, md2 = ta_valymas(mk, md)              # TA rašybos triukšmas - žr. ta_valymas()
            baz, _ = modelis_dalys(mk2, md2)
            if baz:
                raktai.append((mk, md, marke_norm(mk2) + ' ' + baz))
        con.execute("DROP TABLE IF EXISTS raktai")
        con.execute("CREATE TABLE raktai (tp_marke VARCHAR, tp_modelis VARCHAR, raktas VARCHAR)")
        con.executemany("INSERT INTO raktai VALUES (?, ?, ?)", raktai)
        print('Markės/modelio porų: %d -> raktų: %d' % (len(poros), len({r[2] for r in raktai})))
        pazymeti('raktai')

    # ── 4. Įrašai su raktu, amžiumi ir juosta ────────────────────────────────
    if not atlikta('ir'):
        laikas_baigesi()
        # vienas automobilis - vienas modelis (tp_modelis skirtingose apžiūrose gali skirtis)
        con.execute("DROP TABLE IF EXISTS auto_raktas")
        con.execute("""
            CREATE TABLE auto_raktas AS
            SELECT z.tp_id, mode(r.raktas) AS raktas
            FROM zali z JOIN raktai r ON r.tp_marke IS NOT DISTINCT FROM z.tp_marke
                                     AND r.tp_modelis IS NOT DISTINCT FROM z.tp_modelis
            WHERE z.d IS NOT NULL GROUP BY z.tp_id""")
        con.execute("DROP TABLE IF EXISTS ir")
        # amžius kaip piloto: metai + mėn/12 + d/365 - gamybos metai
        con.execute("""
            CREATE TABLE ir AS
            SELECT tp_id, raktas, d, rida, pirmine, neislaike, amzius, %s AS juosta
            FROM (SELECT z.tp_id, a.raktas, z.d, z.rida, z.pirmine, z.neislaike,
                         year(z.d) + (month(z.d) - 1) / 12.0 + day(z.d) / 365.0 - z.metai AS amzius
                  FROM zali z JOIN auto_raktas a USING (tp_id)
                  WHERE z.d IS NOT NULL)""" % juostos_sql('amzius'))
        print('Paruošta analizei: %d apžiūrų' % con.execute("SELECT count(*) FROM ir").fetchone()[0], flush=True)
        pazymeti('ir')

    # ── 4b. Kuras (K-34): atskiras lengvas įkėlimas - tik tp_id ir tp_kuras ────
    # Atskiras etapas, kad esamos DB nereikėtų įkelti iš naujo (zali neturi kuro).
    if not atlikta('kuras'):
        con.execute("CREATE TABLE IF NOT EXISTS kuras_zali (tp_id VARCHAR, kuras VARCHAR)")
        con.execute("CREATE TABLE IF NOT EXISTS kuras_ikelta (failas VARCHAR PRIMARY KEY)")
        jau = {r[0] for r in con.execute("SELECT failas FROM kuras_ikelta").fetchall()}
        for f in [f for f in failai if os.path.basename(f) not in jau]:
            laikas_baigesi()
            kel = f.replace("'", "''")
            con.execute("""
                INSERT INTO kuras_zali
                SELECT tp_id, replace(lower(trim(tp_kuras)), ',', '/')
                FROM read_csv('%s', header = true, all_varchar = true)
                WHERE tp_klase LIKE '%s'""" % (kel, KLASE))
            con.execute("INSERT INTO kuras_ikelta VALUES (?)", [os.path.basename(f)])
        laikas_baigesi()
        con.execute("DROP TABLE IF EXISTS auto_kuras")
        con.execute("""
            CREATE TABLE auto_kuras AS
            SELECT tp_id, CASE WHEN min(kuras) = max(kuras) THEN min(kuras) END AS kuras
            FROM kuras_zali WHERE kuras IS NOT NULL AND kuras <> '' GROUP BY tp_id""")
        k = con.execute("SELECT count(*), count(kuras) FROM auto_kuras").fetchone()
        print('Kuras: automobilių %d, vienareikšmis %d' % k, flush=True)
        pazymeti('kuras')

    # ── 5. Ridos normos: rida / amžius pagal modelį x juostą ─────────────────
    if not atlikta('km'):
        laikas_baigesi()
        con.execute("DROP TABLE IF EXISTS rez_km")
        con.execute("""
            CREATE TABLE rez_km AS
            SELECT raktas, juosta, count(*) AS n,
                   quantile_disc(rida / amzius, [0.10, 0.25, 0.50, 0.75, 0.90]) AS q
            FROM ir WHERE rida > %d AND amzius > 0.5 AND juosta IS NOT NULL
            GROUP BY ALL HAVING count(*) >= %d""" % (MIN_RIDA, MIN_JUOSTAI))
        pazymeti('km')

    # ── 5b. Ridos normos pagal kurą (K-34): modelis x kuras x juosta, be 0-3 ──
    # 0-3 m. TA juosta ridos normai nenaudojama (K-39), tad jos ir nerašom.
    if not atlikta('kmk'):
        laikas_baigesi()
        con.execute("DROP TABLE IF EXISTS rez_km_kuras")
        con.execute("""
            CREATE TABLE rez_km_kuras AS
            SELECT i.raktas, k.kuras, i.juosta, count(*) AS n,
                   quantile_disc(i.rida / i.amzius, [0.10, 0.25, 0.50, 0.75, 0.90]) AS q
            FROM ir i JOIN auto_kuras k USING (tp_id)
            WHERE k.kuras IS NOT NULL AND i.rida > %d AND i.amzius > 0.5
              AND i.juosta IS NOT NULL AND i.juosta <> '0-3'
            GROUP BY ALL HAVING count(*) >= %d""" % (MIN_RIDA, MIN_KURO_JUOSTAI))
        pazymeti('kmk')

    # ── 6. TA neišlaikymas: tik PIRMINĖS; vardiklis - visos pirminės (SPĄSTAI 3) ─
    if not atlikta('fail'):
        laikas_baigesi()
        con.execute("DROP TABLE IF EXISTS rez_fail")
        con.execute("""
            CREATE TABLE rez_fail AS
            SELECT raktas, juosta, count(*) AS n, 100.0 * count(*) FILTER (WHERE neislaike) / count(*) AS pct
            FROM ir WHERE pirmine AND juosta IS NOT NULL
            GROUP BY ALL HAVING count(*) >= %d""" % MIN_JUOSTAI)
        con.execute("DROP TABLE IF EXISTS rez_bazine")
        con.execute("""
            CREATE TABLE rez_bazine AS
            SELECT juosta, count(*) AS n, 100.0 * count(*) FILTER (WHERE neislaike) / count(*) AS pct
            FROM ir WHERE pirmine AND juosta IS NOT NULL GROUP BY juosta""")
        pazymeti('fail')

    # ── 7. Trajektorijos: atsukimas vs nusinulinimas (SPĄSTAI 2) ─────────────
    if not atlikta('traj'):
        laikas_baigesi()
        con.execute("DROP TABLE IF EXISTS rez_traj")
        con.execute("""
            CREATE TABLE rez_traj AS
            WITH r AS (
                SELECT tp_id, raktas, d, rida, amzius,
                       lag(rida) OVER (PARTITION BY tp_id ORDER BY d, rida) AS buvo
                FROM ir WHERE rida > %d
            ),
            a AS (
                SELECT tp_id, any_value(raktas) AS raktas, count(*) AS ridu,
                       bool_or(rida - buvo < %d AND rida >= %f * buvo) AS atsukta,
                       bool_or(rida - buvo < %d AND rida <  %f * buvo) AS nulinta,
                       arg_max(amzius, d) < 20 AS iki20
                FROM r GROUP BY tp_id
            )
            SELECT raktas,
                   count(*)                                             AS automobiliu,
                   count(*) FILTER (WHERE ridu >= 2)                     AS su2,
                   count(*) FILTER (WHERE ridu >= 2 AND atsukta)          AS atsuk,
                   count(*) FILTER (WHERE ridu >= 2 AND nulinta)          AS nulin,
                   count(*) FILTER (WHERE ridu >= 2 AND iki20)            AS su2_iki20,
                   count(*) FILTER (WHERE ridu >= 2 AND iki20 AND atsukta) AS atsuk_iki20
            FROM a GROUP BY raktas""" % (MIN_RIDA, -ATSUKIMO_RIBA, NUSINULINIMO_DALIS,
                                         -ATSUKIMO_RIBA, NUSINULINIMO_DALIS))
        pazymeti('traj')

    # ── 8. Sudėjimas ir įrašymas ─────────────────────────────────────────────
    laikas_baigesi()
    traj = con.execute("SELECT * FROM rez_traj").fetchall()
    km = con.execute("SELECT * FROM rez_km").fetchall()
    kmk = con.execute("SELECT * FROM rez_km_kuras").fetchall()
    fail = con.execute("SELECT * FROM rez_fail").fetchall()
    bazine = con.execute("SELECT * FROM rez_bazine").fetchall()
    apziuru = dict(con.execute("SELECT raktas, count(*) FROM ir GROUP BY raktas").fetchall())
    ribos = con.execute("SELECT min(d), max(d), count(DISTINCT tp_id) FROM ir").fetchone()
    visi, klases = meta('visi'), meta('klases')

    def p(x, y):
        return round(100.0 * x / y, 1) if y else None

    M = {}
    for raktas, aut, su2, at, nu, su2_20, at_20 in traj:
        if aut < MIN_AUTOMOBILIU:
            continue
        M[raktas] = {
            'modelis': raktas, 'automobiliu': aut, 'apziuru': apziuru.get(raktas, 0),
            'kmmet_juostos': {}, 'kmmet_kuras': {}, 'neislaike_juostos': {},
            'su_2_apziuromis': su2,
            'atsukimas_pct': p(at, su2), 'atsukimas_iki20_pct': p(at_20, su2_20),
            'nulinimas_pct': p(nu, su2),
        }
    for raktas, juosta, n, q in km:
        if raktas in M:
            M[raktas]['kmmet_juostos'][juosta] = [n] + [int(round(x)) for x in q]
    for raktas, kuras, juosta, n, q in kmk:
        if raktas in M:
            M[raktas]['kmmet_kuras'].setdefault(kuras, {})[juosta] = [n] + [int(round(x)) for x in q]
    for raktas, juosta, n, pct in fail:
        if raktas in M:
            M[raktas]['neislaike_juostos'][juosta] = [n, round(pct, 1)]
    eile = ['%d-%d' % x for x in JUOSTOS]
    for m in M.values():
        m['kmmet_juostos'] = {j: m['kmmet_juostos'][j] for j in eile if j in m['kmmet_juostos']}
        m['neislaike_juostos'] = {j: m['neislaike_juostos'][j] for j in eile if j in m['neislaike_juostos']}
        m['kmmet_kuras'] = {k: {j: v[j] for j in eile if j in v}
                            for k, v in sorted(m['kmmet_kuras'].items(), key=lambda kv: -sum(x[0] for x in kv[1].values()))}
    modeliai = sorted(M.values(), key=lambda x: -x['automobiliu'])

    saknis = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    isvestis = (os.path.expanduser(a.isvestis) if a.isvestis
                else os.path.join(saknis, 'backend', 'duomenys', 'ta-modeliai.json'))
    os.makedirs(os.path.dirname(isvestis), exist_ok=True)
    with open(isvestis, 'w', encoding='utf-8') as f:
        json.dump({
            'versija': 2,
            'saltinis': 'TRANSEKSTA, Transporto priemonių techninės apžiūros duomenys (data.gov.lt 2721)',
            'licencija': 'CC BY 4.0',
            'sugeneruota': datetime.date.today().isoformat(),
            'laikotarpis': [str(ribos[0]), str(ribos[1])],
            'irasu': visi,
            'klases': {'M1': klases.get('M1', 0), 'M1G': klases.get('M1G', 0)},
            'automobiliu': ribos[2],
            'bazine': {'neislaike_juostos': {j: [n, round(pct, 1)] for j, n, pct in
                                             sorted(bazine, key=lambda x: eile.index(x[0]))}},
            'modeliai': modeliai,
        }, f, ensure_ascii=False, separators=(',', ':'))

    print('Laikotarpis: %s .. %s | automobilių: %d | modelių (>= %d aut.): %d'
          % (ribos[0], ribos[1], ribos[2], MIN_AUTOMOBILIU, len(modeliai)))
    print('Įrašyta: %s (%d KB)' % (isvestis, os.path.getsize(isvestis) // 1024))

    # ── 9. Priėmimo testas prieš pilotą ──────────────────────────────────────
    print('\nPriėmimo testas (pilotas 2026-09-22):')
    blogai = 0
    for raktas, laukiama in PILOTAS.items():
        m = M.get(raktas)
        if not m:
            continue
        for k, v in laukiama.items():
            if k.startswith('km_'):
                _, j, _ = k.split('_'); fakt = (m['kmmet_juostos'].get(j) or [None] * 4)[3]; tol = 0.05 * v
            elif k.startswith('neislaike_'):
                j = k.split('_')[1]; fakt = (m['neislaike_juostos'].get(j) or [None, None])[1]; tol = 1.5
            elif k.endswith('_pct'):
                fakt = m[k]; tol = 1.5
            else:
                fakt = m[k]; tol = 0.05 * v
            ok = fakt is not None and abs(fakt - v) <= tol
            blogai += 0 if ok else 1
            print('  %-4s %-15s %-17s laukta %-8s gauta %s' % ('ok' if ok else 'ŽR.', raktas, k, v, fakt))
    # K-34: kuro juostos (A-36 matavimas 2026-09-22, ±5 %)
    for raktas, kuras, j, laukta in (('BMW 3', 'benzinas', '16-20', 8812), ('BMW 3', 'dyzelinas', '16-20', 13240)):
        v = ((M.get(raktas) or {}).get('kmmet_kuras', {}).get(kuras) or {}).get(j)
        ok = v is not None and abs(v[1] - laukta) <= 0.05 * laukta
        blogai += 0 if ok else 1
        print('  %-4s %-15s %-17s laukta %-8s gauta %s' % ('ok' if ok else 'ŽR.', raktas, kuras + ' ' + j + ' P10', laukta, v and v[1]))
    if 'BMW X5' in M and M['BMW X5']['automobiliu'] < 9000:
        print('  !!  BMW X5 automobilių < 9 000 - tikėtina, kad M1G išmesti (SPĄSTAI 1)')
    print('\n%s' % ('Visi palyginimai sutampa.' if not blogai else 'Nesutampa: %d - žiūrėti prieš naudojant.' % blogai))
    con.close()


if __name__ == '__main__':
    main()
