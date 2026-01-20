/**
 * Standard error response format for all API routes
 */
export interface ErrorResponse {
  error: string
  message?: string
  timestamp: string
  code?: string
  details?: unknown
}

/**
 * Custom error classes for different error types
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details?: unknown) {
    super(message, 500, "DATABASE_ERROR", details)
    this.name = "DatabaseError"
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTH_ERROR")
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR")
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED")
    this.name = "RateLimitError"
  }
}

export class TimeoutError extends AppError {
  constructor(message = "Request timeout") {
    super(message, 504, "TIMEOUT")
    this.name = "TimeoutError"
  }
}

export class ShortlinkError extends AppError {
  constructor(message: string, public suggestedCode?: string) {
    super(message, 400, "SHORTLINK_ERROR")
    this.name = "ShortlinkError"
  }
}

/**
 * Convert any error to a standard ErrorResponse
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString()

  if (error instanceof AppError) {
    return {
      error: error.message,
      timestamp,
      code: error.code,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      error: "An unexpected error occurred",
      message: error.message,
      timestamp,
      code: "INTERNAL_ERROR",
    }
  }

  return {
    error: "An unexpected error occurred",
    timestamp,
    code: "UNKNOWN_ERROR",
  }
}

/**
 * Log error with context for monitoring
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error("[ERROR]", {
    timestamp,
    message: errorMessage,
    stack: errorStack,
    context,
  })
}

/**
 * User-friendly error messages
 */
export const USER_FRIENDLY_MESSAGES = {
  DATABASE_ERROR: "We're having trouble connecting to our database. Please try again in a moment.",
  TIMEOUT: "This is taking longer than expected. Please try again.",
  RATE_LIMIT_EXCEEDED: "You're doing that too quickly. Please wait a moment and try again.",
  NOT_FOUND: "We couldn't find what you're looking for.",
  AUTH_ERROR: "Please sign in to continue.",
  AUTHORIZATION_ERROR: "You don't have permission to do that.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NETWORK_ERROR: "Connection issue. Please check your internet and try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError && error.code) {
    return USER_FRIENDLY_MESSAGES[error.code as keyof typeof USER_FRIENDLY_MESSAGES] || error.message
  }

  if (error instanceof Error) {
    if (error.message.includes("timeout")) {
      return USER_FRIENDLY_MESSAGES.TIMEOUT
    }
    if (error.message.includes("database") || error.message.includes("query")) {
      return USER_FRIENDLY_MESSAGES.DATABASE_ERROR
    }
  }

  return USER_FRIENDLY_MESSAGES.UNKNOWN_ERROR
}
