/**
 * Date utility functions for formatting and manipulating dates
 */

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'No date'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays === -1) {
      return 'Yesterday'
    } else {
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Format a due date with special handling for overdue dates
 */
export function formatDueDate(date: string | Date | null | undefined): string {
  if (!date) return 'No due date'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    
    if (dateObj < now) {
      const diffTime = now.getTime() - dateObj.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return `Overdue by ${diffDays} day${diffDays !== 1 ? 's' : ''}`
    } else {
      return formatDate(dateObj)
    }
  } catch (error) {
    console.error('Error formatting due date:', error)
    return 'Invalid date'
  }
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return 'No date'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = dateObj.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))
    
    if (Math.abs(diffMinutes) < 60) {
      if (diffMinutes > 0) return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
      return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`
    } else if (Math.abs(diffHours) < 24) {
      if (diffHours > 0) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
      return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`
    } else {
      if (diffDays > 0) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`
    }
  } catch (error) {
    console.error('Error formatting relative date:', error)
    return 'Invalid date'
  }
}

/**
 * Check if a date is overdue
 */
export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj < new Date()
  } catch (error) {
    console.error('Error checking if date is overdue:', error)
    return false
  }
}

/**
 * Get the number of days until a date
 */
export function getDaysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = dateObj.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.error('Error calculating days until date:', error)
    return 0
  }
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error formatting date for input:', error)
    return ''
  }
}

/**
 * Format time for input fields (HH:MM)
 */
export function formatTimeForInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toTimeString().slice(0, 5)
  } catch (error) {
    console.error('Error formatting time for input:', error)
    return ''
  }
}