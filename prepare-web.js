// Menyalin berkas web ke www/ dan (kalau bisa) menanam font Roboto Flex
// supaya tampilan tetap sama saat offline pertama kali.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const f of ['index.html', 'sw.js', 'manifest.webmanifest']) {
  fs.copyFileSync(path.join(root, f), path.join(www, f));
}
fs.cpSync(path.join(root, 'icons'), path.join(www, 'icons'), { recursive: true });

try {
  const dir = path.join(root, 'node_modules', '@fontsource-variable', 'roboto-flex', 'files');
  const all = fs.readdirSync(dir).filter(n => /latin-[a-z]+-normal\.woff2$/.test(n) && !/ext/.test(n));
  const pick = all.find(n => /latin-full-normal/.test(n)) || all.find(n => /latin-wdth-normal/.test(n)) || all[0];
  if (!pick) throw new Error('berkas font tidak ditemukan');
  fs.mkdirSync(path.join(www, 'fonts'), { recursive: true });
  fs.copyFileSync(path.join(dir, pick), path.join(www, 'fonts', 'roboto-flex.woff2'));

  const file = path.join(www, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const link = /<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>/;
  if (!link.test(html)) throw new Error('tag font Google tidak ditemukan');
  html = html.replace(link,
    "<style>@font-face{font-family:'Roboto Flex';font-style:normal;font-display:swap;" +
    "font-weight:100 1000;font-stretch:25% 151%;src:url(fonts/roboto-flex.woff2) format('woff2')}</style>");
  fs.writeFileSync(file, html);
  console.log('Font lokal terpasang:', pick);
} catch (e) {
  console.log('Font lokal dilewati (pakai Google Fonts + cache):', e.message);
}
console.log('www siap');
