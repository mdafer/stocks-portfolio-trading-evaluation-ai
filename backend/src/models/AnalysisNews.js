const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const AnalysisNews = {
  createBatch(analysisId, newsData) {
    const stmt = db.prepare(
      'INSERT INTO analysis_news (id, analysis_id, symbol, title, link, source, pub_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    const rows = [];
    for (const [symbol, articles] of Object.entries(newsData)) {
      for (const a of articles) rows.push({ symbol, title: a.title, link: a.link || null, source: a.source || null, pubDate: a.pubDate || null });
    }
    db.transaction(() => {
      for (const r of rows) stmt.run(uuidv4(), analysisId, r.symbol, r.title, r.link, r.source, r.pubDate);
    })();
  },

  findByAnalysis(analysisId) {
    return db.prepare(
      'SELECT symbol, title, link, source, pub_date FROM analysis_news WHERE analysis_id = ? ORDER BY symbol, rowid',
    ).all(analysisId);
  },

  findByUser(userId) {
    return db.prepare(`
      SELECT DISTINCT an.symbol, an.title, an.link, an.source, an.pub_date, a.created_at AS analysis_date
      FROM analysis_news an
      JOIN analyses a ON an.analysis_id = a.id
      WHERE a.user_id = ?
      ORDER BY an.pub_date DESC, an.symbol ASC
    `).all(userId);
  },
};

module.exports = AnalysisNews;
