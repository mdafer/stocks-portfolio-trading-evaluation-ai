const NEWS_BASE = 'https://news.google.com/rss/search';
const MAX_ARTICLES = 20;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// In-memory cache keyed by symbol
const cache = new Map();

/**
 * Extract content of an XML tag, handling CDATA and plain text.
 */
function getTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return (m?.[1] ?? m?.[2] ?? '').trim();
}

/**
 * Decode HTML entities then strip HTML tags.
 * Google News RSS descriptions are entity-encoded HTML, so order matters.
 */
function cleanHtml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse <item> blocks out of an RSS XML string.
 */
function parseRSS(xml) {
  const articles = [];

  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    if (articles.length >= MAX_ARTICLES) break;

    const item   = m[1];
    const title  = cleanHtml(getTag(item, 'title'));
    const source = cleanHtml(getTag(item, 'source'));
    const raw    = getTag(item, 'pubDate');
    const pubDate = raw ? new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
    const link    = cleanHtml(getTag(item, 'link'));

    if (title) articles.push({ title, link: link || null, source: source || null, pubDate });
  }

  return articles;
}

/**
 * Fetch up to MAX_ARTICLES news articles for a stock symbol from Google News RSS.
 * Results are cached for 30 minutes.
 */
async function getStockNews(symbol) {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.articles;

  const url = `${NEWS_BASE}?q=${encodeURIComponent(symbol + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockEvalBot/1.0)', Accept: 'application/rss+xml' },
  });

  if (!res.ok) throw new Error(`Google News responded with ${res.status}`);

  const xml      = await res.text();
  const articles = parseRSS(xml);

  cache.set(symbol, { articles, ts: Date.now() });
  return articles;
}

/**
 * Fetch news for multiple symbols in parallel, silently skipping failures.
 */
async function getBulkNews(symbols) {
  const results = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        results[sym] = await getStockNews(sym);
      } catch (err) {
        console.warn(`[NewsApi] Failed to fetch news for ${sym}: ${err.message}`);
        results[sym] = [];
      }
    }),
  );
  return results;
}

module.exports = { getStockNews, getBulkNews };
