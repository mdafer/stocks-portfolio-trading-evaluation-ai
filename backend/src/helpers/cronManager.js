const cron = require('node-cron');
const CronJob = require('../models/CronJob');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
const UserSettings = require('../models/UserSettings');
const { getBulkPriceData } = require('./stockApi');
const { getBulkNews } = require('./newsApi');
const { chatCompletion } = require('../utils/ai/openai');
const { buildSystemPrompt, buildAnalysisPrompt } = require('../utils/ai/prompts');

const activeTasks = new Map();

async function executeAnalysis(cronJob) {
  console.log(`[CronManager] Running job ${cronJob.id} (list: ${cronJob.list_id})`);
  try {
    const stocks = Stock.getByList(cronJob.list_id);
    if (stocks.length === 0) return;

    const symbols = stocks.map((s) => s.symbol);
    const [priceData, newsData, aiSettings] = await Promise.all([
      getBulkPriceData(symbols),
      getBulkNews(symbols),
      Promise.resolve(UserSettings.forAI(cronJob.user_id)),
    ]);

    const result = await chatCompletion(
      [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user',   content: buildAnalysisPrompt(stocks, priceData, newsData, cronJob.user_message) },
      ],
      {},
      aiSettings,
    );

    const analysis = Analysis.create({
      cronJobId:        cronJob.id,
      listId:           cronJob.list_id,
      userId:           cronJob.user_id,
      result:           result.content,
      modelUsed:        result.model,
      promptTokens:     result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
    });

    try {
      const AnalysisNews = require('../models/AnalysisNews');
      AnalysisNews.createBatch(analysis.id, newsData);
    } catch (e) {
      console.error(`[CronManager] Failed saving news for job ${cronJob.id}:`, e.message);
    }

    CronJob.updateLastRun(cronJob.id);
    console.log(`[CronManager] Completed job ${cronJob.id}`);
  } catch (err) {
    console.error(`[CronManager] Failed job ${cronJob.id}:`, err.message);
  }
}

function scheduleJob(cronJob) {
  if (activeTasks.has(cronJob.id)) activeTasks.get(cronJob.id).stop();
  if (!cron.validate(cronJob.schedule)) {
    console.error(`[CronManager] Invalid schedule for job ${cronJob.id}: ${cronJob.schedule}`);
    return false;
  }
  const task = cron.schedule(cronJob.schedule, () => executeAnalysis(cronJob), { scheduled: true });
  activeTasks.set(cronJob.id, task);
  console.log(`[CronManager] Scheduled job ${cronJob.id}: ${cronJob.schedule}`);
  return true;
}

function unscheduleJob(jobId) {
  if (activeTasks.has(jobId)) {
    activeTasks.get(jobId).stop();
    activeTasks.delete(jobId);
  }
}

function initializeJobs() {
  const jobs = CronJob.findAllActive();
  console.log(`[CronManager] Loading ${jobs.length} active cron jobs`);
  for (const job of jobs) scheduleJob(job);
}

function getActiveCount() { return activeTasks.size; }

module.exports = { scheduleJob, unscheduleJob, initializeJobs, getActiveCount, executeAnalysis };
