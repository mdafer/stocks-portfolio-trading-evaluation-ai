const Stock = require('../models/Stock');
const { getDividendData } = require('../helpers/stockApi');
const { success } = require('../utils/response');

async function index(req, res, next) {
  try {
    const stocks = Stock.getByUser(req.user.id);
    const symbols = [...new Set(stocks.map(s => s.symbol))];

    if (symbols.length === 0) return success(res, { dividends: [] });

    const data = await getDividendData(symbols);

    const dividends = symbols
      .map(sym => data[sym])
      .filter(d => d && (d.dividendRate || d.lastDividendValue))
      .sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0));

    return success(res, { dividends });
  } catch (err) { next(err); }
}

module.exports = { index };
