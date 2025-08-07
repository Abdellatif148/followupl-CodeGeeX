/**
 * Rate Limiting Wrapper Component
 * Provides client-side rate limiting for user actions
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { rateLimit, secureError } from '../lib/security'
import { useAuth } from '../hooks/useAuth'

interface RateLimitWrapperProps {
  children: React.ReactNode
  action: string
  limit: number
  windowMs: number
  onLimitExceeded?: () => void
  showWarning?: boolean
}

export default function RateLimitWrapper({
  children,
  action,
  limit,
  windowMs,
  onLimitExceeded,
  showWarning = true
}: RateLimitWrapperProps) {
  const { user } = useAuth()
  const [isLimited, setIsLimited] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [usageCount, setUsageCount] = useState(0)

  const checkRateLimit = useCallback(() => {
    if (!user) return true

    const key = rateLimit.getUserKey(user.id, action)
    const allowed = rateLimit.check(key, limit, windowMs)
    
    if (!allowed) {
      setIsLimited(true)
      setRemainingTime(windowMs)
      
      // Log rate limit exceeded
      secureError.logSecurityEvent('rate_limit_exceeded', {
        action,
        userId: user.id,
        limit,
        windowMs
      })
      
      onLimitExceeded?.()
      
      // Start countdown
      const interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1000) {
            clearInterval(interval)
            setIsLimited(false)
            setUsageCount(0)
            return 0
          }
          return prev - 1000
        })
      }, 1000)
      
      return false
    }
    
    setUsageCount(prev => prev + 1)
    return true
  }, [user, action, limit, windowMs, onLimitExceeded])

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  // Enhanced children with rate limit check
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // If it's a button or form, add rate limit check
      if (child.type === 'button' || child.type === 'form') {
        const originalOnClick = child.props.onClick
        const originalOnSubmit = child.props.onSubmit
        
        return React.cloneElement(child, {
          ...child.props,
          disabled: child.props.disabled || isLimited,
          onClick: originalOnClick ? (e: any) => {
            if (checkRateLimit()) {
              originalOnClick(e)
            } else {
              e.preventDefault()
            }
          } : undefined,
          onSubmit: originalOnSubmit ? (e: any) => {
            if (checkRateLimit()) {
              originalOnSubmit(e)
            } else {
              e.preventDefault()
            }
          } : undefined
        })
      }
    }
    return child
  })

  return (
    <div className="relative">
      {/* Rate limit warning */}
      {showWarning && usageCount > limit * 0.8 && !isLimited && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
              Rate limit warning
            </p>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              You've used {usageCount} of {limit} allowed actions. Please slow down to avoid being temporarily blocked.
            </p>
          </div>
        </div>
      )}

      {/* Rate limit exceeded message */}
      {isLimited && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <Clock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 dark:text-red-300 text-sm font-medium">
              Rate limit exceeded
            </p>
            <p className="text-red-700 dark:text-red-400 text-sm">
              You've exceeded the rate limit for this action. Please wait {formatTime(remainingTime)} before trying again.
            </p>
          </div>
        </div>
      )}

      {/* Render children with rate limiting */}
      {enhancedChildren}
    </div>
  )
}