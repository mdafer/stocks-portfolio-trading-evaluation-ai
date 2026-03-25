function buildSystemPrompt() {
  return `You are an expert financial analyst AI assistant. Analyze stock portfolios using price data and recent news.

Structure your response as:
1. Portfolio Overview — high-level summary
2. Individual Stock Analysis — price performance, notable news, key observations per stock
3. Portfolio Health — diversification, correlated risks, sector exposure
4. Actionable Insights — specific recommendations informed by the news

Be balanced and objective. Highlight both bullish and bearish signals from the news. Always include a disclaimer that this is not financial advice.`;
}

function buildSingleStockSystemPrompt() {
  return `You are an expert financial analyst AI assistant. Analyze the provided stock using price data and recent news.

Structure your response as:
1. Price Performance — trends across available time periods
2. News Sentiment — key themes and sentiment from recent articles
3. Risks & Catalysts — downside risks and upside opportunities surfaced by the news
4. Brief Outlook — short to medium-term perspective

Be concise, balanced, and objective. Always include a disclaimer that this is not financial advice.`;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatPriceData(data) {
  if (!data) return '';
  let s = '';
  if (data.currentPrice) s += ` | Price: $${data.currentPrice}`;
  if (data.changes && Object.keys(data.changes).length) {
    const ch = Object.entries(data.changes)
      .map(([p, v]) => `${p}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}%`)
      .join(', ');
    s += ` | ${ch}`;
  }
  return s;
}

function formatNewsSection(articles, limit = 20) {
  if (!articles?.length) return '';
  const items = articles.slice(0, limit);
  let s = `\n**Recent News (${items.length} articles):**\n`;
  for (const a of items) {
    s += `- "${a.title}"`;
    if (a.source)  s += ` — ${a.source}`;
    if (a.pubDate) s += ` (${a.pubDate})`;
    s += '\n';
  }
  return s;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildAnalysisPrompt(stocks, priceData, newsData = {}, userMessage = null) {
  let prompt = 'Please analyze the following portfolio:\n\n**Holdings:**\n';

  for (const stock of stocks) {
    prompt += `- **${stock.symbol}** (${stock.name})`;
    if (stock.allocation) {
      prompt += ` (Holdings: ${stock.allocation_type === 'value' ? '$' : ''}${stock.allocation}${stock.allocation_type === 'percent' ? '%' : ''})`;
    }
    prompt += formatPriceData(priceData[stock.symbol]);
    prompt += '\n';
    // Up to 5 news articles per stock to keep the portfolio prompt manageable
    prompt += formatNewsSection(newsData[stock.symbol], 5);
  }

  if (userMessage) prompt += `\n**Additional context:** ${userMessage}\n`;
  prompt += '\nProvide a comprehensive portfolio analysis.';
  return prompt;
}

function buildSingleStockPrompt(stock, priceData, newsData = {}, userMessage = null) {
  let prompt = `Analyze the following stock:\n\n**${stock.symbol}** — ${stock.name}\n`;
  if (stock.allocation) {
    prompt += `Holding amount: ${stock.allocation_type === 'value' ? '$' : ''}${stock.allocation}${stock.allocation_type === 'percent' ? '%' : ''}\n`;
  }

  const data = priceData[stock.symbol];
  if (data) {
    if (data.currentPrice) prompt += `Current price: $${data.currentPrice}\n`;
    if (data.changes && Object.keys(data.changes).length) {
      prompt += 'Performance:\n';
      for (const [p, v] of Object.entries(data.changes)) {
        prompt += `  ${p}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}%\n`;
      }
    }
  }

  // Full 20 articles for single-stock analysis
  prompt += formatNewsSection(newsData[stock.symbol], 20);

  if (userMessage) prompt += `\nAdditional context: ${userMessage}\n`;
  prompt += '\nProvide a focused analysis of this stock.';
  return prompt;
}

module.exports = {
  buildSystemPrompt, buildSingleStockSystemPrompt,
  buildAnalysisPrompt, buildSingleStockPrompt,
};
