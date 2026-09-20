#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tools/dizaino-inspekcija.py - visos dizaino sistemos patikra skaiciais.
#
# Kiekvienas skaicius cia is failo, ne is atminties. Paleidimas is frontend/:
#   python3 ../tools/dizaino-inspekcija.py

import io, os, re, sys
from collections import Counter, defaultdict

CSS = ['ct-dizainas.css', 'ct-priedai.css', 'ct-mygtukai.css', 'ct-bendras.css']
HTML = ['index.html', 'detail.html', 'compare.html', 'megstamiausi.html',
        'ataskaitos.html', 'admin.html']
JS = ['ct-bendras.js', 'auth_frontend.js', 'megstami-meniu.js', 'paskyra-meniu.js',
      'klaidu-pranesimas.js', 'compare-report.js']

def r(f):
    return io.open(f, encoding='utf-8').read() if os.path.exists(f) else ''

def be_komentaru(t):
    return re.sub(r'/\*[\s\S]*?\*/', '', t)

def sk(nr, pav):
    print('\n' + '=' * 62 + '\n  ' + nr + ' · ' + pav + '\n' + '=' * 62)

# ── I-01 · skyriu numeracija ────────────────────────────────────────────────
sk('I-01', 'Skyriu numeracija ct-dizainas.css')
nums = re.findall(r'(?m)^   (\d+[a-z]?)\. ', r('ct-dizainas.css'))
dub = [k for k, v in Counter(nums).items() if v > 1]
print('  skyriu: ' + str(len(nums)))
print('  tvarka: ' + ' '.join(nums))
print('  DUBLIKATAI: ' + (', '.join(dub) if dub else 'nera'))
surikiuota = nums == sorted(nums, key=lambda x: (int(re.match(r'\d+', x).group()), x))
print('  surikiuota: ' + ('taip' if surikiuota else 'NE - skyriaus paieska tampa spejimu'))

# ── I-02 · !important ───────────────────────────────────────────────────────
sk('I-02', '!important pasiskirstymas')
for f in CSS + HTML:
    t = be_komentaru(r(f))
    n = t.count('!important')
    if n:
        print('  %-20s %3d' % (f, n))

# ── I-03 · inline style= markupe ────────────────────────────────────────────
sk('I-03', 'Inline style= atributai (nugali bet kuri selektoriu)')
for f in HTML:
    t = r(f)
    n = len(re.findall(r'\sstyle="', t))
    if n:
        print('  %-20s %3d' % (f, n))

# ── I-04 · negyvi tokenai ───────────────────────────────────────────────────
sk('I-04', ':root tokenai, kuriu niekas nenaudoja')
visas = ''.join(be_komentaru(r(f)) for f in CSS) + ''.join(r(f) for f in HTML + JS)
tok = sorted(set(re.findall(r'(--[a-z0-9-]+)\s*:', be_komentaru(r('ct-dizainas.css')))))
negyvi = [x for x in tok if visas.count('var(' + x) == 0]
print('  tokenu: %d · negyvu: %d' % (len(tok), len(negyvi)))
for x in negyvi:
    print('      ' + x)

# ── I-05 · height vs min-height ─────────────────────────────────────────────
sk('I-05', 'Tas pats selektorius gauna ir height, ir min-height')
for f in CSS + HTML:
    t = be_komentaru(r(f))
    for m in re.finditer(r'(?m)^([^{}@\n][^{}\n]*)\{([^{}]*)\}', t):
        kunas = m.group(2)
        if re.search(r'(?<!-)\bheight\s*:', kunas) and 'min-height' in kunas:
            print('  %-18s %s' % (f, m.group(1).strip()[:60]))

# ── I-06 · vienodi klasiu vardai skirtinguose failuose ──────────────────────
sk('I-06', 'Ta pati klase aprasyta keliuose failuose')
kur = defaultdict(set)
def klases_is_css(t):
    # tik selektoriai pries { - kitaip i saskaita patenka JS metodai (.catch, .map)
    v = set()
    for m in re.finditer(r'(?m)^([^{}@\n][^{}\n]*)\{', t):
        v |= set(re.findall(r'\.([a-zA-Z][\w-]+)', m.group(1)))
    return v
for f in CSS:
    kur_ = klases_is_css(be_komentaru(r(f)))
    for k in kur_:
        kur[k].add(f)
for f in HTML:
    for st in re.findall(r'<style[^>]*>([\s\S]*?)</style>', r(f)):
        for k in klases_is_css(be_komentaru(st)):
            kur[k].add(f)
bendri = {k: v for k, v in kur.items() if len(v) > 1}
print('  klasiu, aprasytu 2+ failuose: ' + str(len(bendri)))
for k in sorted(bendri)[:12]:
    print('      .%-22s %s' % (k, ', '.join(sorted(bendri[k]))))

# ── I-07 · HEX spalvos uz :root ribu ────────────────────────────────────────
sk('I-07', 'HEX spalvos, irasytos ranka (ne per var())')
for f in CSS:
    t = be_komentaru(r(f))
    root = t[:t.index('}')] if ':root' in t[:200] else ''
    hexai = re.findall(r'#[0-9a-fA-F]{3,8}\b', t.replace(root, ''))
    if hexai:
        c = Counter(hexai)
        print('  %-20s %3d (daznis: %s)' % (f, len(hexai), ', '.join('%s×%d' % x for x in c.most_common(3))))

print('\n' + '=' * 62)
print('  Kiekvienas skaicius surinktas is failo. Nuomoniu cia nera.')
print('=' * 62 + '\n')
