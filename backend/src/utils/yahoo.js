/**
 * Yahoo Finance v3 Configuration Utility
 * 
 * Yahoo Finance is very sensitive to User-Agents. We use a recent browser UA
 * to avoid 429 "Too Many Requests" errors when fetching crumbs.
 */

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let _yf = null;

/**
 * Get a configured instance of YahooFinance
 */
async function getYahooInstance() {
  if (!_yf) {
    const { default: YahooFinance } = await import('yahoo-finance2');
    
    // Instantiate with custom fetch options to provide a solid User-Agent
    _yf = new YahooFinance({
      fetchOptions: {
        headers: {
          'User-Agent': BROWSER_UA
        }
      }
    });
  }
  return _yf;
}

/**
 * Simple wrapper with automatic instantiation
 */
const yf = {
  quote: async (...args) => (await getYahooInstance()).quote(...args),
  search: async (...args) => (await getYahooInstance()).search(...args),
  historical: async (...args) => (await getYahooInstance()).historical(...args),
  chart: async (...args) => (await getYahooInstance()).chart(...args)
};

module.exports = { getYahooInstance, yf };
