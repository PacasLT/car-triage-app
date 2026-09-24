// naujas.test.js — Nr.50 (v2.11.2): naujas automobilis (rida < 5 000 km, ne senesnis nei 1 m.).
//     node backend/testai/naujas.test.js
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const blokas = src.match(/const NAUJO_RIDA[\s\S]*?\n}\n/);
let klaidu = 0, n = 0;
const T = (c, s) => { n++; if (c) console.log('  ok   ' + s); else { klaidu++; console.log('  BLOGAI ' + s); } };
T(!!blokas, 'arNaujas rasta server.js');
const arNaujas = new Function(blokas[0] + '; return arNaujas;')();
const y = new Date().getFullYear();
T(arNaujas({ metai: y, rida: 10 }) === true, 'šių metų, 10 km → naujas');
T(arNaujas({ metai: y - 1, rida: 4999 }) === true, 'pernykštis, 4 999 km → naujas');
// AN-0923-NAUJAS (Luko A, 09-23): ribos praplėstos iki 3 m. ir < 10 000 km.
T(arNaujas({ metai: y - 1, rida: 5000 }) === true, '5 000 km → vis dar naujas');
T(arNaujas({ metai: y - 2, rida: 3000 }) === true, '2 m. su 3 000 km → naujas (buvusi spraga)');
T(arNaujas({ metai: y - 3, rida: 100 }) === true, '3 m. su 100 km → naujas');
T(arNaujas({ metai: y - 4, rida: 100 }) === false, '4 m. → ne');
T(arNaujas({ metai: y - 1, rida: 10000 }) === false, '10 000 km → ne');
T(arNaujas({ metai: y, rida: null }) === false, 'be ridos → ne (nežinoma ≠ nauja)');
T(/l\.naujas\) l\.rinkosGrupes = \['naujas'\]/.test(src), 'naujas lyginamas su grupe „naujas“');
console.log('\n' + (klaidu ? '✗ ' + klaidu + ' klaidos iš ' + n : '✓ ' + n + '/' + n + ' patikrų praėjo'));
process.exit(klaidu ? 1 : 0);
