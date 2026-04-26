const Stock = require('../models/Stock');
const { getUpcomingEarnings, getEarningsHistory } = require('../helpers/stockApi');
const { success, error } = require('../utils/response');

// Curated mega-cap "top companies" — covers the largest US-listed names by market cap.
const TOP_COMPANIES = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO',
  'BRK-B', 'LLY', 'JPM', 'V', 'WMT', 'XOM', 'UNH', 'MA',
  'ORCL', 'COST', 'PG', 'HD', 'JNJ', 'NFLX', 'ABBV', 'BAC',
  'KO', 'CVX', 'CRM', 'AMD', 'PEP', 'MRK',
];

// Estimated report date is typically ~45 days after quarter end.
// We use this to filter the "past" tab to roughly the last `pastDays` window.
const TYPICAL_REPORT_LAG_DAYS = 45;

function flattenUpcoming(entry) {
  if (!entry?.upcoming) return null;
  return { symbol: entry.symbol, name: entry.name, currency: entry.currency, ...entry.upcoming };
}

function flattenPast(entry) {
  if (!entry?.past) return null;
  return { symbol: entry.symbol, name: entry.name, currency: entry.currency, ...entry.past };
}

async function index(req, res, next) {
  try {
    const pastDays = Math.max(1, Math.min(365, parseInt(req.query.pastDays, 10) || 90));

    const userStocks = Stock.getByUser(req.user.id);
    const userSymbols = [...new Set(userStocks.map(s => s.symbol))];

    // Dedupe across the union so we only hit the API once per symbol
    const allSymbols = [...new Set([...userSymbols, ...TOP_COMPANIES])];
    const earningsMap = await getUpcomingEarnings(allSymbols);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoffMs = today.getTime() - pastDays * 86400000;

    const buildUpcoming = (syms) => syms
      .map(s => flattenUpcoming(earningsMap[s]))
      .filter(Boolean)
      .sort((a, b) => (a.earningsDate || '9999').localeCompare(b.earningsDate || '9999'));

    const buildPast = (syms) => syms
      .map(s => flattenPast(earningsMap[s]))
      .filter(Boolean)
      // Estimate the report date and keep only those within the window.
      .filter(p => {
        if (!p.quarter) return false;
        const estReportMs = new Date(p.quarter + 'T00:00:00').getTime() + TYPICAL_REPORT_LAG_DAYS * 86400000;
        return estReportMs >= cutoffMs && estReportMs <= today.getTime() + 7 * 86400000;
      })
      // Newest first
      .sort((a, b) => (b.quarter || '').localeCompare(a.quarter || ''));

    return success(res, {
      portfolio: { upcoming: buildUpcoming(userSymbols),    past: buildPast(userSymbols) },
      top:       { upcoming: buildUpcoming(TOP_COMPANIES),  past: buildPast(TOP_COMPANIES) },
      pastDays,
    });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const symbol = (req.params.symbol || '').toUpperCase().trim();
    if (!symbol) return error(res, 'Symbol is required', 400);
    const data = await getEarningsHistory(symbol);
    return success(res, data);
  } catch (err) { next(err); }
}

module.exports = { index, history };
