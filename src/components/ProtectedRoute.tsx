import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { profilesApi } from '../lib/database'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, initialized } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleAuthenticatedUser = async () => {
      if (!initialized) return
      
      if (!isAuthenticated || !user) {
        navigate('/login')
        setChecking(false)
        return
      }

      try {
        // Check language selection for new users
        const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')

        if (!hasSelectedLanguage && window.location.pathname !== '/language-selection') {
          const profile = await profilesApi.get(user.id)
          
          if (!profile) {
            navigate('/language-selection')
            setChecking(false)
            return
          } else {
            localStorage.setItem('followuply-language-selected', 'true')
          }
        }
      } catch (error) {
        console.error('Error checking user profile:', error)
        localStorage.setItem('followuply-language-selected', 'true')
      }
      
      setChecking(false)
    }

    handleAuthenticatedUser()
  }, [user, isAuthenticated, initialized, navigate])

  if (loading || checking || !initialized) {
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