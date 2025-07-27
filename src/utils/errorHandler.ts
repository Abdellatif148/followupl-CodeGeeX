import { PostgrestError } from '@supabase/supabase-js'

export interface AppError {
  message: string
  code?: string
  details?: any
}

export const handleSupabaseError = (error: PostgrestError | Error | any): AppError => {
  console.error('Supabase error:', error)
  
  // Handle Supabase specific errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return {
          message: 'No data found',
          code: error.code,
          details: error.details
        }
      case 'PGRST301':
        return {
          message: 'Unauthorized access',
          code: error.code,
          details: error.details
        }
      case '23505':
        return {
          message: 'This record already exists',
          code: error.code,
          details: error.details
        }
      case '23503':
        return {
          message: 'Cannot delete this record because it is referenced by other data',
          code: error.code,
          details: error.details
        }
      default:
        return {
          message: error.message || 'An unexpected error occurred',
          code: error.code,
          details: error.details
        }
    }
  }
  
  // Handle generic errors
  if (error?.message) {
    return {
      message: error.message,
      details: error
    }
  }
  
  // Fallback
  return {
    message: 'An unexpected error occurred',
    details: error
  }
}

export const showErrorToast = (error: AppError | string) => {
  const message = typeof error === 'string' ? error : error.message
  
  // Create a simple toast notification
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm'
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 5000)
}

export const showSuccessToast = (message: string) => {
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm'
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 3000)
}