const OpenAI = require('openai');
const env = require('../../config/env');

/**
 * Build an OpenAI-compatible client from user AI settings.
 * Falls back to env vars when user hasn't configured credentials.
 */
function buildClient(aiSettings = null) {
  const apiKey  = aiSettings?.ai_api_key  || env.openai.apiKey;
  const baseURL = aiSettings?.ai_base_url || undefined;

  if (!apiKey) throw new Error('No AI API key configured. Add one in Settings → AI Provider.');

  return new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
}

/**
 * Send a chat completion request.
 * @param {Array<{role:string, content:string}>} messages
 * @param {object}  options     — temperature, maxTokens, model override
 * @param {object|null} aiSettings — user's AI settings from UserSettings.forAI()
 */
async function chatCompletion(messages, options = {}, aiSettings = null) {
  const client = buildClient(aiSettings);
  const model  = options.model || aiSettings?.ai_model || env.openai.model;

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens:  options.maxTokens  ?? 2048,
  });

  const choice = response.choices[0];
  return {
    content: choice.message.content,
    model,
    usage: response.usage
      ? { prompt_tokens: response.usage.prompt_tokens, completion_tokens: response.usage.completion_tokens }
      : null,
  };
}

module.exports = { buildClient, chatCompletion };
