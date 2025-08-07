/**
 * Secure Supabase client with enhanced security features
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { secureError, authSecurity, rateLimit } from './security'
import { ddosProtection } from './ddosProtection'

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

class SecureSupabaseClient {
  private client: SupabaseClient
  private requestCount = 0
  private lastReset = Date.now()

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // Use PKCE flow for enhanced security
      },
      global: {
        headers: {
          'X-Client-Info': 'followuply-web',
          'X-Client-Version': '1.0.0'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10 // Limit realtime events
        }
      }
    })

    this.setupSecurityInterceptors()
  }

  /**
   * Set up security interceptors for all requests
   */
  private setupSecurityInterceptors(): void {
    // Monitor auth state changes for security
    this.client.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            secureError.logSecurityEvent('user_signed_in', {
              userId: session.user.id,
              provider: session.user.app_metadata?.provider || 'email'
            })
          }
          break
        case 'SIGNED_OUT':
          secureError.logSecurityEvent('user_signed_out', {})
          break
        case 'TOKEN_REFRESHED':
          secureError.logSecurityEvent('token_refreshed', {})
          break
        case 'USER_UPDATED':
          secureError.logSecurityEvent('user_updated', {})
          break
      }
    })
  }

  /**
   * Secure wrapper for database operations
   */
  private async secureOperation<T>(
    operation: () => Promise<T>,
    operationType: string,
    resourceType?: string
  ): Promise<T> {
    // Check DDoS protection
    if (!ddosProtection.checkRequest(`supabase:${operationType}`)) {
      throw new Error('Rate limit exceeded. Please slow down.')
    }

    // Check authentication for protected operations
    if (['insert', 'update', 'delete'].includes(operationType)) {
      const { user, isValid } = await authSecurity.validateSession()
      if (!isValid) {
        throw new Error('Authentication required')
      }
    }

    try {
      const startTime = performance.now()
      const result = await operation()
      const endTime = performance.now()

      // Log slow queries
      if (endTime - startTime > 2000) {
        secureError.logSecurityEvent('slow_query_detected', {
          operation: operationType,
          duration: endTime - startTime,
          resourceType
        })
      }

      return result
    } catch (error) {
      secureError.logSecurityEvent('database_operation_failed', {
        operation: operationType,
        error: error instanceof Error ? error.message : 'Unknown',
        resourceType
      })
      throw error
    }
  }

  /**
   * Get the underlying Supabase client (for direct access when needed)
   */
  public getClient(): SupabaseClient {
    return this.client
  }

  /**
   * Secure auth operations
   */
  public get auth() {
    return {
      ...this.client.auth,
      
      // Override signUp with additional security
      signUp: async (credentials: any) => {
        // Rate limiting for sign up attempts
        if (!rateLimit.check('signup', 5, 300000)) { // 5 attempts per 5 minutes
          throw new Error('Too many signup attempts. Please try again later.')
        }

        return this.secureOperation(
          () => this.client.auth.signUp(credentials),
          'signup',
          'auth'
        )
      },

      // Override signIn with additional security
      signInWithPassword: async (credentials: any) => {
        // Rate limiting for sign in attempts
        if (!rateLimit.check(`signin:${credentials.email}`, 5, 300000)) { // 5 attempts per 5 minutes per email
          throw new Error('Too many login attempts. Please try again later.')
        }

        return this.secureOperation(
          () => this.client.auth.signInWithPassword(credentials),
          'signin',
          'auth'
        )
      },

      // Override OAuth with additional security
      signInWithOAuth: async (options: any) => {
        // Rate limiting for OAuth attempts
        if (!rateLimit.check('oauth', 10, 300000)) { // 10 attempts per 5 minutes
          throw new Error('Too many OAuth attempts. Please try again later.')
        }

        return this.secureOperation(
          () => this.client.auth.signInWithOAuth(options),
          'oauth',
          'auth'
        )
      }
    }
  }

  /**
   * Secure database operations
   */
  public from(table: string) {
    const originalFrom = this.client.from(table)

    return {
      ...originalFrom,
      
      // Override select with security checks
      select: (query?: string) => {
        const selectBuilder = originalFrom.select(query)
        
        return {
          ...selectBuilder,
          
          // Add security to execution
          then: (onfulfilled?: any, onrejected?: any) => {
            return this.secureOperation(
              () => selectBuilder,
              'select',
              table
            ).then(onfulfilled, onrejected)
          }
        }
      },

      // Override insert with security checks
      insert: (values: any) => {
        return this.secureOperation(
          () => originalFrom.insert(values),
          'insert',
          table
        )
      },

      // Override update with security checks
      update: (values: any) => {
        return this.secureOperation(
          () => originalFrom.update(values),
          'update',
          table
        )
      },

      // Override delete with security checks
      delete: () => {
        return this.secureOperation(
          () => originalFrom.delete(),
          'delete',
          table
        )
      }
    }
  }

  /**
   * Secure RPC calls
   */
  public rpc(fn: string, args?: any) {
    return this.secureOperation(
      () => this.client.rpc(fn, args),
      'rpc',
      fn
    )
  }

  /**
   * Get security metrics
   */
  public getSecurityMetrics() {
    return {
      requestCount: this.requestCount,
      lastReset: this.lastReset,
      rateLimitStatus: ddosProtection.getMetrics('supabase')
    }
  }
}

// Create secure client instance
export const secureSupabase = new SecureSupabaseClient()

// Export the original client for backward compatibility (but prefer secure client)
export const supabase = secureSupabase.getClient()

export default secureSupabase