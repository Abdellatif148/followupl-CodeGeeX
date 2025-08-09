import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { profilesApi } from '../lib/database'
import { secureError, sessionSecurity, validate } from '../lib/security'
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
    let sessionCheckInterval: NodeJS.Timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        // Validate session integrity
        if (!sessionSecurity.validateSessionIntegrity()) {
          secureError.logSecurityEvent('session_integrity_failed', {})
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
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          secureError.logSecurityEvent('session_error', { error: error.message })
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
          // Additional session validation
          const now = new Date()
          const sessionExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null
          
          if (sessionExpiry && sessionExpiry < now) {
            secureError.logSecurityEvent('expired_session_detected', { userId: session.user.id })
            await supabase.auth.signOut()
            return
          }
          
          // Load user profile
          const profile = await profilesApi.get(session.user.id)
          
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true
          })
          
          // Set up periodic session validation
          sessionCheckInterval = setInterval(async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            if (!currentSession || !sessionSecurity.validateSessionIntegrity()) {
              secureError.logSecurityEvent('session_validation_failed', { userId: session.user.id })
              await supabase.auth.signOut()
            }
          }, 5 * 60 * 1000) // Check every 5 minutes
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
        secureError.logSecurityEvent('auth_initialization_error', { 
          error: error instanceof Error ? error.message : 'Unknown' 
        })
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

        // Log auth events for security monitoring
        secureError.logSecurityEvent('auth_state_change', { 
          event, 
          userId: session?.user?.id 
        })
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Validate new session
            if (!sessionSecurity.validateSessionIntegrity()) {
              secureError.logSecurityEvent('invalid_session_on_signin', { userId: session.user.id })
              await supabase.auth.signOut()
              return
            }
            
            // Load or create user profile
            let profile = await profilesApi.get(session.user.id)
            
            if (!profile) {
              // Create profile for new users
              profile = await profilesApi.create({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                currency: 'USD',
                language: 'en',
                plan: 'free'
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
            secureError.logSecurityEvent('signin_error', { 
              userId: session.user.id,
              error: error instanceof Error ? error.message : 'Unknown' 
            })
            setAuthState({
              user: session.user,
              profile: null,
              loading: false,
              initialized: true
            })
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear session data securely
          sessionSecurity.clearSession()
          
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
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
      }
    }
  }, [])

  const refreshProfile = async () => {
    if (!authState.user || !validate.uuid(authState.user.id)) return

    try {
      // Validate session before refresh
      if (!sessionSecurity.validateSessionIntegrity()) {
        secureError.logSecurityEvent('session_invalid_on_refresh', { userId: authState.user.id })
        await signOut()
        return
      }
      
      const profile = await profilesApi.get(authState.user.id)
      setAuthState(prev => ({
        ...prev,
        profile
      }))
    } catch (error) {
      console.error('Error refreshing profile:', error)
      secureError.logSecurityEvent('profile_refresh_error', { 
        userId: authState.user.id,
        error: error instanceof Error ? error.message : 'Unknown' 
      })
    }
  }

  const signOut = async () => {
    try {
      const currentUser = authState.user
      
      // Log sign out event
      if (currentUser) {
        secureError.logSecurityEvent('user_signout', { userId: currentUser.id })
      }
      
      await supabase.auth.signOut()
      
      // Clear session data
      sessionSecurity.clearSession()
    } catch (error) {
      console.error('Error signing out:', error)
      secureError.logSecurityEvent('signout_error', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      })
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