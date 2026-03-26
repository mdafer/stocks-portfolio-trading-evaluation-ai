const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Stock = {
  findOrCreate(symbol, name, exchange = null) {
    let stock = db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol);
    if (!stock) {
      const id = uuidv4();
      db.prepare('INSERT INTO stocks (id, symbol, name, exchange) VALUES (?, ?, ?, ?)').run(id, symbol, name, exchange);
      stock = db.prepare('SELECT * FROM stocks WHERE id = ?').get(id);
    }
    return stock;
  },

  findBySymbol(symbol) {
    return db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol);
  },

  findById(id) {
    return db.prepare('SELECT * FROM stocks WHERE id = ?').get(id);
  },

  updateCurrency(id, currency) {
    if (!currency) return;
    db.prepare('UPDATE stocks SET currency = ? WHERE id = ? AND (currency IS NULL OR currency != ?)').run(currency, id, currency);
  },

  addToList(listId, stockId, allocation = null, allocationType = 'value') {
    const existing = db.prepare('SELECT id FROM list_stocks WHERE list_id = ? AND stock_id = ?').get(listId, stockId);
    if (existing) return existing;

    const id = uuidv4();
    db.prepare('INSERT INTO list_stocks (id, list_id, stock_id, allocation, allocation_type) VALUES (?, ?, ?, ?, ?)')
      .run(id, listId, stockId, allocation, allocationType);
    return { id, list_id: listId, stock_id: stockId, allocation, allocation_type: allocationType };
  },

  updateInList(listId, stockId, allocation, allocationType) {
    return db.prepare(`
      UPDATE list_stocks
      SET allocation = ?, allocation_type = ?
      WHERE list_id = ? AND stock_id = ?
    `).run(allocation, allocationType, listId, stockId);
  },

  removeFromList(listId, stockId) {
    return db.prepare('DELETE FROM list_stocks WHERE list_id = ? AND stock_id = ?').run(listId, stockId);
  },

  getByList(listId) {
    return db.prepare(`
      SELECT s.*, ls.added_at, ls.allocation, ls.allocation_type
      FROM stocks s
      JOIN list_stocks ls ON s.id = ls.stock_id
      WHERE ls.list_id = ?
      ORDER BY ls.added_at DESC
    `).all(listId);
  },

  getByLists(listIds) {
    if (!listIds.length) return [];
    const placeholders = listIds.map(() => '?').join(',');
    return db.prepare(`
      SELECT s.*, ls.added_at, ls.allocation, ls.allocation_type,
             ls.list_id, l.name AS list_name
      FROM stocks s
      JOIN list_stocks ls ON s.id = ls.stock_id
      JOIN lists l ON ls.list_id = l.id
      WHERE ls.list_id IN (${placeholders})
      ORDER BY s.symbol ASC, l.name ASC
    `).all(...listIds);
  },

  getByUser(userId) {
    return db.prepare(`
      SELECT s.symbol, ls.allocation, ls.allocation_type
      FROM stocks s
      JOIN list_stocks ls ON s.id = ls.stock_id
      JOIN lists l ON ls.list_id = l.id
      WHERE l.user_id = ?
    `).all(userId);
  },

  getHoldingsForSymbol(symbol, userId) {
    return db.prepare(`
      SELECT
        l.id   AS list_id,
        l.name AS list_name,
        ls.allocation,
        ls.allocation_type,
        ls.added_at,
        (SELECT SUM(ls2.allocation)
         FROM list_stocks ls2
         WHERE ls2.list_id = l.id AND ls2.allocation_type = 'value'
        ) AS list_total_value
      FROM stocks s
      JOIN list_stocks ls ON s.id = ls.stock_id
      JOIN lists l        ON ls.list_id = l.id
      WHERE s.symbol = ? AND l.user_id = ?
      ORDER BY l.name ASC
    `).all(symbol, userId);
  },
};

module.exports = Stock;
