const Analysis = require('../models/Analysis');
const AnalysisNews = require('../models/AnalysisNews');
const List = require('../models/List');
const Stock = require('../models/Stock');
const UserSettings = require('../models/UserSettings');
const { getBulkPriceData } = require('../helpers/stockApi');
const { getBulkNews } = require('../helpers/newsApi');
const { chatCompletion } = require('../utils/ai/openai');
const {
  buildSystemPrompt, buildSingleStockSystemPrompt,
  buildAnalysisPrompt, buildSingleStockPrompt,
} = require('../utils/ai/prompts');
const { success, created, notFound, forbidden, error } = require('../utils/response');

async function index(req, res, next) {
  try {
    return success(res, { analyses: Analysis.findByUser(req.user.id) });
  } catch (err) { next(err); }
}

async function show(req, res, next) {
  try {
    const analysis = Analysis.findById(req.params.id);
    if (!analysis) return notFound(res, 'Analysis');
    if (analysis.user_id !== req.user.id) return forbidden(res);
    return success(res, { analysis });
  } catch (err) { next(err); }
}

async function byList(req, res, next) {
  try {
    const { listId } = req.params;
    if (!List.isOwnedBy(listId, req.user.id)) {
      return List.findById(listId) ? forbidden(res) : notFound(res, 'List');
    }
    return success(res, { analyses: Analysis.findByList(listId) });
  } catch (err) { next(err); }
}

async function trigger(req, res, next) {
  try {
    const { list_id, symbol, user_message } = req.body;

    if (!List.isOwnedBy(list_id, req.user.id)) {
      return List.findById(list_id) ? forbidden(res) : notFound(res, 'List');
    }

    let stocks = Stock.getByList(list_id);
    const isSingle = !!symbol;

    if (isSingle) {
      stocks = stocks.filter((s) => s.symbol === symbol.toUpperCase());
      if (stocks.length === 0) return error(res, `${symbol} is not in this list`, 404);
    } else if (stocks.length === 0) {
      return error(res, 'No stocks in this list to analyze', 422);
    }

    const symbols = stocks.map((s) => s.symbol);
    const [priceData, newsData, aiSettings] = await Promise.all([
      getBulkPriceData(symbols),
      getBulkNews(symbols),
      Promise.resolve(UserSettings.forAI(req.user.id)),
    ]);

    const messages = isSingle
      ? [
          { role: 'system', content: buildSingleStockSystemPrompt() },
          { role: 'user',   content: buildSingleStockPrompt(stocks[0], priceData, newsData, user_message) },
        ]
      : [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user',   content: buildAnalysisPrompt(stocks, priceData, newsData, user_message) },
        ];

    const result = await chatCompletion(messages, {}, aiSettings);

    const analysis = Analysis.create({
      listId:           list_id,
      userId:           req.user.id,
      symbol:           isSingle ? symbol.toUpperCase() : null,
      result:           result.content,
      modelUsed:        result.model,
      promptTokens:     result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
    });

    AnalysisNews.createBatch(analysis.id, newsData);

    return created(res, { analysis });
  } catch (err) { next(err); }
}

async function news(req, res, next) {
  try {
    const analysis = Analysis.findById(req.params.id);
    if (!analysis) return notFound(res, 'Analysis');
    if (analysis.user_id !== req.user.id) return forbidden(res);
    return success(res, { articles: AnalysisNews.findByAnalysis(req.params.id) });
  } catch (err) { next(err); }
}

async function destroy(req, res, next) {
  try {
    const analysis = Analysis.findById(req.params.id);
    if (!analysis) return notFound(res, 'Analysis');
    if (analysis.user_id !== req.user.id) return forbidden(res);
    Analysis.delete(req.params.id);
    return success(res, { message: 'Analysis deleted' });
  } catch (err) { next(err); }
}

module.exports = { index, show, byList, trigger, news, destroy };
