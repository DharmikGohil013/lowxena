/**
 * Async route handler wrapper.
 * Catches any thrown error and forwards it to Express error handler
 * so every endpoint returns a predictable JSON shape:
 *
 *   { success: false, message: "...", code: "ERR_...", status: 500 }
 *
 * Usage:
 *   import { asyncHandler } from '../middleware/asyncHandler.js';
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
