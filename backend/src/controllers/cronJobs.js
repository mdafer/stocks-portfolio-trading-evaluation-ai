const cron = require('node-cron');
const CronJob = require('../models/CronJob');
const List = require('../models/List');
const { scheduleJob, unscheduleJob } = require('../helpers/cronManager');
const { success, created, noContent, error, notFound, forbidden } = require('../utils/response');

async function index(req, res, next) {
  try {
    const jobs = CronJob.findByUser(req.user.id);
    return success(res, { cronJobs: jobs });
  } catch (err) {
    next(err);
  }
}

async function show(req, res, next) {
  try {
    const job = CronJob.findById(req.params.id);
    if (!job) return notFound(res, 'Cron job');
    if (job.user_id !== req.user.id) return forbidden(res);
    return success(res, { cronJob: job });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { list_id, schedule, user_message } = req.body;

    if (!List.isOwnedBy(list_id, req.user.id)) {
      const list = List.findById(list_id);
      if (!list) return notFound(res, 'List');
      return forbidden(res);
    }

    if (!cron.validate(schedule)) {
      return error(res, 'Invalid cron schedule expression', 422);
    }

    const job = CronJob.create(list_id, req.user.id, schedule, user_message);
    scheduleJob(job);

    return created(res, { cronJob: job });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;

    if (!CronJob.isOwnedBy(id, req.user.id)) {
      const job = CronJob.findById(id);
      if (!job) return notFound(res, 'Cron job');
      return forbidden(res);
    }

    if (req.body.schedule && !cron.validate(req.body.schedule)) {
      return error(res, 'Invalid cron schedule expression', 422);
    }

    const job = CronJob.update(id, req.body);

    // Re-schedule or unschedule based on active status
    if (job.is_active) {
      scheduleJob(job);
    } else {
      unscheduleJob(job.id);
    }

    return success(res, { cronJob: job });
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const { id } = req.params;

    if (!CronJob.isOwnedBy(id, req.user.id)) {
      const job = CronJob.findById(id);
      if (!job) return notFound(res, 'Cron job');
      return forbidden(res);
    }

    unscheduleJob(id);
    CronJob.delete(id);
    return noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, show, create, update, destroy };
