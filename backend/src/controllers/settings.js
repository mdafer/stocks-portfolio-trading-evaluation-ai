const UserSettings = require('../models/UserSettings');
const { getFreeModels } = require('../helpers/openRouter');
const { chatCompletion } = require('../utils/ai/openai');
const { success, error } = require('../utils/response');

async function getSettings(req, res, next) {
  try {
    const settings = UserSettings.forClient(req.user.id);
    return success(res, { settings, providerDefaults: UserSettings.PROVIDER_DEFAULTS });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = UserSettings.update(req.user.id, req.body);
    return success(res, { settings });
  } catch (err) {
    next(err);
  }
}

async function freeModels(req, res, next) {
  try {
    const models = await getFreeModels();
    return success(res, { models });
  } catch (err) {
    next(err);
  }
}

async function testConnection(req, res, next) {
  try {
    // Use provided body fields for an ad-hoc test, or fall back to saved settings
    const saved = UserSettings.forAI(req.user.id);
    const aiSettings = {
      ai_api_key:  (!req.body.ai_api_key || req.body.ai_api_key.includes('••••'))
                     ? saved.ai_api_key
                     : req.body.ai_api_key,
      ai_base_url: req.body.ai_base_url || saved.ai_base_url,
      ai_model:    req.body.ai_model    || saved.ai_model,
    };

    const result = await chatCompletion(
      [{ role: 'user', content: 'Reply with exactly: "ok"' }],
      { maxTokens: 10, temperature: 0 },
      aiSettings,
    );

    return success(res, { ok: true, model: result.model, reply: result.content?.trim() });
  } catch (err) {
    // Return as a 200 with ok:false so the frontend can show the message without triggering the generic error handler
    return error(res, err.message, 200);
  }
}

module.exports = { getSettings, updateSettings, freeModels, testConnection };
