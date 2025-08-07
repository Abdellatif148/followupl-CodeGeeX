/**
 * Centralized error handling utilities
 */

export interface AppError {
  message: string
  code?: string
  details?: any
}

export class DatabaseError extends Error {
  code: string
  details: any

  constructor(message: string, code: string = 'DATABASE_ERROR', details?: any) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.details = details
  }
}

export class AuthError extends Error {
  code: string

  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

export class ValidationError extends Error {
  field: string

  constructor(message: string, field: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * Handle Supabase errors and convert them to user-friendly messages
 */
export function handleSupabaseError(error: any): AppError {
  if (!error) {
    return { message: 'An unknown error occurred' }
  }

  // Handle specific Supabase error codes
  switch (error.code) {
    case 'PGRST116':
      return { message: 'No data found', code: 'NOT_FOUND' }
    case '23505':
      return { message: 'This record already exists', code: 'DUPLICATE' }
    case '23503':
      return { message: 'Cannot delete - this record is referenced by other data', code: 'FOREIGN_KEY_VIOLATION' }
    case '42501':
      return { message: 'You do not have permission to perform this action', code: 'PERMISSION_DENIED' }
    default:
      return { 
        message: error.message || 'A database error occurred', 
        code: error.code,
        details: error.details 
      }
  }
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: any): AppError {
  if (!error) {
    return { message: 'An authentication error occurred' }
  }

  switch (error.message) {
    case 'Invalid login credentials':
      return { message: 'Invalid email or password. Please check your credentials and try again.' }
    case 'Email not confirmed':
      return { message: 'Please check your email and click the confirmation link.' }
    case 'User already registered':
      return { message: 'This email is already registered. Please try signing in instead.' }
    case 'Signup disabled':
      return { message: 'New registrations are currently disabled.' }
    default:
      return { message: error.message || 'An authentication error occurred' }
  }
}

/**
 * Generic error handler for API calls
 */
export function handleApiError(error: any, context: string = 'operation'): AppError {
  console.error(`Error in ${context}:`, error)

  if (error.name === 'DatabaseError') {
    return handleSupabaseError(error)
  }

  if (error.name === 'AuthError') {
    return handleAuthError(error)
  }

  if (error.name === 'ValidationError') {
    return { message: error.message, code: 'VALIDATION_ERROR' }
  }

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return { message: 'Network error. Please check your connection and try again.' }
  }

  // Default fallback
  return { 
    message: error.message || `Failed to complete ${context}. Please try again.`,
    code: 'UNKNOWN_ERROR'
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const appError = handleApiError(error)
    return { data: fallback || null, error: appError }
  }
}