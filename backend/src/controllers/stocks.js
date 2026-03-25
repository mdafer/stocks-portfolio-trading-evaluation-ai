const Stock = require('../models/Stock');
const List = require('../models/List');
const { searchStocks, getQuote, getPriceChange } = require('../helpers/stockApi');
const { getStockNews } = require('../helpers/newsApi');
const { success, error, notFound, forbidden } = require('../utils/response');

function handleStockApiError(err, res, next) {
  if (err.code === 'RATE_LIMITED') return error(res, 'Stock API rate limit reached. Please wait and try again.', 429);
  if (err.code === 'INVALID_SYMBOL') return error(res, 'Symbol not found', 404);
  return next(err);
}

async function search(req, res, next) {
  try {
    const results = await searchStocks(req.query.q);
    return success(res, { results });
  } catch (err) {
    return handleStockApiError(err, res, next);
  }
}

async function quote(req, res, next) {
  try {
    const data = await getQuote(req.params.symbol);
    if (!data) return notFound(res, 'Stock quote');
    return success(res, { quote: data });
  } catch (err) {
    return handleStockApiError(err, res, next);
  }
}

async function priceChange(req, res, next) {
  try {
    const data = await getPriceChange(req.params.symbol, req.query.period);
    if (!data) return notFound(res, 'Price data');
    return success(res, { priceChange: data });
  } catch (err) {
    return handleStockApiError(err, res, next);
  }
}

async function addToList(req, res, next) {
  try {
    const { listId } = req.params;
    const { symbol, name, exchange, allocation, allocation_type } = req.body;

    if (!List.isOwnedBy(listId, req.user.id)) {
      const list = List.findById(listId);
      if (!list) return notFound(res, 'List');
      return forbidden(res);
    }

    // If name not provided, look up via API
    let stockName = name;
    let stockExchange = exchange;
    if (!stockName) {
      const results = await searchStocks(symbol);
      const match = results.find((r) => r.symbol === symbol.toUpperCase());
      stockName = match ? match.name : symbol;
      stockExchange = match ? match.region : null;
    }

    const stock = Stock.findOrCreate(symbol.toUpperCase(), stockName, stockExchange);
    const listStock = Stock.addToList(listId, stock.id, allocation, allocation_type);

    return success(res, { stock, listStock });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint')) return error(res, 'Stock already in this list', 409);
    if (err.code === 'RATE_LIMITED') return error(res, 'Stock API rate limit reached. Please wait and try again.', 429);
    if (err.code === 'INVALID_SYMBOL') return error(res, `Symbol not found: ${req.body.symbol}`, 404);
    next(err);
  }
}

async function removeFromList(req, res, next) {
  try {
    const { listId, symbol } = req.params;

    if (!List.isOwnedBy(listId, req.user.id)) {
      const list = List.findById(listId);
      if (!list) return notFound(res, 'List');
      return forbidden(res);
    }

    const stock = Stock.findBySymbol(symbol.toUpperCase());
    if (!stock) return notFound(res, 'Stock');

    Stock.removeFromList(listId, stock.id);
    return success(res, { message: 'Stock removed from list' });
  } catch (err) {
    next(err);
  }
}

async function updateInList(req, res, next) {
  try {
    const { listId, symbol } = req.params;
    const { allocation, allocation_type } = req.body;

    if (!List.isOwnedBy(listId, req.user.id)) {
      const list = List.findById(listId);
      if (!list) return notFound(res, 'List');
      return forbidden(res);
    }

    const stock = Stock.findBySymbol(symbol.toUpperCase());
    if (!stock) return notFound(res, 'Stock');

    Stock.updateInList(listId, stock.id, allocation, allocation_type);
    return success(res, { message: 'Holding updated' });
  } catch (err) {
    next(err);
  }
}

async function news(req, res, next) {
  try {
    const articles = await getStockNews(req.params.symbol.toUpperCase());
    return success(res, { articles, symbol: req.params.symbol.toUpperCase() });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, quote, priceChange, addToList, updateInList, removeFromList, news };
