/**
 * Security utilities and validation functions
 * Provides comprehensive security measures for the application
 */

import { supabase } from './supabase'

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Input sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize HTML content to prevent XSS
   */
  html(input: string): string {
    if (!input) return ''
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  /**
   * Sanitize SQL input (though we use Supabase client which handles this)
   */
  sql(input: string): string {
    if (!input) return ''
    
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
  },

  /**
   * Sanitize email input
   */
  email(input: string): string {
    if (!input) return ''
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '')
  },

  /**
   * Sanitize phone number
   */
  phone(input: string): string {
    if (!input) return ''
    
    return input.replace(/[^0-9+\-\(\)\s]/g, '')
  },

  /**
   * Sanitize general text input
   */
  text(input: string): string {
    if (!input) return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000) // Limit length
  }
}

/**
 * Input validation utilities
 */
export const validate = {
  /**
   * Validate email format
   */
  email(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email) && email.length <= 254
  },

  /**
   * Validate password strength
   */
  password(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate UUID format
   */
  uuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  },

  /**
   * Validate amount (currency)
   */
  amount(amount: string | number): boolean {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return !isNaN(num) && num >= 0 && num <= 999999999.99
  },

  /**
   * Validate date format
   */
  date(date: string): boolean {
    const dateObj = new Date(date)
    return dateObj instanceof Date && !isNaN(dateObj.getTime())
  },

  /**
   * Validate text length
   */
  textLength(text: string, min: number = 0, max: number = 1000): boolean {
    return text.length >= min && text.length <= max
  }
}

/**
 * Rate limiting utilities
 */
export const rateLimit = {
  /**
   * Check if action is rate limited
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= limit) {
      return false
    }
    
    record.count++
    return true
  },

  /**
   * Get rate limit key for user actions
   */
  getUserKey(userId: string, action: string): string {
    return `user:${userId}:${action}`
  },

  /**
   * Get rate limit key for IP-based actions
   */
  getIpKey(ip: string, action: string): string {
    return `ip:${ip}:${action}`
  }
}

/**
 * Authentication security utilities
 */
export const authSecurity = {
  /**
   * Validate user session and permissions
   */
  async validateSession(): Promise<{ user: any; isValid: boolean }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return { user: null, isValid: false }
      }
      
      // Additional session validation
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        return { user: null, isValid: false }
      }
      
      return { user, isValid: true }
    } catch (error) {
      console.error('Session validation error:', error)
      return { user: null, isValid: false }
    }
  },

  /**
   * Check if user has permission for resource
   */
  async hasPermission(userId: string, resourceId: string, resourceType: 'client' | 'invoice' | 'reminder' | 'expense'): Promise<boolean> {
    try {
      if (!validate.uuid(userId) || !validate.uuid(resourceId)) {
        return false
      }
      
      const tableName = resourceType === 'client' ? 'clients' : 
                       resourceType === 'invoice' ? 'invoices' :
                       resourceType === 'reminder' ? 'reminders' : 'expenses'
      
      const { data, error } = await supabase
        .from(tableName)
        .select('user_id')
        .eq('id', resourceId)
        .single()
      
      if (error || !data) return false
      
      return data.user_id === userId
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  },

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

/**
 * Content Security Policy utilities
 */
export const csp = {
  /**
   * Generate CSP header value
   */
  generateHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
}

/**
 * Error handling security
 */
export const secureError = {
  /**
   * Sanitize error messages for client display
   */
  sanitizeMessage(error: any): string {
    // Never expose internal details in production
    if (import.meta.env.PROD) {
      // Generic messages for production
      if (error?.code === 'PGRST116') return 'Resource not found'
      if (error?.code === '23505') return 'This item already exists'
      if (error?.code === '42501') return 'Access denied'
      return 'An error occurred. Please try again.'
    }
    
    // More detailed messages in development
    return error?.message || 'An unknown error occurred'
  },

  /**
   * Log security events
   */
  logSecurityEvent(event: string, details: any, userId?: string): void {
    const logData = {
      event,
      details: import.meta.env.PROD ? 'redacted' : details,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    console.warn('🔒 Security Event:', logData)
    
    // In production, send to monitoring service
    if (import.meta.env.PROD && window.gtag) {
      window.gtag('event', 'security_event', {
        event_category: 'security',
        event_label: event,
        custom_parameters: {
          user_id: userId
        }
      })
    }
  }
}

/**
 * Data encryption utilities (for sensitive local storage)
 */
export const encryption = {
  /**
   * Simple encryption for local storage (not for production secrets)
   */
  encrypt(text: string, key: string): string {
    try {
      // Simple XOR encryption for demo purposes
      // In production, use proper encryption libraries
      let result = ''
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return btoa(result)
    } catch (error) {
      console.error('Encryption error:', error)
      return text
    }
  },

  /**
   * Simple decryption for local storage
   */
  decrypt(encryptedText: string, key: string): string {
    try {
      const text = atob(encryptedText)
      let result = ''
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }
      return result
    } catch (error) {
      console.error('Decryption error:', error)
      return encryptedText
    }
  }
}

/**
 * Security headers for API requests
 */
export const securityHeaders = {
  /**
   * Get security headers for API requests
   */
  getHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': csp.generateHeader()
    }
  }
}

/**
 * Audit logging for security events
 */
