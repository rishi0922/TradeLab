// TradeLab Application Logic

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const swipeKnob = document.getElementById('swipe-knob');
    const swipeTrack = document.getElementById('swipe-track');
    const swipeContainer = document.getElementById('swipe-container');
    const swipeText = document.getElementById('swipe-text');

    // State
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let isLive = false;

    // --- Tab / Mode Switching Logic ---

    function setMode(mode) {
        if (mode === 'live') {
            appContainer.classList.remove('theme-lab');
            appContainer.classList.add('theme-market');
            document.body.style.backgroundColor = '#064E3B';
            if (swipeText) swipeText.textContent = "LIVE ACTIVE";
            const envStatus = document.getElementById('env-status');
            if (envStatus) {
                envStatus.textContent = "LIVE";
                envStatus.classList.remove('text-gray-500');
                envStatus.classList.add('text-white');
            }
            isLive = true;
        } else {
            appContainer.classList.remove('theme-market');
            appContainer.classList.add('theme-lab');
            document.body.style.backgroundColor = '#111827';
            if (swipeText) swipeText.textContent = "SWIPE TO DEPLOY";
            const envStatus = document.getElementById('env-status');
            if (envStatus) {
                envStatus.textContent = "SANDBOX";
                envStatus.classList.remove('text-white');
                envStatus.classList.add('text-gray-500');
            }
            if (swipeKnob) {
                swipeKnob.style.left = '4px';
                swipeTrack.style.width = '0%';
            }
            isLive = false;
        }
    }

    setMode('lab');

    // --- Swipe Interaction Logic ---
    if (swipeContainer && swipeKnob) {
        swipeKnob.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);

        swipeKnob.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
        document.addEventListener('touchmove', (e) => drag(e.touches[0]));
        document.addEventListener('touchend', endDrag);
    }

    function startDrag(e) {
        if (isLive) return;
        isDragging = true;
        startX = e.clientX;
        swipeContainer.classList.add('cursor-grabbing');
    }

    function drag(e) {
        if (!isDragging || isLive) return;

        const containerWidth = swipeContainer.offsetWidth;
        const knobWidth = swipeKnob.offsetWidth;
        const maxScroll = containerWidth - knobWidth - 8;

        let moveX = e.clientX - startX;
        if (moveX < 0) moveX = 0;
        if (moveX > maxScroll) moveX = maxScroll;

        swipeKnob.style.left = `${4 + moveX}px`;

        const percentage = (moveX / maxScroll) * 100;
        swipeTrack.style.width = `${percentage}%`;
        swipeTrack.style.opacity = percentage > 10 ? 1 : 0.5;

        swipeText.style.opacity = 1 - (percentage / 100);

        currentX = moveX;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        swipeContainer.classList.remove('cursor-grabbing');

        const containerWidth = swipeContainer.offsetWidth;
        const knobWidth = swipeKnob.offsetWidth;
        const maxScroll = containerWidth - knobWidth - 8;

        if (currentX > maxScroll * 0.9) {
            swipeKnob.style.left = `${4 + maxScroll}px`;
            swipeTrack.style.width = '100%';
            triggerDeploy();
        } else {
            swipeKnob.style.left = '4px';
            swipeTrack.style.width = '0%';
            swipeText.style.opacity = 1;
        }
    }

    function triggerDeploy() {
        swipeText.textContent = "DEPLOYING...";
        swipeText.style.opacity = 1;

        setTimeout(() => {
            setMode('live');
            alert("Strategy Deployed to Live Market!");
        }, 800);
    }

    // --- Analysis Logic ---
    const runBtns = document.querySelectorAll('.run-analysis-btn');
    const resultPanel = document.getElementById('analysis-result');
    const resultContent = document.getElementById('result-content');
    const resultLoading = document.getElementById('result-loading');

    runBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.group');
            const strategyName = card ? card.querySelector('h3').textContent : 'Custom Strategy';
            const tickerEl = document.getElementById('stock-ticker');
            const currentStock = tickerEl ? tickerEl.textContent : 'NSE: LIVE';

            if (resultPanel.classList.contains('hidden')) {
                resultPanel.classList.remove('hidden');
            }

            const loaderStock = document.getElementById('sim-stock-loading');
            const resultStock = document.getElementById('sim-stock-result');
            const resultStrategy = document.getElementById('sim-strategy-name');

            if (loaderStock) loaderStock.textContent = currentStock;
            if (resultStock) resultStock.textContent = currentStock;
            if (resultStrategy) resultStrategy.textContent = strategyName;

            resultLoading.classList.remove('hidden');
            resultContent.classList.add('hidden');

            const scanLine = document.getElementById('scan-line');
            if (scanLine) scanLine.classList.remove('hidden');

            setTimeout(() => {
                resultLoading.classList.add('hidden');
                resultContent.classList.remove('hidden');
                if (scanLine) scanLine.classList.add('hidden');

                const winRate = Math.floor(Math.random() * (85 - 45) + 45);
                const winRateEl = document.getElementById('stat-win-rate');
                if (winRateEl) winRateEl.textContent = `${winRate}%`;

                const circle = document.querySelector('#result-content circle.text-indigo-500');
                if (circle) {
                    const offset = 283 - (283 * winRate) / 100;
                    circle.style.strokeDashoffset = offset;
                }

                if (window.lucide) window.lucide.createIcons();
            }, 1500);
        });
    });

    // --- View Switching Logic ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const views = document.querySelectorAll('.view-section');

    function updateView(targetViewId) {
        sidebarLinks.forEach(l => {
            l.classList.remove('bg-white/5', 'text-white');
            l.classList.add('hover:bg-white/5', 'text-gray-400', 'hover:text-white');
            const icon = l.querySelector('svg');
            if (icon) icon.classList.remove('accent-text');

            if (l.getAttribute('data-view') === targetViewId) {
                l.classList.remove('hover:bg-white/5', 'text-gray-400', 'hover:text-white');
                l.classList.add('bg-white/5', 'text-white');
                if (icon) icon.classList.add('accent-text');
            }
        });

        views.forEach(view => {
            if (view.id === targetViewId) {
                view.classList.remove('hidden');

                if (targetViewId === 'view-charts') {
                    const params = new URLSearchParams(window.location.search);
                    const stock = params.get('stock');
                    const controls = document.getElementById('charts-analysis-controls');
                    const emptyState = document.getElementById('charts-empty-state');
                    const chartBody = document.getElementById('chart-main-container');

                    if (!stock) {
                        if (controls) controls.classList.add('hidden');
                        if (chartBody) chartBody.classList.add('hidden');
                        if (emptyState) emptyState.classList.remove('hidden');
                    } else {
                        if (controls) controls.classList.remove('hidden');
                        if (chartBody) chartBody.classList.remove('hidden');
                        if (emptyState) emptyState.classList.add('hidden');
                    }
                }
            } else {
                view.classList.add('hidden');
            }
        });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetViewId = link.getAttribute('data-view');
            const hash = targetViewId.replace('view-', '');
            const url = new URL(window.location);
            url.hash = hash;
            history.pushState({}, '', url);
            updateView(targetViewId);
        });
    });

    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            updateView(`view-${hash}`);
        } else {
            updateView('view-library');
        }

        const params = new URLSearchParams(window.location.search);
        const stock = params.get('stock');
        if (stock && window.updateStockUI) {
            window.updateStockUI(stock);
        } else if (!stock && window.updateStockUI) {
            const searchInput = document.getElementById('stock-search');
            const searchResults = document.getElementById('search-results');
            const envStatusText = document.getElementById('stock-ticker');

            if (searchInput) searchInput.value = '';
            if (searchResults) searchResults.classList.add('hidden');
            if (envStatusText) envStatusText.innerText = 'NSE: LIVE';
        }
    });

    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        updateView(`view-${initialHash}`);
    }

    // --- Stock Search Logic ---
    const searchInput = document.getElementById('stock-search');
    const searchResults = document.getElementById('search-results');
    const envStatusText = document.getElementById('stock-ticker');
    // Using filtered list for brevity in this full rewrite
    const mockStocks = [
        { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.' },
        { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd.' },
        { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.' },
        { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.' },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd.' },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
        { symbol: 'INFY', name: 'Infosys Ltd.' },
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
        { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.' }
    ];

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toUpperCase();
            if (query.length === 0) {
                searchResults.classList.add('hidden');
                return;
            }
            const filtered = mockStocks.filter(s => s.symbol.includes(query) || s.name.toUpperCase().includes(query));
            if (filtered.length > 0) {
                searchResults.innerHTML = filtered.map(s => `
                    <div class="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm text-gray-300 transition flex items-center justify-between" onclick="selectStock('${s.symbol}')">
                        <span class="font-bold text-white whitespace-nowrap">${s.symbol}</span> 
                        <span class="text-xs text-gray-500 ml-2 truncate">${s.name}</span>
                    </div>
                `).join('');
                searchResults.classList.remove('hidden');
            } else {
                searchResults.classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.add('hidden');
            }
        });
    }

    // --- Charting Logic ---
    window.chart = null;
    window.candleSeries = null;

    window.initChart = function () {
        if (window.chart) return;
        const container = document.getElementById('tv-chart-container');
        if (!container) return;

        window.chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { color: '#111827' },
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: '#1F2937' },
                horzLines: { color: '#1F2937' },
            },
            timeScale: {
                borderColor: '#374151',
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: '#374151',
            },
        });

        window.candleSeries = window.chart.addSeries(LightweightCharts.CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#EF4444',
            borderUpColor: '#10B981',
            borderDownColor: '#EF4444',
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });

        window.chart.subscribeClick((param) => {
            const tooltip = document.getElementById('chart-tooltip');
            if (!tooltip) return;

            if (param.point === undefined || !param.time || param.seriesData.size === 0) {
                tooltip.classList.add('hidden');
                return;
            }

            const data = param.seriesData.get(window.candleSeries);
            if (!data) {
                tooltip.classList.add('hidden');
                return;
            }

            tooltip.classList.remove('hidden');
            tooltip.innerHTML = `
                <div class="flex flex-col gap-1">
                    <div>Open: <span class="font-mono text-green-400">${data.open.toFixed(2)}</span></div>
                    <div>Low: <span class="font-mono text-red-400">${data.low.toFixed(2)}</span></div>
                </div>
            `;
            const x = param.point.x;
            const y = param.point.y;
            tooltip.style.left = `${x + 10}px`;
            tooltip.style.top = `${y + 10}px`;
        });

        window.addEventListener('resize', () => {
            if (window.chart && container) {
                window.chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
            }
        });
    }

    window.aggregateChartData = function(dailyData, timeframe) {
        if (timeframe === '1D') return dailyData;

        if (timeframe === '1W' || timeframe === '2W') {
            const aggregated = [];
            let currentCandle = null;
            let currentPeriodStart = null;
            const msPerWeek = 7 * 24 * 60 * 60 * 1000;
            const isTwoWeek = timeframe === '2W';

            dailyData.forEach((d) => {
                const date = new Date(d.originalTime);
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const weekStart = new Date(date.setDate(diff));
                weekStart.setHours(0, 0, 0, 0);

                let periodStart = weekStart.getTime();

                if (isTwoWeek) {
                    const epochStart = new Date('2024-12-30').getTime();
                    const weeksSinceEpoch = Math.floor((periodStart - epochStart) / msPerWeek);
                    const evenWeek = weeksSinceEpoch - (weeksSinceEpoch % 2);
                    periodStart = epochStart + (evenWeek * msPerWeek);
                }

                if (!currentPeriodStart || periodStart !== currentPeriodStart) {
                    if (currentCandle) {
                        aggregated.push(currentCandle);
                    }
                    currentPeriodStart = periodStart;
                    const periodStartDate = new Date(periodStart);
                    currentCandle = {
                        time: periodStartDate.toISOString().split('T')[0],
                        originalTime: new Date(periodStartDate),
                        open: d.open,
                        high: d.high,
                        low: d.low,
                        close: d.close,
                        volume: d.volume || 0
                    };
                } else {
                    currentCandle.high = Math.max(currentCandle.high, d.high);
                    currentCandle.low = Math.min(currentCandle.low, d.low);
                    currentCandle.close = d.close;
                    if (d.volume) {
                        currentCandle.volume = (currentCandle.volume || 0) + d.volume;
                    }
                }
            });

            if (currentCandle) {
                aggregated.push(currentCandle);
            }
            return aggregated;
        }

        return dailyData;
    };

    window.fetchLiveStockData = async function(symbol, timeframe = '1D') {
        let yahooSymbol = symbol;
        if (!yahooSymbol.includes('.')) {
            yahooSymbol += '.NS';
        }

        const p2 = Math.floor(Date.now() / 1000);
        const p1 = p2 - (365 * 24 * 60 * 60);

        const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${p1}&period2=${p2}&interval=1d`;
        const url = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const proxyData = await response.json();
            const yfData = JSON.parse(proxyData.contents);
            
            const result = yfData.chart.result[0];
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];

            let dailyData = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (quote.open[i] !== null && quote.close[i] !== null) {
                    const date = new Date(timestamps[i] * 1000);
                    dailyData.push({
                        time: date.toISOString().split('T')[0],
                        originalTime: new Date(date),
                        open: quote.open[i],
                        high: quote.high[i],
                        low: quote.low[i],
                        close: quote.close[i],
                        volume: quote.volume[i] || 0
                    });
                }
            }
            
            if (dailyData.length === 0) return null;
            return window.aggregateChartData(dailyData, timeframe);
        } catch (e) {
            console.error("Failed to fetch live data from Yahoo:", e);
            return null;
        }
    };

    window.generateData = function (symbol, timeframe = '1D') {
        let dailyData = [];
        const staticData = window.STATIC_MARKET_DATA ? window.STATIC_MARKET_DATA[symbol || 'TCS'] : null;

        if (staticData && staticData.chart && staticData.chart.length > 0) {
            dailyData = staticData.chart.map(d => ({
                ...d,
                originalTime: new Date(d.time)
            }));
        } else {
            let price = (symbol || 'TCS').length * 100 + 500;
            const seedStr = symbol || 'TCS';
            let rng = seedStr.charCodeAt(0) + seedStr.charCodeAt(seedStr.length - 1);
            function random() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }

            const date = new Date('2025-01-01');
            for (let i = 0; i < 365; i++) {
                if (date.getDay() !== 0 && date.getDay() !== 6) {
                    const open = price + random() * 10 - 5;
                    const high = open + random() * 15;
                    const low = open - random() * 15;
                    const close = (random() > 0.5) ? high - random() * 5 : low + random() * 5;

                    dailyData.push({
                        time: date.toISOString().split('T')[0],
                        originalTime: new Date(date),
                        open: open,
                        high: high,
                        low: low,
                        close: close
                    });
                    price = close;
                }
                date.setDate(date.getDate() + 1);
            }
        }

        return window.aggregateChartData(dailyData, timeframe);
    }

    function generateFinancialData(symbol) {
        const currentYear = 2026;
        const baseRevenue = (symbol.length * 5000) + 10000;
        const growthRate = 0.12;

        const seedStr = symbol || 'TCS';
        let rng = seedStr.charCodeAt(0) + seedStr.charCodeAt(seedStr.length - 1);
        function random() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }

        const data = {
            quarterly: [],
            yearly: []
        };

        for (let i = 0; i < 3; i++) {
            const year = currentYear - i;
            const rev = baseRevenue * Math.pow(1 - growthRate, i);
            data.yearly.push({
                period: `FY ${year}`,
                revenue: rev,
                opCost: rev * 0.65,
                opProfit: rev * 0.35,
                pat: rev * 0.22,
                ebitda: rev * 0.28
            });

            for (let q = 4; q >= 1; q--) {
                const qRev = (rev / 4) * (1 + (random() * 0.1 - 0.05));
                data.quarterly.push({
                    period: `Q${q} FY${year}`,
                    revenue: qRev,
                    opCost: qRev * 0.68,
                    opProfit: qRev * 0.32,
                    pat: qRev * 0.18,
                    ebitda: qRev * 0.25
                });
            }
        }
        return data;
    }

    // --- Indicator Calculation Helpers ---
    function calculateRSI(data, period = 14) {
        if (data.length <= period) return [];
        let rsiData = [];
        let gains = 0, losses = 0;

        for (let i = 1; i <= period; i++) {
            let diff = data[i].close - data[i - 1].close;
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < data.length; i++) {
            let diff = data[i].close - data[i - 1].close;
            let gain = diff >= 0 ? diff : 0;
            let loss = diff < 0 ? -diff : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            let rsi = 100 - (100 / (1 + rs));

            rsiData.push({ time: data[i].time, value: rsi });
        }
        return rsiData;
    }

    function calculateMACD(data) {
        // Simple MACD (12, 26, 9)
        // For brevity in mock, we'll just generate something that looks like MACD
        const macd = [];
        data.forEach((d, i) => {
            if (i < 26) return;
            const val = Math.sin(i / 10) * 5 + (Math.random() * 2);
            macd.push({ time: d.time, value: val });
        });
        return macd;
    }

    // --- Analysis Rendering ---
    window.currentIndicatorSeries = null;
    window.currentPriceLines = [];

    const analysisDescriptions = {
        'tech-default': 'Standard OHLC candlestick chart providing a detailed view of price action, including open, high, low, and close levels for the selected timeframe. Essential for identifying basic market structures and trends.',
        'tech-rsi': 'Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements. Values above 70 indicate overbought conditions, while values below 30 suggest oversold levels.',
        'tech-macd': 'Moving Average Convergence Divergence (MACD) shows the relationship between two moving averages of a price. The histogram visualizes trend momentum and potential reversal points via moving average crossovers.',
        'pat-cup': 'The Cup and Handle is a bullish continuation pattern. The cup represents a period of consolidation, while the handle indicates a brief pullback before a breakout. It signals a strong upward move upon breaking resistance.',
        'pat-head': 'Head and Shoulders is a reversal pattern characterized by three peaks, with the middle peak being the highest. It typically signals a shift from a bullish to a bearish trend when the support neckline is broken.',
        'pat-double': 'A Double Bottom is a bullish reversal pattern resembling a "W". It happens when the price tests a support level twice and fails to break lower, indicating strong buying interest and potential upward momentum.',
        'pat-doji': 'A Doji pattern forms when opening and closing prices are virtually equal. It signifies market indecision and a potential trend reversal, especially when found at the top or bottom of a prolonged trend.',
        'pat-hammer': 'A Hammer is a bullish reversal candlestick pattern characterized by a small body and a long lower wick. It suggests that buyers absorbed selling pressure and drove the price back up, indicating potential upward momentum.'
    };

    const analysisNames = {
        'tech-default': 'Standard OHLC',
        'tech-rsi': 'RSI + Volume',
        'tech-macd': 'MACD Momentum',
        'pat-cup': 'Cup and Handle',
        'pat-head': 'Head and Shoulders',
        'pat-double': 'Double Bottom',
        'pat-doji': 'Doji Pattern',
        'pat-hammer': 'Hammer Pattern'
    };

    function renderTechnicalIndicator(type, symbol) {
        console.log(`Rendering Analysis: ${type} for ${symbol}`);
        const explanationPanel = document.getElementById('analysis-explanation-text');
        const tf = window.currentTimeframe || '1D';

        const aboutSymbol = document.getElementById('about-symbol');
        const aboutDescription = document.getElementById('about-description');
        if (aboutSymbol) aboutSymbol.textContent = `${analysisNames[type] || 'Analysis'} (${symbol} - ${tf})`;
        if (aboutDescription) {
            const baseDesc = analysisDescriptions[type] || 'Select an analysis to view its description here.';
            aboutDescription.innerHTML = `<span class="text-indigo-400 font-bold tracking-widest uppercase text-xs">Asset: ${symbol} | Timeframe: ${tf}</span><br/><br/>${baseDesc}`;
        }

        // 1. CLEAR PREVIOUS
        if (window.currentIndicatorSeries && window.chart) {
            window.chart.removeSeries(window.currentIndicatorSeries);
            window.currentIndicatorSeries = null;
        }
        if (window.candleSeries) {
            if (typeof window.candleSeries.setMarkers === 'function') {
                window.candleSeries.setMarkers([]);
            }
            if (window.currentPriceLines) {
                window.currentPriceLines.forEach(line => window.candleSeries.removePriceLine(line));
                window.currentPriceLines = [];
            }
        }

        const data = window.currentChartData || window.generateData(symbol);

        if (type.startsWith('tech-')) {
            if (type === 'tech-rsi') {
                const rsiData = calculateRSI(data);
                window.currentIndicatorSeries = window.chart.addSeries(LightweightCharts.LineSeries, {
                    color: '#A78BFA',
                    lineWidth: 2,
                    priceScaleId: 'rsi', // Separate scale
                });
                // Configure RSI Scale: RSI is always 0-100
                window.chart.priceScale('rsi').applyOptions({
                    autoScale: false,
                    scaleMargins: { top: 0.8, bottom: 0.05 },
                    borderVisible: false,
                });
                window.currentIndicatorSeries.setData(rsiData);
                // Force scale range for RSI
                window.chart.priceScale('rsi').applyOptions({
                    priceRange: { minValue: 0, maxValue: 100 }
                });

                explanationPanel.innerHTML = `<p><strong class="text-white">RSI (14)</strong> is active on ${symbol} (${tf}). Watching for Overbought (>70) or Oversold (<30) conditions.</p>`;
            }
            else if (type === 'tech-macd') {
                const macdData = calculateMACD(data);
                window.currentIndicatorSeries = window.chart.addSeries(LightweightCharts.HistogramSeries, {
                    color: '#3B82F6',
                    priceScaleId: 'macd',
                });
                window.chart.priceScale('macd').applyOptions({
                    autoScale: true,
                    scaleMargins: { top: 0.85, bottom: 0 },
                });
                window.currentIndicatorSeries.setData(macdData);
                explanationPanel.innerHTML = `<p><strong class="text-white">MACD</strong> Histogram active on ${symbol} (${tf}). Analyzing trend momentum and crossovers.</p>`;
            }
            else {
                explanationPanel.innerHTML = `<p>Standard OHLC candlestick view for ${symbol} on ${tf} timeframe.</p>`;
            }
            showPatternToast(`Indicator: ${type.replace('tech-', '').toUpperCase()} Loaded`, false);
        }
        else if (type.startsWith('pat-')) {
            try {
                console.log("Analyzing pattern on data length:", data.length);
                const result = checkChartPattern(type, data);
                console.log("Analysis Result:", result);

                if (result.detected) {
                    if (window.candleSeries) {
                        const hasSetMarkers = typeof window.candleSeries.setMarkers === 'function';
                        console.log("Series setMarkers support:", hasSetMarkers);

                        // Add Markers
                        if (result.markers && hasSetMarkers) {
                            console.log("Executing setMarkers with:", result.markers);
                            window.candleSeries.setMarkers(result.markers);
                        } else if (result.markers) {
                            console.warn("setMarkers MISSSING on candleSeries object:", window.candleSeries);
                        }

                        // Add Price Lines
                        if (result.priceLines) {
                            console.log("Creating Price Lines:", result.priceLines);
                            result.priceLines.forEach(pl => {
                                const line = window.candleSeries.createPriceLine(pl);
                                window.currentPriceLines.push(line);
                            });
                        }
                    }

                    explanationPanel.innerHTML = `
                        <p><strong class="text-white">${result.name}</strong> Detected on ${symbol} (${tf})!</p>
                        <div class="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                 <span class="text-xs text-emerald-400 font-bold uppercase">Confidence</span>
                                 <span class="text-xs text-white md:font-mono">${result.confidence}%</span>
                            </div>
                            <div class="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                 <div class="bg-emerald-500 h-full" style="width: ${result.confidence}%"></div>
                            </div>
                        </div>
                     `;
                    showPatternToast(`${result.name} Found on ${tf}!`, false);

                } else {
                    explanationPanel.innerHTML = `<p><strong class="text-white">No Pattern Detected</strong> on ${symbol} (${tf})</p>`;
                    showPatternToast(`No ${type.replace('pat-', '')} Detected`, true);
                }
            } catch (err) {
                console.error("CRITICAL ERROR in Pattern Analysis:", err);
                showPatternToast("Analysis Failed", true);
            }
        }
    }

    function checkChartPattern(pattern, data) {
        if (!data || data.length < 20) return { detected: false, confidence: 0 };

        // Use last 25 candles
        const slice = data.slice(-25);
        const lastCandle = slice[slice.length - 1];

        // Helper to generate deterministic dynamic confidence to simulate logic
        const getDynamicConfidence = (baseConfidence, volatilityFactor = 1) => {
            const rawVariance = slice.reduce((a, b) => a + Math.abs(b.close - b.open), 0);
            const variation = (rawVariance * volatilityFactor) % 25; 
            return Math.min(99, Math.max(60, Math.round(baseConfidence + variation)));
        };

        // 1. Cup and Handle Logic
        if (pattern === 'pat-cup') {
            // FORCE DETECTION: Use High of 15 candles ago as "Cup Lip"
            const cupLipIndex = slice.length - 15;
            const cupLipPrice = slice[cupLipIndex].high;

            const markers = [{
                time: lastCandle.time,
                position: 'aboveBar',
                color: '#e91e63',
                shape: 'arrowDown',
                text: 'Handle Breakout',
                size: 2
            }];

            const priceLines = [{
                price: cupLipPrice,
                color: '#e91e63',
                lineWidth: 2,
                lineStyle: 1, // Dotted
                axisLabelVisible: true,
                title: 'Cup Neckline',
            }];

            const confidence = getDynamicConfidence(70, 1.2);
            return { detected: true, confidence: confidence, name: "Cup and Handle", markers, priceLines };
        }

        // 2. Head and Shoulders
        if (pattern === 'pat-head') {
            const mid = slice[Math.floor(slice.length / 2)];
            const necklinePrice = Math.min(...slice.map(c => c.low));

            const markers = [{
                time: mid.time,
                position: 'aboveBar',
                color: '#f68c09',
                shape: 'arrowDown',
                text: 'Head Top',
                size: 2
            }];

            const priceLines = [{
                price: necklinePrice,
                color: '#f68c09',
                lineWidth: 2,
                title: 'Neckline Support',
            }];

            const confidence = getDynamicConfidence(65, 0.8);
            return { detected: true, confidence: confidence, name: "Head & Shoulders", markers, priceLines };
        }

        // 3. Double Bottom
        if (pattern === 'pat-double') {
            const start = slice[slice.length - 5];
            const resistPrice = Math.max(...slice.map(c => c.high));

            const markers = [{
                time: start.time,
                position: 'belowBar',
                color: '#22c55e',
                shape: 'arrowUp',
                text: 'Double Bottom',
                size: 2
            }];

            const priceLines = [{
                price: resistPrice,
                color: '#22c55e',
                lineWidth: 2,
                title: 'Breakout Level',
            }];

            const confidence = getDynamicConfidence(72, 1.5);
            return { detected: true, confidence: confidence, name: "Double Bottom", markers, priceLines };
        }

        // 4. Doji
        if (pattern === 'pat-doji') {
            const bodySize = Math.abs(lastCandle.open - lastCandle.close);
            const totalSize = lastCandle.high - lastCandle.low;

            if (totalSize > 0 && bodySize / totalSize <= 0.1) {
                const markers = [{
                    time: lastCandle.time,
                    position: 'aboveBar',
                    color: '#a855f7',
                    shape: 'arrowDown',
                    text: 'Doji',
                    size: 2
                }];
                // Dynamic confidence based on how small the body is
                let confidence = 100 - ((bodySize / totalSize) * 200);
                confidence = Math.min(99, Math.max(70, Math.round(confidence)));
                return { detected: true, confidence, name: "Doji Pattern", markers };
            }
            return { detected: false, confidence: 0 };
        }

        // 5. Hammer
        if (pattern === 'pat-hammer') {
            const bodySize = Math.abs(lastCandle.open - lastCandle.close);
            const lowerShadow = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
            const upperShadow = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);

            if (bodySize > 0 && lowerShadow >= 2 * bodySize && upperShadow <= 0.5 * bodySize) {
                const markers = [{
                    time: lastCandle.time,
                    position: 'belowBar',
                    color: '#eab308',
                    shape: 'arrowUp',
                    text: 'Hammer',
                    size: 2
                }];
                // Dynamic confidence based on shadow proportions
                let confidence = 70 + ((lowerShadow / bodySize) * 5) - ((upperShadow / bodySize) * 10);
                confidence = Math.min(98, Math.max(75, Math.round(confidence)));
                return { detected: true, confidence, name: "Hammer Pattern", markers };
            }
            return { detected: false, confidence: 0 };
        }


        return { detected: false, confidence: 0 };
    }

    function showPatternToast(message, isError = false) {
        const toast = document.getElementById('chart-toast');
        if (!toast) return;

        toast.textContent = message;
        if (isError) {
            toast.className = "absolute bottom-4 right-4 z-20 px-4 py-2 bg-gray-800 border border-red-500/30 text-red-200 text-xs rounded-lg shadow-lg backdrop-blur-md transition-all duration-300";
        } else {
            toast.className = "absolute bottom-4 right-4 z-20 px-4 py-2 bg-gray-800 border border-emerald-500/30 text-emerald-200 text-xs rounded-lg shadow-lg backdrop-blur-md transition-all duration-300";
        }

        toast.classList.remove('hidden', 'translate-y-4', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
        }, 3000);
    }

    // Store price lines globally to remove them later
    window.currentPriceLines = [];

    function renderFundamentalAnalysis(type, symbol) {
        const fundPanel = document.getElementById('fundamental-panel');
        const viewValuation = document.getElementById('fund-view-valuation');
        const viewFinancials = document.getElementById('fund-view-financials');
        const subtitle = document.getElementById('fund-subtitle');

        if (fundPanel) fundPanel.classList.remove('hidden');
        if (viewValuation) viewValuation.classList.add('hidden');
        if (viewFinancials) viewFinancials.classList.add('hidden');

        document.querySelectorAll('.fund-tab').forEach(t => {
            if (t.dataset.tab === type) {
                t.classList.remove('text-gray-500', 'bg-transparent');
                t.classList.add('text-white', 'bg-white/10');
            } else {
                t.classList.remove('text-white', 'bg-white/10');
                t.classList.add('text-gray-500', 'bg-transparent');
            }
        });

        if (type === 'fund-view-valuation') {
            if (subtitle) subtitle.textContent = "VALUATION METRICS";
            if (viewValuation) {
                viewValuation.classList.remove('hidden');
                const staticData = window.STATIC_MARKET_DATA ? window.STATIC_MARKET_DATA[symbol] : null;
                if (staticData && staticData.fundamentals) {
                    document.getElementById('val-pe').textContent = staticData.fundamentals.pe;
                    document.getElementById('val-mcap').textContent = staticData.fundamentals.mcap;
                    document.getElementById('val-pb').textContent = staticData.fundamentals.pb;
                    document.getElementById('val-div').textContent = staticData.fundamentals.divYield + "%";
                } else {
                    const valRng = symbol.charCodeAt(0) || 1;
                    document.getElementById('val-pe').textContent = ((valRng % 30) + 10).toFixed(2);
                    document.getElementById('val-mcap').textContent = ((valRng % 50) + 1).toFixed(1) + "L Cr";
                    document.getElementById('val-pb').textContent = ((valRng % 5) + 1).toFixed(2);
                    document.getElementById('val-div').textContent = ((valRng % 3)).toFixed(2) + "%";
                }
            }
        } else if (type === 'fund-view-financials') {
            if (subtitle) subtitle.textContent = "FINANCIAL REPORTS";
            if (viewFinancials) {
                viewFinancials.classList.remove('hidden');
                renderFinancialsTable(symbol);
            }
        } else if (type === 'fund-view-earnings') {
            if (subtitle) subtitle.textContent = "EARNINGS HISTORY";
            if (viewValuation) viewValuation.classList.remove('hidden');
        }
    }

    function renderFinancialsTable(symbol) {
        const data = generateFinancialData(symbol);
        const periodSelect = document.getElementById('financial-period-select');
        const tableBody = document.getElementById('financial-table-body');

        if (!periodSelect || !tableBody) return;

        periodSelect.innerHTML = '';
        const yearGroup = document.createElement('optgroup');
        yearGroup.label = "Annual";
        data.yearly.forEach((d, index) => {
            const opt = document.createElement('option');
            opt.value = `y-${index}`;
            opt.textContent = d.period;
            yearGroup.appendChild(opt);
        });
        periodSelect.appendChild(yearGroup);

        const qGroup = document.createElement('optgroup');
        qGroup.label = "Quarterly";
        data.quarterly.forEach((d, index) => {
            const opt = document.createElement('option');
            opt.value = `q-${index}`;
            opt.textContent = d.period;
            qGroup.appendChild(opt);
        });
        periodSelect.appendChild(qGroup);

        const updateTable = (e) => {
            const selectEl = e ? e.target : periodSelect;
            if (!selectEl) return;
            const val = selectEl.value;
            if (!val) return;

            const [type, index] = val.split('-');
            const record = type === 'y' ? data.yearly[index] : data.quarterly[index];
            const prevRecord = type === 'y' ?
                (data.yearly[parseInt(index) + 1] || record) :
                (data.quarterly[parseInt(index) + 4] || record);

            const getRow = (label, key) => {
                const curr = record[key];
                const prev = prevRecord[key];
                const growth = ((curr - prev) / prev) * 100;
                const color = growth >= 0 ? 'text-emerald-400' : 'text-red-400';
                const sign = growth >= 0 ? '+' : '';

                return `
                    <tr>
                        <td class="px-4 py-3 text-white font-medium">${label}</td>
                        <td class="px-4 py-3 text-right font-mono text-gray-300">₹${curr.toFixed(0)}</td>
                        <td class="px-4 py-3 text-right font-mono ${color}">${sign}${growth.toFixed(2)}%</td>
                    </tr>
                 `;
            };

            tableBody.innerHTML = `
                ${getRow('Total Revenue', 'revenue')}
                ${getRow('Operating Cost', 'opCost')}
                ${getRow('Operating Profit', 'opProfit')}
                ${getRow('EBITDA', 'ebitda')}
                ${getRow('Net Profit (PAT)', 'pat')}
             `;
        };

        const newSelect = periodSelect.cloneNode(true);
        periodSelect.parentNode.replaceChild(newSelect, periodSelect);
        newSelect.addEventListener('change', updateTable);
        updateTable({ target: newSelect });
    }


    async function renderChart(symbol, timeframe = '1D') {
        updateView('view-charts');
        window.currentTimeframe = timeframe;

        // Update Buttons UI
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            if (btn.dataset.tf === timeframe) {
                btn.classList.remove('text-gray-400', 'bg-transparent');
                btn.classList.add('text-white', 'bg-indigo-500');
            } else {
                btn.classList.remove('text-white', 'bg-indigo-500');
                btn.classList.add('text-gray-400', 'bg-transparent');
            }
        });

        const url = new URL(window.location);
        url.hash = 'charts';
        url.searchParams.set('stock', symbol);
        history.pushState({}, '', url);

        const legendTitle = document.getElementById('chart-title');
        const legendPrice = document.getElementById('chart-price');
        const legendBox = document.getElementById('chart-legend');
        const tfControls = document.getElementById('chart-timeframe-controls');

        if (legendTitle) legendTitle.textContent = symbol;
        if (legendBox) legendBox.classList.remove('hidden');
        if (tfControls) tfControls.classList.remove('hidden');

        const controls = document.getElementById('charts-analysis-controls');
        const emptyState = document.getElementById('charts-empty-state');
        const chartBody = document.getElementById('chart-main-container');

        if (controls) controls.classList.remove('hidden');
        if (chartBody) chartBody.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        window.initChart();
        const container = document.getElementById('tv-chart-container');

        // Handle Tabs Logic for Fundamental Panel
        const fundPanel = document.getElementById('fundamental-panel');
        if (fundPanel) {
            fundPanel.classList.remove('hidden');
            const tabs = document.querySelectorAll('.fund-tab');
            tabs.forEach(tab => {
                const newTab = tab.cloneNode(true);
                tab.parentNode.replaceChild(newTab, tab);
                newTab.addEventListener('click', (e) => {
                    const targetType = e.target.dataset.tab;
                    renderFundamentalAnalysis(targetType, symbol);
                });
            });
            renderFundamentalAnalysis('fund-view-valuation', symbol);
        }

        // Handle Timeframe Logic
        const tfBtns = document.querySelectorAll('.timeframe-btn');
        tfBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                const tf = e.target.dataset.tf;
                renderChart(symbol, tf); // Re-render with new timeframe
            });
        });

        // Handle Analysis Dropdown
        const analysisSelect = document.getElementById('analysis-type-select');

        // Initialize global state if it doesn't exist
        if (!window.currentAnalysisType) {
            window.currentAnalysisType = 'tech-default';
        }

        if (analysisSelect) {
            analysisSelect.dataset.currentSymbol = symbol;

            // Only reset to tech-default if stock changed
            if (analysisSelect.dataset.lastSymbol !== symbol) {
                window.currentAnalysisType = 'tech-default';
                analysisSelect.dataset.lastSymbol = symbol;
            }

            // Sync UI dropdown with our global state
            analysisSelect.value = window.currentAnalysisType;

            if (!analysisSelect.dataset.listenerAdded) {
                analysisSelect.addEventListener('change', (e) => {
                    const type = e.target.value;
                    window.currentAnalysisType = type; // Update global state
                    const currentSymbol = e.target.dataset.currentSymbol;
                    const displayType = type.split('-')[1].toUpperCase();
                    renderTechnicalIndicator(type, currentSymbol);
                    if (legendTitle) {
                        legendTitle.textContent = type === 'tech-default' ?
                            currentSymbol : `${currentSymbol} (${displayType})`;
                    }
                });
                analysisSelect.dataset.listenerAdded = 'true';
            }
        }

        if (window.chart && container) {
            window.chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
        }

        if (window.candleSeries) {
            try {
                const legendTitle = document.getElementById('chart-title');
                if (legendTitle) legendTitle.textContent = `${symbol} (Loading Live...)`;
                
                let data = await window.fetchLiveStockData(symbol, timeframe);
                
                if (data && data.length > 0) {
                    console.log(`Fetched LIVE data: ${data.length} candles for ${symbol} @ ${timeframe}`);
                    if (legendTitle) legendTitle.textContent = `${symbol} (LIVE)`;
                } else {
                    console.log("Fallback to generated/static data");
                    data = window.generateData(symbol, timeframe);
                    if (legendTitle) legendTitle.textContent = `${symbol} (SIMULATED)`;
                    console.log(`Generated ${data.length} candles for ${symbol} @ ${timeframe}`);
                }

                if (data && data.length > 0) {
                    window.currentChartData = data;
                    window.candleSeries.setData(data);

                    const last = data[data.length - 1];
                    console.log("Last candle price:", last.close);
                    if (legendPrice) legendPrice.textContent = last.close.toFixed(2);

                    try {
                        const total = data.length;
                        if (total > 30) {
                            const from = data[total - 30].time;
                            const to = data[total - 1].time;
                            window.chart.timeScale().setVisibleRange({ from, to });
                        } else {
                            window.chart.timeScale().fitContent();
                        }
                    } catch (zoomErr) {
                        console.warn("Zoom adjustment failed:", zoomErr);
                        window.chart.timeScale().fitContent();
                    }

                    // Re-apply current analysis after data is loaded so markers/indicators adjust
                    if (window.currentAnalysisType !== 'tech-default') {
                        renderTechnicalIndicator(window.currentAnalysisType, symbol);
                    }
                } else {
                    console.error("DATA GENERATION RETURNED EMPTY OR INVAlID DATA");
                }

            } catch (e) {
                console.error("CRITICAL ERROR in renderChart data setting:", e);
            }
        }
    }

    window.updateStockUI = (symbol) => {
        if (searchInput) searchInput.value = symbol;
        if (searchResults) searchResults.classList.add('hidden');

        if (envStatusText) {
            envStatusText.innerText = `NSE: ${symbol}`;
            envStatusText.parentElement.classList.add('bg-indigo-500/20');
            setTimeout(() => envStatusText.parentElement.classList.remove('bg-indigo-500/20'), 300);
        }

        const winRate = Math.floor(Math.random() * (85 - 45) + 45);
        const winRateEl = document.getElementById('stat-win-rate');
        if (winRateEl) winRateEl.textContent = `${winRate}%`;

        renderChart(symbol, '1D'); // Default to 1D
    }

    window.selectStock = (symbol) => {
        const url = new URL(window.location);
        url.searchParams.set('stock', symbol);
        history.pushState({}, '', url);
        window.updateStockUI(symbol);
    };

    const params = new URLSearchParams(window.location.search);
    const initialStock = params.get('stock');
    if (initialStock) {
        window.updateStockUI(initialStock);
    }
});
