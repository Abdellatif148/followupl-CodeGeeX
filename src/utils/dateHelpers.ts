import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast, isFuture } from 'date-fns'

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never'
  
  try {
    const date = new Date(dateString)
    
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'
    
    return format(date, 'MMM d, yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

export const formatRelativeDate = (dateString: string): string => {
  if (!dateString) return 'Never'
  
  try {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting relative date:', error)
    return 'Invalid date'
  }
}

export const formatDueDate = (dateString: string): string => {
  if (!dateString) return 'No due date'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    
    if (isToday(date)) return 'Due today'
    if (isTomorrow(date)) return 'Due tomorrow'
    if (isYesterday(date)) return 'Due yesterday'
    
    if (isPast(date)) {
      const days = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      return `${days} day${days === 1 ? '' : 's'} overdue`
    }
    
    if (isFuture(date)) {
      const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (days <= 7) {
        return `Due in ${days} day${days === 1 ? '' : 's'}`
      }
    }
    
    return `Due ${format(date, 'MMM d')}`
  } catch (error) {
    console.error('Error formatting due date:', error)
    return 'Invalid date'
  }
}

export const isOverdue = (dateString: string): boolean => {
  if (!dateString) return false
  
  try {
    const date = new Date(dateString)
    return isPast(date) && !isToday(date)
  } catch (error) {
    console.error('Error checking if overdue:', error)
    return false
  }
}

export const getDaysUntilDue = (dateString: string): number => {
  if (!dateString) return 0
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.error('Error calculating days until due:', error)
    return 0
  }
}