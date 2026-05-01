/* TradeLab — front-end application
 *
 * Single-file SPA-ish app that renders the dashboard:
 *   - Top tab router (Dashboard / Orders / Holdings / Positions / Funds / Strategies / Explore / Charts)
 *   - Universal symbol search (press '/' to focus, Enter to open first result on Charts)
 *   - Persistent left watchlist
 *   - Slide-in BUY/SELL order ticket
 *   - Sandbox/Live environment toggle (LIVE requires typing "LIVE" to confirm)
 *   - Live quotes via Yahoo Finance with public CORS-proxy fallback,
 *     and a deterministic simulator when both fail.
 *   - Dashboard live NIFTY 50 5-minute chart
 *   - Charts tab with timeframes (5D/1M/3M/6M/1Y) and analysis dropdown:
 *     Technical (OHLC / RSI+Volume / MACD / SMA 50/200 / Bollinger)
 *     Patterns (Cup & Handle / Head & Shoulders / Double Bottom / Doji / Hammer)
 *
 * State persists to localStorage so a reload preserves the user's portfolio.
 */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmt = {
    inr: n => '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    pct: n => (n >= 0 ? '+' : '') + Number(n || 0).toFixed(2) + '%',
    sign: n => (n >= 0 ? '+' : '') + (Math.round(n * 100) / 100).toLocaleString('en-IN'),
    cr: n => {
      if (!n && n !== 0) return '—';
      if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L Cr';
      if (n >= 1000)   return '₹' + (n / 1000).toFixed(2) + ' K Cr';
      return '₹' + Number(n).toLocaleString('en-IN') + ' Cr';
    },
    rel: ts => {
      const d = (Date.now() - ts) / 1000;
      if (d < 60)    return Math.floor(d) + 's ago';
      if (d < 3600)  return Math.floor(d / 60) + 'm ago';
      if (d < 86400) return Math.floor(d / 3600) + 'h ago';
      return Math.floor(d / 86400) + 'd ago';
    }
  };

  // ───────────────────────── State ─────────────────────────
  const STORAGE_KEY = 'tradelab.v2';
  const seed = TL.STATIC.seed;

  const freshState = () => ({
    env: 'SANDBOX',
    funds: { ...seed.funds },
    holdings: seed.holdings.map(h => ({ ...h })),
    positions: seed.positions.map(p => ({ ...p })),
    orders: seed.orders.map(o => ({ ...o })),
    watchlist: [...seed.watchlist],
    notifications: seed.notifications.map(n => ({ ...n })),
    selected: 'RELIANCE',
    activeTab: 'tab-dashboard',
    chartRange: '3mo',
    chartInterval: '1d',
    analysisType: 'ohlc',
  });
  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(freshState(), JSON.parse(raw));
    } catch (e) {}
    return freshState();
  };

  const state = loadState();
  state.quotes = {};
  state.candles = {};
  // Re-rendering guard: prevents the quotes->render->fetch->quotes loop.
  state._rendering = false;

  const persist = () => {
    try {
      const { quotes, candles, _rendering, ...rest } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch (e) {}
  };

  // ───────────────────────── Pub/Sub ─────────────────────────
  const bus = (() => {
    const listeners = {};
    return {
      on:   (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
      emit: (ev, payload) => { (listeners[ev] || []).forEach(fn => fn(payload)); }
    };
  })();

  const bySym = Object.fromEntries(TL.STATIC.stocks.map(s => [s.sym, s]));

  // ───────────────────────── Live data layer ─────────────────────────
  const Q1 = 'https://query1.finance.yahoo.com';
  const PROXIES = [
    u => 'https://corsproxy.io/?' + encodeURIComponent(u),
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  ];

  const fetchJson = async (url, timeoutMs = 6000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctrl.signal, mode: 'cors' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  };
  const tryAll = async (url) => {
    try { return await fetchJson(url); } catch (e) {}
    for (const wrap of PROXIES) {
      try { return await fetchJson(wrap(url)); } catch (e) {}
    }
    return null;
  };

  const tryYahooQuote = (yahooSyms) =>
    tryAll(`${Q1}/v7/finance/quote?symbols=${encodeURIComponent(yahooSyms.join(','))}`);
  const tryYahooChart = (yahooSym, range = '3mo', interval = '1d') =>
    tryAll(`${Q1}/v8/finance/chart/${yahooSym}?range=${range}&interval=${interval}`);

  // Synthesised candle series from a seed close (fallback when fetch fails).
  const synthesiseSeries = (closePrice, n = 90, intervalSec = 86400) => {
    let p = closePrice * 0.92;
    const out = [];
    let s = closePrice * 13.37;
    const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const start = Math.floor(Date.now() / 1000) - n * intervalSec;
    for (let i = 0; i < n; i++) {
      const drift = (closePrice - p) * 0.02;
      const vol = closePrice * 0.014;
      const o = p;
      const c = Math.max(1, p + drift + (rng() - 0.5) * vol * 2);
      const h = Math.max(o, c) + rng() * vol;
      const l = Math.min(o, c) - rng() * vol;
      const volume = Math.floor(rng() * 1e6 + 1e5);
      out.push({
        time: start + i * intervalSec,
        open: +o.toFixed(2), high: +h.toFixed(2), low: +l.toFixed(2), close: +c.toFixed(2),
        volume
      });
      p = c;
    }
    out[out.length - 1].close = closePrice;
    return out;
  };

  const refreshQuotes = async (syms) => {
    syms = (syms || Object.keys(state.quotes).concat(state.watchlist).concat(state.holdings.map(h => h.sym)))
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter(s => bySym[s]);
    if (!syms.length) return;
    const yahoo = syms.map(s => bySym[s].yahoo);
    const data = await tryYahooQuote(yahoo);
    const result = (data && data.quoteResponse && data.quoteResponse.result) || [];
    const byYahoo = Object.fromEntries(result.map(r => [r.symbol, r]));

    syms.forEach(s => {
      const r = byYahoo[bySym[s].yahoo];
      if (r && typeof r.regularMarketPrice === 'number') {
        state.quotes[s] = {
          ltp: r.regularMarketPrice,
          prevClose: r.regularMarketPreviousClose ?? r.previousClose ?? r.regularMarketPrice,
          change: r.regularMarketChange ?? 0,
          pct: r.regularMarketChangePercent ?? 0,
          dayHigh: r.regularMarketDayHigh,
          dayLow:  r.regularMarketDayLow,
          open:    r.regularMarketOpen,
          ts: Date.now(), live: true
        };
      } else {
        const fb = TL.STATIC.fallback[s] || { close: 100, prevClose: 100 };
        const prev = state.quotes[s]?.ltp ?? fb.close;
        const wob = prev * (Math.random() - 0.5) * 0.004;
        const ltp = +(prev + wob).toFixed(2);
        state.quotes[s] = {
          ltp, prevClose: fb.prevClose,
          change: ltp - fb.prevClose,
          pct: ((ltp - fb.prevClose) / fb.prevClose) * 100,
          dayHigh: Math.max(ltp, fb.close),
          dayLow:  Math.min(ltp, fb.close * 0.99),
          open: fb.prevClose,
          ts: Date.now(), live: false
        };
      }
    });
    bus.emit('quotes', syms);
  };

  const fetchCandles = async (sym, range = '3mo', interval = '1d', { fresh = false } = {}) => {
    const key = `${sym}_${range}_${interval}`;
    if (!fresh && state.candles[key]) return state.candles[key];
    const meta = bySym[sym];
    if (!meta) return [];
    const data = await tryYahooChart(meta.yahoo, range, interval);
    const r = data?.chart?.result?.[0];
    if (r?.timestamp && r?.indicators?.quote?.[0]) {
      const ts = r.timestamp;
      const q  = r.indicators.quote[0];
      const out = ts.map((t, i) => ({
        time: t,
        open:  q.open?.[i]   ?? q.close?.[i],
        high:  q.high?.[i]   ?? q.close?.[i],
        low:   q.low?.[i]    ?? q.close?.[i],
        close: q.close?.[i]  ?? q.open?.[i],
        volume: q.volume?.[i] ?? 0
      })).filter(c => c.close != null);
      state.candles[key] = out;
      return out;
    }
    // Fallback: synthesise. Choose interval seconds by interval string.
    const intervalSec = ({ '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '60m': 3600, '1d': 86400 })[interval] || 86400;
    const n = ({ '1d': 78, '5d': 78 * 5, '1mo': 22, '3mo': 66, '6mo': 132, '1y': 252 })[range] || 90;
    const fb = TL.STATIC.fallback[sym] || { close: 100 };
    const out = synthesiseSeries(fb.close, n, intervalSec);
    state.candles[key] = out;
    return out;
  };

  let pollTimer = null;
  const startPolling = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      const visible = state.watchlist
        .concat(state.holdings.map(h => h.sym))
        .concat(['NIFTY50', 'BANKNIFTY', 'NIFTYIT', state.selected])
        .filter((v, i, a) => a.indexOf(v) === i);
      refreshQuotes(visible);
      // Refresh dashboard NIFTY 5m chart if we're on dashboard
      if (state.activeTab === 'tab-dashboard') {
        delete state.candles['NIFTY50_1d_5m'];
        renderDashboardNiftyChart();
      }
    }, 30000);
  };

  // ───────────────────────── Indicators ─────────────────────────
  const ind = {
    sma(values, period) {
      const out = new Array(values.length).fill(null);
      let sum = 0;
      for (let i = 0; i < values.length; i++) {
        sum += values[i];
        if (i >= period) sum -= values[i - period];
        if (i >= period - 1) out[i] = sum / period;
      }
      return out;
    },
    ema(values, period) {
      const out = new Array(values.length).fill(null);
      const k = 2 / (period + 1);
      let prev;
      for (let i = 0; i < values.length; i++) {
        if (i === period - 1) {
          let s = 0; for (let j = 0; j < period; j++) s += values[j];
          prev = s / period; out[i] = prev;
        } else if (i >= period) {
          prev = values[i] * k + prev * (1 - k);
          out[i] = prev;
        }
      }
      return out;
    },
    rsi(values, period = 14) {
      const out = new Array(values.length).fill(null);
      let gain = 0, loss = 0;
      for (let i = 1; i <= period; i++) {
        const ch = values[i] - values[i - 1];
        if (ch >= 0) gain += ch; else loss -= ch;
      }
      let avgG = gain / period, avgL = loss / period;
      out[period] = 100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL));
      for (let i = period + 1; i < values.length; i++) {
        const ch = values[i] - values[i - 1];
        const g = ch > 0 ? ch : 0, l = ch < 0 ? -ch : 0;
        avgG = (avgG * (period - 1) + g) / period;
        avgL = (avgL * (period - 1) + l) / period;
        out[i] = 100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL));
      }
      return out;
    },
    macd(values, fast = 12, slow = 26, signal = 9) {
      const ef = ind.ema(values, fast);
      const es = ind.ema(values, slow);
      const macd = values.map((_, i) => (ef[i] != null && es[i] != null) ? ef[i] - es[i] : null);
      const validStart = macd.findIndex(v => v != null);
      const macdValid = macd.slice(validStart).map(v => v ?? 0);
      const sig = ind.ema(macdValid, signal);
      const sigFull = new Array(values.length).fill(null);
      for (let i = 0; i < sig.length; i++) sigFull[validStart + i] = sig[i];
      const hist = values.map((_, i) => (macd[i] != null && sigFull[i] != null) ? macd[i] - sigFull[i] : null);
      return { macd, signal: sigFull, histogram: hist };
    },
    bollinger(values, period = 20, mult = 2) {
      const sma = ind.sma(values, period);
      const upper = new Array(values.length).fill(null);
      const lower = new Array(values.length).fill(null);
      for (let i = period - 1; i < values.length; i++) {
        const slice = values.slice(i - period + 1, i + 1);
        const m = sma[i];
        const v = slice.reduce((s, x) => s + (x - m) ** 2, 0) / period;
        const sd = Math.sqrt(v);
        upper[i] = m + mult * sd;
        lower[i] = m - mult * sd;
      }
      return { middle: sma, upper, lower };
    }
  };

  // ───────────────────────── Pattern detection ─────────────────────────
  // Each detector returns an array of marker descriptors:
  //   { time, position: 'aboveBar'|'belowBar', color, shape, text, idx }
  const patterns = {
    doji(c) {
      const out = [];
      for (let i = 0; i < c.length; i++) {
        const range = c[i].high - c[i].low;
        const body = Math.abs(c[i].close - c[i].open);
        if (range > 0 && body / range < 0.1) {
          out.push({ time: c[i].time, position: 'aboveBar', color: '#facc15', shape: 'circle', text: 'Doji' });
        }
      }
      return out.slice(-5);
    },
    hammer(c) {
      const out = [];
      for (let i = 0; i < c.length; i++) {
        const body = Math.abs(c[i].close - c[i].open);
        const lowerWick = Math.min(c[i].open, c[i].close) - c[i].low;
        const upperWick = c[i].high - Math.max(c[i].open, c[i].close);
        if (body > 0 && lowerWick >= 2 * body && upperWick <= body * 0.4) {
          out.push({ time: c[i].time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Hammer' });
        }
      }
      return out.slice(-5);
    },
    'double-bottom'(c) {
      // Find two local minima within 2% of each other separated by >=10 bars,
      // with a peak between them. Return marker on the second bottom.
      const lows = c.map(b => b.low);
      const out = [];
      const isLocalMin = i => i > 2 && i < c.length - 3 &&
        lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] && lows[i] < lows[i + 2];
      const mins = [];
      for (let i = 0; i < c.length; i++) if (isLocalMin(i)) mins.push(i);
      for (let a = 0; a < mins.length - 1; a++) {
        for (let b = a + 1; b < mins.length; b++) {
          if (mins[b] - mins[a] < 10) continue;
          const ratio = Math.abs(lows[mins[a]] - lows[mins[b]]) / lows[mins[a]];
          if (ratio < 0.02) {
            const peak = Math.max(...lows.slice(mins[a] + 1, mins[b]));
            if (peak > Math.max(lows[mins[a]], lows[mins[b]]) * 1.02) {
              out.push({ time: c[mins[b]].time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Double Bottom' });
            }
          }
        }
      }
      return out.slice(-3);
    },
    'head-shoulders'(c) {
      // Three local maxima where middle is highest, shoulders within 5%.
      const highs = c.map(b => b.high);
      const out = [];
      const isLocalMax = i => i > 2 && i < c.length - 3 &&
        highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] && highs[i] > highs[i + 2];
      const maxes = [];
      for (let i = 0; i < c.length; i++) if (isLocalMax(i)) maxes.push(i);
      for (let i = 0; i < maxes.length - 2; i++) {
        const a = maxes[i], b = maxes[i + 1], cc = maxes[i + 2];
        if (b - a < 5 || cc - b < 5) continue;
        if (highs[b] > highs[a] && highs[b] > highs[cc] &&
            Math.abs(highs[a] - highs[cc]) / highs[a] < 0.05) {
          out.push({ time: c[cc].time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'H&S' });
        }
      }
      return out.slice(-3);
    },
    'cup-handle'(c) {
      // Heuristic: rolling 30-bar window where the middle low is the lowest
      // and the recent close is near the window high (within 5%), with a
      // small dip in the last 5 bars.
      const out = [];
      const W = Math.min(40, c.length - 6);
      for (let end = W; end < c.length - 2; end += 5) {
        const win = c.slice(end - W, end);
        const lows = win.map(b => b.low);
        const minIdx = lows.indexOf(Math.min(...lows));
        if (minIdx < 8 || minIdx > W - 8) continue;
        const winHigh = Math.max(...win.map(b => b.high));
        if (Math.abs(c[end].close - winHigh) / winHigh > 0.05) continue;
        // Check small handle pullback in last 5 bars
        const last5 = c.slice(end, end + 5);
        const dip = Math.min(...last5.map(b => b.low));
        if ((winHigh - dip) / winHigh < 0.08) {
          out.push({ time: c[end].time, position: 'aboveBar', color: '#818cf8', shape: 'circle', text: 'Cup' });
        }
      }
      return out.slice(-2);
    }
  };

  const ANALYSIS_INSIGHT = {
    ohlc:        'Standard candlestick view. Each bar shows open / high / low / close.',
    rsi:         'RSI > 70 suggests overbought, < 30 oversold. Volume below confirms participation.',
    macd:        'MACD = EMA(12) − EMA(26). Signal = EMA(MACD, 9). Histogram positive ⇒ momentum building.',
    sma:         '50-day vs 200-day SMA. Crossing above (Golden Cross) is a classic long signal.',
    bollinger:   'Price hugging the upper band signals strength; tagging the lower band, weakness.',
    'pat-cup':       'A rounded U-shape followed by a brief pullback — classic continuation pattern.',
    'pat-head':      'Three peaks, middle highest. Bearish reversal signal once neckline breaks.',
    'pat-double':    'Two roughly-equal lows with a peak between. Bullish reversal off the second low.',
    'pat-doji':      'Open ≈ close — indecision. Often precedes a reversal at extremes.',
    'pat-hammer':    'Long lower wick, small body up top. Bullish if it appears after a downtrend.',
  };

  // ───────────────────────── Search ─────────────────────────
  const searchSymbols = (q) => {
    q = (q || '').trim().toUpperCase();
    if (!q) return [];
    return TL.STATIC.stocks
      .filter(s => s.sym.includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, 8);
  };

  // ───────────────────────── Order ticket ─────────────────────────
  const Order = {
    open(sym, side = 'BUY') {
      state.selected = sym;
      const drawer = $('#order-drawer');
      drawer.classList.remove('hidden');
      requestAnimationFrame(() => drawer.classList.add('open'));
      drawer.dataset.side = side;
      this.render(sym, side);
    },
    close() {
      const drawer = $('#order-drawer');
      drawer.classList.remove('open');
      setTimeout(() => drawer.classList.add('hidden'), 220);
    },
    render(sym, side) {
      const meta = bySym[sym];
      const q = state.quotes[sym] || { ltp: TL.STATIC.fallback[sym]?.close || 0 };
      $('#od-side-buy').classList.toggle('active', side === 'BUY');
      $('#od-side-sell').classList.toggle('active', side === 'SELL');
      $('#od-symbol').textContent = sym;
      $('#od-name').textContent = meta?.name || sym;
      $('#od-ltp').textContent = fmt.inr(q.ltp);
      if (!$('#od-qty').value) $('#od-qty').value = 1;
      $('#od-price').value = (q.ltp || 0).toFixed(2);
      this.updatePreview();
    },
    updatePreview() {
      const qty = +$('#od-qty').value || 0;
      const type = $('#od-type').value;
      const sym = $('#od-symbol').textContent;
      const q = state.quotes[sym] || { ltp: TL.STATIC.fallback[sym]?.close || 0 };
      const px = type === 'MARKET' ? q.ltp : (+$('#od-price').value || q.ltp);
      const total = qty * px;
      $('#od-total').textContent = fmt.inr(total);
      $('#od-margin').textContent = fmt.inr(total);
      const side = $('#order-drawer').dataset.side;
      $('#od-submit').textContent =
        (side === 'BUY' ? 'Place BUY · ' : 'Place SELL · ') + qty + ' × ' +
        (type === 'MARKET' ? 'MKT' : fmt.inr(px));
      $('#od-submit').className = 'od-submit ' + (side === 'BUY' ? 'buy' : 'sell');
    },
    submit() {
      const sym = $('#od-symbol').textContent;
      const side = $('#order-drawer').dataset.side;
      const qty = +$('#od-qty').value || 0;
      const type = $('#od-type').value;
      const q = state.quotes[sym] || { ltp: TL.STATIC.fallback[sym]?.close || 0 };
      const px = type === 'MARKET' ? q.ltp : (+$('#od-price').value || q.ltp);
      if (qty <= 0) return toast('Enter quantity', 'err');

      const order = {
        id: 'TL-' + (1100 + state.orders.length + 1),
        sym, side, qty, price: +(+px).toFixed(2), type,
        status: type === 'MARKET' ? 'EXECUTED' : 'OPEN',
        env: state.env,
        ts: Date.now()
      };
      state.orders.unshift(order);
      if (order.status === 'EXECUTED') Order.applyFill(order);
      pushNotification({
        kind: 'fill',
        msg: `${sym} ${side} ${qty} @ ${fmt.inr(px)} ${order.status === 'EXECUTED' ? 'filled' : 'placed'} in ${state.env}.`
      });
      persist();
      Order.close();
      toast(`${order.status === 'EXECUTED' ? 'Order filled' : 'Order placed'}: ${sym} ${side} ${qty}`, 'ok');
      bus.emit('orders');
      bus.emit('holdings');
      bus.emit('funds');
    },
    applyFill(o) {
      const cost = o.qty * o.price;
      if (o.side === 'BUY') {
        if (state.funds.cash < cost) toast('Insufficient funds — order placed but flagged.', 'err');
        state.funds.cash -= cost;
        state.funds.used += cost;
        const h = state.holdings.find(h => h.sym === o.sym);
        if (h) {
          const newQty = h.qty + o.qty;
          h.avg = (h.avg * h.qty + o.price * o.qty) / newQty;
          h.qty = newQty;
          h.ts  = o.ts;
        } else {
          state.holdings.push({ sym: o.sym, qty: o.qty, avg: o.price, ts: o.ts });
        }
      } else {
        const h = state.holdings.find(h => h.sym === o.sym);
        if (!h || h.qty < o.qty) return toast('Not enough holdings to sell.', 'err');
        h.qty -= o.qty;
        state.funds.cash += cost;
        state.funds.used = Math.max(0, state.funds.used - h.avg * o.qty);
        if (h.qty === 0) state.holdings = state.holdings.filter(x => x !== h);
      }
    }
  };

  // ───────────────────────── Toast / Notifications ─────────────────────────
  const toast = (msg, tone = 'ok') => {
    const t = document.createElement('div');
    t.className = `tl-toast tone-${tone}`;
    t.textContent = msg;
    $('#toast-stack').appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 3500);
  };
  const pushNotification = (n) => {
    state.notifications.unshift({ id: 'n' + Date.now(), ts: Date.now(), ...n });
    state.notifications = state.notifications.slice(0, 30);
    bus.emit('notifications');
  };

  // ───────────────────────── Watchlist ─────────────────────────
  const Watchlist = {
    render() {
      const root = $('#watchlist');
      if (!root) return;
      root.innerHTML = state.watchlist.map(sym => {
        const meta = bySym[sym] || { name: sym };
        const q = state.quotes[sym];
        const ltp = q ? q.ltp : (TL.STATIC.fallback[sym]?.close ?? 0);
        const pct = q ? q.pct : 0;
        const cls = pct >= 0 ? 'pos' : 'neg';
        return `
          <div class="wl-row ${state.selected === sym ? 'selected' : ''}" data-sym="${sym}">
            <div class="wl-meta">
              <div class="wl-sym">${sym}</div>
              <div class="wl-name">${meta.name}</div>
            </div>
            <div class="wl-right">
              <div class="wl-ltp">${fmt.inr(ltp)}</div>
              <div class="wl-pct ${cls}">${fmt.pct(pct)}</div>
            </div>
            <div class="wl-actions">
              <button class="wl-btn buy"  data-act="buy"  data-sym="${sym}" title="Buy">B</button>
              <button class="wl-btn sell" data-act="sell" data-sym="${sym}" title="Sell">S</button>
              <button class="wl-btn x"    data-act="rm"   data-sym="${sym}" title="Remove">×</button>
            </div>
          </div>`;
      }).join('') || '<div class="empty-watch">Search a symbol and add it to your watchlist.</div>';
    },
    init() {
      $('#watchlist').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        const row = e.target.closest('.wl-row');
        if (btn) {
          const { act, sym } = btn.dataset;
          if (act === 'buy')  return Order.open(sym, 'BUY');
          if (act === 'sell') return Order.open(sym, 'SELL');
          if (act === 'rm') {
            state.watchlist = state.watchlist.filter(x => x !== sym);
            persist(); Watchlist.render();
            return;
          }
        }
        if (row) {
          state.selected = row.dataset.sym;
          persist();
          renderQuickPanel();
          Watchlist.render();
        }
      });
      bus.on('quotes', () => Watchlist.render());
    },
    add(sym) {
      if (!state.watchlist.includes(sym)) state.watchlist.unshift(sym);
      persist(); Watchlist.render(); refreshQuotes([sym]);
    }
  };

  // ───────────────────────── Search ─────────────────────────
  const Search = {
    init() {
      const inp = $('#global-search');
      const dd  = $('#search-results');
      const close = () => dd.classList.add('hidden');
      const open  = () => dd.classList.remove('hidden');
      const renderResults = () => {
        const list = searchSymbols(inp.value);
        if (!list.length) { close(); return list; }
        dd.innerHTML = list.map((s, i) => `
          <div class="sr-row ${i === 0 ? 'highlight' : ''}" data-sym="${s.sym}">
            <div>
              <div class="sr-sym">${s.sym}</div>
              <div class="sr-name">${s.name}</div>
            </div>
            <div class="sr-actions">
              <button class="sr-add" data-sym="${s.sym}" data-act="watch">+ Watch</button>
              <button class="sr-buy" data-sym="${s.sym}" data-act="buy">Buy</button>
            </div>
          </div>`).join('');
        open();
        return list;
      };
      const openSym = (sym) => {
        state.selected = sym;
        persist();
        renderQuickPanel();
        Watchlist.render();
        Router.go('tab-charts');
        inp.value = ''; close();
      };
      inp.addEventListener('input', () => renderResults());
      inp.addEventListener('focus', () => { if (inp.value) renderResults(); });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const list = searchSymbols(inp.value);
          if (list[0]) openSym(list[0].sym);
        } else if (e.key === 'Escape') {
          close(); inp.blur();
        }
      });
      document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrap')) close(); });
      dd.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
          if (btn.dataset.act === 'watch') Watchlist.add(btn.dataset.sym);
          if (btn.dataset.act === 'buy')   Order.open(btn.dataset.sym, 'BUY');
          inp.value = ''; close(); return;
        }
        const row = e.target.closest('.sr-row');
        if (row) openSym(row.dataset.sym);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault(); inp.focus();
        }
      });
    }
  };

  // ───────────────────────── Env toggle ─────────────────────────
  const Env = {
    apply() {
      document.documentElement.dataset.env = state.env;
      $('#env-pill').textContent = state.env;
      $('#env-pill').dataset.env = state.env;
    },
    toggle() {
      if (state.env === 'SANDBOX') {
        $('#env-modal').classList.remove('hidden');
        $('#env-confirm-input').value = '';
        $('#env-confirm-go').disabled = true;
        setTimeout(() => $('#env-confirm-input').focus(), 60);
      } else {
        state.env = 'SANDBOX'; persist(); this.apply();
        toast('Switched back to SANDBOX.', 'ok');
      }
    },
    confirm() {
      state.env = 'LIVE'; persist(); this.apply();
      $('#env-modal').classList.add('hidden');
      toast('LIVE mode is simulated in this preview — real broker bridge requires API keys.', 'warn');
      pushNotification({ kind: 'sys', msg: 'Environment switched to LIVE.' });
    }
  };

  // ───────────────────────── Quick panel ─────────────────────────
  const renderQuickPanel = () => {
    const sym = state.selected;
    const root = $('#quick-panel');
    if (!sym || !root) return;
    const meta = bySym[sym] || { name: sym };
    const q = state.quotes[sym] || {};
    const ltp = q.ltp ?? TL.STATIC.fallback[sym]?.close ?? 0;
    const pct = q.pct ?? 0;
    const cls = pct >= 0 ? 'pos' : 'neg';
    root.innerHTML = `
      <div class="qp-head">
        <div>
          <div class="qp-sym">${sym}</div>
          <div class="qp-name">${meta.name}</div>
        </div>
        <div class="qp-px">
          <div class="qp-ltp">${fmt.inr(ltp)}</div>
          <div class="qp-pct ${cls}">${fmt.pct(pct)}</div>
        </div>
      </div>
      <div class="qp-grid">
        <div><span>Open</span><b>${q.open  != null ? fmt.inr(q.open)     : '—'}</b></div>
        <div><span>High</span><b>${q.dayHigh != null ? fmt.inr(q.dayHigh) : '—'}</b></div>
        <div><span>Low</span> <b>${q.dayLow  != null ? fmt.inr(q.dayLow)  : '—'}</b></div>
        <div><span>Prev</span><b>${q.prevClose != null ? fmt.inr(q.prevClose) : '—'}</b></div>
      </div>
      <div class="qp-actions">
        <button class="btn-buy"   data-act="buy">BUY</button>
        <button class="btn-sell"  data-act="sell">SELL</button>
        <button class="btn-chart" data-act="chart">Chart →</button>
      </div>`;
    root.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.act === 'buy')   Order.open(sym, 'BUY');
        if (b.dataset.act === 'sell')  Order.open(sym, 'SELL');
        if (b.dataset.act === 'chart') Router.go('tab-charts');
      });
    });
  };

  // ───────────────────────── Tab Router ─────────────────────────
  const Router = {
    go(id) {
      state.activeTab = id;
      $$('.tab-pane').forEach(p => p.classList.toggle('hidden', p.id !== id));
      $$('.tab-link').forEach(l => l.classList.toggle('active', l.dataset.tab === id));
      persist();
      const fn = Views[id]; if (fn) fn();
    },
    init() {
      $$('.tab-link').forEach(l => l.addEventListener('click', (e) => {
        e.preventDefault(); this.go(l.dataset.tab);
      }));
      this.go(state.activeTab || 'tab-dashboard');
    }
  };

  // ───────────────────────── Dashboard NIFTY 5m chart ─────────────────────────
  let dashChart, dashSeries;
  const renderDashboardNiftyChart = async () => {
    const el = $('#dash-nifty-chart');
    if (!el || !window.LightweightCharts) return;
    const candles = await fetchCandles('NIFTY50', '1d', '5m');
    if (!candles || !candles.length) return;
    const last = candles[candles.length - 1];
    const first = candles[0];
    const pct = first.open ? ((last.close - first.open) / first.open) * 100 : 0;
    $('#dash-nifty-ltp').textContent = last.close.toFixed(2);
    $('#dash-nifty-pct').textContent = fmt.pct(pct);
    $('#dash-nifty-pct').className = 'chart-pct ' + (pct >= 0 ? 'pos' : 'neg');

    if (!dashChart) {
      el.innerHTML = '';
      dashChart = LightweightCharts.createChart(el, {
        width: el.clientWidth, height: 280,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
        crosshair: { mode: 1 }
      });
      dashSeries = dashChart.addAreaSeries({
        topColor: 'rgba(99,102,241,0.3)',
        bottomColor: 'rgba(99,102,241,0.0)',
        lineColor: '#818cf8',
        lineWidth: 2
      });
      const ro = new ResizeObserver(() => { if (dashChart) dashChart.applyOptions({ width: el.clientWidth }); });
      ro.observe(el);
    }
    dashSeries.setData(candles.map(c => ({ time: c.time, value: c.close })));
    dashChart.timeScale().fitContent();
  };

  // ───────────────────────── Views ─────────────────────────
  const Views = {};

  Views['tab-dashboard'] = () => {
    const indices = ['NIFTY50', 'BANKNIFTY', 'NIFTYIT'];
    $('#indices-strip').innerHTML = indices.map(s => {
      const q = state.quotes[s] || {};
      const ltp = q.ltp ?? TL.STATIC.fallback[s]?.close ?? 0;
      const pct = q.pct ?? 0;
      const cls = pct >= 0 ? 'pos' : 'neg';
      return `
        <div class="ix-card">
          <div class="ix-name">${bySym[s]?.name || s}</div>
          <div class="ix-ltp">${ltp.toFixed(2)}</div>
          <div class="ix-pct ${cls}">${fmt.pct(pct)}</div>
        </div>`;
    }).join('');

    const inv = state.holdings.reduce((s, h) => s + h.qty * h.avg, 0);
    const cur = state.holdings.reduce((s, h) => s + h.qty * (state.quotes[h.sym]?.ltp ?? h.avg), 0);
    const day = state.holdings.reduce((s, h) => {
      const q = state.quotes[h.sym]; if (!q) return s;
      return s + h.qty * (q.ltp - q.prevClose);
    }, 0);
    const totPnl = cur - inv;
    const cls = totPnl >= 0 ? 'pos' : 'neg';
    $('#dash-summary').innerHTML = `
      <div class="kpi"><span>Invested</span><b>${fmt.inr(inv)}</b></div>
      <div class="kpi"><span>Current</span><b>${fmt.inr(cur)}</b></div>
      <div class="kpi"><span>P&L</span><b class="${cls}">${fmt.sign(totPnl)} (${fmt.pct(inv ? (totPnl / inv) * 100 : 0)})</b></div>
      <div class="kpi"><span>Today</span><b class="${day >= 0 ? 'pos' : 'neg'}">${fmt.sign(day)}</b></div>
      <div class="kpi"><span>Cash</span><b>${fmt.inr(state.funds.cash)}</b></div>`;

    $('#dash-news').innerHTML = TL.STATIC.news.map(n => `
      <div class="news-row">
        <div class="news-src">${n.src}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-time">${fmt.rel(n.ts)}</div>
      </div>`).join('');

    const pool = TL.STATIC.stocks.filter(s => s.sector !== 'Index')
      .map(s => ({ ...s, q: state.quotes[s.sym] || {} }))
      .filter(s => s.q.pct != null);
    const gainers = [...pool].sort((a, b) => b.q.pct - a.q.pct).slice(0, 5);
    const losers  = [...pool].sort((a, b) => a.q.pct - b.q.pct).slice(0, 5);
    const renderMover = s => `
      <div class="mover" data-sym="${s.sym}">
        <div><b>${s.sym}</b><span>${s.name}</span></div>
        <div class="${s.q.pct >= 0 ? 'pos' : 'neg'}">${fmt.pct(s.q.pct)}</div>
      </div>`;
    $('#dash-gainers').innerHTML = gainers.map(renderMover).join('') || '<div class="empty">Loading…</div>';
    $('#dash-losers').innerHTML  = losers.map(renderMover).join('')  || '<div class="empty">Loading…</div>';
    $$('#dash-gainers .mover, #dash-losers .mover').forEach(el => {
      el.addEventListener('click', () => {
        state.selected = el.dataset.sym; persist();
        renderQuickPanel(); Watchlist.render();
      });
    });

    renderDashboardNiftyChart();
  };

  Views['tab-orders'] = () => {
    const tbody = $('#orders-tbody');
    if (!state.orders.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No orders yet. Place one from the watchlist.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.orders.map(o => `
      <tr>
        <td class="mono">${o.id}</td>
        <td><b>${o.sym}</b></td>
        <td><span class="pill side-${o.side.toLowerCase()}">${o.side}</span></td>
        <td>${o.qty}</td>
        <td class="mono">${fmt.inr(o.price)}</td>
        <td>${o.type}</td>
        <td><span class="pill st-${o.status.toLowerCase()}">${o.status}</span></td>
        <td class="muted">${new Date(o.ts).toLocaleString('en-IN')}</td>
      </tr>`).join('');
  };

  Views['tab-holdings'] = () => {
    const tbody = $('#holdings-tbody');
    if (!state.holdings.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No holdings yet. Place a BUY order to begin.</td></tr>`;
      $('#holdings-summary').innerHTML = '';
      return;
    }
    let inv = 0, cur = 0, day = 0;
    tbody.innerHTML = state.holdings.map(h => {
      const q = state.quotes[h.sym] || {};
      const ltp = q.ltp ?? h.avg;
      const dayChg = q.prevClose ? (ltp - q.prevClose) : 0;
      const pnl = (ltp - h.avg) * h.qty;
      const pnlPct = ((ltp - h.avg) / h.avg) * 100;
      inv += h.avg * h.qty; cur += ltp * h.qty; day += dayChg * h.qty;
      const cls = pnl >= 0 ? 'pos' : 'neg';
      return `
        <tr>
          <td><b>${h.sym}</b></td>
          <td>${h.qty}</td>
          <td class="mono">${fmt.inr(h.avg)}</td>
          <td class="mono">${fmt.inr(ltp)}</td>
          <td class="mono ${dayChg >= 0 ? 'pos' : 'neg'}">${fmt.sign(dayChg)}</td>
          <td class="mono ${cls}">${fmt.sign(pnl)}</td>
          <td class="mono ${cls}">${fmt.pct(pnlPct)}</td>
          <td><button class="btn-mini sell" data-sym="${h.sym}" data-act="sell">SELL</button></td>
        </tr>`;
    }).join('');
    const totPnl = cur - inv;
    const cls = totPnl >= 0 ? 'pos' : 'neg';
    $('#holdings-summary').innerHTML = `
      <div class="kpi"><span>Invested</span><b>${fmt.inr(inv)}</b></div>
      <div class="kpi"><span>Current</span><b>${fmt.inr(cur)}</b></div>
      <div class="kpi"><span>P&L</span><b class="${cls}">${fmt.sign(totPnl)} (${fmt.pct(inv ? (totPnl / inv) * 100 : 0)})</b></div>
      <div class="kpi"><span>Today's P&L</span><b class="${day >= 0 ? 'pos' : 'neg'}">${fmt.sign(day)}</b></div>`;
    tbody.querySelectorAll('button[data-act="sell"]').forEach(b => {
      b.addEventListener('click', () => Order.open(b.dataset.sym, 'SELL'));
    });
  };

  Views['tab-positions'] = () => {
    const tbody = $('#positions-tbody');
    if (!state.positions.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No intraday positions. Sandbox positions appear here when you place MIS orders.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.positions.map(p => `
      <tr>
        <td>${p.sym}</td><td>${p.qty}</td>
        <td class="mono">${fmt.inr(p.avg)}</td>
        <td class="mono">${fmt.inr(p.ltp || p.avg)}</td>
        <td class="mono">${fmt.sign((p.ltp - p.avg) * p.qty)}</td>
        <td>${p.product || 'MIS'}</td>
      </tr>`).join('');
  };

  Views['tab-funds'] = () => {
    const f = state.funds;
    const inv = state.holdings.reduce((s, h) => s + h.qty * h.avg, 0);
    $('#funds-grid').innerHTML = `
      <div class="kpi big"><span>Available Cash</span><b>${fmt.inr(f.cash)}</b></div>
      <div class="kpi big"><span>Used Margin</span><b>${fmt.inr(inv)}</b></div>
      <div class="kpi big"><span>Total Equity</span><b>${fmt.inr(f.cash + inv)}</b></div>
      <div class="kpi big"><span>Currency</span><b>${f.currency}</b></div>`;
  };

  Views['tab-strategies'] = () => {
    const root = $('#strategies-grid');
    root.innerHTML = TL.STATIC.strategies.map(s => `
      <div class="strat-card tone-${s.tone}" data-id="${s.id}">
        <div class="strat-head">
          <div>
            <div class="strat-name">${s.name}</div>
            <div class="strat-blurb">${s.blurb}</div>
          </div>
          <span class="tag">${s.tag}</span>
        </div>
        <div class="strat-stats">
          <div><span>Win Rate</span><b>${s.stats.winRate}%</b></div>
          <div><span>P/L</span><b class="${s.stats.pl >= 0 ? 'pos' : 'neg'}">${fmt.pct(s.stats.pl)}</b></div>
          <div><span>Sharpe</span><b>${s.stats.sharpe}</b></div>
          <div><span>Max DD</span><b class="neg">${s.stats.dd}%</b></div>
        </div>
        <div class="strat-actions">
          <button class="btn-primary" data-id="${s.id}" data-act="open">Open</button>
          <button class="btn-ghost"   data-id="${s.id}" data-act="backtest">Backtest</button>
          <button class="btn-ghost"   data-id="${s.id}" data-act="paper">Paper-Forward</button>
        </div>
      </div>`).join('');
    // Re-bind on every render (no { once: true } — strategies tab gets opened repeatedly)
    root.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const s = TL.STATIC.strategies.find(x => x.id === b.dataset.id); if (!s) return;
      const act = b.dataset.act;
      const det = $('#strategy-detail');
      if (act === 'open' || act === 'backtest') {
        det.classList.remove('hidden');
        $('#strat-det-name').textContent  = s.name;
        $('#strat-det-blurb').textContent = s.blurb;
        $('#strat-det-stats').innerHTML = `
          <div><span>Win Rate</span><b>${s.stats.winRate}%</b></div>
          <div><span>Profit Factor</span><b>${s.stats.profitFactor}</b></div>
          <div><span>Sharpe</span><b>${s.stats.sharpe}</b></div>
          <div><span>Max Drawdown</span><b class="neg">${s.stats.dd}%</b></div>
          <div><span>Trades</span><b>${s.stats.trades.toLocaleString()}</b></div>
          <div><span>Expected P/L</span><b class="${s.stats.pl >= 0 ? 'pos' : 'neg'}">${fmt.pct(s.stats.pl)}</b></div>`;
        $('#strat-det-params').innerHTML = Object.entries(s.params).map(([k, v]) => `
          <label>
            <span>${k}</span>
            <input type="number" data-key="${k}" value="${v}">
          </label>`).join('');
        renderStrategyChart(s);
        det.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (act === 'paper') toast(`${s.name} promoted to Paper-Forward (1-week live data, no money).`, 'ok');
    };
  };

  const renderStrategyChart = (s) => {
    const el = $('#strat-chart');
    if (!el || !window.LightweightCharts) return;
    el.innerHTML = '';
    const ch = LightweightCharts.createChart(el, {
      width: el.clientWidth, height: 260,
      layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' }
    });
    const lab  = ch.addLineSeries({ color: '#818cf8', lineWidth: 2 });
    const live = ch.addLineSeries({ color: '#34d399', lineWidth: 2, lineStyle: 2 });
    let v1 = 100, v2 = 100;
    const labData = [], liveData = [];
    const day = 86400;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 90; i >= 0; i--) {
      v1 *= 1 + (Math.random() - 0.45) * 0.012 + s.stats.pl / 9000;
      v2 *= 1 + (Math.random() - 0.48) * 0.011 + s.stats.pl / 12000;
      labData.push({  time: now - i * day, value: +v1.toFixed(2) });
      liveData.push({ time: now - i * day, value: +v2.toFixed(2) });
    }
    lab.setData(labData);
    live.setData(liveData);
    ch.timeScale().fitContent();
  };

  Views['tab-explore'] = async () => {
    const targets = TL.STATIC.stocks.filter(s => s.sector !== 'Index').slice(0, 30);
    await refreshQuotes(targets.map(s => s.sym));

    const grouped = {};
    targets.forEach(s => {
      const q = state.quotes[s.sym]; if (!q) return;
      (grouped[s.sector] = grouped[s.sector] || []).push({ ...s, pct: q.pct });
    });
    $('#sector-heatmap').innerHTML = Object.entries(grouped).map(([sec, arr]) => `
      <div class="sector-block">
        <div class="sector-name">${sec}</div>
        <div class="sector-tiles">${
          arr.map(s => {
            const k = Math.max(-3, Math.min(3, s.pct));
            const tone = k >= 0
              ? `rgba(16,185,129,${0.18 + (k / 3) * 0.55})`
              : `rgba(239,68,68,${0.18 + (-k / 3) * 0.55})`;
            return `<div class="tile" style="background:${tone}" title="${s.name}: ${fmt.pct(s.pct)}" data-sym="${s.sym}">
              <b>${s.sym}</b><span>${fmt.pct(s.pct)}</span></div>`;
          }).join('')
        }</div>
      </div>`).join('');
    $$('#sector-heatmap .tile').forEach(t => t.addEventListener('click', () => {
      state.selected = t.dataset.sym; persist();
      renderQuickPanel(); Watchlist.render();
    }));

    $('#baskets-grid').innerHTML = TL.STATIC.baskets.map(b => `
      <div class="basket-card tone-${b.tone}">
        <div class="basket-tag">${b.tag}</div>
        <div class="basket-name">${b.name}</div>
        <p class="basket-blurb">${b.blurb}</p>
        <div class="basket-members">${b.members.map(m => `<span>${m}</span>`).join('')}</div>
        <div class="basket-stats">
          <div><span>CAGR</span><b class="pos">${fmt.pct(b.cagr)}</b></div>
          <div><span>Sharpe</span><b>${b.sharpe}</b></div>
          <div><span>Max DD</span><b class="neg">${b.dd}%</b></div>
        </div>
        <button class="btn-primary basket-deploy" data-id="${b.id}">Simulate basket</button>
      </div>`).join('');
    $$('.basket-deploy').forEach(btn => btn.onclick = () => {
      const basket = TL.STATIC.baskets.find(x => x.id === btn.dataset.id);
      toast(`Simulating ${basket.name} on ${basket.members.length} symbols…`, 'ok');
    });
  };

  // ───────────────────────── Charts tab ─────────────────────────
  let mainChart, mainSeries, volSeries, overlaySeriesList = [];
  let subChart, subSeriesList = [];

  const destroyOverlays = () => {
    if (mainChart) {
      overlaySeriesList.forEach(s => { try { mainChart.removeSeries(s); } catch (e) {} });
      overlaySeriesList = [];
      if (volSeries) { try { mainChart.removeSeries(volSeries); } catch (e) {} volSeries = null; }
    }
    if (subChart) {
      try { subChart.remove(); } catch (e) {}
      subChart = null; subSeriesList = [];
    }
    $('#tv-sub').classList.add('hidden');
    $('#tv-sub').innerHTML = '';
    if (mainSeries) { try { mainSeries.setMarkers([]); } catch (e) {} }
  };

  const buildCharts = (candles) => {
    const el = $('#tv-chart'); el.innerHTML = '';
    mainChart = LightweightCharts.createChart(el, {
      width: el.clientWidth, height: 460,
      layout: { background: { color: 'transparent' }, textColor: '#cbd5e1' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: state.chartInterval !== '1d' },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      crosshair: { mode: 1 }
    });
    mainSeries = mainChart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
    });
    mainSeries.setData(candles);
    overlaySeriesList = []; subSeriesList = []; volSeries = null;
    mainChart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (mainChart) mainChart.applyOptions({ width: el.clientWidth });
      if (subChart)  subChart.applyOptions({ width: $('#tv-sub').clientWidth });
    });
    ro.observe(el);
  };

  const applyAnalysis = (type, candles) => {
    destroyOverlays();
    const closes = candles.map(c => c.close);
    const showInsight = (txt) => {
      $('#analysis-insight').classList.remove('hidden');
      $('#analysis-insight').innerHTML = `<b>Insight:</b> ${txt}`;
    };
    showInsight(ANALYSIS_INSIGHT[type] || 'Standard candlestick view.');

    if (type === 'sma') {
      const sma50  = ind.sma(closes, 50);
      const sma200 = ind.sma(closes, 200);
      const s50  = mainChart.addLineSeries({ color: '#fbbf24', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      const s200 = mainChart.addLineSeries({ color: '#a78bfa', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      s50.setData(candles.map((c, i) => sma50[i]  != null ? { time: c.time, value: +sma50[i].toFixed(2) }  : null).filter(Boolean));
      s200.setData(candles.map((c, i) => sma200[i] != null ? { time: c.time, value: +sma200[i].toFixed(2) } : null).filter(Boolean));
      overlaySeriesList.push(s50, s200);
      return;
    }
    if (type === 'bollinger') {
      const { upper, middle, lower } = ind.bollinger(closes, 20, 2);
      const u = mainChart.addLineSeries({ color: 'rgba(244,114,182,0.8)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const m = mainChart.addLineSeries({ color: 'rgba(244,114,182,0.5)', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      const l = mainChart.addLineSeries({ color: 'rgba(244,114,182,0.8)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      u.setData(candles.map((c, i) => upper[i]  != null ? { time: c.time, value: +upper[i].toFixed(2) }  : null).filter(Boolean));
      m.setData(candles.map((c, i) => middle[i] != null ? { time: c.time, value: +middle[i].toFixed(2) } : null).filter(Boolean));
      l.setData(candles.map((c, i) => lower[i]  != null ? { time: c.time, value: +lower[i].toFixed(2) }  : null).filter(Boolean));
      overlaySeriesList.push(u, m, l);
      return;
    }
    if (type === 'rsi') {
      volSeries = mainChart.addHistogramSeries({
        priceFormat: { type: 'volume' }, priceScaleId: '',
        scaleMargins: { top: 0.85, bottom: 0 },
      });
      volSeries.setData(candles.map(c => ({
        time: c.time, value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'
      })));
      overlaySeriesList.push(volSeries);

      const subEl = $('#tv-sub'); subEl.classList.remove('hidden'); subEl.innerHTML = '';
      subChart = LightweightCharts.createChart(subEl, {
        width: subEl.clientWidth, height: 140,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.06)' },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      });
      const rsiVals = ind.rsi(closes, 14);
      const rsiS = subChart.addLineSeries({ color: '#22d3ee', lineWidth: 2 });
      rsiS.setData(candles.map((c, i) => rsiVals[i] != null ? { time: c.time, value: +rsiVals[i].toFixed(2) } : null).filter(Boolean));
      rsiS.createPriceLine({ price: 70, color: 'rgba(239,68,68,0.6)', lineWidth: 1, lineStyle: 2 });
      rsiS.createPriceLine({ price: 30, color: 'rgba(16,185,129,0.6)', lineWidth: 1, lineStyle: 2 });
      subSeriesList.push(rsiS);
      mainChart.timeScale().subscribeVisibleLogicalRangeChange(r => { if (r) subChart.timeScale().setVisibleLogicalRange(r); });
      return;
    }
    if (type === 'macd') {
      const subEl = $('#tv-sub'); subEl.classList.remove('hidden'); subEl.innerHTML = '';
      subChart = LightweightCharts.createChart(subEl, {
        width: subEl.clientWidth, height: 160,
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.06)' },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      });
      const m = ind.macd(closes, 12, 26, 9);
      const macdLine = subChart.addLineSeries({ color: '#60a5fa', lineWidth: 2 });
      const sigLine  = subChart.addLineSeries({ color: '#f97316', lineWidth: 2 });
      const hist     = subChart.addHistogramSeries({ priceFormat: { type: 'price' } });
      macdLine.setData(candles.map((c, i) => m.macd[i]   != null ? { time: c.time, value: +m.macd[i].toFixed(4) }   : null).filter(Boolean));
      sigLine .setData(candles.map((c, i) => m.signal[i] != null ? { time: c.time, value: +m.signal[i].toFixed(4) } : null).filter(Boolean));
      hist    .setData(candles.map((c, i) => m.histogram[i] != null ? {
        time: c.time, value: +m.histogram[i].toFixed(4),
        color: m.histogram[i] >= 0 ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)'
      } : null).filter(Boolean));
      subSeriesList.push(macdLine, sigLine, hist);
      mainChart.timeScale().subscribeVisibleLogicalRangeChange(r => { if (r) subChart.timeScale().setVisibleLogicalRange(r); });
      return;
    }
    if (type.startsWith('pat-')) {
      const key = type.replace('pat-', '');
      const map = { 'cup': 'cup-handle', 'head': 'head-shoulders', 'double': 'double-bottom', 'doji': 'doji', 'hammer': 'hammer' };
      const fn = patterns[map[key]];
      if (fn) {
        const markers = fn(candles);
        if (markers.length) {
          mainSeries.setMarkers(markers);
          showInsight((ANALYSIS_INSIGHT[type] || '') + ` Found ${markers.length} occurrence${markers.length > 1 ? 's' : ''}.`);
        } else {
          showInsight((ANALYSIS_INSIGHT[type] || '') + ' No clear occurrence in current range.');
        }
      }
      return;
    }
  };

  Views['tab-charts'] = async () => {
    const sym = state.selected;
    $('#chart-symbol').textContent = sym;
    $('#chart-name').textContent   = bySym[sym]?.name || sym;
    refreshQuotes([sym]);
    const q = state.quotes[sym] || {};
    $('#chart-ltp').textContent = fmt.inr(q.ltp ?? TL.STATIC.fallback[sym]?.close ?? 0);
    $('#chart-pct').textContent = fmt.pct(q.pct ?? 0);
    $('#chart-pct').className = 'chart-pct ' + ((q.pct ?? 0) >= 0 ? 'pos' : 'neg');

    const sel = $('#analysis-select'); if (sel) sel.value = state.analysisType;
    $$('.chart-tf').forEach(b =>
      b.classList.toggle('active', b.dataset.range === state.chartRange && b.dataset.interval === state.chartInterval));

    const candles = await fetchCandles(sym, state.chartRange, state.chartInterval);
    buildCharts(candles);
    applyAnalysis(state.analysisType, candles);

    const fd = window.STATIC_MARKET_DATA && window.STATIC_MARKET_DATA[sym];
    const fp = $('#fund-panel');
    if (fd) {
      fp.classList.remove('hidden');
      $('#fund-pe').textContent   = fd.fundamentals.pe;
      $('#fund-pb').textContent   = fd.fundamentals.pb;
      $('#fund-mcap').textContent = bySym[sym] ? fmt.cr(bySym[sym].mcap) : fd.fundamentals.mcap;
      $('#fund-div').textContent  = fd.fundamentals.divYield;
      const yearly = fd.earnings.yearly || [];
      $('#fund-table').innerHTML = `
        <thead><tr><th>Period</th><th>Revenue</th><th>Op Profit</th><th>PAT</th><th>EBITDA</th></tr></thead>
        <tbody>${yearly.map(y => `
          <tr>
            <td>${y.period}</td>
            <td class="mono">${fmt.cr(y.revenue / 1e7)}</td>
            <td class="mono">${fmt.cr(y.opProfit / 1e7)}</td>
            <td class="mono">${fmt.cr(y.pat / 1e7)}</td>
            <td class="mono">${fmt.cr(y.ebitda / 1e7)}</td>
          </tr>`).join('')}
        </tbody>`;
    } else {
      fp.classList.add('hidden');
    }
  };

  // ───────────────────────── Order drawer plumbing ─────────────────────────
  const initOrderDrawer = () => {
    $('#od-close').addEventListener('click', () => Order.close());
    $('#od-side-buy').addEventListener('click',  () => { $('#order-drawer').dataset.side = 'BUY';  Order.render($('#od-symbol').textContent, 'BUY'); });
    $('#od-side-sell').addEventListener('click', () => { $('#order-drawer').dataset.side = 'SELL'; Order.render($('#od-symbol').textContent, 'SELL'); });
    ['od-qty', 'od-price', 'od-type'].forEach(id => $('#' + id).addEventListener('input', () => Order.updatePreview()));
    $('#od-submit').addEventListener('click', () => Order.submit());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') Order.close(); });
  };

  // ───────────────────────── Env modal ─────────────────────────
  const initEnvModal = () => {
    $('#env-pill').addEventListener('click', () => Env.toggle());
    $('#env-confirm-input').addEventListener('input', e => {
      $('#env-confirm-go').disabled = e.target.value.trim().toUpperCase() !== 'LIVE';
    });
    $('#env-confirm-cancel').addEventListener('click', () => $('#env-modal').classList.add('hidden'));
    $('#env-confirm-go').addEventListener('click', () => Env.confirm());
  };

  // ───────────────────────── Notifications popover ─────────────────────────
  const renderNotifications = () => {
    $('#notif-count').textContent = state.notifications.length;
    $('#notif-list').innerHTML = state.notifications.map(n => `
      <div class="notif-row kind-${n.kind}">
        <span class="dot"></span>
        <div>
          <div class="notif-msg">${n.msg}</div>
          <div class="notif-time">${fmt.rel(n.ts)}</div>
        </div>
      </div>`).join('') || '<div class="empty">No notifications.</div>';
  };
  const initNotifications = () => {
    $('#notif-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#notif-pop').classList.toggle('hidden'); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-pop')) {
        $('#notif-pop').classList.add('hidden');
      }
    });
    bus.on('notifications', renderNotifications);
  };

  // ───────────────────────── Charts toolbar ─────────────────────────
  const initChartsToolbar = () => {
    $$('.chart-tf').forEach(b => b.addEventListener('click', async () => {
      state.chartRange    = b.dataset.range;
      state.chartInterval = b.dataset.interval;
      persist();
      $$('.chart-tf').forEach(x => x.classList.toggle('active', x === b));
      const sym = state.selected;
      const candles = await fetchCandles(sym, state.chartRange, state.chartInterval, { fresh: true });
      buildCharts(candles);
      applyAnalysis(state.analysisType, candles);
    }));
    const sel = $('#analysis-select');
    if (sel) {
      sel.value = state.analysisType;
      sel.addEventListener('change', () => {
        state.analysisType = sel.value;
        persist();
        const cacheKey = `${state.selected}_${state.chartRange}_${state.chartInterval}`;
        const candles = state.candles[cacheKey] || [];
        if (candles.length) applyAnalysis(state.analysisType, candles);
      });
    }
  };

  // ───────────────────────── Boot ─────────────────────────
  const boot = async () => {
    Env.apply();
    Router.init();
    Watchlist.init(); Watchlist.render();
    Search.init();
    initOrderDrawer();
    initEnvModal();
    initNotifications();
    initChartsToolbar();
    renderNotifications();

    bus.on('orders',   () => { if (state.activeTab === 'tab-orders')   Views['tab-orders'](); });
    bus.on('holdings', () => { if (state.activeTab === 'tab-holdings') Views['tab-holdings'](); });
    bus.on('funds',    () => { if (state.activeTab === 'tab-funds')    Views['tab-funds'](); });
    bus.on('quotes',   () => {
      if (state.activeTab === 'tab-dashboard') Views['tab-dashboard']();
      if (state.activeTab === 'tab-holdings')  Views['tab-holdings']();
    });

    const prime = [...new Set(['NIFTY50', 'BANKNIFTY', 'NIFTYIT',
      ...state.watchlist, ...state.holdings.map(h => h.sym), state.selected])];
    await refreshQuotes(prime);
    renderQuickPanel();
    startPolling();

    const fn = Views[state.activeTab]; if (fn) fn();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  window.TL.app = { state, bus, refreshQuotes, fetchCandles, Order, Router, Env, ind, patterns };
})();
