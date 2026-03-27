#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const CURATED_STOCKS = require('../src/data/curatedStocks');

// Setup database
const dbPath = path.resolve(__dirname, '../data/stock_eval.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize DB schema if needed
require('../src/config/db').initialize();

const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Communication Services',
  'Industrials',
  'Consumer Defensive',
  'Energy',
  'Basic Materials',
  'Real Estate',
];

async function main() {
  try {
    // 1. Get first user or create dummy one
    let user = db.prepare('SELECT id FROM users ORDER BY created_at DESC LIMIT 1').get();
    if (!user) {
      const userId = uuidv4();
      // Use a simple hash placeholder
      const hash = '$2b$10$dummyhashduplicatedbytesonly';
      db.prepare(`
        INSERT INTO users (id, email, password, name)
        VALUES (?, ?, ?, ?)
      `).run(userId, 'admin@localhost', hash, 'Admin User');
      user = { id: userId };
      console.log('✓ Created admin user');
    } else {
      console.log('✓ Using existing user');
    }

    const userId = user.id;

    // 2. For each sector, create a list and add 100 stocks
    for (const sectorName of SECTORS) {
      console.log(`\n📋 Processing ${sectorName}...`);

      // Create list for this sector
      const listId = uuidv4();
      db.prepare(`
        INSERT INTO lists (id, user_id, name, description)
        VALUES (?, ?, ?, ?)
      `).run(listId, userId, `${sectorName} - Curated`, `Top stocks in ${sectorName}`);
      console.log(`  ✓ Created list`);

      // Get stocks for this sector from curated data
      const symbols = CURATED_STOCKS.us[sectorName] || [];

      if (symbols.length === 0) {
        console.log(`  ⚠ No stocks found for ${sectorName}`);
        continue;
      }

      // Add up to 100 stocks to the list
      let added = 0;
      for (const symbol of symbols.slice(0, 100)) {
        try {
          if (!symbol) continue;

          // Create or get stock
          let stock = db.prepare('SELECT id FROM stocks WHERE symbol = ?').get(symbol);
          if (!stock) {
            const stockId = uuidv4();
            db.prepare(`
              INSERT INTO stocks (id, symbol, name, exchange)
              VALUES (?, ?, ?, ?)
            `).run(stockId, symbol, symbol, 'NASDAQ');
            stock = { id: stockId };
          }

          // Add to list
          const listStockId = uuidv4();
          try {
            db.prepare(`
              INSERT INTO list_stocks (id, list_id, stock_id, allocation, allocation_type)
              VALUES (?, ?, ?, ?, ?)
            `).run(listStockId, listId, stock.id, null, 'value');
            added++;
          } catch (err) {
            // Stock might already be in list, skip
          }
        } catch (err) {
          console.error(`    Error adding stock:`, err.message);
        }
      }

      console.log(`  ✓ Added ${added} stocks to ${sectorName}`);
    }

    console.log('\n✅ Bulk load complete!');

    // Show summary
    const listCount = db.prepare('SELECT COUNT(*) as count FROM lists').get();
    const stockCount = db.prepare('SELECT COUNT(*) as count FROM stocks').get();
    const listStockCount = db.prepare('SELECT COUNT(*) as count FROM list_stocks').get();

    console.log(`\nSummary:`);
    console.log(`  Lists: ${listCount.count}`);
    console.log(`  Total Stocks: ${stockCount.count}`);
    console.log(`  List-Stock Associations: ${listStockCount.count}`);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
