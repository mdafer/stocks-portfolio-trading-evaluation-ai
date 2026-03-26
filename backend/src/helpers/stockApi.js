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

    const currency = chartRes.meta?.currency || null;

    const latest = history[history.length - 1].close;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);

    // Find closest date before or on target
    const pastArr = history.filter(h => new Date(h.date) <= targetDate);
    const past = pastArr.length > 0 ? pastArr[pastArr.length - 1].close : history[0].close;

    const changePercent = ((latest - past) / past) * 100;

    const latestDate = history[history.length - 1].date;
    const pastDate = pastArr.length > 0 ? pastArr[pastArr.length - 1].date : history[0].date;

    return {
      symbol, period,
      currentPrice: latest,
      pastPrice: past,
      change: latest - past,
      changePercent: Math.round(changePercent * 100) / 100,
      currency,
      currentDate: latestDate ? new Date(latestDate).toISOString().split('T')[0] : null,
      pastDate: pastDate ? new Date(pastDate).toISOString().split('T')[0] : null,
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

/**
 * Fetch actual top market movers using Yahoo Finance screener
 */
async function getMarketMovers(region = 'US', count = 6) {
  const regionMap = { US: 'US', CA: 'CA' };
  const yfRegion = regionMap[region] || 'US';

  try {
    const [gainersRes, losersRes] = await Promise.all([
      fetchWithRetry(yf.screener, [{ scrIds: 'day_gainers', count, region: yfRegion }]),
      fetchWithRetry(yf.screener, [{ scrIds: 'day_losers', count, region: yfRegion }]),
    ]);

    // Validate response structure
    if (!gainersRes || !gainersRes.quotes || !losersRes || !losersRes.quotes) {
      console.error(`[YahooApi] Invalid screener response for ${region}:`, {
        gainers: gainersRes ? Object.keys(gainersRes) : 'null',
        losers: losersRes ? Object.keys(losersRes) : 'null'
      });
      return { topPerformers: [], bottomPerformers: [] };
    }

    const mapQuotes = (quotes) => (quotes || []).map(q => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      change: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
      price: q.regularMarketPrice,
      currency: q.currency,
    }));

    return {
      topPerformers: mapQuotes(gainersRes.quotes).slice(0, count),
      bottomPerformers: mapQuotes(losersRes.quotes).slice(0, count),
    };
  } catch (err) {
    console.error(`[YahooApi] Market movers screener fail for ${region}:`, {
      message: err.message,
      code: err.code,
      status: err.status
    });
    return { topPerformers: [], bottomPerformers: [] };
  }
}

/**
 * Batch dividend data for a list of symbols
 */
async function getDividendData(symbols) {
  if (symbols.length === 0) return {};

  const toDate = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val);
    return isNaN(d) ? null : d.toISOString().split('T')[0];
  };

  const result = {};

  // Batch quote fetch for basic dividend fields
  try {
    const quotes = await fetchWithRetry(yf.quote, [symbols]);
    const qArray = Array.isArray(quotes) ? quotes : [quotes];
    qArray.forEach(q => {
      if (!q) return;
      result[q.symbol] = {
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        dividendRate: q.dividendRate ?? null,
        // dividendYield is already a percentage (e.g. 26.32 for 26.32%), don't multiply
        dividendYield: q.dividendYield != null ? parseFloat((q.dividendYield).toFixed(2)) : null,
        exDividendDate: toDate(q.exDividendDate),
        // dividendDate in yf.quote is the last payment date
        lastDividendDate: toDate(q.dividendDate),
        lastDividendValue: null,
        currency: q.currency ?? null,
      };
    });
  } catch (err) {
    console.error(`[YahooApi] Dividend quote fail: ${err.message}`);
    return {};
  }

  // Parallel quoteSummary calls to get lastDividendValue & lastDividendDate
  const dividendSymbols = symbols.filter(s => result[s]);
  await Promise.all(
    dividendSymbols.map(async (sym) => {
      try {
        const summary = await fetchWithRetry(yf.quoteSummary, [sym, { modules: ['defaultKeyStatistics'] }]);
        const stats = summary?.defaultKeyStatistics;
        if (!stats || !result[sym]) return;
        if (stats.lastDividendValue != null) result[sym].lastDividendValue = stats.lastDividendValue;
        if (stats.lastDividendDate)          result[sym].lastDividendDate  = toDate(stats.lastDividendDate);
      } catch (_) { /* skip individual failures */ }
    })
  );

  return result;
}

/**
 * Historical chart data for a symbol and period
 */
async function getStockChart(symbol, period) {
  const configs = {
    '1d':  { interval: '5m',  days: 2 },
    '1w':  { interval: '1d',  days: 7 },
    '1m':  { interval: '1d',  days: 30 },
    '3m':  { interval: '1d',  days: 90 },
    '1y':  { interval: '1wk', days: 365 },
    '5y':  { interval: '1mo', days: 1825 },
    '10y': { interval: '1mo', days: 3650 },
  };

  const cfg = configs[period] || configs['1m'];
  const start = new Date();
  start.setDate(start.getDate() - cfg.days);

  const res = await fetchWithRetry(yf.chart, [symbol, {
    period1: start.toISOString().split('T')[0],
    interval: cfg.interval,
  }]);

  const toIso = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val);
    return isNaN(d) ? null : d.toISOString();
  };

  const points = (res.quotes || [])
    .filter(q => q.close != null)
    .map(q => ({ date: toIso(q.date), price: Math.round(q.close * 10000) / 10000 }))
    .filter(q => q.date);

  // For 1d, only keep today's points
  if (period === '1d') {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPoints = points.filter(q => q.date.startsWith(todayStr));
    return { points: todayPoints.length > 0 ? todayPoints : points.slice(-78), currency: res.meta?.currency || null };
  }

  return { points, currency: res.meta?.currency || null };
}

module.exports = { searchStocks, getQuote, getPriceChange, getBulkPriceData, getDashboardQuotes, getMarketMovers, getDividendData, getStockChart };
