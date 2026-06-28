/**
 * Wraps an async route handler and forwards any rejected promise to Express's
 * next(err) so the global error handler can process it.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
