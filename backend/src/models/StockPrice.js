const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const StockPrice = {
  upsert(stockId, period, data) {
    db.prepare(`
      INSERT INTO stock_prices (id, stock_id, period, current_price, past_price, change_percent, current_date, past_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stock_id, period) DO UPDATE SET
        current_price  = excluded.current_price,
        past_price     = excluded.past_price,
        change_percent = excluded.change_percent,
        current_date   = excluded.current_date,
        past_date      = excluded.past_date,
        fetched_at     = datetime('now')
    `).run(uuidv4(), stockId, period, data.currentPrice, data.pastPrice, data.changePercent, data.currentDate, data.pastDate);
  },

  // Returns one row per stock in the list (null price columns if never fetched for this period)
  findByListAndPeriod(listId, period) {
    return db.prepare(`
      SELECT s.id AS stock_id, s.symbol, s.name, s.currency,
             sp.current_price, sp.past_price, sp.change_percent,
             sp.current_date, sp.past_date, sp.fetched_at
      FROM stocks s
      JOIN list_stocks ls ON ls.stock_id = s.id
      LEFT JOIN stock_prices sp ON sp.stock_id = s.id AND sp.period = ?
      WHERE ls.list_id = ?
      ORDER BY ls.added_at DESC
    `).all(period, listId);
  },
  findByListsAndPeriod(listIds, period) {
    if (!listIds.length) return [];
    const placeholders = listIds.map(() => '?').join(',');
    return db.prepare(`
      SELECT DISTINCT s.id AS stock_id, s.symbol, s.name, s.currency,
             sp.current_price, sp.past_price, sp.change_percent,
             sp.current_date, sp.past_date, sp.fetched_at
      FROM stocks s
      JOIN list_stocks ls ON ls.stock_id = s.id
      LEFT JOIN stock_prices sp ON sp.stock_id = s.id AND sp.period = ?
      WHERE ls.list_id IN (${placeholders})
      ORDER BY s.symbol ASC
    `).all(period, ...listIds);
  },
};

module.exports = StockPrice;
