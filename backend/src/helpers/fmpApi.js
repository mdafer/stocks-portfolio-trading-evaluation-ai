const env = require('../config/env');
const CURATED_STOCKS = require('../data/curatedStocks');

const FMP_BASE_URL = env.fmp.baseUrl;
const FMP_API_KEY = env.fmp.apiKey;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

/**
 * Fetch with retry for rate-limit backoff
 */
async function fetchWithRetry(url, retries = 3, baseDelayMs = 1000) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          const delay = baseDelayMs * attempt;
          console.warn(`[FMP] Rate limited, retrying in ${delay}ms… (${attempt}/${retries})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseDelayMs * attempt;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

/**
 * Get stocks by sector with pagination
 * Uses curated list first, supplements with Finnhub API if needed
 * @param {string} sector - Sector name (e.g., 'Technology')
 * @param {string} region - Region ('us' or 'ca')
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Array of stocks with symbol, name, industry
 */
async function getStocksBySector(sector, region = 'us', limit = 250) {
  try {
    // Step 1: Get from curated list
    const regionKey = region.toLowerCase();
    const curatedList = CURATED_STOCKS[regionKey]?.[sector] || [];

    if (curatedList.length === 0) {
      console.warn(`[SectorStocks] No curated stocks found for ${region}/${sector}`);
      return [];
    }

    const stocks = curatedList.slice(0, limit).map(symbol => ({
      symbol,
      name: null, // Will be fetched on-demand
      industry: null,
    }));

    // Step 2: Supplement with Finnhub for company details if key is available
    if (FINNHUB_API_KEY && stocks.length < 100) {
      // Only enrich if we have few stocks
      console.log(`[SectorStocks] Supplementing ${region}/${sector} via Finnhub API`);
      await enrichStocksWithFinnhub(stocks.slice(0, 50)); // Enrich first 50 to avoid rate limits
    }

    return stocks;
  } catch (err) {
    console.error(`[SectorStocks] Failed to fetch stocks for sector ${sector}: ${err.message}`);
    return [];
  }
}

/**
 * Enrich stock data using Finnhub API
 * @param {Array} stocks - Array of stock objects with symbol
 */
async function enrichStocksWithFinnhub(stocks) {
  try {
    for (const stock of stocks) {
      if (!FINNHUB_API_KEY) break;

      try {
        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`;
        const data = await fetchWithRetry(url, 2, 500); // Light retry

        if (data) {
          stock.name = data.name || stock.symbol;
          stock.industry = data.finnhubIndustry || null;
        }
      } catch (err) {
        // Skip enrichment on failure, keep going
        stock.name = stock.symbol;
      }

      // Rate limit: small delay between requests
      await new Promise(r => setTimeout(r, 100));
    }
  } catch (err) {
    console.warn(`[SectorStocks] Finnhub enrichment partial failure:`, err.message);
  }
}

/**
 * Get available sectors
 * @returns {Promise<Array>} Array of sector names
 */
async function getAvailableSectors() {
  if (!FMP_API_KEY) {
    return [
      'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
      'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy',
      'Basic Materials', 'Real Estate', 'Utilities'
    ];
  }

  try {
    const url = `${FMP_BASE_URL}/sectors?apikey=${FMP_API_KEY}`;
    const data = await fetchWithRetry(url);

    if (Array.isArray(data)) {
      return data.map(s => s.sector);
    }
    return [];
  } catch (err) {
    console.warn(`[FMP] Failed to fetch sectors: ${err.message}`);
    // Return hardcoded list as fallback
    return [
      'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
      'Communication Services', 'Industrials', 'Consumer Defensive', 'Energy',
      'Basic Materials', 'Real Estate', 'Utilities'
    ];
  }
}

/**
 * Get company profile
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object>} Company profile data
 */
async function getCompanyProfile(symbol) {
  if (!FMP_API_KEY) return null;

  try {
    const url = `${FMP_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`;
    const data = await fetchWithRetry(url);

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return data || null;
  } catch (err) {
    console.warn(`[FMP] Failed to fetch profile for ${symbol}: ${err.message}`);
    return null;
  }
}

/**
 * Get historical EOD price data
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Historical price data with dates, opens, closes, volumes
 */
async function getHistoricalPrices(symbol) {
  if (!FMP_API_KEY) return null;

  try {
    const url = `${FMP_BASE_URL}/historical-price-eod/full/${symbol}?apikey=${FMP_API_KEY}`;
    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data)) {
      return null;
    }

    // Return the array of historical data
    return {
      symbol: data[0]?.symbol || symbol,
      historical: data.slice(0, 250) // Return last ~1 year of data
    };
  } catch (err) {
    console.warn(`[FMP] Failed to fetch historical prices for ${symbol}: ${err.message}`);
    return null;
  }
}

/**
 * Get income statement data
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Income statement data
 */
async function getIncomeStatement(symbol) {
  if (!FMP_API_KEY) return null;

  try {
    const url = `${FMP_BASE_URL}/income-statement/${symbol}?limit=4&apikey=${FMP_API_KEY}`;
    const data = await fetchWithRetry(url);

    if (!data || !Array.isArray(data)) {
      return null;
    }

    // Return last 4 quarters
    return {
      symbol,
      statements: data.slice(0, 4)
    };
  } catch (err) {
    console.warn(`[FMP] Failed to fetch income statement for ${symbol}: ${err.message}`);
    return null;
  }
}

module.exports = {
  getStocksBySector,
  getAvailableSectors,
  getCompanyProfile,
  getHistoricalPrices,
  getIncomeStatement
};
