"""TA apziuru (data.gov.lt 2721, TRANSEKSTA, CC BY 4.0) parsisiuntimas be narsykles.

Paleisti Windows'e (Python 3, tik standartine biblioteka), is repo saknies:
    python tools\\ta-parsisiuntimas.py

Formatas TAS PATS kaip Analitiko narsykles failu (2026-09-22):
  ta-apziuros-NNNN.csv, 100 000 eiluciu, 11 stulpeliu, rikiuota pagal _id,
  filtras tp_klase.startswith("M1") (M1 + M1G visureigiai).

- Rasoma TIK i %USERPROFILE%\\Downloads (zali duomenys niekada repo aplanke).
- TESIA: randa paskutini pilna faila ir tesia nuo jo paskutinio _id.
- Tuscius / trukstamus failus tarp esamu (pvz. 0 baitu 0001) uzpildo is naujo.
- Kiekviena uzklausa savarankiska (_id > paskutinis & sort(_id)), todel
  nutrukus - tiesiog paleisti dar karta.
- 429 / 5xx / tinklo klaida -> laukia ir kartoja (iki 8 kartu).
- select() NENAUDOTI - dingsta `_page.next`.
"""
import argparse, csv, glob, json, os, re, time, urllib.parse, urllib.request

BAZE = 'https://get.data.gov.lt/datasets/gov/transeksta/ctadb/Apziura/:format/json'
STULPELIAI = ['_id', 'tp_id', 'tp_marke', 'tp_modelis', 'tp_klase', 'tp_pag_metai', 'tp_kuras',
              'tp_rida_km', 'ta_tipas', 'ar_ta_islaikyta', 'ta_savaites_data']
FILTRAS = 'tp_klase.startswith("M1")'
PUSLAPIS = 10000
csv.field_size_limit(10**9)

def gauti(q):
    url = BAZE + '?' + urllib.parse.quote(q, safe='=&()",.<>')
    for bandymas in range(8):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'cartriige-analitikas'})
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read().decode('utf-8'))['_data']
        except Exception as e:
            kodas = getattr(e, 'code', None)
            if kodas and kodas not in (429, 500, 502, 503, 504): raise
            laukti = min(300, 10 * 2 ** bandymas)
            print(f'  {kodas or e} - laukiu {laukti} s ({bandymas + 1}/8)', flush=True)
            time.sleep(laukti)
    raise SystemExit('Nepavyko po 8 bandymu.')

def reiksme(v):
    if v is None: return ''
    if isinstance(v, bool): return 'True' if v else 'False'
    return v

def id_ribos(kelias):
    with open(kelias, encoding='utf-8-sig', newline='') as f:
        r = csv.DictReader(f)
        pirmas = paskutinis = None
        n = 0
        for eil in r:
            if pirmas is None: pirmas = eil['_id']
            paskutinis = eil['_id']; n += 1
    return pirmas, paskutinis, n

def rasyti(kelias, eilutes):
    laik = kelias + '.dalis'
    with open(laik, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(STULPELIAI)
        for d in eilutes: w.writerow([reiksme(d.get(k)) for k in STULPELIAI])
    os.replace(laik, kelias)

def rinkti(nuo_id, iki_id, kiek):
    """Iki `kiek` eiluciu su nuo_id < _id < iki_id, rikiuota pagal _id."""
    visos, pask = [], nuo_id
    while len(visos) < kiek:
        q = FILTRAS
        if pask: q += f'&_id>"{pask}"'
        if iki_id: q += f'&_id<"{iki_id}"'
        q += f'&sort(_id)&limit({min(PUSLAPIS, kiek - len(visos))})'
        d = gauti(q)
        if not d: break
        visos.extend(d); pask = d[-1]['_id']
        if len(d) < min(PUSLAPIS, kiek): break
    return visos

def main():
    a = argparse.ArgumentParser()
    a.add_argument('--katalogas', default=os.path.join(os.path.expanduser('~'), 'Downloads'))
    a.add_argument('--prefiksas', default='ta-apziuros')
    a.add_argument('--failui', type=int, default=100000, help='eiluciu viename faile')
    a.add_argument('--daugiausia', type=int, default=0, help='kiek nauju failu daugiausia (0 = iki galo)')
    x = a.parse_args()
    if 'car-triage-app' in os.path.abspath(x.katalogas).lower():
        raise SystemExit('Zali duomenys repo aplanke draudziami.')
    os.makedirs(x.katalogas, exist_ok=True)
    kelias = lambda n: os.path.join(x.katalogas, f'{x.prefiksas}-{n:04d}.csv')

    esami = sorted(int(re.search(r'-(\d{4})\.csv$', p).group(1))
                   for p in glob.glob(os.path.join(x.katalogas, x.prefiksas + '-[0-9][0-9][0-9][0-9].csv')))
    ribos = {}
    for n in esami:
        if os.path.getsize(kelias(n)) > 0:
            p, q, k = id_ribos(kelias(n))
            if k: ribos[n] = (p, q, k)

    pradzia = time.time()
    # 1. Spragos: tusti ar trukstami failai tarp pilnu
    if ribos:
        for n in range(1, max(ribos)):
            if n in ribos: continue
            nuo = ribos[n - 1][1] if (n - 1) in ribos else None
            if n > 1 and (n - 1) not in ribos:
                print(f'{n:04d}: pries ji irgi spraga - praleidziu, pataisyk rankiniu budu'); continue
            iki = next(ribos[m][0] for m in sorted(ribos) if m > n)
            e = rinkti(nuo, iki, x.failui)
            rasyti(kelias(n), e); ribos[n] = (e[0]['_id'] if e else None, e[-1]['_id'] if e else None, len(e))
            print(f'{os.path.basename(kelias(n))}  {len(e)} eil. (spraga uzpildyta)  ({time.time() - pradzia:.0f} s)', flush=True)

    # 2. Tesimas nuo paskutinio
    n = (max(ribos) + 1) if ribos else 1
    pask = ribos[max(ribos)][1] if ribos else None
    if ribos and ribos[max(ribos)][2] < x.failui:
        print('Paskutinis failas nepilnas - parsisiuntimas jau baigtas.'); return
    nauju = 0
    while True:
        e = rinkti(pask, None, x.failui)
        if not e: print('Galas.'); break
        rasyti(kelias(n), e); nauju += 1
        print(f'{os.path.basename(kelias(n))}  {len(e)} eil.  ({time.time() - pradzia:.0f} s)', flush=True)
        pask = e[-1]['_id']; n += 1
        if len(e) < x.failui: print('Galas.'); break
        if x.daugiausia and nauju >= x.daugiausia: print('Pasiekta --daugiausia riba.'); break
    print(f'Baigta: {nauju} nauji failai. Paskutinis nr. {n - 1:04d}.')

if __name__ == '__main__':
    main()
