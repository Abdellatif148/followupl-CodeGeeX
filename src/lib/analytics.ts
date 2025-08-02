/**
 * Google Analytics (GA4) Integration
 * 
 * This module provides a centralized, type-safe way to track user interactions
 * and page views using Google Analytics 4. It includes privacy controls and
 * error handling for a production-ready analytics solution.
 * 
 * Features:
 * - Page view tracking
 * - Custom event tracking
 * - User behavior analytics
 * - Privacy-compliant tracking
 * - Error handling and fallbacks
 * - TypeScript support
 */

// Google Analytics Configuration
const GA_MEASUREMENT_ID = 'G-8PSN0Z7MMP'

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

/**
 * Analytics Event Types
 * Define all possible events for type safety and consistency
 */
export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

/**
 * User Properties for Analytics
 */
export interface UserProperties {
  user_id?: string
  user_type?: 'free' | 'pro' | 'super_pro'
  signup_method?: 'email' | 'google'
  language?: string
  currency?: string
}

/**
 * Page View Tracking Data
 */
export interface PageViewData {
  page_title?: string
  page_location?: string
  page_path?: string
  content_group1?: string // e.g., 'dashboard', 'clients', 'settings'
  content_group2?: string // e.g., 'authenticated', 'public'
}

/**
 * Analytics Service Class
 * Provides a clean, modular interface for all analytics operations
 */
class AnalyticsService {
  private isInitialized = false
  private isDevelopment = import.meta.env.DEV
  private isEnabled = true

  constructor() {
    this.initialize()
  }

  /**
   * Initialize Google Analytics
   * Sets up the analytics service and configures basic settings
   */
  private initialize(): void {
    try {
      // Skip initialization in development unless explicitly enabled
      if (this.isDevelopment && !import.meta.env.VITE_ENABLE_ANALYTICS) {
        console.log('📊 Analytics disabled in development mode')
        this.isEnabled = false
        return
      }

      // Check if gtag is available
      if (typeof window !== 'undefined' && window.gtag) {
        this.isInitialized = true
        console.log('📊 Google Analytics initialized successfully')
        
        // Set default configuration
        this.configureAnalytics()
      } else {
        console.warn('📊 Google Analytics not loaded')
      }
    } catch (error) {
      console.error('📊 Analytics initialization failed:', error)
      this.isEnabled = false
    }
  }

  /**
   * Configure Google Analytics with default settings
   */
  private configureAnalytics(): void {
    if (!this.isReady()) return

    try {
      window.gtag('config', GA_MEASUREMENT_ID, {
        // Privacy settings
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        
        // Performance settings
        send_page_view: false, // We'll handle page views manually
        
        // Custom settings
        custom_map: {
          dimension1: 'user_type',
          dimension2: 'signup_method',
          dimension3: 'language'
        }
      })
    } catch (error) {
      console.error('📊 Analytics configuration failed:', error)
    }
  }

  /**
   * Check if analytics is ready to use
   */
  private isReady(): boolean {
    return this.isEnabled && this.isInitialized && typeof window !== 'undefined' && window.gtag
  }

  /**
   * Track page views
   * Call this on route changes to track navigation
   */
  public trackPageView(data: PageViewData = {}): void {
    if (!this.isReady()) return

    try {
      const pageData = {
        page_title: data.page_title || document.title,
        page_location: data.page_location || window.location.href,
        page_path: data.page_path || window.location.pathname,
        content_group1: data.content_group1,
        content_group2: data.content_group2 || 'authenticated'
      }

      window.gtag('event', 'page_view', pageData)
      
      if (this.isDevelopment) {
        console.log('📊 Page view tracked:', pageData)
      }
    } catch (error) {
      console.error('📊 Page view tracking failed:', error)
    }
  }

  /**
   * Track custom events
   * Use this for user interactions, feature usage, etc.
   */
  public trackEvent(event: AnalyticsEvent): void {
    if (!this.isReady()) return

    try {
      const eventData = {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters
      }

      window.gtag('event', event.action, eventData)
      
      if (this.isDevelopment) {
        console.log('📊 Event tracked:', event.action, eventData)
      }
    } catch (error) {
      console.error('📊 Event tracking failed:', error)
    }
  }

  /**
   * Set user properties
   * Call this when user logs in or updates profile
   */
  public setUserProperties(properties: UserProperties): void {
    if (!this.isReady()) return

    try {
      // Set user ID for cross-device tracking
      if (properties.user_id) {
        window.gtag('config', GA_MEASUREMENT_ID, {
          user_id: properties.user_id
        })
      }

      // Set custom user properties
      window.gtag('set', {
        user_properties: {
          user_type: properties.user_type,
          signup_method: properties.signup_method,
          language: properties.language,
          currency: properties.currency
        }
      })

      if (this.isDevelopment) {
        console.log('📊 User properties set:', properties)
      }
    } catch (error) {
      console.error('📊 User properties setting failed:', error)
    }
  }

  /**
   * Track user authentication events
   */
  public trackAuth(action: 'login' | 'signup' | 'logout', method?: string): void {
    this.trackEvent({
      action,
      category: 'authentication',
      label: method,
      custom_parameters: {
        method: method || 'email'
      }
    })
  }

  /**
   * Track business-specific events
   */
  public trackBusiness(action: string, category: 'client' | 'invoice' | 'reminder' | 'expense', details?: Record<string, any>): void {
    this.trackEvent({
      action,
      category: `business_${category}`,
      custom_parameters: details
    })
  }

  /**
   * Track feature usage
   */
  public trackFeature(feature: string, action: string, details?: Record<string, any>): void {
    this.trackEvent({
      action,
      category: 'feature_usage',
      label: feature,
      custom_parameters: details
    })
  }

  /**
   * Track errors for debugging
   */
  public trackError(error: string, category: string = 'javascript_error'): void {
    this.trackEvent({
      action: 'error',
      category,
      label: error,
      custom_parameters: {
        error_message: error,
        page: window.location.pathname
      }
    })
  }

  /**
   * Enable/disable analytics (for privacy compliance)
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    
    if (!enabled && this.isReady()) {
      // Disable Google Analytics
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsService()

// Convenience functions for common tracking scenarios
export const trackPageView = (data?: PageViewData) => analytics.trackPageView(data)
export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event)
export const trackAuth = (action: 'login' | 'signup' | 'logout', method?: string) => analytics.trackAuth(action, method)
export const trackBusiness = (action: string, category: 'client' | 'invoice' | 'reminder' | 'expense', details?: Record<string, any>) => analytics.trackBusiness(action, category, details)
export const trackFeature = (feature: string, action: string, details?: Record<string, any>) => analytics.trackFeature(feature, action, details)
export const setUserProperties = (properties: UserProperties) => analytics.setUserProperties(properties)

// Export the main analytics service
export default analytics