const { yf } = require('../utils/yahoo');
const { getStocksBySector, getCompanyProfile, getHistoricalPrices, getIncomeStatement, getMarketGainersLosers } = require('./fmpApi');

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
 * Fetch top market movers — tries FMP first (no ~15% cap), falls back to Yahoo Finance screener
 */
async function getMarketMovers(region = 'US', count = 6) {
  // Try FMP first for US market (better data range, no artificial cap)
  if (region === 'US') {
    try {
      const fmpResult = await getMarketGainersLosers(count);
      if (fmpResult && fmpResult.topPerformers.length > 0) {
        console.log(`[FMP] Market movers fetched successfully (${fmpResult.topPerformers.length} gainers, ${fmpResult.bottomPerformers.length} losers)`);
        return fmpResult;
      }
    } catch (err) {
      console.warn(`[FMP] Market movers failed, falling back to Yahoo: ${err.message}`);
    }
  }

  // Fallback to Yahoo Finance screener
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
 * Batch upcoming-earnings fetch for a list of symbols.
 * Uses Yahoo Finance `calendarEvents` (per symbol). Returns map symbol → entry.
 */
const earningsCache = new Map();
const EARNINGS_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function getUpcomingEarnings(symbols) {
  if (!symbols.length) return {};

  const toDate = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val);
    return isNaN(d) ? null : d;
  };
  const toIso = (val) => {
    const d = toDate(val);
    return d ? d.toISOString().split('T')[0] : null;
  };
  const toIsoFull = (val) => {
    const d = toDate(val);
    return d ? d.toISOString() : null;
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  // Resolve cached vs uncached
  const result = {};
  const toFetch = [];
  for (const sym of symbols) {
    const cached = earningsCache.get(sym);
    if (cached && Date.now() - cached.ts < EARNINGS_TTL) {
      if (cached.data) result[sym] = cached.data;
    } else {
      toFetch.push(sym);
    }
  }

  // Batch — Yahoo quoteSummary is per-symbol; cap concurrency to avoid 429s.
  const BATCH = 6;
  for (let i = 0; i < toFetch.length; i += BATCH) {
    const batch = toFetch.slice(i, i + BATCH);
    await Promise.all(batch.map(async (sym) => {
      try {
        const summary = await fetchWithRetry(yf.quoteSummary, [sym, {
          modules: ['calendarEvents', 'price', 'earningsHistory'],
        }]);
        const ev = summary?.calendarEvents?.earnings;
        const price = summary?.price;

        // ── Upcoming entry ────────────────────────────────────────────────
        let upcoming = null;
        if (ev) {
          // Pair date-only and full-ISO so the times survive sorting
          const rawDates = (ev.earningsDate || [])
            .map(v => ({ date: toIso(v), full: toIsoFull(v) }))
            .filter(d => d.date)
            .sort((a, b) => a.full.localeCompare(b.full));

          const start = rawDates[0] || null;
          const end   = rawDates[1] || rawDates[0] || null;

          // Only count as "upcoming" if any part of the range is today or later
          if (end && new Date(end.date + 'T00:00:00').getTime() >= todayMs) {
            upcoming = {
              earningsDate: start.date,
              earningsDateEnd: end.date !== start.date ? end.date : null,
              earningsDateTimeUTC:    start.full,
              earningsDateTimeEndUTC: end.full !== start.full ? end.full : null,
              isEstimate: !!ev.isEarningsDateEstimate,
              epsAvg:  ev.earningsAverage ?? null,
              epsLow:  ev.earningsLow     ?? null,
              epsHigh: ev.earningsHigh    ?? null,
              revenueAvg: ev.revenueAverage ?? null,
            };
          }
        }

        // ── Past entry — most recent earningsHistory row with a reported actual ──
        const histRaw = summary?.earningsHistory?.history || [];
        const reported = histRaw
          .map(h => ({
            quarter: h.quarter ? toIso(h.quarter) : null,
            period: h.period || null,
            epsActual:       h.epsActual       ?? null,
            epsEstimate:     h.epsEstimate     ?? null,
            epsDifference:   h.epsDifference   ?? null,
            surprisePercent: h.surprisePercent ?? null,
          }))
          .filter(h => h.quarter && h.epsActual != null)
          .sort((a, b) => (b.quarter || '').localeCompare(a.quarter || ''));

        const past = reported[0] || null;

        const entry = {
          symbol: sym,
          name: price?.shortName || price?.longName || sym,
          currency: price?.currency || null,
          upcoming,
          past,
        };

        result[sym] = entry;
        earningsCache.set(sym, { data: entry, ts: Date.now() });
      } catch (err) {
        // Cache the miss briefly so we don't hammer on persistent failures
        earningsCache.set(sym, { data: null, ts: Date.now() });
      }
    }));
    if (i + BATCH < toFetch.length) await new Promise(r => setTimeout(r, 250));
  }

  return result;
}

