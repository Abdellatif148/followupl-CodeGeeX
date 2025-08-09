import React from 'react'
import { CLIENT_STATUSES, INVOICE_STATUSES, EXPENSE_STATUSES } from '../lib/constants'

interface StatusBadgeProps {
  status: string
  type: 'client' | 'invoice' | 'expense' | 'reminder'
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, type, size = 'sm' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (type) {
      case 'client':
        return CLIENT_STATUSES.find(s => s.value === status)
      case 'invoice':
        return INVOICE_STATUSES.find(s => s.value === status)
      case 'expense':
        return EXPENSE_STATUSES.find(s => s.value === status)
      case 'reminder':
        if (['done', 'completed'].includes(status)) {
          return { value: status, label: 'Done', color: 'green' }
        }
        return { value: status, label: 'Active', color: 'yellow' }
      default:
        return { value: status, label: status, color: 'gray' }
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
      case 'yellow':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700'
      case 'red':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700'
      case 'orange':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span 
      className={`${sizeClasses} font-medium rounded-full capitalize ${getColorClasses(config.color)}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  )
}