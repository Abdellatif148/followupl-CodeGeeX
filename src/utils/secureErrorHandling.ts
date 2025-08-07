/**
 * Secure error handling with sanitization and logging
 */

import { secureError } from '../lib/security'

export interface SecureAppError {
  message: string
  code?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string
  shouldLog: boolean
}

export class SecureDatabaseError extends Error {
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string

  constructor(message: string, code: string = 'DATABASE_ERROR', severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    super(message)
    this.name = 'SecureDatabaseError'
    this.code = code
    this.severity = severity
    this.userMessage = this.sanitizeUserMessage(message)
  }

  private sanitizeUserMessage(message: string): string {
    // Never expose internal details to users
    const sanitizedMessages: { [key: string]: string } = {
      'PGRST116': 'The requested item was not found',
      '23505': 'This item already exists',
      '23503': 'Cannot delete - this item is being used elsewhere',
      '42501': 'You do not have permission to perform this action',
      'auth_required': 'Please sign in to continue',
      'rate_limit_exceeded': 'Too many requests. Please slow down.',
      'invalid_input': 'Please check your input and try again',
      'network_error': 'Network error. Please check your connection.'
    }

    return sanitizedMessages[this.code] || 'An error occurred. Please try again.'
  }
}

export class SecureAuthError extends Error {
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string

  constructor(message: string, code: string = 'AUTH_ERROR', severity: 'low' | 'medium' | 'high' | 'critical' = 'high') {
    super(message)
    this.name = 'SecureAuthError'
    this.code = code
    this.severity = severity
    this.userMessage = this.sanitizeUserMessage(message)
  }

  private sanitizeUserMessage(message: string): string {
    const sanitizedMessages: { [key: string]: string } = {
      'invalid_credentials': 'Invalid email or password',
      'email_not_confirmed': 'Please check your email and click the confirmation link',
      'user_already_registered': 'This email is already registered',
      'signup_disabled': 'New registrations are currently disabled',
      'session_expired': 'Your session has expired. Please sign in again.',
      'access_denied': 'You do not have permission to access this resource',
      'account_locked': 'Your account has been temporarily locked due to suspicious activity'
    }

    return sanitizedMessages[this.code] || 'Authentication error. Please try again.'
  }
}

export class SecureValidationError extends Error {
  field: string
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  userMessage: string

  constructor(message: string, field: string) {
    super(message)
    this.name = 'SecureValidationError'
    this.field = field
    this.userMessage = message // Validation messages are safe to show
  }
}

/**
 * Secure error handler for Supabase operations
 */
export function handleSecureSupabaseError(error: any, context: string = 'operation'): SecureAppError {
  console.error(`Secure error in ${context}:`, error)

  // Log security event
  secureError.logSecurityEvent('database_error', {
    context,
    code: error?.code,
    message: error?.message
  })

  if (!error) {
    return {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
      severity: 'medium',
      userMessage: 'An unexpected error occurred. Please try again.',
      shouldLog: true
    }
  }

  // Handle specific Supabase error codes
  switch (error.code) {
    case 'PGRST116':
      return {
        message: error.message,
        code: 'NOT_FOUND',
        severity: 'low',
        userMessage: 'The requested item was not found',
        shouldLog: false
      }
    case '23505':
      return {
        message: error.message,
        code: 'DUPLICATE',
        severity: 'low',
        userMessage: 'This item already exists',
        shouldLog: false
      }
    case '23503':
      return {
        message: error.message,
        code: 'FOREIGN_KEY_VIOLATION',
        severity: 'medium',
        userMessage: 'Cannot delete - this item is referenced by other data',
        shouldLog: true
      }
    case '42501':
      return {
        message: error.message,
        code: 'PERMISSION_DENIED',
        severity: 'high',
        userMessage: 'You do not have permission to perform this action',
        shouldLog: true
      }
    case 'PGRST301':
      return {
        message: error.message,
        code: 'ROW_LEVEL_SECURITY',
        severity: 'high',
        userMessage: 'Access denied',
        shouldLog: true
      }
    default:
      return {
        message: error.message || 'Database error occurred',
        code: error.code || 'DATABASE_ERROR',
        severity: 'medium',
        userMessage: 'A database error occurred. Please try again.',
        shouldLog: true
      }
  }
}

