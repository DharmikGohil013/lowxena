/**
 * Global error handler middleware.
 * Guarantees the frontend always receives:
 * {
 *   success: false,
 *   message: string,       // human-readable
 *   code: string,          // machine-readable error code
 *   status: number,        // HTTP status
 *   ...(dev-only) error: string  // stack trace in development
 * }
 */
export const errorHandler = (err, req, res, _next) => {
  // Supabase errors come with a `code` field like 'PGRST116'
  const supabaseCode = err?.code;
  // Express-validator errors
  const validationErrors = err?.errors;

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = 'ERR_INTERNAL';

  // --- Classify known error types ---

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'ERR_AUTH_INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    code = 'ERR_AUTH_TOKEN_EXPIRED';
  }

  // Supabase "no rows" — treat as 404
  if (supabaseCode === 'PGRST116') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'ERR_NOT_FOUND';
  }

  // Supabase unique constraint violation
  if (supabaseCode === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'ERR_DUPLICATE';
  }

  // Validation errors
  if (validationErrors) {
    statusCode = 400;
    message = validationErrors.map(e => e.msg).join(', ');
    code = 'ERR_VALIDATION';
  }

  // Custom AppError
  if (err.isOperational) {
    code = err.code || 'ERR_APP';
  }

  // Log server errors, skip expected ones
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  const response = {
    success: false,
    message,
    code,
    status: statusCode,
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Custom error class with HTTP status code
 */
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERR_APP';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default errorHandler;
