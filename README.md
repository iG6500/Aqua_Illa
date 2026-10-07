# Aqua Illa weboldal

Statikus oldal, GitHub Pages-en a `main` ágról szolgálva.

## Fájlok

- `index.src.html` — **a szerkesztendő forrás** (JavaScripttel renderelt oldal).
- `index.html` — **generált** fájl: a forrás + a beágyazott, előre renderelt tartalom. Ezt szolgálja ki a Pages. Ne kézzel szerkeszd.
- `assets/` — runtime, React, betűk, logók, videó, favicon, OG-kép.
- `robots.txt`, `sitemap.xml`, `404.html` — SEO és hibaoldal.

## Módosítás után

```sh
npm install        # egyszer
npx playwright-core install chromium   # egyszer (vagy: CHROMIUM_PATH=/út/a/chromiumhoz)
npm run build      # újragenerálja az index.html-t az index.src.html-ből
```

Az új `index.html`-t commitold is: a Pages közvetlenül azt szolgálja ki.

## Hogyan működik az előrenderelés

A `scripts/prerender.js` böngészőben megnyitja az `index.src.html`-t, kiolvassa a kirenderelt DOM-ot, és `#prerender` tárolóként beágyazza az `index.html`-be. JavaScript nélkül (keresők, lassú kapcsolat) ez látszik. JavaScripttel a futó alkalmazás átveszi a helyét, és a statikus másolat azonnal eltűnik.
