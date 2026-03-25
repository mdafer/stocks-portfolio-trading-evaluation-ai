const Stock = require('../models/Stock');
const List = require('../models/List');
const { getDashboardQuotes } = require('../helpers/stockApi');
const { getBulkNews } = require('../helpers/newsApi');
const { success } = require('../utils/response');

async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const lists = List.findByUser(userId);
    const stocks = Stock.getByUser(userId);

    // This is instant because it's only database queries
    let totalValue = 0;
    stocks.forEach(s => {
      if (s.allocation_type === 'value' && s.allocation) {
        totalValue += parseFloat(s.allocation);
      }
    });

    console.log(`[Dashboard] Summary for user ${userId}: ${stocks.length} stocks, total value $ ${totalValue}`);

    return success(res, {
      listCount: lists.length,
      stockCount: stocks.length,
      totalValue,
      symbols: [...new Set(stocks.map(s => s.symbol))]
    });
  } catch (err) {
    next(err);
  }
}

async function getMovers(req, res, next) {
  try {
    const userId = req.user.id;
    const stocks = Stock.getByUser(userId);
    const symbols = [...new Set(stocks.map(s => s.symbol))];

    if (symbols.length === 0) return success(res, { topPerformers: [], bottomPerformers: [] });

    // This part can be slow as it hits Alpha Vantage
    const priceData = await getDashboardQuotes(symbols);
    
    const performers = [];
    Object.entries(priceData).forEach(([symbol, data]) => {
      if (data.changePercent !== undefined) {
        performers.push({ symbol, change: parseFloat(data.changePercent.toFixed(2)) });
      }
    });
    
    performers.sort((a, b) => b.change - a.change);

    return success(res, {
      topPerformers: performers.filter(p => p.change > 0).slice(0, 3),
      bottomPerformers: performers.filter(p => p.change < 0).slice(-3).reverse()
    });
  } catch (err) {
    next(err);
  }
}

async function getNewsFeed(req, res, next) {
  try {
    const userId = req.user.id;
    const stocks = Stock.getByUser(userId);
    const symbols = [...new Set(stocks.map(s => s.symbol))];

    let feed = [];
    if (symbols.length > 0) {
      // Only fetch news for the top 3 symbols for maximum speed
      const newsResults = await getBulkNews(symbols.slice(0, 3));
      Object.values(newsResults).forEach(articles => {
        feed.push(...articles);
      });
      feed = feed.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 10);
    }

    return success(res, { newsFeed: feed });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getMovers, getNewsFeed };
