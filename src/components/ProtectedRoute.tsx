import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthAnalytics } from '../hooks/useAnalytics'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { setUserProfile } = useAuthAnalytics()
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthenticatedUser = async () => {
      if (!isAuthenticated || !user) {
        navigate('/login')
        return
      }

      // Set user properties for analytics
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .maybeSingle()
        
        setUserProfile(
          user.id, 
          profile?.plan || 'free',
          user.app_metadata?.provider || 'email'
        )
      } catch (error) {
        console.error('Error setting user analytics properties:', error)
      }

      // Check language selection for new users
      const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')

      if (!hasSelectedLanguage && window.location.pathname !== '/language-selection') {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()

          if (!profile) {
            navigate('/language-selection')
            return
          } else {
            localStorage.setItem('followuply-language-selected', 'true')
          }
        } catch (error) {
          console.error('Error checking user profile:', error)
          localStorage.setItem('followuply-language-selected', 'true')
        }
      }
    }

    if (!loading) {
      handleAuthenticatedUser()
    }
  }, [user, isAuthenticated, loading, navigate, setUserProfile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}