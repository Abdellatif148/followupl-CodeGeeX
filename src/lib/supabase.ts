import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { secureError } from './security'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Validate environment variables format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL format')
}

if (supabaseAnonKey.length < 100) {
  throw new Error('Invalid Supabase anonymous key format')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'X-Client-Info': 'followuply-web',
      'X-Client-Version': '1.0.0',
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Add global error handler
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any cached data
    localStorage.removeItem('followuply-cached-profile')
  }
  
  if (event === 'TOKEN_REFRESHED') {
    secureError.logSecurityEvent('token_refreshed', { userId: session?.user?.id })
  }
})

export default supabase