import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthAnalytics } from '../hooks/useAnalytics'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized, profile } = useAuth()
  const { setUserProfile } = useAuthAnalytics()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialized) return

    if (!user) {
      navigate('/login')
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
  }, [user, loading, initialized, profile, navigate, setUserProfile])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}