/**
 * Past earnings reports for a single symbol — quarterly EPS actual vs estimate.
 * Uses Yahoo `earningsHistory` quoteSummary module.
 */
async function getEarningsHistory(symbol) {
  const toDate = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val);
    return isNaN(d) ? null : d;
  };
  const toIso     = (val) => { const d = toDate(val); return d ? d.toISOString().split('T')[0] : null; };
  const toIsoFull = (val) => { const d = toDate(val); return d ? d.toISOString() : null; };

  try {
    const summary = await fetchWithRetry(yf.quoteSummary, [symbol, {
      modules: ['earningsHistory', 'earningsTrend', 'price', 'calendarEvents'],
    }]);

    const price = summary?.price || {};
    const history = (summary?.earningsHistory?.history || []).map(h => ({
      quarter: h.quarter ? toIso(h.quarter) : null,
      period:  h.period  || null,
      epsActual:        h.epsActual        ?? null,
      epsEstimate:      h.epsEstimate      ?? null,
      epsDifference:    h.epsDifference    ?? null,
      surprisePercent:  h.surprisePercent  ?? null,
    })).filter(h => h.quarter); // drop empty rows

    // Sort newest first
    history.sort((a, b) => (b.quarter || '').localeCompare(a.quarter || ''));

    const ev = summary?.calendarEvents?.earnings;
    const rawDates = (ev?.earningsDate || [])
      .map(v => ({ date: toIso(v), full: toIsoFull(v) }))
      .filter(d => d.date)
      .sort((a, b) => a.full.localeCompare(b.full));

    return {
      symbol,
      name: price.shortName || price.longName || symbol,
      currency: price.currency || null,
      history,
      upcoming: {
        earningsDate:           rawDates[0]?.date || null,
        earningsDateEnd:        rawDates[1]?.date || null,
        earningsDateTimeUTC:    rawDates[0]?.full || null,
        earningsDateTimeEndUTC: rawDates[1]?.full || null,
        isEstimate:             !!ev?.isEarningsDateEstimate,
        epsAvg:                 ev?.earningsAverage ?? null,
        epsLow:                 ev?.earningsLow     ?? null,
        epsHigh:                ev?.earningsHigh    ?? null,
        revenueAvg:             ev?.revenueAverage  ?? null,
      },
    };
  } catch (err) {
    console.warn(`[YahooApi] earnings history fail for ${symbol}: ${err.message}`);
    return { symbol, name: symbol, currency: null, history: [], upcoming: null };
  }
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

/**
 * Historical top gainers/losers for a specific day (daysBack=0 means today)
 */
const historicalMoversCache = new Map();
const HIST_MOVERS_TTL_TODAY = 30 * 60 * 1000;   // 30 min
const HIST_MOVERS_TTL_PAST  = 24 * 60 * 60 * 1000; // 24 h

