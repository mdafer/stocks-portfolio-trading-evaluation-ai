const Stock = require('../models/Stock');
const { db } = require('../config/db');
const { getUpcomingEarnings, getEarningsHistory } = require('../helpers/stockApi');
const { getEarningsCalendarBulk } = require('../helpers/fmpApi');
const { success, error } = require('../utils/response');

// Curated mega-cap "top companies" — covers the largest US-listed names by market cap.
const TOP_COMPANIES = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AVGO',
  'BRK-B', 'LLY', 'JPM', 'V', 'WMT', 'XOM', 'UNH', 'MA',
  'ORCL', 'COST', 'PG', 'HD', 'JNJ', 'NFLX', 'ABBV', 'BAC',
  'KO', 'CVX', 'CRM', 'AMD', 'PEP', 'MRK',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function nameMapForSymbols(symbols) {
  if (!symbols.length) return {};
  const placeholders = symbols.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT symbol, name FROM stocks WHERE symbol IN (${placeholders})`
  ).all(...symbols);
  const map = {};
  for (const r of rows) map[r.symbol] = r.name;
  return map;
}

function isoDate(d) { return d.toISOString().split('T')[0]; }

// ── FMP fast path ──────────────────────────────────────────────────────────

async function buildFromFmp(userSymbols, pastDays) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fromStr = isoDate(new Date(today.getTime() - pastDays * 86400000));
  const toStr   = isoDate(new Date(today.getTime() + 90 * 86400000));
  const todayStr = isoDate(today);

  const all = await getEarningsCalendarBulk(fromStr, toStr);
  if (!all) return null; // signal to caller to try fallback

  // Index by symbol, sorted by date
  const bySymbol = new Map();
  for (const e of all) {
    if (!e?.symbol || !e?.date) continue;
    if (!bySymbol.has(e.symbol)) bySymbol.set(e.symbol, []);
    bySymbol.get(e.symbol).push(e);
  }
  for (const arr of bySymbol.values()) arr.sort((a, b) => a.date.localeCompare(b.date));

  const allSymbols = [...new Set([...userSymbols, ...TOP_COMPANIES])];
  const names = nameMapForSymbols(allSymbols);

  const upcomingFor = (sym) => {
    const arr = bySymbol.get(sym) || [];
    const next = arr.find(e => e.date >= todayStr);
    if (!next) return null;
    return {
      symbol: sym,
      name: names[sym] || sym,
      earningsDate: next.date,
      earningsDateEnd: null,
      earningsDateTimeUTC: null,
      isEstimate: false,
      epsAvg: next.epsEstimated ?? null,
      epsLow: null,
      epsHigh: null,
      revenueAvg: next.revenueEstimated ?? null,
    };
  };

  const pastFor = (sym) => {
    const arr = bySymbol.get(sym) || [];
    // most recent reported entry (epsActual present, date in past)
    const reported = [...arr].reverse().find(e => e.date < todayStr && e.epsActual != null);
    if (!reported) return null;
    const epsActual   = reported.epsActual;
    const epsEstimate = reported.epsEstimated ?? null;
    const epsDifference   = (epsActual != null && epsEstimate != null) ? epsActual - epsEstimate : null;
    const surprisePercent = (epsDifference != null && epsEstimate) ? (epsDifference / Math.abs(epsEstimate)) * 100 : null;
    return {
      symbol: sym,
      name: names[sym] || sym,
      quarter: reported.date,        // FMP date is the report date itself
      epsActual,
      epsEstimate,
      epsDifference,
      surprisePercent: surprisePercent != null ? parseFloat(surprisePercent.toFixed(2)) : null,
      revenueActual:   reported.revenueActual    ?? null,
      revenueEstimate: reported.revenueEstimated ?? null,
    };
  };

  const buildUpcoming = (syms) => syms
    .map(upcomingFor).filter(Boolean)
    .sort((a, b) => (a.earningsDate || '9999').localeCompare(b.earningsDate || '9999'));

  const buildPast = (syms) => syms
    .map(pastFor).filter(Boolean)
    .sort((a, b) => (b.quarter || '').localeCompare(a.quarter || ''));

  return {
    portfolio: { upcoming: buildUpcoming(userSymbols),   past: buildPast(userSymbols) },
    top:       { upcoming: buildUpcoming(TOP_COMPANIES), past: buildPast(TOP_COMPANIES) },
    pastDays,
    source: 'fmp',
  };
}

// ── Yahoo fallback (slow per-symbol — used only if FMP isn't configured) ───

const TYPICAL_REPORT_LAG_DAYS = 45;

function flattenUpcoming(entry) {
  if (!entry?.upcoming) return null;
  return { symbol: entry.symbol, name: entry.name, currency: entry.currency, ...entry.upcoming };
}
function flattenPast(entry) {
  if (!entry?.past) return null;
  return { symbol: entry.symbol, name: entry.name, currency: entry.currency, ...entry.past };
}

async function buildFromYahoo(userSymbols, pastDays) {
  const allSymbols = [...new Set([...userSymbols, ...TOP_COMPANIES])];
  const earningsMap = await getUpcomingEarnings(allSymbols);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cutoffMs = today.getTime() - pastDays * 86400000;

  const buildUpcoming = (syms) => syms
    .map(s => flattenUpcoming(earningsMap[s])).filter(Boolean)
    .sort((a, b) => (a.earningsDate || '9999').localeCompare(b.earningsDate || '9999'));

  const buildPast = (syms) => syms
    .map(s => flattenPast(earningsMap[s])).filter(Boolean)
    .filter(p => {
      if (!p.quarter) return false;
      const estReportMs = new Date(p.quarter + 'T00:00:00').getTime() + TYPICAL_REPORT_LAG_DAYS * 86400000;
      return estReportMs >= cutoffMs && estReportMs <= today.getTime() + 7 * 86400000;
    })
    .sort((a, b) => (b.quarter || '').localeCompare(a.quarter || ''));

  return {
    portfolio: { upcoming: buildUpcoming(userSymbols),   past: buildPast(userSymbols) },
    top:       { upcoming: buildUpcoming(TOP_COMPANIES), past: buildPast(TOP_COMPANIES) },
    pastDays,
    source: 'yahoo',
  };
}

// ── Controllers ────────────────────────────────────────────────────────────

// Hard cap on per-user symbol count to keep the page responsive when the
// fallback path (per-symbol Yahoo calls) is in play. Prioritises positions
// with a real allocation set.
const MAX_USER_SYMBOLS = 150;

function rankedUserSymbols(rows) {
  // Sum allocations per symbol so the same ticker held in multiple lists
  // gets credit for all of them. Then keep symbols with allocation first,
  // and fall back to alphabetical for the unallocated tail.
  const totals = new Map();
  for (const r of rows) {
    const cur = totals.get(r.symbol) || 0;
    totals.set(r.symbol, cur + (Number(r.allocation) || 0));
  }
  const symbols = [...totals.keys()];
  symbols.sort((a, b) => {
    const ta = totals.get(a) || 0;
    const tb = totals.get(b) || 0;
    if (tb !== ta) return tb - ta;     // higher allocation first
    return a.localeCompare(b);         // stable tie-break
  });
  return symbols;
}

async function index(req, res, next) {
  try {
    const pastDays = Math.max(1, Math.min(365, parseInt(req.query.pastDays, 10) || 90));

    const userStocks    = Stock.getByUser(req.user.id);
    const rankedAll     = rankedUserSymbols(userStocks);
    const totalUserSyms = rankedAll.length;
    const userSymbols   = rankedAll.slice(0, MAX_USER_SYMBOLS);

    // Try FMP bulk first — single API call covers all symbols.
    let payload = await buildFromFmp(userSymbols, pastDays);
    if (!payload) payload = await buildFromYahoo(userSymbols, pastDays);

    payload.userSymbolsTotal = totalUserSyms;
    payload.userSymbolsScanned = userSymbols.length;

    return success(res, payload);
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
