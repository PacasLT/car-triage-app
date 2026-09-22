// backend/nuotraukos.js — skelbimo galerijos dedublikavimas (Nr.45, v2.10.4).

// Tos pačios nuotraukos raktas be dydžio: olxcdn „…/image;s=644x461",
// autoscout24 „…/listing-images/<id>.jpg/250x188.webp", autoplius „…_720x480.jpg".
function nuotraukosRaktas(u) {
  let k = String(u || '').split('?')[0];
  k = k.replace(/;s=\d+x\d+.*$/i, '');
  k = k.replace(/\/\d{2,4}x\d{2,4}\.(webp|jpe?g|png)$/i, '');
  k = k.replace(/_\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, '$1');
  // olxcdn: tas pats failas skirtingais žetonais – raktas iš „fn" lauko
  const m = k.match(/olxcdn\.com\/v1\/files\/[^.\/]+\.([^.\/]+)\./);
  if (m) { try { const fn = JSON.parse(Buffer.from(m[1], 'base64url').toString()).fn; if (fn) return 'olx:' + fn; } catch (e) { /* paliekam kaip yra */ } }
  return k;
}
function nuotraukuUnikalios(sar) {
  const mat = new Set(); const out = [];
  for (const u of sar) { const k = nuotraukosRaktas(u); if (!k || mat.has(k)) continue; mat.add(k); out.push(u); }
  return out;
}

module.exports = { nuotraukosRaktas, nuotraukuUnikalios };