async function getHistoricalMovers(region = 'US', daysBack = 0, count = 20) {
  const yfRegion = region === 'CA' ? 'CA' : 'US';

  // Resolve target trading date string
  const targetDate = new Date();
  targetDate.setHours(0, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() - daysBack);
  const targetStr = targetDate.toISOString().split('T')[0];

  const cacheKey = `${region}-${targetStr}`;
  const cached = historicalMoversCache.get(cacheKey);
  const ttl = daysBack === 0 ? HIST_MOVERS_TTL_TODAY : HIST_MOVERS_TTL_PAST;
  if (cached && Date.now() - cached.ts < ttl) return cached.data;

  // ── Today: use screener directly ──────────────────────────────────────────
  if (daysBack === 0) {
    const result = await getMarketMovers(region, count);
    const data = { ...result, date: targetStr };
    historicalMoversCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  }

  // ── Past day: build a symbol pool then fetch chart history ────────────────
  let symbols = [];
  try {
    const [gRes, lRes, aRes] = await Promise.allSettled([
      fetchWithRetry(yf.screener, [{ scrIds: 'day_gainers',  count: 50, region: yfRegion }]),
      fetchWithRetry(yf.screener, [{ scrIds: 'day_losers',   count: 50, region: yfRegion }]),
      fetchWithRetry(yf.screener, [{ scrIds: 'most_actives', count: 50, region: yfRegion }]),
    ]);
    const symbolSet = new Set();
    [gRes, lRes, aRes].forEach(r => {
      if (r.status === 'fulfilled') (r.value?.quotes || []).forEach(q => symbolSet.add(q.symbol));
    });
    symbols = [...symbolSet];
  } catch (err) {
    console.error(`[YahooApi] getHistoricalMovers pool fail: ${err.message}`);
  }

  if (symbols.length === 0) {
    return { topPerformers: [], bottomPerformers: [], date: targetStr };
  }

  // Fetch daily chart data for a 10-day window around the target date
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - 7);
  const startStr = startDate.toISOString().split('T')[0];

  const toDateStr = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val);
    return isNaN(d) ? null : d.toISOString().split('T')[0];
  };

  // Batch in groups of 10 to avoid rate limits
  const batchSize = 10;
  const allResults = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchRes = await Promise.allSettled(
      batch.map(sym => fetchWithRetry(yf.chart, [sym, { period1: startStr, interval: '1d' }]))
    );
    batchRes.forEach((r, j) => allResults.push({ result: r, symbol: batch[j] }));
    if (i + batchSize < symbols.length) await new Promise(r => setTimeout(r, 300));
  }

  // Compute close-to-previous-close change for the target date
  const movers = [];
  allResults.forEach(({ result, symbol }) => {
    if (result.status !== 'fulfilled') return;
    const quotes = (result.value?.quotes || []).filter(q => q.close != null);
    if (quotes.length < 2) return;

    // Find target day (or closest trading day at/before target)
    let targetIdx = -1;
    for (let i = quotes.length - 1; i >= 0; i--) {
      const ds = toDateStr(quotes[i].date);
      if (ds && ds <= targetStr) { targetIdx = i; break; }
    }
    if (targetIdx < 1) return;

    const curr = quotes[targetIdx];
    const prev = quotes[targetIdx - 1];
    if (!curr.close || !prev.close) return;

    const changePercent = ((curr.close - prev.close) / prev.close) * 100;
    movers.push({
      symbol,
      name: null,
      change: parseFloat(changePercent.toFixed(2)),
      price: curr.close,
    });
  });

  movers.sort((a, b) => b.change - a.change);

  const data = {
    topPerformers:    movers.filter(m => m.change > 0).slice(0, count),
    bottomPerformers: movers.filter(m => m.change < 0).reverse().slice(0, count),
    date: targetStr,
  };

  historicalMoversCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

/**
 * Fundamentals for a single stock (PE, EPS, market cap, description, dividends, etc.)
 * Uses yf.quote for financial metrics (reliable) + quoteSummary for profile/EPS extras.
 */
