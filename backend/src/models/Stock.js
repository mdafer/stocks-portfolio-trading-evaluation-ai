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

  getByUser(userId) {
    return db.prepare(`
      SELECT s.symbol, ls.allocation, ls.allocation_type
      FROM stocks s
      JOIN list_stocks ls ON s.id = ls.stock_id
      JOIN lists l ON ls.list_id = l.id
      WHERE l.user_id = ?
    `).all(userId);
  },
};

module.exports = Stock;
