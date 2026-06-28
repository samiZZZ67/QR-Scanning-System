import config from '../config/env.js';

/**
 * Global Express error handler.
 * - Never exposes stack traces in production.
 * - Derives HTTP status from err.status / err.statusCode (defaulting to 400).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 400;
  const isProd = config.nodeEnv === 'production';

  if (!isProd) {
    console.error(err);
  }

  res.status(status).json({
    error: err.message || 'Request failed',
    ...(isProd ? {} : { stack: err.stack })
  });
}
