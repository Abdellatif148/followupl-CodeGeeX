import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { profilesApi } from '../lib/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  initialized: boolean
  profile: any
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Load profile if user exists
          if (session?.user) {
            await loadProfile(session.user.id)
          }
          
          setLoading(false)
          setInitialized(true)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (event === 'SIGNED_IN' && session?.user) {
            await loadProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            setProfile(null)
            localStorage.removeItem('followuply-cached-profile')
            localStorage.removeItem('followuply-language-selected')
          }
          
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const profileData = await profilesApi.get(userId)
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      
      localStorage.removeItem('followuply-cached-profile')
      localStorage.removeItem('followuply-language-selected')
      
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        throw error
      }
      
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Refresh session error:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  const isAuthenticated = !!user && !!session

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated,
    initialized,
    profile,
    signOut,
    refreshSession,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}