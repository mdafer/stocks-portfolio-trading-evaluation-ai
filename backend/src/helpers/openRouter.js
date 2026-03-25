const MODELS_URL = 'https://openrouter.ai/api/v1/models';

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getFreeModels() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;

  const res = await fetch(MODELS_URL);
  if (!res.ok) throw new Error(`OpenRouter responded with ${res.status}`);
  const data = await res.json();

  const free = (data.data || [])
    .filter((m) => m.pricing?.prompt === '0' && m.pricing?.completion === '0')
    .map((m) => ({
      id:          m.id,
      name:        m.name,
      context:     m.context_length,
      description: m.description,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  cache = free;
  cacheTime = Date.now();
  return free;
}

module.exports = { getFreeModels };
