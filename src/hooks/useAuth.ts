import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { profilesApi } from '../lib/database'
import type { Profile } from '../types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false
  })

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              initialized: true
            })
          }
          return
        }

        if (session?.user && mounted) {
          // Load user profile
          const profile = await profilesApi.get(session.user.id)
          
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true
          })
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true
          })
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true
          })
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Load or create user profile
            let profile = await profilesApi.get(session.user.id)
            
            if (!profile) {
              // Create profile for new users
              profile = await profilesApi.create({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                email: session.user.email || '',
                plan: 'free',
                currency: 'USD',
                language: 'en'
              })
            }

            setAuthState({
              user: session.user,
              profile,
              loading: false,
              initialized: true
            })
          } catch (error) {
            console.error('Error handling sign in:', error)
            setAuthState({
              user: session.user,
              profile: null,
              loading: false,
              initialized: true
            })
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (!authState.user) return

    try {
      const profile = await profilesApi.get(authState.user.id)
      setAuthState(prev => ({
        ...prev,
        profile
      }))
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    initialized: authState.initialized,
    refreshProfile,
    signOut
  }
}