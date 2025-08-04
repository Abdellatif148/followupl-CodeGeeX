import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { setUserProfile } = useAuthAnalytics()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      // If there's an error or no user, clear any stale session data
      if (error || !user) {
        await supabase.auth.signOut()
        setUser(null)
        setLoading(false)
        navigate('/login')
        return
      }
      
      setUser(user)
      setLoading(false)

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

      // Check if user has selected language (only for new users)
      const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')
      
      // Only redirect to language selection if:
      // 1. No language selected AND
      // 2. Not already on language selection page AND  
      // 3. User just signed up (check if they have a profile)
      if (!hasSelectedLanguage && window.location.pathname !== '/language-selection') {
        // Check if this is a new user by looking for profile
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()
          
          // If no profile exists, this is a new user - redirect to language selection
          if (!profile) {
            navigate('/language-selection')
            return
          } else {
            // Existing user without language preference - set default
            localStorage.setItem('followuply-language-selected', 'true')
          }
        } catch (error) {
          console.error('Error checking user profile:', error)
          // On error, assume existing user and set default language
          localStorage.setItem('followuply-language-selected', 'true')
        }
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login')
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        
        // For OAuth sign-ins, check if new user
        const hasSelectedLanguage = localStorage.getItem('followuply-language-selected')
        if (!hasSelectedLanguage) {
          // This could be a new OAuth user, redirect to language selection
          navigate('/language-selection')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

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

  if (!user) {
    return null
  }

  return <>{children}</>
}