export const auditLog = {
  /**
   * Log user actions for security auditing
   */
  async logAction(action: string, resourceType: string, resourceId?: string, details?: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      // In a real app, you'd store this in an audit_logs table
      const logEntry = {
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: import.meta.env.PROD ? 'redacted' : details,
        timestamp: new Date().toISOString(),
        ip_address: 'unknown', // Would be captured server-side
        user_agent: navigator.userAgent
      }
      
      console.log('📋 Audit Log:', logEntry)
      
      // Track in analytics
      if (window.gtag) {
        window.gtag('event', 'user_action', {
          event_category: 'audit',
          event_label: action,
          custom_parameters: {
            resource_type: resourceType,
            user_id: user.id
          }
        })
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }
}

/**
 * Security middleware for API calls
 */
export const securityMiddleware = {
  /**
   * Wrap API calls with security checks
   */
  async secureApiCall<T>(
    operation: () => Promise<T>,
    options: {
      requireAuth?: boolean
      rateLimit?: { key: string; limit: number; windowMs: number }
      validateInput?: (input: any) => boolean
      auditLog?: { action: string; resourceType: string }
    } = {}
  ): Promise<T> {
    const { requireAuth = true, rateLimit: rateLimitConfig, validateInput, auditLog: auditConfig } = options
    
    // Authentication check
    if (requireAuth) {
      const { isValid } = await authSecurity.validateSession()
      if (!isValid) {
        throw new Error('Authentication required')
      }
    }
    
    // Rate limiting
    if (rateLimitConfig) {
      const { key, limit, windowMs } = rateLimitConfig
      if (!rateLimit.check(key, limit, windowMs)) {
        secureError.logSecurityEvent('rate_limit_exceeded', { key, limit })
        throw new Error('Rate limit exceeded. Please try again later.')
      }
    }
    
    // Input validation
    if (validateInput && !validateInput(arguments)) {
      secureError.logSecurityEvent('invalid_input', { operation: operation.name })
      throw new Error('Invalid input provided')
    }
    
    try {
      const result = await operation()
      
      // Audit logging
      if (auditConfig) {
        await auditLog.logAction(auditConfig.action, auditConfig.resourceType)
      }
      
      return result
    } catch (error) {
      secureError.logSecurityEvent('api_error', { 
        operation: operation.name, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }
}

/**
 * CSRF protection utilities
 */
export const csrf = {
  /**
   * Generate CSRF token
   */
  generateToken(): string {
    return authSecurity.generateSecureToken(32)
  },

  /**
   * Validate CSRF token
   */
  validateToken(token: string, expectedToken: string): boolean {
    return token === expectedToken && token.length === 64
  },

  /**
   * Get CSRF token from session storage
   */
  getToken(): string {
    let token = sessionStorage.getItem('csrf_token')
    if (!token) {
      token = this.generateToken()
      sessionStorage.setItem('csrf_token', token)
    }
    return token
  }
}

/**
 * Session security utilities
 */
export const sessionSecurity = {
  /**
   * Check for session hijacking indicators
   */
  validateSessionIntegrity(): boolean {
    try {
      const storedFingerprint = sessionStorage.getItem('session_fingerprint')
      const currentFingerprint = this.generateFingerprint()
      
      if (!storedFingerprint) {
        sessionStorage.setItem('session_fingerprint', currentFingerprint)
        return true
      }
      
      return storedFingerprint === currentFingerprint
    } catch (error) {
      console.error('Session integrity check failed:', error)
      return false
    }
  },

  /**
   * Generate browser fingerprint for session validation
   */
  generateFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('fingerprint', 10, 10)
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')
    
    return btoa(fingerprint).substring(0, 32)
  },

  /**
   * Clear all session data securely
   */
  clearSession(): void {
    try {
      sessionStorage.clear()
      localStorage.removeItem('supabase.auth.token')
      
      // Clear any cached sensitive data
      const sensitiveKeys = [
        'followuply-cached-profile',
        'followuply-temp-data'
      ]
      
      sensitiveKeys.forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Session clearing error:', error)
    }
  }
}

/**
 * Content validation for user-generated content
 */
export const contentSecurity = {
  /**
   * Validate and sanitize user content
   */
  validateContent(content: string, type: 'text' | 'html' | 'markdown'): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = []
    let sanitized = content
    
    // Length validation
    if (content.length > 10000) {
      errors.push('Content too long (max 10,000 characters)')
      sanitized = content.substring(0, 10000)
    }
    
    // Sanitize based on type
    switch (type) {
      case 'html':
        sanitized = sanitize.html(sanitized)
        break
      case 'text':
        sanitized = sanitize.text(sanitized)
        break
      case 'markdown':
        // Basic markdown sanitization
        sanitized = sanitized
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
        break
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i
    ]
    
    if (suspiciousPatterns.some(pattern => pattern.test(content))) {
      errors.push('Content contains potentially harmful code')
      secureError.logSecurityEvent('suspicious_content', { content: content.substring(0, 100) })
    }
    
    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    }
  }
}

/**
 * Database security utilities
 */
export const dbSecurity = {
  /**
   * Validate database query parameters
   */
  validateQueryParams(params: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(params)) {
      // Check for SQL injection patterns
      if (typeof value === 'string') {
        const sqlPatterns = [
          /union\s+select/i,
          /drop\s+table/i,
          /delete\s+from/i,
          /insert\s+into/i,
          /update\s+set/i,
          /exec\s*\(/i,
          /script\s*>/i
        ]
        
        if (sqlPatterns.some(pattern => pattern.test(value))) {
          secureError.logSecurityEvent('sql_injection_attempt', { key, value: value.substring(0, 50) })
          return false
        }
      }
    }
    
    return true
  }
}

/**
 * File upload security
 */
export const fileSecurity = {
  /**
   * Validate file upload
   */
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // File size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB')
    }
    
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed')
    }
    
    // File name validation
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('Invalid file name')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Export all security utilities
 */
export default {
  sanitize,
  validate,
  rateLimit,
  authSecurity,
  csp,
  secureError,
  sessionSecurity,
  contentSecurity,
  dbSecurity,
  fileSecurity,
  securityMiddleware,
  csrf,
  encryption,
  auditLog
}