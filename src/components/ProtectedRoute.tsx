import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthAnalytics } from '../hooks/useAnalytics'
import { secureError, sessionSecurity } from '../lib/security'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresPro?: boolean
}

export default function ProtectedRoute({ children, requiresPro = false }: ProtectedRouteProps) {
  const { user, loading, initialized, profile } = useAuth()
  const { setUserProfile } = useAuthAnalytics()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialized) return

    // Validate session integrity
    if (!sessionSecurity.validateSessionIntegrity()) {
      secureError.logSecurityEvent('session_integrity_failed_on_route', {})
      navigate('/login', { replace: true })
      return
    }
    if (!user) {
      secureError.logSecurityEvent('unauthorized_route_access', { 
        route: window.location.pathname 
      })
      navigate('/login')
      return
    }
    
    // Check Pro requirement
    if (requiresPro && profile?.plan === 'free') {
      secureError.logSecurityEvent('pro_feature_access_denied', { 
        userId: user.id,
        route: window.location.pathname 
      })
      navigate('/upgrade')
      return
    }

    // Set user properties for analytics
    if (user && profile) {
      setUserProfile(
        user.id, 
        profile?.plan || 'free',
        user.app_metadata?.provider || 'email'
      )
    }

    // Check if user has selected language (only for new users)
    const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')
    
    if (!hasSelectedLanguage && window.location.pathname !== '/language-selection') {
      // If no profile exists, this is a new user - redirect to language selection
      if (!profile) {
        navigate('/language-selection')
        return
      } else {
        // Existing user without language preference - set default
        localStorage.setItem('followuply-language-selected', 'true')
      }
    }
  }, [user, loading, initialized, profile, navigate, setUserProfile, requiresPro])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner text="Initializing..." size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}