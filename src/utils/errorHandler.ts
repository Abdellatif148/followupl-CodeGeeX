// Error handling utilities for consistent error management across the app

export interface AppError {
  message: string
  code?: string
  details?: any
}

// Handle Supabase errors and convert them to user-friendly messages
export function handleSupabaseError(error: any): AppError {
  console.error('Supabase error:', error)
  
  if (!error) {
    return { message: 'An unknown error occurred' }
  }

  // Handle different types of Supabase errors
  if (error.message) {
    // Authentication errors
    if (error.message.includes('Invalid login credentials')) {
      return { message: 'Invalid email or password. Please check your credentials.' }
    }
    
    if (error.message.includes('Email not confirmed')) {
      return { message: 'Please check your email and click the confirmation link.' }
    }
    
    if (error.message.includes('User already registered')) {
      return { message: 'An account with this email already exists.' }
    }
    
    // Database errors
    if (error.message.includes('duplicate key value')) {
      return { message: 'This record already exists.' }
    }
    
    if (error.message.includes('foreign key constraint')) {
      return { message: 'Cannot delete this record as it is referenced by other data.' }
    }
    
    if (error.message.includes('permission denied')) {
      return { message: 'You do not have permission to perform this action.' }
    }
    
    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { message: 'Network error. Please check your internet connection.' }
    }
    
    // Return the original message if it's user-friendly
    return { message: error.message, code: error.code, details: error.details }
  }
  
  // Fallback for unknown error types
  return { message: 'An unexpected error occurred. Please try again.' }
}

// Toast notification system
let toastContainer: HTMLElement | null = null

function createToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

function createToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  const container = createToastContainer()
  
  const toast = document.createElement('div')
  toast.className = `
    max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
    ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ease-in-out
    ${type === 'success' ? 'border-l-4 border-green-500' : ''}
    ${type === 'error' ? 'border-l-4 border-red-500' : ''}
    ${type === 'warning' ? 'border-l-4 border-yellow-500' : ''}
    ${type === 'info' ? 'border-l-4 border-blue-500' : ''}
  `
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  const colorMap = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  }
  
  toast.innerHTML = `
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-lg">${iconMap[type]}</span>
        </div>
        <div class="ml-3 w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${message}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
  
  // Add animation classes
  toast.style.opacity = '0'
  toast.style.transform = 'translateX(100%)'
  
  container.appendChild(toast)
  
  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateX(0)'
  }, 10)
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 5000)
}

export function showSuccessToast(message: string) {
  createToast(message, 'success')
}

export function showErrorToast(message: string) {
  createToast(message, 'error')
}

export function showWarningToast(message: string) {
  createToast(message, 'warning')
}

export function showInfoToast(message: string) {
  createToast(message, 'info')
}

// Utility function to handle async operations with error handling
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string
): Promise<T | null> {
  try {
    const result = await operation()
    if (successMessage) {
      showSuccessToast(successMessage)
    }
    return result
  } catch (error) {
    const appError = handleSupabaseError(error)
    showErrorToast(errorMessage || appError.message)
    return null
  }
}