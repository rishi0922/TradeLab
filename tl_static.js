/* TradeLab — extended seed data
 * Loaded after static_data.js (legacy STATIC_MARKET_DATA fundamentals dataset).
 * Defines TL.STATIC: NSE universe, sectors, themed baskets, strategy catalog,
 * virtual portfolio, fallback quotes.
 */
window.TL = window.TL || {};

TL.STATIC = (() => {
  const stocks = [
    { sym: 'HDFCBANK',   name: 'HDFC Bank',                      sector: 'Banking',     mcap: 1280000 },
    { sym: 'ICICIBANK',  name: 'ICICI Bank',                     sector: 'Banking',     mcap:  860000 },
    { sym: 'SBIN',       name: 'State Bank of India',            sector: 'Banking',     mcap:  720000 },
    { sym: 'KOTAKBANK',  name: 'Kotak Mahindra Bank',            sector: 'Banking',     mcap:  370000 },
    { sym: 'AXISBANK',   name: 'Axis Bank',                      sector: 'Banking',     mcap:  340000 },
    { sym: 'BAJFINANCE', name: 'Bajaj Finance',                  sector: 'Financials',  mcap:  470000 },
    { sym: 'BAJAJFINSV', name: 'Bajaj Finserv',                  sector: 'Financials',  mcap:  260000 },
    { sym: 'HDFCLIFE',   name: 'HDFC Life Insurance',            sector: 'Financials',  mcap:  140000 },
    { sym: 'SBILIFE',    name: 'SBI Life Insurance',             sector: 'Financials',  mcap:  150000 },
    { sym: 'RELIANCE',   name: 'Reliance Industries',            sector: 'Energy',      mcap: 1900000 },
    { sym: 'ONGC',       name: 'Oil & Natural Gas Corp',         sector: 'Energy',      mcap:  330000 },
    { sym: 'NTPC',       name: 'NTPC',                           sector: 'Energy',      mcap:  340000 },
    { sym: 'POWERGRID',  name: 'Power Grid Corp',                sector: 'Energy',      mcap:  290000 },
    { sym: 'COALINDIA',  name: 'Coal India',                     sector: 'Energy',      mcap:  280000 },
    { sym: 'IOC',        name: 'Indian Oil Corp',                sector: 'Energy',      mcap:  200000 },
    { sym: 'TCS',        name: 'Tata Consultancy Services',      sector: 'IT',          mcap: 1430000 },
    { sym: 'INFY',       name: 'Infosys',                        sector: 'IT',          mcap:  720000 },
    { sym: 'HCLTECH',    name: 'HCL Technologies',               sector: 'IT',          mcap:  400000 },
    { sym: 'WIPRO',      name: 'Wipro',                          sector: 'IT',          mcap:  240000 },
    { sym: 'TECHM',      name: 'Tech Mahindra',                  sector: 'IT',          mcap:  150000 },
    { sym: 'LTIM',       name: 'LTIMindtree',                    sector: 'IT',          mcap:  170000 },
    { sym: 'HINDUNILVR', name: 'Hindustan Unilever',             sector: 'FMCG',        mcap:  580000 },
    { sym: 'ITC',        name: 'ITC',                            sector: 'FMCG',        mcap:  580000 },
    { sym: 'NESTLEIND',  name: 'Nestle India',                   sector: 'FMCG',        mcap:  240000 },
    { sym: 'BRITANNIA',  name: 'Britannia Industries',           sector: 'FMCG',        mcap:  120000 },
    { sym: 'DABUR',      name: 'Dabur India',                    sector: 'FMCG',        mcap:  100000 },
    { sym: 'ASIANPAINT', name: 'Asian Paints',                   sector: 'FMCG',        mcap:  290000 },
    { sym: 'MARUTI',     name: 'Maruti Suzuki',                  sector: 'Auto',        mcap:  370000 },
    { sym: 'TATAMOTORS', name: 'Tata Motors',                    sector: 'Auto',        mcap:  300000 },
    { sym: 'M&M',        name: 'Mahindra & Mahindra',            sector: 'Auto',        mcap:  280000 },
    { sym: 'BAJAJ-AUTO', name: 'Bajaj Auto',                     sector: 'Auto',        mcap:  240000 },
    { sym: 'EICHERMOT',  name: 'Eicher Motors',                  sector: 'Auto',        mcap:  120000 },
    { sym: 'HEROMOTOCO', name: 'Hero MotoCorp',                  sector: 'Auto',        mcap:   90000 },
    { sym: 'SUNPHARMA',  name: 'Sun Pharmaceutical',             sector: 'Pharma',      mcap:  370000 },
    { sym: 'CIPLA',      name: 'Cipla',                          sector: 'Pharma',      mcap:  120000 },
    { sym: 'DRREDDY',    name: "Dr Reddy's Labs",                sector: 'Pharma',      mcap:  100000 },
    { sym: 'DIVISLAB',   name: "Divi's Laboratories",            sector: 'Pharma',      mcap:  140000 },
    { sym: 'APOLLOHOSP', name: 'Apollo Hospitals',               sector: 'Healthcare',  mcap:  100000 },
    { sym: 'TATASTEEL',  name: 'Tata Steel',                     sector: 'Metals',      mcap:  180000 },
    { sym: 'JSWSTEEL',   name: 'JSW Steel',                      sector: 'Metals',      mcap:  220000 },
    { sym: 'HINDALCO',   name: 'Hindalco Industries',            sector: 'Metals',      mcap:  150000 },
    { sym: 'ULTRACEMCO', name: 'UltraTech Cement',               sector: 'Cement',      mcap:  330000 },
    { sym: 'GRASIM',     name: 'Grasim Industries',              sector: 'Cement',      mcap:  170000 },
    { sym: 'BHARTIARTL', name: 'Bharti Airtel',                  sector: 'Telecom',     mcap:  830000 },
    { sym: 'LT',         name: 'Larsen & Toubro',                sector: 'Infra',       mcap:  500000 },
    { sym: 'ADANIENT',   name: 'Adani Enterprises',              sector: 'Infra',       mcap:  340000 },
    { sym: 'ADANIPORTS', name: 'Adani Ports',                    sector: 'Infra',       mcap:  290000 },
    { sym: 'ZOMATO',     name: 'Zomato',                         sector: 'New-Age',     mcap:  220000 },
    { sym: 'NYKAA',      name: 'FSN E-Commerce (Nykaa)',         sector: 'New-Age',     mcap:   55000 },
    { sym: 'PAYTM',      name: 'One 97 (Paytm)',                 sector: 'New-Age',     mcap:   45000 },
    { sym: 'POLICYBZR',  name: 'PB Fintech',                     sector: 'New-Age',     mcap:   65000 },
    { sym: 'NIFTY50',    name: 'NIFTY 50',                       sector: 'Index',       mcap: 0, yahoo: '^NSEI',     tv: 'NSE:NIFTY' },
    { sym: 'BANKNIFTY',  name: 'NIFTY Bank',                     sector: 'Index',       mcap: 0, yahoo: '^NSEBANK',  tv: 'NSE:BANKNIFTY' },
    { sym: 'NIFTYIT',    name: 'NIFTY IT',                       sector: 'Index',       mcap: 0, yahoo: '^CNXIT',    tv: 'NSE:CNXIT' },
  ];
  stocks.forEach(s => {
    if (!s.yahoo) s.yahoo = encodeURIComponent(s.sym) + '.NS';
    if (!s.tv)    s.tv    = 'NSE:' + s.sym.replace('-', '_').replace('&', '');
  });

  const sectors = ['Banking','Financials','Energy','IT','FMCG','Auto','Pharma','Healthcare','Metals','Cement','Telecom','Infra','New-Age'];

  // Industry averages used for the Fundamental Comparison panel.
  const industryAvg = {
    Banking:    { pe: 22.1, pb: 3.1, de: 0.8, roe: 12.5, divYield: 0.8 },
    Financials: { pe: 28.4, pb: 4.2, de: 1.2, roe: 14.8, divYield: 0.6 },
    Energy:     { pe: 14.2, pb: 1.9, de: 0.5, roe: 11.2, divYield: 2.4 },
    IT:         { pe: 26.7, pb: 7.4, de: 0.1, roe: 24.6, divYield: 1.8 },
    FMCG:       { pe: 48.2, pb: 12.6, de: 0.2, roe: 22.4, divYield: 1.6 },
    Auto:       { pe: 24.1, pb: 4.8, de: 0.7, roe: 16.8, divYield: 1.2 },
    Pharma:     { pe: 28.6, pb: 4.2, de: 0.4, roe: 14.2, divYield: 0.7 },
    Healthcare: { pe: 52.3, pb: 8.1, de: 0.3, roe: 13.6, divYield: 0.4 },
    Metals:     { pe: 12.8, pb: 1.6, de: 0.6, roe: 12.4, divYield: 1.8 },
    Cement:     { pe: 26.4, pb: 3.8, de: 0.5, roe: 13.2, divYield: 0.8 },
    Telecom:    { pe: 38.2, pb: 5.4, de: 1.4, roe: 9.6,  divYield: 0.4 },
    Infra:      { pe: 22.6, pb: 3.2, de: 1.1, roe: 13.8, divYield: 0.7 },
    'New-Age':  { pe: 0,    pb: 6.2, de: 0.2, roe: -8.4, divYield: 0 },
    Index:      { pe: 22.0, pb: 3.5, de: 0.7, roe: 14.0, divYield: 1.2 },
  };

  // Per-stock fundamentals overlay (used for the Comparison panel).
  // Anchored to plausible recent values; the Fundamentals tab uses real
  // legacy data when available (STATIC_MARKET_DATA covers 10 names).
  const fundamentals = {
    HDFCBANK:   { pe: 18.5, pb: 2.4, de: 0.6, roe: 14.2, divYield: 1.2 },
    ICICIBANK:  { pe: 17.2, pb: 2.8, de: 0.7, roe: 16.4, divYield: 0.9 },
    SBIN:       { pe: 11.8, pb: 1.6, de: 1.1, roe: 16.1, divYield: 1.4 },
    KOTAKBANK:  { pe: 26.4, pb: 3.6, de: 0.8, roe: 14.6, divYield: 0.1 },
    AXISBANK:   { pe: 14.8, pb: 2.4, de: 0.9, roe: 17.2, divYield: 0.1 },
    BAJFINANCE: { pe: 32.1, pb: 6.4, de: 3.8, roe: 22.4, divYield: 0.4 },
    RELIANCE:   { pe: 24.6, pb: 2.4, de: 0.4, roe: 8.8,  divYield: 0.3 },
    TCS:        { pe: 31.2, pb: 14.8, de: 0.0, roe: 47.6, divYield: 1.4 },
    INFY:       { pe: 26.4, pb: 7.8,  de: 0.0, roe: 32.1, divYield: 2.0 },
    HCLTECH:    { pe: 24.8, pb: 5.6,  de: 0.1, roe: 22.6, divYield: 3.4 },
    WIPRO:      { pe: 22.1, pb: 3.4,  de: 0.2, roe: 14.8, divYield: 0.2 },
    TECHM:      { pe: 28.6, pb: 4.2,  de: 0.1, roe: 12.4, divYield: 2.4 },
    HINDUNILVR: { pe: 56.2, pb: 11.4, de: 0.0, roe: 21.6, divYield: 1.6 },
    ITC:        { pe: 28.4, pb: 7.8,  de: 0.0, roe: 28.4, divYield: 3.4 },
    NESTLEIND:  { pe: 76.8, pb: 76.4, de: 0.1, roe: 102.4, divYield: 0.8 },
    BRITANNIA:  { pe: 56.4, pb: 28.6, de: 0.4, roe: 64.2,  divYield: 1.4 },
    MARUTI:     { pe: 26.8, pb: 4.2,  de: 0.0, roe: 16.4,  divYield: 0.9 },
    TATAMOTORS: { pe: 12.4, pb: 4.6,  de: 1.6, roe: 28.4,  divYield: 0.4 },
    SUNPHARMA:  { pe: 38.4, pb: 4.8,  de: 0.1, roe: 12.6,  divYield: 0.8 },
    CIPLA:      { pe: 24.8, pb: 3.8,  de: 0.1, roe: 14.2,  divYield: 0.4 },
    DRREDDY:    { pe: 18.6, pb: 3.2,  de: 0.1, roe: 18.4,  divYield: 0.6 },
    APOLLOHOSP: { pe: 81.2, pb: 9.8,  de: 0.6, roe: 12.8,  divYield: 0.3 },
    TATASTEEL:  { pe: 24.6, pb: 1.8,  de: 0.7, roe: 8.4,   divYield: 2.4 },
    JSWSTEEL:   { pe: 22.4, pb: 3.2,  de: 0.8, roe: 16.4,  divYield: 0.9 },
    BHARTIARTL: { pe: 38.4, pb: 6.8,  de: 1.2, roe: 18.2,  divYield: 0.4 },
    LT:         { pe: 32.8, pb: 4.8,  de: 0.9, roe: 15.4,  divYield: 0.6 },
    ADANIENT:   { pe: 92.4, pb: 8.4,  de: 1.4, roe: 9.2,   divYield: 0.0 },
    ADANIPORTS: { pe: 28.4, pb: 4.6,  de: 0.9, roe: 18.4,  divYield: 0.4 },
    ZOMATO:     { pe: 0,    pb: 8.4,  de: 0.1, roe: -2.4,  divYield: 0 },
    NYKAA:      { pe: 0,    pb: 11.4, de: 0.2, roe: -1.8,  divYield: 0 },
    PAYTM:      { pe: 0,    pb: 4.6,  de: 0.0, roe: -8.4,  divYield: 0 },
    POLICYBZR:  { pe: 86.4, pb: 7.2,  de: 0.0, roe: 8.6,   divYield: 0 },
  };

  const baskets = [
    { id: 'momentum-nifty', name: 'Momentum Nifty 50',   tag: 'Trend',     tone: 'indigo',
      blurb: 'High-beta Nifty constituents riding 50-DMA momentum.',
      members: ['RELIANCE','HDFCBANK','ICICIBANK','BHARTIARTL','LT'],
      cagr: 24.6, sharpe: 1.42, dd: -8.4 },
    { id: 'meanrev-banks',  name: 'Mean-Reversion Banks', tag: 'Banks',     tone: 'purple',
      blurb: 'Buys oversold bank names against a 20-day Bollinger band.',
      members: ['HDFCBANK','ICICIBANK','SBIN','KOTAKBANK','AXISBANK'],
      cagr: 18.1, sharpe: 1.21, dd: -6.7 },
    { id: 'value-fmcg',     name: 'Steady Value FMCG',    tag: 'Defensive', tone: 'emerald',
      blurb: 'Low-vol FMCG with positive earnings revisions.',
      members: ['HINDUNILVR','ITC','NESTLEIND','BRITANNIA','DABUR'],
      cagr: 12.4, sharpe: 1.55, dd: -3.9 },
    { id: 'it-rotation',    name: 'IT Rotation',          tag: 'IT',        tone: 'sky',
      blurb: 'Pair-trade large-cap IT against the sector index.',
      members: ['TCS','INFY','HCLTECH','WIPRO','TECHM'],
      cagr: 15.7, sharpe: 1.18, dd: -7.2 },
    { id: 'pharma-defense', name: 'Pharma Defense',       tag: 'Pharma',    tone: 'rose',
      blurb: 'Counter-cyclical pharma exposure for risk-off weeks.',
      members: ['SUNPHARMA','CIPLA','DRREDDY','DIVISLAB'],
      cagr: 13.9, sharpe: 1.31, dd: -5.5 },
    { id: 'newage-growth',  name: 'New-Age Growth',       tag: 'Growth',    tone: 'amber',
      blurb: 'High-vol new economy basket — momentum gated by RSI.',
      members: ['ZOMATO','NYKAA','PAYTM','POLICYBZR'],
      cagr: 31.2, sharpe: 0.94, dd: -16.1 },
  ];

  // Strategies now expose `triggers` (used by the Strategy Detail signal card)
  // and `kind` for the Explorer indicator filter.
  const strategies = [
    {
      id: 'golden-cross', name: 'Golden Cross', tag: 'Trend', tone: 'indigo',
      kind: ['Technical','SMA'],
      blurb: 'Buys when 50-DMA crosses above 200-DMA. Sell on inverse.',
      params: { fast: 50, slow: 200, stopPct: 4 },
      stats: { winRate: 56, pl: 14.2, profitFactor: 2.14, trades: 1402, dd: -6.4, sharpe: 1.82 },
      triggers: [
        { kind: 'tech', test: (c) => c.sma50 != null && c.sma200 != null && c.sma50 > c.sma200, label: '50-DMA above 200-DMA (Golden Cross)' },
        { kind: 'tech', test: (c) => c.rsi != null && c.rsi > 45 && c.rsi < 70, label: 'RSI in healthy 45–70 zone' }
      ]
    },
    {
      id: 'rsi-reversal', name: 'RSI Reversal', tag: 'Volatility', tone: 'purple',
      kind: ['Technical','RSI'],
      blurb: 'Mean reversion in extreme oversold zones (RSI < 28).',
      params: { rsiLow: 28, rsiHigh: 72, holdDays: 5 },
      stats: { winRate: 61, pl: 9.8, profitFactor: 1.86, trades: 980, dd: -5.1, sharpe: 1.41 },
      triggers: [
        { kind: 'tech', test: (c) => c.rsi != null && c.rsi < 32, label: 'RSI in oversold zone (<32)' },
        { kind: 'tech', test: (c) => c.close != null && c.bb && c.close < c.bb.lower, label: 'Price below lower Bollinger band' }
      ]
    },
    {
      id: 'value-hunter', name: 'Value Hunter', tag: 'Value', tone: 'emerald',
      kind: ['Fundamental','P/E','D/E','Div Yield'],
      blurb: 'Multi-factor fundamental scoring for long-term growth.',
      params: { peMax: 25, roeMin: 18, debtEqMax: 0.5 },
      stats: { winRate: 64, pl: 21.5, profitFactor: 2.51, trades: 312, dd: -9.8, sharpe: 1.65 },
      triggers: [
        { kind: 'fund', test: (c) => c.f && c.f.pe > 0 && c.industry && c.f.pe < c.industry.pe, label: 'P/E below industry average' },
        { kind: 'fund', test: (c) => c.f && c.f.roe >= 18, label: 'Return on Equity ≥ 18%' },
        { kind: 'fund', test: (c) => c.f && c.f.de <= 0.5, label: 'Debt-to-Equity ≤ 0.5' }
      ]
    },
    {
      id: 'opening-range', name: 'Opening Range Breakout', tag: 'Intraday', tone: 'amber',
      kind: ['Technical','Volume'],
      blurb: 'Breaks of the first 15-minute high with volume confirmation.',
      params: { rangeMins: 15, volMult: 1.5, stopAtr: 1.2 },
      stats: { winRate: 48, pl: 7.4, profitFactor: 1.48, trades: 2210, dd: -4.2, sharpe: 1.19 },
      triggers: [
        { kind: 'tech', test: (c) => c.close != null && c.dayHigh != null && c.close >= c.dayHigh * 0.998, label: 'Price near day high (breakout zone)' },
        { kind: 'tech', test: (c) => c.atrPct != null && c.atrPct > 1.0, label: 'Volatility above 1% (ATR)' }
      ]
    },
    {
      id: 'macd-momentum', name: 'MACD Momentum', tag: 'Momentum', tone: 'sky',
      kind: ['Technical','MACD'],
      blurb: 'MACD signal crossover with positive histogram.',
      params: { fast: 12, slow: 26, signal: 9 },
      stats: { winRate: 53, pl: 11.6, profitFactor: 1.72, trades: 1640, dd: -7.1, sharpe: 1.37 },
      triggers: [
        { kind: 'tech', test: (c) => c.macdHist != null && c.macdHist > 0, label: 'MACD histogram positive (momentum)' },
        { kind: 'tech', test: (c) => c.macd != null && c.macdSignal != null && c.macd > c.macdSignal, label: 'MACD line above signal' }
      ]
    },
    {
      id: 'pair-banks', name: 'Pair Trade — HDFC/ICICI', tag: 'Pairs', tone: 'rose',
      kind: ['Technical','Pairs'],
      blurb: 'Long the laggard, short the leader on z-score divergence.',
      params: { lookback: 60, zEntry: 2, zExit: 0.5 },
      stats: { winRate: 58, pl: 6.2, profitFactor: 1.55, trades: 410, dd: -3.8, sharpe: 1.46 },
      triggers: [
        { kind: 'tech', test: (c) => c.pct != null && c.pct < -0.5, label: 'Lagging vs sector index' },
        { kind: 'fund', test: (c) => c.f && c.industry && c.f.pe < c.industry.pe * 0.95, label: 'Cheaper than peers on P/E' }
      ]
    },
  ];

  // Analyst commentary keyed by symbol — falls back to a generic note.
  const analystNotes = {
    HDFCBANK:   'HDFC Bank is poised for growth due to its oversold RSI and attractive P/E ratio. Analysts expect a rebound as fundamental strengths align with technical recovery signals.',
    RELIANCE:   'Reliance trades at a market premium reflecting its diversified portfolio across energy, retail and digital. Watch the consumer demerger narrative as a near-term catalyst.',
    TCS:        'TCS continues to lead Indian IT on margins. Discretionary deal flow remains soft but BFSI tailwinds and a stable rupee support our constructive view.',
    INFY:       'Infy guidance has been conservative; valuation has compressed to a 5-year low. Pair this with healthy ROE for an attractive risk/reward at current levels.',
    ITC:        'ITC offers defensive cash flows with a high dividend yield. The hotels demerger should unlock value through pure-play exposure to FMCG and cigarettes.',
    TATAMOTORS: 'JLR delivers operating leverage as mix improves; CV cycle is past peak but earnings revisions remain positive. Long-term thesis intact.',
    ZOMATO:    'New-Age platform with improving unit economics. Watch for sustained EBITDA positive quarters; volatility is still high — size positions accordingly.',
    BAJFINANCE: 'Premier NBFC with strong execution. AUM growth has moderated; near-term catalyst is the capital raise and digital strategy delivery.',
  };
  const defaultAnalystNote = sym =>
    `${sym} is currently being scanned by our strategy engine. Triggers below combine our technical and fundamental scoring; review them alongside your own thesis before placing a sandbox order.`;

  // Seed mock community discussion. Real comments persist in localStorage
  // alongside these and are shown in chronological order.
  const communitySeed = {
    HDFCBANK: [
      { user: 'User123',   ts: Date.now() - 3600 * 1000,        msg: 'Great entry point!' },
      { user: 'TraderPro', ts: Date.now() - 45 * 60 * 1000,     msg: 'Watching support at 1550.' },
      { user: 'User103',   ts: Date.now() - 60 * 60 * 1000,     msg: 'Good return!' },
    ],
    RELIANCE: [
      { user: 'NiftyKing', ts: Date.now() - 2 * 3600 * 1000,    msg: 'Demerger talk getting louder. Holding into Q3.' },
      { user: 'Aakash',    ts: Date.now() - 5 * 3600 * 1000,    msg: 'Stop at 2880. Risk-reward is fine here.' },
    ],
    TCS: [
      { user: 'Megha',     ts: Date.now() - 4 * 3600 * 1000,    msg: 'IT pack has more legs. Adding on dips.' },
    ],
    INFY: [
      { user: 'Rahul',     ts: Date.now() - 90 * 60 * 1000,     msg: 'Better risk-reward than TCS at these levels.' },
    ],
  };

  // Newbie Path — 5-step gamified onboarding checklist for the dashboard.
  const newbieSteps = [
    { id: 'watch',      label: 'Add a stock to your watchlist',          hint: 'Search a symbol and tap + Watch.' },
    { id: 'detail',     label: 'Open a Strategy Detail View',            hint: 'Click any strategy card → Open.' },
    { id: 'firstOrder', label: 'Place your first sandbox order',         hint: 'Use the BUY button on any watchlist row.' },
    { id: 'backtest',   label: 'Backtest a strategy',                    hint: 'Strategies tab → Backtest.' },
    { id: 'envSwitch',  label: 'Switch the environment to LIVE and back', hint: 'Tap the SANDBOX pill in the header.' },
  ];

  const seed = {
    funds: { cash: 500000, used: 0, payin: 0, payout: 0, currency: 'INR' },
    holdings: [
      { sym: 'RELIANCE', qty: 12, avg: 2780.40, ts: 1714032000000 },
      { sym: 'HDFCBANK', qty: 20, avg: 1620.10, ts: 1715241600000 },
      { sym: 'INFY',     qty: 18, avg: 1505.55, ts: 1716105600000 },
      { sym: 'ITC',      qty: 80, avg:  428.90, ts: 1716796800000 },
    ],
    positions: [],
    orders: [
      { id: 'TL-1001', sym: 'RELIANCE',   side: 'BUY', qty: 12, price: 2780.40, type: 'LIMIT',  status: 'EXECUTED',  env: 'SANDBOX', ts: 1714032000000 },
      { id: 'TL-1002', sym: 'HDFCBANK',   side: 'BUY', qty: 20, price: 1620.10, type: 'MARKET', status: 'EXECUTED',  env: 'SANDBOX', ts: 1715241600000 },
      { id: 'TL-1003', sym: 'INFY',       side: 'BUY', qty: 18, price: 1505.55, type: 'MARKET', status: 'EXECUTED',  env: 'SANDBOX', ts: 1716105600000 },
      { id: 'TL-1004', sym: 'ITC',        side: 'BUY', qty: 80, price:  428.90, type: 'LIMIT',  status: 'EXECUTED',  env: 'SANDBOX', ts: 1716796800000 },
      { id: 'TL-1005', sym: 'TATAMOTORS', side: 'BUY', qty: 25, price:  920.00, type: 'LIMIT',  status: 'CANCELLED', env: 'SANDBOX', ts: 1716969600000 },
    ],
    watchlist: ['NIFTY50','BANKNIFTY','RELIANCE','HDFCBANK','INFY','TCS','TATAMOTORS','ITC'],
    notifications: [
      { id: 'n1', kind: 'fill',  msg: 'RELIANCE BUY 12 @ ₹2780.40 filled in Sandbox.',          ts: 1714032000000 },
      { id: 'n2', kind: 'alert', msg: 'Golden Cross strategy crossed 1,400 backtested trades.', ts: 1716105600000 },
      { id: 'n3', kind: 'sys',   msg: 'New theme basket added: New-Age Growth.',                ts: 1716796800000 },
    ]
  };

  const fallback = {
    NIFTY50:    { close: 24580.10, prevClose: 24410.50 },
    BANKNIFTY:  { close: 53120.40, prevClose: 52840.00 },
    NIFTYIT:    { close: 38420.65, prevClose: 38280.10 },
    RELIANCE:   { close: 2932.50,  prevClose: 2918.20 },
    HDFCBANK:   { close: 1685.30,  prevClose: 1672.10 },
    ICICIBANK:  { close: 1158.70,  prevClose: 1149.20 },
    SBIN:       { close:  812.40,  prevClose:  806.10 },
    KOTAKBANK:  { close: 1742.55,  prevClose: 1738.90 },
    AXISBANK:   { close: 1144.10,  prevClose: 1138.40 },
    BAJFINANCE: { close: 7012.40,  prevClose: 6987.80 },
    BAJAJFINSV: { close: 1612.10,  prevClose: 1604.55 },
    HDFCLIFE:   { close:  610.45,  prevClose:  607.90 },
    SBILIFE:    { close: 1492.30,  prevClose: 1485.55 },
    ONGC:       { close:  264.85,  prevClose:  262.40 },
    NTPC:       { close:  368.20,  prevClose:  364.10 },
    POWERGRID:  { close:  308.95,  prevClose:  305.40 },
    COALINDIA:  { close:  448.10,  prevClose:  445.30 },
    IOC:        { close:  158.40,  prevClose:  156.90 },
    TCS:        { close: 3925.60,  prevClose: 3902.40 },
    INFY:       { close: 1734.80,  prevClose: 1721.30 },
    HCLTECH:    { close: 1462.50,  prevClose: 1455.80 },
    WIPRO:      { close:  462.90,  prevClose:  460.20 },
    TECHM:      { close: 1494.30,  prevClose: 1488.10 },
    LTIM:       { close: 5710.20,  prevClose: 5685.90 },
    HINDUNILVR: { close: 2452.40,  prevClose: 2446.10 },
    ITC:        { close:  462.20,  prevClose:  460.55 },
    NESTLEIND:  { close: 24812.00, prevClose: 24770.50 },
    BRITANNIA:  { close: 5042.10,  prevClose: 5028.30 },
    DABUR:      { close:  584.20,  prevClose:  582.10 },
    ASIANPAINT: { close: 2742.10,  prevClose: 2730.40 },
    MARUTI:     { close: 12245.00, prevClose: 12198.40 },
    TATAMOTORS: { close:  942.10,  prevClose:  936.20 },
    'M&M':      { close: 2840.10,  prevClose: 2828.40 },
    'BAJAJ-AUTO': { close: 9420.30, prevClose: 9385.60 },
    EICHERMOT:  { close: 4612.40,  prevClose: 4598.10 },
    HEROMOTOCO: { close: 4582.10,  prevClose: 4570.90 },
    SUNPHARMA:  { close: 1542.30,  prevClose: 1535.60 },
    CIPLA:      { close: 1480.40,  prevClose: 1476.20 },
    DRREDDY:    { close: 6210.50,  prevClose: 6195.40 },
    DIVISLAB:   { close: 4382.10,  prevClose: 4365.20 },
    APOLLOHOSP: { close: 6520.40,  prevClose: 6505.10 },
    TATASTEEL:  { close:  148.90,  prevClose:  147.30 },
    JSWSTEEL:   { close:  890.20,  prevClose:  885.60 },
    HINDALCO:   { close:  642.80,  prevClose:  639.50 },
    ULTRACEMCO: { close: 11420.30, prevClose: 11385.40 },
    GRASIM:     { close: 2540.90,  prevClose: 2532.10 },
    BHARTIARTL: { close: 1480.20,  prevClose: 1472.80 },
    LT:         { close: 3582.10,  prevClose: 3568.40 },
    ADANIENT:   { close: 2940.80,  prevClose: 2925.30 },
    ADANIPORTS: { close: 1342.10,  prevClose: 1335.60 },
    ZOMATO:     { close:  248.40,  prevClose:  245.10 },
    NYKAA:      { close:  192.30,  prevClose:  190.80 },
    PAYTM:      { close:  710.20,  prevClose:  705.40 },
    POLICYBZR:  { close: 1432.10,  prevClose: 1425.30 },
  };

  const news = [
    { ts: Date.now() -  2 * 3600 * 1000, src: 'Mint',         title: 'Nifty hits fresh high as IT pack leads gains' },
    { ts: Date.now() -  5 * 3600 * 1000, src: 'Bloomberg',    title: 'RBI holds rates, signals dovish tilt for Q3' },
    { ts: Date.now() -  9 * 3600 * 1000, src: 'CNBC-TV18',    title: 'Reliance plans demerger of consumer arm: report' },
    { ts: Date.now() - 14 * 3600 * 1000, src: 'ET Markets',   title: 'FIIs net buyers for sixth straight session' },
    { ts: Date.now() - 22 * 3600 * 1000, src: 'BusinessLine', title: 'Auto numbers strong; Tata Motors upgraded to Buy' },
  ];

  return {
    stocks, sectors, industryAvg, fundamentals,
    baskets, strategies, analystNotes, defaultAnalystNote,
    communitySeed, newbieSteps, seed, fallback, news
  };
})();
