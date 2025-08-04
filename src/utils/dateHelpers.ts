import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'No date'
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (isToday(dateObj)) {
      return 'Today'
    } else if (isTomorrow(dateObj)) {
      return 'Tomorrow'
    } else if (isYesterday(dateObj)) {
      return 'Yesterday'
    } else {
      return format(dateObj, 'MMM d, yyyy')
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    
    if (dateObj < now) {
      return `Overdue (${format(dateObj, 'MMM d')})`
    } else if (isToday(dateObj)) {
      return 'Due today'
    } else if (isTomorrow(dateObj)) {
      return 'Due tomorrow'
    } else {
      return `Due ${format(dateObj, 'MMM d, yyyy')}`
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(dateObj, { addSuffix: true })
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date
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
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    const diffTime = dateObj.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.error('Error calculating days until date:', error)
    return 0
  }
}