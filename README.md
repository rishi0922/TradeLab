# TradeLab

A sandbox-first algorithmic trading workspace for Indian retail. Test strategies on real NSE data, promote them through Paper-Forward when they prove themselves, and only deploy live once they've cleared the gates.

**Live demo:** https://rishi0922.github.io/TradeLab/

## Stack

Pure static site — no build step.

- `index.html` — landing page
- `dashboard.html` — workspace shell (Kite + Groww hybrid)
- `app.js` — SPA router, state, live data layer, order engine
- `static_data.js` — NSE universe + virtual portfolio + fundamentals
- `styles.css` — design system with env-aware accents (indigo for Sandbox, emerald for Live)
- `lightweight-charts.js` — TradingView Lightweight Charts (vendored)

## Run locally

Just open `index.html` in a browser, or for live Yahoo Finance quotes (which are CORS-blocked from `file://`), serve from any static server:

```bash
# pick one
npx serve .
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Live data

Quotes and OHLC come from Yahoo Finance (`query1.finance.yahoo.com`). The fetcher tries direct first, falls back to `corsproxy.io`, and finally to a deterministic simulator built from a seeded fallback table — so the page always shows plausible numbers even offline.

For real broker integration (Zerodha, Upstox), swap the `tryYahooQuote` / `tryYahooChart` functions in `app.js` for your broker's WebSocket feed.

## Deploy

GitHub Actions deploys to Pages on every push to `main` (`.github/workflows/pages.yml`). Enable Pages in repo Settings → Pages → Source: GitHub Actions.

## Keyboard shortcuts

- `/` — focus universal search
- `Esc` — dismiss the order drawer or modal

## Sandbox state

State persists in `localStorage` under the key `tradelab.v2`. Clear it from DevTools to reset to seed data.
