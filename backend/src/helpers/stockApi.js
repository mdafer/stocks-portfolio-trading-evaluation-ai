const { yf } = require('../utils/yahoo');

const PERIOD_DAYS = {
  '1d': 1,
  '1w': 7,
  '1m': 30,
  '1y': 365,
  '5y': 1825,
  '10y': 3650,
};

// Global quote cache (30 minutes)
const quoteCache = new Map();
const QUOTE_CACHE_TTL = 30 * 60 * 1000;

/**
 * Fetch with retry for Rate-Limit (429) backoff
 */
async function fetchWithRetry(fn, args, retries = 3, baseDelayMs = 2000) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(...args);
    } catch (err) {
      lastErr = err;
      const is429 = err.message?.includes('429') || err.message?.includes('Too Many') || err.message?.includes('crumb');
      if (is429 && attempt < retries) {
        const delay = baseDelayMs * attempt;
        console.warn(`[YahooApi] Rate limited, retrying in ${delay}ms… (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        break; 
      }
    }
  }
  throw lastErr;
}

/**
 * Search stocks by symbol or name
 */
async function searchStocks(query) {
  try {
    const results = await fetchWithRetry(yf.search, [query, { quotesCount: 10 }]);
    return results.quotes.map(q => ({
      symbol: q.symbol,
      name: q.longname || q.shortname || q.symbol,
      type: q.quoteType,
      exchange: q.exchange,
      matchScore: 1 
    }));
  } catch (err) {
    console.error(`[YahooApi] Search fail: ${err.message}`);
    return [];
  }
}

/**
 * Get single quote with caching
 */
async function getQuote(symbol) {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.ts < QUOTE_CACHE_TTL) return cached.data;

  try {
    const q = await fetchWithRetry(yf.quote, [symbol]);
    if (!q) return null;

    const result = {
      symbol: q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      volume: q.regularMarketVolume,
      latestTradingDay: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString().split('T')[0] : null,
      source: 'yahoo'
    };

    quoteCache.set(symbol, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn(`[YahooApi] Failed to fetch ${symbol}: ${err.message}`);
    return null;
  }
}

/**
 * Get price change for a period using CHART data (more stable in v3)
 */
async function getPriceChange(symbol, period) {
  try {
    const days = PERIOD_DAYS[period] || 1;
    const start = new Date();
    start.setDate(start.getDate() - (days + 7)); // Buffer for weekends/holidays

    const chartRes = await fetchWithRetry(yf.chart, [symbol, { 
      period1: start.toISOString().split('T')[0],
      interval: '1d'
    }]);

    const history = chartRes.quotes;
    if (!history || history.length < 2) return null;

    const latest = history[history.length - 1].close;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    
    // Find closest date before or on target
    const pastArr = history.filter(h => new Date(h.date) <= targetDate);
    const past = pastArr.length > 0 ? pastArr[pastArr.length - 1].close : history[0].close;

    const changePercent = ((latest - past) / past) * 100;

    return {
      symbol, period,
      currentPrice: latest,
      pastPrice: past,
      change: latest - past,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  } catch (err) {
    console.warn(`[YahooApi] History fail for ${symbol} (${period}): ${err.message}`);
    return null;
  }
}

/**
 * Super fast batch quote fetcher for Dashboard
 */
async function getDashboardQuotes(symbols) {
  if (symbols.length === 0) return {};
  try {
    const quotes = await fetchWithRetry(yf.quote, [symbols]);
    const result = {};
    const qArray = Array.isArray(quotes) ? quotes : [quotes];
    
    qArray.forEach(q => {
      if (!q) return;
      result[q.symbol] = {
        symbol: q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        source: 'yahoo'
      };
    });
    return result;
  } catch (err) {
    console.error(`[YahooApi] Batch quote fail: ${err.message}`);
    return {};
  }
}

/**
 * Bulk data for individual stock detail views
 */
async function getBulkPriceData(symbols) {
  const result = {};
  await Promise.all(
    symbols.map(async (sym) => {
      const quote = await getQuote(sym);
      const changes = {};

      const periods = ['1d', '1w', '1m', '1y'];
      await Promise.all(periods.map(async (p) => {
         const c = await getPriceChange(sym, p);
         if (c) changes[p] = c.changePercent;
      }));

      result[sym] = { currentPrice: quote?.price ?? null, changes };
    })
  );
  return result;
}

module.exports = { searchStocks, getQuote, getPriceChange, getBulkPriceData, getDashboardQuotes };