/**
 * Secure error handler for authentication operations
 */
export function handleSecureAuthError(error: any): SecureAppError {
  console.error('Secure auth error:', error)

  // Log security event for auth errors
  secureError.logSecurityEvent('auth_error', {
    code: error?.code,
    message: error?.message
  })

  if (!error) {
    return {
      message: 'Authentication error occurred',
      code: 'AUTH_ERROR',
      severity: 'high',
      userMessage: 'An authentication error occurred. Please try again.',
      shouldLog: true
    }
  }

  switch (error.message) {
    case 'Invalid login credentials':
      return {
        message: error.message,
        code: 'INVALID_CREDENTIALS',
        severity: 'medium',
        userMessage: 'Invalid email or password. Please check your credentials and try again.',
        shouldLog: true
      }
    case 'Email not confirmed':
      return {
        message: error.message,
        code: 'EMAIL_NOT_CONFIRMED',
        severity: 'low',
        userMessage: 'Please check your email and click the confirmation link.',
        shouldLog: false
      }
    case 'User already registered':
      return {
        message: error.message,
        code: 'USER_EXISTS',
        severity: 'low',
        userMessage: 'This email is already registered. Please try signing in instead.',
        shouldLog: false
      }
    case 'Signup disabled':
      return {
        message: error.message,
        code: 'SIGNUP_DISABLED',
        severity: 'medium',
        userMessage: 'New registrations are currently disabled.',
        shouldLog: true
      }
    default:
      return {
        message: error.message || 'Authentication error occurred',
        code: 'AUTH_ERROR',
        severity: 'high',
        userMessage: 'An authentication error occurred. Please try again.',
        shouldLog: true
      }
  }
}

/**
 * Generic secure error handler
 */
export function handleSecureApiError(error: any, context: string = 'operation'): SecureAppError {
  if (error instanceof SecureDatabaseError) {
    return {
      message: error.message,
      code: error.code,
      severity: error.severity,
      userMessage: error.userMessage,
      shouldLog: true
    }
  }

  if (error instanceof SecureAuthError) {
    return {
      message: error.message,
      code: error.code,
      severity: error.severity,
      userMessage: error.userMessage,
      shouldLog: true
    }
  }

  if (error instanceof SecureValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      severity: error.severity,
      userMessage: error.userMessage,
      shouldLog: false
    }
  }

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR',
      severity: 'medium',
      userMessage: 'Network error. Please check your connection and try again.',
      shouldLog: true
    }
  }

  // Rate limit errors
  if (error.message.includes('rate limit') || error.message.includes('too many')) {
    return {
      message: error.message,
      code: 'RATE_LIMIT_ERROR',
      severity: 'medium',
      userMessage: 'Too many requests. Please slow down and try again.',
      shouldLog: true
    }
  }

  // Default fallback
  return {
    message: error.message || `Failed to complete ${context}`,
    code: 'UNKNOWN_ERROR',
    severity: 'medium',
    userMessage: 'An unexpected error occurred. Please try again.',
    shouldLog: true
  }
}

/**
 * Secure retry mechanism with exponential backoff
 */
export async function secureRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry certain errors
      if (error instanceof SecureAuthError || 
          error instanceof SecureValidationError ||
          (error.code && ['42501', 'PGRST301'].includes(error.code))) {
        throw error
      }
      
      if (attempt === maxRetries) {
        secureError.logSecurityEvent('max_retries_exceeded', {
          context,
          attempts: maxRetries,
          error: error.message
        })
        throw error
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Safe async operation wrapper with security
 */
export async function secureAsync<T>(
  operation: () => Promise<T>,
  context: string = 'operation',
  fallback?: T
): Promise<{ data: T | null; error: SecureAppError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const secureAppError = handleSecureApiError(error, context)
    
    // Log if required
    if (secureAppError.shouldLog) {
      secureError.logSecurityEvent('secure_async_error', {
        context,
        code: secureAppError.code,
        severity: secureAppError.severity
      })
    }
    
    return { data: fallback || null, error: secureAppError }
  }
}

export default {
  handleSecureSupabaseError,
  handleSecureAuthError,
  handleSecureApiError,
  secureRetry,
  secureAsync,
  SecureDatabaseError,
  SecureAuthError,
  SecureValidationError
}