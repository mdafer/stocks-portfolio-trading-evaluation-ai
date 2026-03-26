const { getHistoricalMovers } = require('../helpers/stockApi');
const { success } = require('../utils/response');

async function getMovers(req, res, next) {
  try {
    const region   = (req.query.region || 'US').toUpperCase();
    const daysBack = Math.max(0, Math.min(parseInt(req.query.daysBack) || 0, 30));
    const count    = Math.min(parseInt(req.query.count) || 20, 50);

    console.log(`[Movers] region=${region} daysBack=${daysBack} count=${count}`);
    const result = await getHistoricalMovers(region, daysBack, count);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMovers };
