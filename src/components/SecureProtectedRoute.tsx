/**
 * Enhanced protected route component with comprehensive security checks
 */

import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react'
import { useSecureAuth } from '../hooks/useSecureAuth'
import { useAuthAnalytics } from '../hooks/useAnalytics'
import { secureError, rateLimit } from '../lib/security'

interface SecureProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiresPro?: boolean
}

export default function SecureProtectedRoute({ 
  children, 
  requiredPermissions = [],
  requiresPro = false 
}: SecureProtectedRouteProps) {
  const { 
    user, 
    profile, 
    loading, 
    initialized, 
    sessionValid, 
    validateSession,
    updateActivity 
  } = useSecureAuth()
  const { setUserProfile } = useAuthAnalytics()
  const navigate = useNavigate()
  const location = useLocation()
  const [securityCheck, setSecurityCheck] = useState<'checking' | 'passed' | 'failed'>('checking')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!initialized) return

    performSecurityChecks()
  }, [initialized, user, sessionValid, location.pathname])

  const performSecurityChecks = async () => {
    try {
      setSecurityCheck('checking')

      // Rate limiting check for route access
      const routeKey = `route:${location.pathname}:${user?.id || 'anonymous'}`
      if (!rateLimit.check(routeKey, 100, 60000)) { // 100 requests per minute per route
        secureError.logSecurityEvent('route_rate_limit_exceeded', { 
          route: location.pathname,
          userId: user?.id 
        })
        setSecurityCheck('failed')
        return
      }

      // Authentication check
      if (!user) {
        secureError.logSecurityEvent('unauthorized_access_attempt', { 
          route: location.pathname 
        })
        navigate('/login', { 
          state: { from: location.pathname },
          replace: true 
        })
        return
      }

      // Session validation
      if (!sessionValid) {
        const isValid = await validateSession()
        if (!isValid) {
          secureError.logSecurityEvent('invalid_session_detected', { 
            userId: user.id,
            route: location.pathname 
          })
          navigate('/login', { replace: true })
          return
        }
      }

      // Pro plan requirement check
      if (requiresPro && profile?.plan === 'free') {
        secureError.logSecurityEvent('unauthorized_pro_access', { 
          userId: user.id,
          route: location.pathname 
        })
        navigate('/upgrade', { replace: true })
        return
      }

      // Permission checks
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => {
          // Define permission logic based on your app's needs
          switch (permission) {
            case 'admin':
              return profile?.plan === 'super_pro'
            case 'pro':
              return profile?.plan !== 'free'
            default:
              return true
          }
        })

        if (!hasAllPermissions) {
          secureError.logSecurityEvent('insufficient_permissions', { 
            userId: user.id,
            route: location.pathname,
            requiredPermissions 
          })
          navigate('/dashboard', { replace: true })
          return
        }
      }

      // Set user properties for analytics
      if (user && profile) {
        setUserProfile(
          user.id, 
          profile?.plan || 'free',
          user.app_metadata?.provider || 'email'
        )
      }

      // Language selection check for new users
      const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')
      
      if (!hasSelectedLanguage && location.pathname !== '/language-selection') {
        if (!profile) {
          navigate('/language-selection', { replace: true })
          return
        } else {
          localStorage.setItem('followuply-language-selected', 'true')
        }
      }

      // Update activity
      updateActivity()

      setSecurityCheck('passed')
    } catch (error) {
      console.error('Security check error:', error)
      secureError.logSecurityEvent('security_check_error', { 
        error: error instanceof Error ? error.message : 'Unknown',
        userId: user?.id 
      })
      setSecurityCheck('failed')
    }
  }

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      performSecurityChecks()
    } else {
      navigate('/login', { replace: true })
    }
  }

  // Loading state
  if (!initialized || loading || securityCheck === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Securing your session...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Validating authentication and permissions
          </p>
        </div>
      </div>
    )
  }

  // Security check failed
  if (securityCheck === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Security Check Failed
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We detected a security issue with your session. Please try again or contact support if the problem persists.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-medium"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry ({3 - retryCount} left)
            </button>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center font-medium"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}