const List = require('../models/List');
const Stock = require('../models/Stock');
const StockPrice = require('../models/StockPrice');
const { getPriceChange } = require('../helpers/stockApi');
const { success, created, noContent, notFound, forbidden } = require('../utils/response');

async function index(req, res, next) {
  try {
    return success(res, { lists: List.findByUser(req.user.id) });
  } catch (err) { next(err); }
}

async function show(req, res, next) {
  try {
    const list = List.findById(req.params.id);
    if (!list) return notFound(res, 'List');
    if (list.user_id !== req.user.id) return forbidden(res);
    return success(res, { list, stocks: Stock.getByList(list.id) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const list = List.create(req.user.id, req.body.name, req.body.description);
    return created(res, { list });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    if (!List.isOwnedBy(id, req.user.id)) {
      return List.findById(id) ? forbidden(res) : notFound(res, 'List');
    }
    return success(res, { list: List.update(id, req.body) });
  } catch (err) { next(err); }
}

async function destroy(req, res, next) {
  try {
    const { id } = req.params;
    if (!List.isOwnedBy(id, req.user.id)) {
      return List.findById(id) ? forbidden(res) : notFound(res, 'List');
    }
    List.delete(id);
    return noContent(res);
  } catch (err) { next(err); }
}

// ── Prices ────────────────────────────────────────────────────────────────────

function buildPriceMap(rows) {
  const prices = {};
  let lastUpdated = null;

  for (const row of rows) {
    if (row.current_price === null) continue;
    prices[row.symbol] = {
      currentPrice:  row.current_price,
      pastPrice:     row.past_price,
      changePercent: row.change_percent,
      currentDate:   row.current_date,
      pastDate:      row.past_date,
      fetchedAt:     row.fetched_at,
      currency:      row.currency || null,
    };
    if (!lastUpdated || row.fetched_at > lastUpdated) lastUpdated = row.fetched_at;
  }

  return { prices, lastUpdated };
}

async function getPrices(req, res, next) {
  try {
    const { id } = req.params;
    if (!List.isOwnedBy(id, req.user.id)) {
      return List.findById(id) ? forbidden(res) : notFound(res, 'List');
    }

    const period = req.query.period || '1m';
    const rows = StockPrice.findByListAndPeriod(id, period);
    const { prices, lastUpdated } = buildPriceMap(rows);

    return success(res, { prices, period, lastUpdated });
  } catch (err) { next(err); }
}

async function refreshPrices(req, res, next) {
  try {
    const { id } = req.params;
    if (!List.isOwnedBy(id, req.user.id)) {
      return List.findById(id) ? forbidden(res) : notFound(res, 'List');
    }

    const period = req.body.period || '1m';
    const stocks = Stock.getByList(id);
    console.log(`[Dashboard] Refreshing prices for list ${id}: found ${stocks.length} stocks`);
    const errors = [];

    for (const stock of stocks) {
      try {
        const data = await getPriceChange(stock.symbol, period);
        if (data) {
          StockPrice.upsert(stock.id, period, data);
          if (data.currency) Stock.updateCurrency(stock.id, data.currency);
        }
      } catch (err) {
        errors.push(`${stock.symbol}: ${err.code === 'RATE_LIMITED' ? 'rate limited' : err.message}`);
      }
    }

    const rows = StockPrice.findByListAndPeriod(id, period);
    const { prices, lastUpdated } = buildPriceMap(rows);

    return success(res, { prices, period, lastUpdated, errors });
  } catch (err) { next(err); }
}

// ── Combined (multi-list) view ───────────────────────────────────────────────

async function compare(req, res, next) {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (ids.length === 0) return success(res, { lists: [], stocks: [], prices: {}, lastUpdated: null });

    // Verify ownership of all lists
    const userLists = List.findByUser(req.user.id);
    const userListIds = new Set(userLists.map((l) => l.id));
    const validIds = ids.filter((id) => userListIds.has(id));
    if (validIds.length === 0) return success(res, { lists: [], stocks: [], prices: {}, lastUpdated: null });

    const lists = userLists.filter((l) => validIds.includes(l.id));
    const stocks = Stock.getByLists(validIds);

    const period = req.query.period || '1m';
    const rows = StockPrice.findByListsAndPeriod(validIds, period);
    const { prices, lastUpdated } = buildPriceMap(rows);

    return success(res, { lists, stocks, prices, period, lastUpdated });
  } catch (err) { next(err); }
}

module.exports = { index, show, create, update, destroy, getPrices, refreshPrices, compare };
