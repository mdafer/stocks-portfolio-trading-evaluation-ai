/**
 * Standardized API response helpers
 */

function success(res, data = null, statusCode = 200) {
  const payload = { success: true };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
}

function created(res, data = null) {
  return success(res, data, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function error(res, message, statusCode = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

function notFound(res, resource = 'Resource') {
  return error(res, `${resource} not found`, 404);
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401);
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

function serverError(res, message = 'Internal server error') {
  return error(res, message, 500);
}

module.exports = { success, created, noContent, error, notFound, unauthorized, forbidden, serverError };
