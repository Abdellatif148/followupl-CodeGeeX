import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast, Toast } from '../hooks/useToast'

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info': return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getTextStyles = () => {
    switch (toast.type) {
      case 'success': return 'text-green-800 dark:text-green-300'
      case 'error': return 'text-red-800 dark:text-red-300'
      case 'warning': return 'text-yellow-800 dark:text-yellow-300'
      case 'info': return 'text-blue-800 dark:text-blue-300'
    }
  }

  return (
    <div className={`p-4 rounded-lg border shadow-lg transition-all duration-300 ${getStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${getTextStyles()}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`text-sm mt-1 ${getTextStyles()} opacity-90`}>
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`text-sm font-medium mt-2 hover:underline ${getTextStyles()}`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 ${getTextStyles()}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}