async function getStockFundamentals(symbol) {
  const toDate = (val) => {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val);
    return isNaN(d) ? null : d.toISOString().split('T')[0];
  };

  // Run all fetches in parallel; each failure is independent
  const [quoteRes, profileRes, detailRes, statsRes] = await Promise.allSettled([
    fetchWithRetry(yf.quote, [symbol]),
    fetchWithRetry(yf.quoteSummary, [symbol, { modules: ['summaryProfile'] }]),
    fetchWithRetry(yf.quoteSummary, [symbol, { modules: ['summaryDetail'] }]),
    fetchWithRetry(yf.quoteSummary, [symbol, { modules: ['defaultKeyStatistics'] }]),
  ]);

  const q = quoteRes.status  === 'fulfilled' ? (quoteRes.value  || {})                          : {};
  const p = profileRes.status === 'fulfilled' ? (profileRes.value?.summaryProfile      || {})    : {};
  const d = detailRes.status  === 'fulfilled' ? (detailRes.value?.summaryDetail        || {})    : {};
  const k = statsRes.status   === 'fulfilled' ? (statsRes.value?.defaultKeyStatistics  || {})    : {};

  ['quote', 'profile', 'detail', 'stats'].forEach((name, i) => {
    const r = [quoteRes, profileRes, detailRes, statsRes][i];
    if (r.status === 'rejected')
      console.warn(`[YahooApi] Fundamentals ${name} fail for ${symbol}: ${r.reason?.message}`);
  });

  // yf.quote dividendYield is already a percentage (e.g. 1.5 = 1.5%)
  const dy = q.dividendYield != null ? parseFloat((q.dividendYield).toFixed(2)) : null;

  // summaryDetail payoutRatio is a decimal (0.35 = 35%); fiveYearAvgDividendYield is already %
  const payoutRatio = d.payoutRatio != null ? parseFloat((d.payoutRatio * 100).toFixed(2)) : null;
  const fiveYrYield = d.fiveYearAvgDividendYield ?? null;

  return {
    // Company profile
    description: p.longBusinessSummary || null,
    sector:      p.sector              || null,
    industry:    p.industry            || null,
    website:     p.website             || null,
    employees:   p.fullTimeEmployees   || null,
    country:     p.country             || null,

    // Valuation — primary: yf.quote
    marketCap:   q.marketCap   ?? null,
    trailingPE:  q.trailingPE  ?? null,
    forwardPE:   q.forwardPE   ?? null,
    priceToBook: q.priceToBook ?? null,
    pegRatio:    k.pegRatio    ?? null,

    // Per-share
    trailingEps: q.epsTrailingTwelveMonths ?? null,
    forwardEps:  q.epsForward              ?? null,
    bookValue:   q.bookValue               ?? null,

    // Range & risk
    fiftyTwoWeekLow:  q.fiftyTwoWeekLow  ?? null,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
    beta:             q.beta             ?? null,
    averageVolume:    q.averageDailyVolume3Month ?? q.averageDailyVolume10Day ?? null,

    // Dividends — rate/yield from quote; extras from summaryDetail + defaultKeyStatistics
    dividendRate:             q.dividendRate        ?? null,
    dividendYield:            dy,
    exDividendDate:           toDate(q.exDividendDate ?? d.exDividendDate),
    payoutRatio,
    fiveYearAvgDividendYield: fiveYrYield,
    lastDividendValue:        k.lastDividendValue   ?? null,
    lastDividendDate:         toDate(k.lastDividendDate),
  };
}

// ── Sector stocks ────────────────────────────────────────────────────────────

const sectorCache = new Map();
const SECTOR_TTL = 10 * 60 * 1000; // 10 min

/**
 * Batch-fetch 5-year weekly chart data for a list of symbols and return
 * 1-month, 1-year, 5-year % changes for each.
 */
async function batchPeriodChanges(symbols) {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 6);
  const startStr = startDate.toISOString().split('T')[0];

  const results = {};
  const toMs = (v) => {
    if (!v) return 0;
    if (v instanceof Date) return v.getTime();
    return typeof v === 'number' ? v * 1000 : new Date(v).getTime();
  };

  const BATCH = 6;
  for (let i = 0; i < symbols.length; i += BATCH) {
    const batch = symbols.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(sym => fetchWithRetry(yf.chart, [sym, { period1: startStr, interval: '1wk' }]))
    );

    settled.forEach((r, j) => {
      const sym = batch[j];
      if (r.status !== 'fulfilled') { results[sym] = {}; return; }
      const history = (r.value?.quotes || []).filter(q => q.close != null);
      if (history.length < 2) { results[sym] = {}; return; }

      const latestMs = toMs(history[history.length - 1].date);
      const latest   = history[history.length - 1].close;

      const pct = (days) => {
        const cutoff = latestMs - days * 86_400_000;
        const entry  = [...history].reverse().find(h => toMs(h.date) <= cutoff);
        if (!entry) return null;
        return parseFloat(((latest - entry.close) / entry.close * 100).toFixed(2));
      };

      results[sym] = { change1m: pct(30), change1y: pct(365), change5y: pct(1825) };
    });

    if (i + BATCH < symbols.length) await new Promise(r => setTimeout(r, 400));
  }
  return results;
}

