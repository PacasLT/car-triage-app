#!/usr/bin/env python3
# tools/onclick-patikra.py - ar visos `onclick="..."` funkcijos apskritai egzistuoja.
#
# Kam: v1.76.0 paaiskejo, kad `detail.html` septyni skirtukai kviete `dpTab`,
# kurios faile NEBUVO - dingo per v1.43.0 perdarymus. Klaida tyli: `onclick`
# atributas nieko nesako, kol nepaspaudi, o paspaudus meta `ReferenceError`
# i konsole, kurios niekas neziuri. Naudotojui atrodo, kad mygtukas negyvas.
# Lukas ta ir prasnese: „paspaudziu tarp box pvz nuotraukos niekas nesikeicia".
#
# Paleidimas is `frontend/`:  python3 ../tools/onclick-patikra.py
# Grazina 1, jei kas nors nerasta - tinka pakabinti pries kiekviena push'a.

import io, os, re, sys

PUSLAPIAI = ['index.html', 'detail.html', 'compare.html', 'megstamiausi.html',
             'ataskaitos.html', 'admin.html']
BENDRI = ['ct-bendras.js', 'auth_frontend.js', 'megstami-meniu.js',
          'paskyra-meniu.js', 'klaidu-pranesimas.js', 'compare-report.js', 'versijos.js']

# DOM ir standartines JS funkcijos - jas kviecia ne globalus vardas, o objektas
NE_GLOBALUS = {
    'if', 'for', 'while', 'switch', 'return', 'typeof', 'function', 'catch',
    'alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'String', 'Number',
    'Array', 'Object', 'JSON', 'Math', 'Date', 'setTimeout', 'clearTimeout',
    'encodeURIComponent', 'decodeURIComponent', 'fetch', 'event',
    'getElementById', 'querySelector', 'querySelectorAll', 'preventDefault',
    'stopPropagation', 'stopImmediatePropagation', 'scrollIntoView', 'reload',
    'replace', 'toggle', 'click', 'open', 'log', 'print', 'stringify', 'focus',
    'blur', 'remove', 'add', 'contains', 'trim', 'split', 'join', 'slice',
}

def apibrezimai(tekstas):
    v = set(re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)', tekstas))
    v |= set(re.findall(r'\bwindow\.([A-Za-z_$][\w$]*)\s*=', tekstas))
    v |= set(re.findall(r'\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|\()', tekstas))
    return v

def main():
    bendri = ''
    for f in BENDRI:
        if os.path.exists(f):
            bendri += io.open(f, encoding='utf-8').read()
    globalus = apibrezimai(bendri)

    blogai = 0
    for p in PUSLAPIAI:
        if not os.path.exists(p):
            continue
        s = io.open(p, encoding='utf-8').read()
        savos = apibrezimai(s) | globalus
        kviest = set()
        for atr in re.findall(r'on(?:click|change|input|submit|focus|blur|keyup|keydown)\s*=\s*"([^"]*)"', s):
            kviest |= set(re.findall(r'\b([A-Za-z_$][\w$]*)\s*\(', atr))
        truksta = sorted(x for x in kviest - savos - NE_GLOBALUS if not x.startswith('_'))
        if truksta:
            blogai += 1
            print('  ' + p + ': NERASTA ' + ', '.join(truksta))
        else:
            print('  ' + p + ': gerai (' + str(len(kviest)) + ' funkcijos)')

    if blogai:
        print('\n  ' + str(blogai) + ' puslapiuose yra onclick be funkcijos.\n')
        return 1
    print('\n  Visos onclick funkcijos apibreztos.\n')
    return 0

sys.exit(main())
