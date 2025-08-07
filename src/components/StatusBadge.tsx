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
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
      case 'yellow':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
      case 'red':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
      case 'orange':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`${sizeClasses} font-medium rounded-full capitalize ${getColorClasses(config.color)}`}>
      {config.label}
    </span>
  )
}