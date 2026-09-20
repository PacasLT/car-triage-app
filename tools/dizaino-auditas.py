#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# tools/dizaino-auditas.py - kurios dizaino sistemos klases markupe nebenaudojamos.
#
# Kam: per visa projekta radom septynias „negyvybes" formas, ir kiekviena
# isgyveno menesius, nes nieko nelauze garsiai. Sis skriptas atsako i viena
# is dvieju klausimu, kuriuos reikia uzduoti:
#
#   „kas dar to nenaudoja"  <- SIS skriptas (negyvos klases)
#   „kas remesi tuo, ka ka tik pakeiciau"  <- to automatiskai nerasi
#
# Paleidimas is frontend/:  python3 ../tools/dizaino-auditas.py

import io, os, re, sys

CSS = ['ct-dizainas.css', 'ct-priedai.css', 'ct-mygtukai.css', 'ct-bendras.css']
MARKUPAS = ['index.html', 'detail.html', 'compare.html', 'megstamiausi.html',
            'ataskaitos.html', 'admin.html', 'ct-ikonos.html']
JS = ['ct-bendras.js', 'auth_frontend.js', 'megstami-meniu.js', 'paskyra-meniu.js',
      'klaidu-pranesimas.js', 'compare-report.js']
# generatorius: admin.html klases gimsta cia
KITI = ['../tools/mk-admin.py']

def skaityti(sar):
    t = ''
    for f in sar:
        if os.path.exists(f):
            t += io.open(f, encoding='utf-8').read()
    return t

def main():
    turinys = skaityti(MARKUPAS) + skaityti(JS) + skaityti(KITI)
    blogai = 0
    for failas in CSS:
        if not os.path.exists(failas):
            continue
        css = io.open(failas, encoding='utf-8').read()
        css = re.sub(r'/\*[\s\S]*?\*/', '', css)          # komentarai lauk
        klases = set(re.findall(r'\.([a-zA-Z][\w-]+)', css))
        negyvos = sorted(k for k in klases if k not in turinys)
        # busenu klases (is-*) tikrinam atskirai - jas dazniausiai deda JS
        negyvos = [k for k in negyvos if not k.startswith('is-')]
        if negyvos:
            blogai += len(negyvos)
            print('\n  ' + failas + ': ' + str(len(negyvos)) + ' klasiu markupe nerasta')
            for k in negyvos:
                print('      .' + k)
        else:
            print('\n  ' + failas + ': visos klases naudojamos')

    if blogai:
        print('\n  Is viso ' + str(blogai) + '. Tai NE BUTINAI klaida: klase gali laukti')
        print('  busimo skyriaus arba buti dedama dinamiskai. Bet kiekviena verta')
        print('  paklausti: ar ji dar ko nors laukia, ar jau niekas jos nebesaukia.\n')
    else:
        print('\n  Negyvu klasiu nerasta.\n')
    return 0

sys.exit(main())
