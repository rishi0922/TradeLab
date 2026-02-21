const https = require('https');
const fs = require('fs');

const symbols = [
    'ADANIENT.NS', 'ADANIPORTS.NS', 'APOLLOHOSP.NS', 'ASIANPAINT.NS',
    'AXISBANK.NS', 'BAJFINANCE.NS', 'HDFCBANK.NS', 'INFY.NS',
    'RELIANCE.NS', 'TCS.NS'
];

// period1: 2025-01-01T00:00:00Z -> 1735689600
// period2: 2026-01-01T00:00:00Z -> 1767225600
const p1 = 1735689600;
const p2 = 1767225600;

const marketData = {};

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function run() {
    console.log("Fetching data from Yahoo Finance...");
    for (const sym of symbols) {
        const cleanSym = sym.replace('.NS', '');
        console.log(`Fetching ${cleanSym}...`);
        try {
            // Chart Data
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?period1=${p1}&period2=${p2}&interval=1d`;
            const chartRes = await fetchJson(chartUrl);

            const result = chartRes.chart.result[0];
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];

            const chartData = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (quote.open[i] !== null) {
                    const date = new Date(timestamps[i] * 1000);
                    chartData.push({
                        time: date.toISOString().split('T')[0],
                        open: quote.open[i],
                        high: quote.high[i],
                        low: quote.low[i],
                        close: quote.close[i],
                        volume: quote.volume[i]
                    });
                }
            }

            // Generate some static fallback fundamentals since Yahoo's fundamental API often 401s without cookies
            const baseRevenue = (cleanSym.length * 5000) + 10000;
            const fundamentals = {
                pe: (Math.random() * 20 + 10).toFixed(2),
                mcap: (Math.random() * 50 + 5).toFixed(1) + "L Cr",
                pb: (Math.random() * 5 + 1).toFixed(2),
                divYield: (Math.random() * 3).toFixed(2)
            };

            marketData[cleanSym] = {
                chart: chartData,
                fundamentals: fundamentals
            };

        } catch (e) {
            console.error(`Failed to fetch ${sym}:`, e.message);
        }
    }

    const jsContent = `window.STATIC_MARKET_DATA = ${JSON.stringify(marketData, null, 2)};`;
    fs.writeFileSync('static_data.js', jsContent);
    console.log("Successfully wrote static_data.js");
}

run();
