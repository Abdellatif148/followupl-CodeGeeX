import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
<<<<<<< HEAD
import { useAuth } from '../hooks/useAuth'
=======
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
>>>>>>> 18e20bc (Auto commit 2025-08-04 21:20:01)
import { useAuthAnalytics } from '../hooks/useAnalytics'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth()
  const { setUserProfile } = useAuthAnalytics()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialized) return

    if (!user) {
      navigate('/login')
      return
    }

    // Set user properties for analytics
    try {
      setUserProfile(
        user.id, 
        'free', // Default plan, will be updated from profile
        user.app_metadata?.provider || 'email'
      )
    } catch (error) {
      console.error('Error setting user analytics properties:', error)
    }

    // Check if user has selected language (only for new users)
    const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')
    
    if (!hasSelectedLanguage && window.location.pathname !== '/language-selection') {
      navigate('/language-selection')
    }
  }, [user, initialized, navigate, setUserProfile])

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
