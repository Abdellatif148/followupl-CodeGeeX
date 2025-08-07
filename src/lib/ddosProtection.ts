/**
 * DDoS Protection and Traffic Management
 * Client-side protection mechanisms and monitoring
 */

interface TrafficMetrics {
  requestCount: number
  lastReset: number
  suspiciousActivity: boolean
  blockedUntil?: number
}

class DDoSProtection {
  private metrics: Map<string, TrafficMetrics> = new Map()
  private readonly MAX_REQUESTS_PER_MINUTE = 60
  private readonly MAX_REQUESTS_PER_HOUR = 1000
  private readonly SUSPICIOUS_THRESHOLD = 100
  private readonly BLOCK_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Check if request should be allowed
   */
  public checkRequest(identifier: string = 'global'): boolean {
    const now = Date.now()
    const metrics = this.getMetrics(identifier)

    // Check if currently blocked
    if (metrics.blockedUntil && now < metrics.blockedUntil) {
      this.logSecurityEvent('ddos_blocked_request', { identifier })
      return false
    }

    // Reset metrics if window expired
    if (now - metrics.lastReset > 60000) { // 1 minute window
      metrics.requestCount = 0
      metrics.lastReset = now
      metrics.suspiciousActivity = false
      metrics.blockedUntil = undefined
    }

    // Increment request count
    metrics.requestCount++

    // Check for suspicious activity
    if (metrics.requestCount > this.SUSPICIOUS_THRESHOLD) {
      metrics.suspiciousActivity = true
      this.logSecurityEvent('ddos_suspicious_activity', { 
        identifier, 
        requestCount: metrics.requestCount 
      })
    }

    // Block if limit exceeded
    if (metrics.requestCount > this.MAX_REQUESTS_PER_MINUTE) {
      metrics.blockedUntil = now + this.BLOCK_DURATION
      this.logSecurityEvent('ddos_rate_limit_exceeded', { 
        identifier, 
        requestCount: metrics.requestCount 
      })
      return false
    }

    return true
  }

  /**
   * Get or create metrics for identifier
   */
  private getMetrics(identifier: string): TrafficMetrics {
    if (!this.metrics.has(identifier)) {
      this.metrics.set(identifier, {
        requestCount: 0,
        lastReset: Date.now(),
        suspiciousActivity: false
      })
    }
    return this.metrics.get(identifier)!
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, details: any): void {
    console.warn(`🛡️ DDoS Protection: ${event}`, details)
    
    // Track in analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'security_event', {
        event_category: 'ddos_protection',
        event_label: event,
        custom_parameters: details
      })
    }
  }

  /**
   * Get current metrics for monitoring
   */
  public getMetrics(identifier: string = 'global'): TrafficMetrics {
    return this.metrics.get(identifier) || {
      requestCount: 0,
      lastReset: Date.now(),
      suspiciousActivity: false
    }
  }

  /**
   * Reset metrics for identifier
   */
  public resetMetrics(identifier: string): void {
    this.metrics.delete(identifier)
  }

  /**
   * Check if identifier is currently blocked
   */
  public isBlocked(identifier: string = 'global'): boolean {
    const metrics = this.getMetrics(identifier)
    return !!(metrics.blockedUntil && Date.now() < metrics.blockedUntil)
  }

  /**
   * Get remaining block time
   */
  public getBlockTimeRemaining(identifier: string = 'global'): number {
    const metrics = this.getMetrics(identifier)
    if (!metrics.blockedUntil) return 0
    return Math.max(0, metrics.blockedUntil - Date.now())
  }
}

// Create singleton instance
export const ddosProtection = new DDoSProtection()

/**
 * Request interceptor for API calls
 */
export const secureApiCall = async <T>(
  apiCall: () => Promise<T>,
  identifier?: string
): Promise<T> => {
  const requestId = identifier || 'api_call'
  
  // Check DDoS protection
  if (!ddosProtection.checkRequest(requestId)) {
    const blockTime = ddosProtection.getBlockTimeRemaining(requestId)
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(blockTime / 1000)} seconds.`)
  }

  try {
    return await apiCall()
  } catch (error) {
    // Log failed requests for monitoring
    console.error('API call failed:', error)
    throw error
  }
}

/**
 * Network monitoring utilities
 */
export const networkMonitor = {
  /**
   * Monitor network requests for suspicious patterns
   */
  monitorRequest(url: string, method: string, responseTime: number): void {
    // Log slow requests (potential DoS indicator)
    if (responseTime > 5000) {
      console.warn('🐌 Slow request detected:', { url, method, responseTime })
    }

    // Monitor for rapid requests to same endpoint
    const key = `${method}:${url}`
    if (!ddosProtection.checkRequest(key)) {
      console.warn('🚫 Rapid requests to same endpoint:', { url, method })
    }
  },

  /**
   * Check connection quality
   */
  checkConnectionQuality(): Promise<{ latency: number; bandwidth: number }> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const testImage = new Image()
      
      testImage.onload = () => {
        const latency = performance.now() - startTime
        resolve({ latency, bandwidth: 0 }) // Simplified for demo
      }
      
      testImage.onerror = () => {
        resolve({ latency: 9999, bandwidth: 0 })
      }
      
      // Use a small image for testing
      testImage.src = '/favicon-32x32.png?' + Date.now()
    })
  }
}

/**
 * Client-side circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open - service temporarily unavailable')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
      console.warn('🔌 Circuit breaker opened due to repeated failures')
    }
  }

  public getState(): string {
    return this.state
  }
}

// Create circuit breaker instances for different services
export const apiCircuitBreaker = new CircuitBreaker(5, 30000)
export const authCircuitBreaker = new CircuitBreaker(3, 60000)

export default ddosProtection