// Sector mapping — used for validation against FMP-supported sectors
const VALID_SECTORS = [
  'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
  'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy',
  'Basic Materials', 'Real Estate', 'Utilities'
];

/**
 * Paginated list of stocks in a given sector, with multi-period changes.
 * Uses FMP Stock Screener API for sector filtering + Yahoo Finance for real-time data.
 */
async function getSectorStocks(sectorId, region = 'us', page = 1, pageSize = 25, search = '') {
  const cacheKey = `${sectorId}|${region}|${page}|${pageSize}|${search}`;
  const cached = sectorCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SECTOR_TTL) return cached.data;

  // Validate sector
  if (!VALID_SECTORS.includes(sectorId)) {
    throw Object.assign(new Error(`Unknown sector: ${sectorId}`), { code: 'INVALID_SYMBOL' });
  }

  // Fetch all stocks in the sector from FMP (1 call per sector, cached locally)
  // FMP returns ~100-500 stocks per sector depending on the sector size
  let allStocks = await getStocksBySector(sectorId, region, 1000);

  // Filter by search query (matches symbol prefix or substring)
  if (search) {
    const q = search.toUpperCase();
    allStocks = allStocks.filter(s => s.symbol.toUpperCase().includes(q));
  }

  if (allStocks.length === 0) {
    const empty = { stocks: [], total: 0, page, pageSize, search };
    sectorCache.set(cacheKey, { data: empty, ts: Date.now() });
    return empty;
  }

  const total = allStocks.length;
  const offset = (page - 1) * pageSize;
  const pageStocks = allStocks.slice(offset, offset + pageSize);

  if (pageStocks.length === 0) {
    const empty = { stocks: [], total, page, pageSize };
    sectorCache.set(cacheKey, { data: empty, ts: Date.now() });
    return empty;
  }

  const symbols = pageStocks.map(s => s.symbol);

  // Batch fetch real-time quote data (same pattern as getDashboardQuotes)
  let quoteMap = {};
  try {
    const quotes = await fetchWithRetry(yf.quote, [symbols]);
    const qArray = Array.isArray(quotes) ? quotes : [quotes];
    qArray.forEach(q => {
      if (q) quoteMap[q.symbol] = q;
    });
  } catch (err) {
    console.warn(`[YahooApi] Sector quote batch failed for ${sectorId}: ${err.message}`);
  }

  // Compute period changes
  const periodChanges = await batchPeriodChanges(symbols);

  // Assemble response
  const stocks = pageStocks.map(entry => {
    const q = quoteMap[entry.symbol] ?? {};
    const pc = periodChanges[entry.symbol] ?? {};
    return {
      symbol: entry.symbol,
      name: q.shortName || q.longName || entry.name,
      industry: entry.industry ?? null,
      price: q.regularMarketPrice ?? null,
      currency: q.currency ?? null,
      marketCap: q.marketCap ?? null,
      change1d: q.regularMarketChangePercent != null
        ? parseFloat(q.regularMarketChangePercent.toFixed(2)) : null,
      change1m: pc.change1m ?? null,
      change1y: pc.change1y ?? null,
      change5y: pc.change5y ?? null,
    };
  });

  const data = { stocks, total, page, pageSize, search };
  sectorCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

/**
 * Fetch stock detail data from FMP (profile, historical prices, income statement)
 */
async function getStockDetailsFMP(symbol) {
  const [profile, historical, incomeStatement] = await Promise.allSettled([
    getCompanyProfile(symbol),
    getHistoricalPrices(symbol),
    getIncomeStatement(symbol),
  ]);

  return {
    profile: profile.status === 'fulfilled' ? profile.value : null,
    historical: historical.status === 'fulfilled' ? historical.value : null,
    incomeStatement: incomeStatement.status === 'fulfilled' ? incomeStatement.value : null,
  };
}

module.exports = {
  searchStocks, getQuote, getPriceChange, getBulkPriceData, getDashboardQuotes,
  getMarketMovers, getHistoricalMovers, getDividendData, getStockChart,
  getStockFundamentals, getSectorStocks, getStockDetailsFMP, getUpcomingEarnings, getEarningsHistory
};
