#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tokenu-patikra.py - dizaino tokenu rysiu sargas.

Paleidimas is repo saknies arba is frontend/:
    python3 tools/tokenu-patikra.py

Atsako i keturis klausimus:
  1. Kurie var(--x) naudojami, bet niekur neapibrezti (sulūžęs ryšys).
  2. Kurie tokenai apibrezti, bet niekur nenaudojami (negyvi).
  3. Kurie apibrezti keliuose failuose (du saltiniai tai paciai spalvai).
  4. Kurie turi SKIRTINGAS reiksmes - tai pavojingiausia: kol ct-dizainas.css
     prijungtas paskutinis, jis laimi ir viskas atrodo gerai. Bet puslapis
     turi dvi paletes, ir antroji pasirodo kraunantis arba failui nepasiekus.

Iseities kodas 1, jei yra sulūžusių ryšių arba reiksmių skirtumų.
"""

import re
import os
import sys
import collections

BAZE = 'ct-dizainas.css'          # dizainerio failas - jo reiksmes teisingos

# Tokenai, nustatomi JS per element.style.setProperty() - ne klaida.
ZINOMOS_ISIMTYS = {
    '--score-color',   # detail.html 1692 eil.: ring.style.setProperty(...)
    '--pct',           # tas pats ziedas
}

FAILAI = [
    'index.html', 'detail.html', 'compare.html',
    'ataskaitos.html', 'megstamiausi.html', 'admin.html',
    'ct-dizainas.css', 'ct-priedai.css', 'ct-mygtukai.css', 'ct-bendras.css',
    'ct-bendras.js', 'versijos.js', 'megstami-meniu.js', 'paskyra-meniu.js',
    'klaidu-pranesimas.js', 'compare-report.js', 'auth_frontend.js',
]


def rasti_frontend():
    for kelias in ('frontend', '.', '../frontend'):
        if os.path.isfile(os.path.join(kelias, BAZE)):
            return kelias
    print('KLAIDA: nerandu %s. Paleiskite is repo saknies arba is frontend/.' % BAZE)
    sys.exit(2)


def main():
    kat = rasti_frontend()
    apibrezti = collections.defaultdict(set)
    naudojami = collections.defaultdict(set)
    reiksmes = collections.defaultdict(dict)   # tokenas -> {failas: reiksme} (tik :root)
    hex_kiekis = collections.Counter()

    for f in FAILAI:
        kelias = os.path.join(kat, f)
        if not os.path.exists(kelias):
            continue
        s = open(kelias, encoding='utf-8', errors='replace').read()
        for m in re.finditer(r'(--[a-zA-Z0-9_-]+)\s*:', s):
            apibrezti[m.group(1)].add(f)
        for m in re.finditer(r'var\(\s*(--[a-zA-Z0-9_-]+)', s):
            naudojami[m.group(1)].add(f)
        for blk in re.finditer(r':root\s*\{(.*?)\}', s, re.S):
            for m in re.finditer(r'(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);', blk.group(1)):
                reiksmes[m.group(1)].setdefault(f, m.group(2).strip())
        hex_kiekis[f] = len(re.findall(r'#[0-9a-fA-F]{3,8}\b', s))

    blogai = 0

    print('\n== 1. Naudojami, bet neapibrezti (sulūžęs ryšys) ==')
    sulauze = sorted(t for t in naudojami
                     if t not in apibrezti and t not in ZINOMOS_ISIMTYS)
    for t in sulauze:
        print('   %-28s naudoja: %s' % (t, ', '.join(sorted(naudojami[t]))))
    print('   viso: %d (riba 0)' % len(sulauze))
    if sulauze:
        blogai += 1

    print('\n== 2. Apibrezti, bet nenaudojami (negyvi) ==')
    negyvi = sorted(t for t in apibrezti if t not in naudojami)
    for t in negyvi:
        print('   %-28s apibrezta: %s' % (t, ', '.join(sorted(apibrezti[t]))))
    print('   viso: %d  (turi mazeti kas paketa; dizainerio failo tokenai - jo sprendimas)' % len(negyvi))

    print('\n== 3. Apibrezti keliuose failuose ==')
    dubliai = sorted(t for t, fs in apibrezti.items() if len(fs) > 1)
    print('   viso: %d  (tikslas: tik %s)' % (len(dubliai), BAZE))

    print('\n== 4. SKIRTINGOS reiksmes tam paciam tokenui ==')
    skiriasi = 0
    for t in sorted(reiksmes):
        d = reiksmes[t]
        if BAZE not in d:
            continue
        kiti = {f: v for f, v in d.items()
                if f != BAZE and v.replace(' ', '').lower() != d[BAZE].replace(' ', '').lower()}
        if kiti:
            skiriasi += 1
            print('   %s' % t)
            print('       %-16s %s' % (BAZE, d[BAZE]))
            for f, v in sorted(kiti.items()):
                print('       %-16s %s' % (f, v))
    print('   viso: %d (riba 0)' % skiriasi)
    if skiriasi:
        blogai += 1

    print('\n== 5. Kietai irasytos hex spalvos (informacijai) ==')
    for f, n in hex_kiekis.most_common():
        if n:
            print('   %-24s %d' % (f, n))

    print('')
    if blogai:
        print('BLOGAI: yra sulūžusių ryšių arba reiksmiu skirtumu.')
        print('Ka daryti: negyvus :root blokus istrinti; nauja tokena prasyti dizainerio.')
        sys.exit(1)
    print('GERAI: tokenu rysiai sveiki.')


if __name__ == '__main__':
    main()
