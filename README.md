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

## Automatikus kiadás (GitHub Actions)

A `.github/workflows/pages.yml` minden `main`-re érkező push után legenerálja az `index.html`-t, és kiadja az oldalt a GitHub Pages-re. Pull requestnél csak építi és ellenőrzi, nem ad ki. Ezért a forrás (`index.src.html`) szerkesztése után elég pusholni.

Egyszeri beállítás: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

A repóban lévő `index.html` tartalék: ha a Pages forrása „Deploy from a branch”, azt szolgálja ki. Az Actionsre váltás után a CI mindig friss példányt ad ki, a commitolt fájl frissítése nem kötelező.

## Hogyan működik az előrenderelés

A `scripts/prerender.js` böngészőben megnyitja az `index.src.html`-t, kiolvassa a kirenderelt DOM-ot, és `#prerender` tárolóként beágyazza az `index.html`-be. JavaScript nélkül (keresők, lassú kapcsolat) ez látszik. JavaScripttel a futó alkalmazás átveszi a helyét, és a statikus másolat azonnal eltűnik.
