/**
 * Secure authentication hook with enhanced security features
 */

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { profilesApi } from '../lib/database'
import { authSecurity, sessionSecurity, secureError, auditLog } from '../lib/security'
import type { Profile } from '../types/database'

interface SecureAuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  sessionValid: boolean
  lastActivity: number
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000 // 1 minute

export function useSecureAuth() {
  const [authState, setAuthState] = useState<SecureAuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    sessionValid: false,
    lastActivity: Date.now()
  })

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      lastActivity: Date.now()
    }))
  }, [])

  // Validate session integrity
  const validateSession = useCallback(async () => {
    try {
      // Check session fingerprint
      if (!sessionSecurity.validateSessionIntegrity()) {
        secureError.logSecurityEvent('session_hijacking_detected', {})
        await signOut()
        return false
      }

      // Check Supabase session
      const { user, isValid } = await authSecurity.validateSession()
      
      if (!isValid) {
        setAuthState(prev => ({
          ...prev,
          user: null,
          profile: null,
          sessionValid: false
        }))
        return false
      }

      // Check session timeout
      const now = Date.now()
      if (now - authState.lastActivity > SESSION_TIMEOUT) {
        secureError.logSecurityEvent('session_timeout', { userId: user?.id })
        await signOut()
        return false
      }

      setAuthState(prev => ({
        ...prev,
        sessionValid: true
      }))

      return true
    } catch (error) {
      console.error('Session validation error:', error)
      return false
    }
  }, [authState.lastActivity])

  // Secure sign out
  const signOut = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log sign out event
      if (user) {
        await auditLog.logAction('sign_out', 'auth', user.id)
      }

      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear all session data
      sessionSecurity.clearSession()
      
      // Update state
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        sessionValid: false,
        lastActivity: Date.now()
      })
    } catch (error) {
      console.error('Secure sign out error:', error)
      secureError.logSecurityEvent('sign_out_error', { error: error instanceof Error ? error.message : 'Unknown' })
    }
  }, [])

  // Initialize authentication
  useEffect(() => {
    let mounted = true
    let activityTimer: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        // Validate session integrity first
        if (!sessionSecurity.validateSessionIntegrity()) {
          secureError.logSecurityEvent('session_integrity_failed', {})
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              initialized: true,
              sessionValid: false,
              lastActivity: Date.now()
            })
          }
          return
        }

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              initialized: true,
              sessionValid: false,
              lastActivity: Date.now()
            })
          }
          return
        }

        if (session?.user && mounted) {
          // Validate session
          const { user, isValid } = await authSecurity.validateSession()
          
          if (!isValid) {
            await signOut()
            return
          }

          // Load user profile
          const profile = await profilesApi.get(session.user.id)
          
          // Log successful authentication
          await auditLog.logAction('session_validated', 'auth', session.user.id)
          
          setAuthState({
            user: session.user,
            profile,
            loading: false,
            initialized: true,
            sessionValid: true,
            lastActivity: Date.now()
          })
        } else if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
            sessionValid: false,
            lastActivity: Date.now()
          })
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        secureError.logSecurityEvent('auth_initialization_error', { error: error instanceof Error ? error.message : 'Unknown' })
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
            sessionValid: false,
            lastActivity: Date.now()
          })
        }
      }
    }

    // Set up activity monitoring
    const setupActivityMonitoring = () => {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      
      const handleActivity = () => {
        updateActivity()
      }

      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true })
      })

      // Periodic session validation
      activityTimer = setInterval(validateSession, ACTIVITY_CHECK_INTERVAL)

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity)
        })
        if (activityTimer) {
          clearInterval(activityTimer)
        }
      }
    }

    initializeAuth()
    const cleanupActivity = setupActivityMonitoring()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Validate new session
            const { user, isValid } = await authSecurity.validateSession()
            
            if (!isValid) {
              await signOut()
              return
            }

            // Load or create user profile
            let profile = await profilesApi.get(session.user.id)
            
            if (!profile) {
              profile = await profilesApi.create({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                email: session.user.email || '',
                plan: 'free',
                currency: 'USD',
                language: 'en'
              })
            }

            // Log sign in event
            await auditLog.logAction('sign_in', 'auth', session.user.id, {
              provider: session.user.app_metadata?.provider || 'email'
            })

            setAuthState({
              user: session.user,
              profile,
              loading: false,
              initialized: true,
              sessionValid: true,
              lastActivity: Date.now()
            })
          } catch (error) {
            console.error('Error handling sign in:', error)
            secureError.logSecurityEvent('sign_in_error', { error: error instanceof Error ? error.message : 'Unknown' })
            setAuthState({
              user: session.user,
              profile: null,
              loading: false,
              initialized: true,
              sessionValid: false,
              lastActivity: Date.now()
            })
          }
        } else if (event === 'SIGNED_OUT') {
          sessionSecurity.clearSession()
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true,
            sessionValid: false,
            lastActivity: Date.now()
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      cleanupActivity()
      if (activityTimer) {
        clearInterval(activityTimer)
      }
    }
  }, [updateActivity, validateSession, signOut])

  // Refresh profile with security checks
  const refreshProfile = useCallback(async () => {
    if (!authState.user || !authState.sessionValid) return

    try {
      // Validate session before refresh
      const isValid = await validateSession()
      if (!isValid) return

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
  }, [authState.user, authState.sessionValid, validateSession])

  // Check if user has permission for resource
  const hasPermission = useCallback(async (resourceId: string, resourceType: 'client' | 'invoice' | 'reminder' | 'expense'): Promise<boolean> => {
    if (!authState.user || !authState.sessionValid) return false

    try {
      return await authSecurity.hasPermission(authState.user.id, resourceId, resourceType)
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }, [authState.user, authState.sessionValid])

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    initialized: authState.initialized,
    sessionValid: authState.sessionValid,
    lastActivity: authState.lastActivity,
    refreshProfile,
    signOut,
    hasPermission,
    validateSession,
    updateActivity
  }
}