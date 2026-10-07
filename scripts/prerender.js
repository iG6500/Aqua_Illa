#!/usr/bin/env node
/*
 * Előre renderelt (statikus) index.html generálása az index.src.html-ből.
 *
 * A forrásoldal (index.src.html) JavaScripttel renderelődik. Ez a script
 * böngészőben (Playwright) megnyitja, kiolvassa a kirenderelt DOM-ot, és
 * beágyazza az index.html-be egy #prerender tárolóba. A JS-t nem futtató
 * keresők és felhasználók így valódi tartalmat kapnak; a JS-es oldalon a
 * futó alkalmazás átveszi a helyét, és a statikus másolat eltűnik.
 *
 * Használat:  npm install && npm run build
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'index.src.html');
const OUT = path.join(ROOT, 'index.html');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.mp4': 'video/mp4', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };

// A kirenderelt oldal viewportja: 980 px alatt nincs oldalsó sín, mobilbarát elrendezés.
const VIEWPORT = { width: 820, height: 1000 };

// A futó alkalmazás átvétele után a statikus másolat eltávolítása (azonnal, még festés előtt).
const SWAP_SCRIPT = `<script>
(function () {
  var mo;
  function swap() {
    var r = document.getElementById('dc-root');
    if (!r || !r.childElementCount) return;
    var els = document.querySelectorAll('[data-prerender]');
    for (var i = 0; i < els.length; i++) els[i].parentNode.removeChild(els[i]);
    if (mo) mo.disconnect();
  }
  mo = new MutationObserver(swap);
  mo.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', swap);
})();
</script>`;

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.src.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await serve();
  const url = 'http://127.0.0.1:' + server.address().port + '/index.src.html';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    page.on('pageerror', e => { throw e; });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('#dc-root h1');
    await page.evaluate(() => document.fonts && document.fonts.ready);

    const { html, styles } = await page.evaluate(() => {
      const root = document.getElementById('dc-root');
      const clone = root.cloneNode(true);
      clone.querySelectorAll('video, script').forEach(n => n.remove());
      return {
        html: clone.innerHTML,
        styles: Array.from(document.head.querySelectorAll('style')).map(s => s.textContent)
      };
    });
    if (!html.includes('<h1')) throw new Error('A kirenderelt oldal nem tartalmaz h1-et — a prerender megszakítva.');

    let src = fs.readFileSync(SRC, 'utf8');
    src = src.replace(/<!--prerender:start-->[\s\S]*?<!--prerender:end-->/g, '');
    const css = '<style data-prerender>x-dc{display:none}\n' + styles.join('\n') + '</style>';
    const head = '<!--prerender:start-->' + css + SWAP_SCRIPT + '<!--prerender:end-->';
    const body = '<!--prerender:start--><div id="prerender" data-prerender>' + html + '</div><!--prerender:end-->';
    if (!src.includes('</head>') || !src.includes('<x-dc>')) throw new Error('Hiányzik a </head> vagy az <x-dc> az index.src.html-ből.');
    src = src.replace('</head>', head + '\n</head>').replace('<x-dc>', body + '\n<x-dc>');
    fs.writeFileSync(OUT, src);
    console.log('index.html legenerálva (' + Math.round(src.length / 1024) + ' KB, prerender: ' + Math.round(html.length / 1024) + ' KB)');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
