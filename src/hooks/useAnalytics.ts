/**
 * Analytics React Hook
 * 
 * Custom hook that provides analytics functionality to React components.
 * Handles page view tracking, user events, and provides a clean interface
 * for components to interact with Google Analytics.
 * 
 * Features:
 * - Automatic page view tracking on route changes
 * - Component-level event tracking
 * - User property management
 * - Privacy controls
 * - Error handling
 */

import { useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics, trackPageView, trackEvent, setUserProperties } from '../lib/analytics'
import type { AnalyticsEvent, UserProperties, PageViewData } from '../lib/analytics'

/**
 * Analytics Hook Configuration
 */
interface UseAnalyticsConfig {
  trackPageViews?: boolean
  trackUserInteractions?: boolean
  enableDebugMode?: boolean
}

/**
 * Analytics Hook Return Type
 */
interface UseAnalyticsReturn {
  trackEvent: (event: AnalyticsEvent) => void
  trackPageView: (data?: PageViewData) => void
  setUserProperties: (properties: UserProperties) => void
  trackClick: (elementName: string, category?: string) => void
  trackFormSubmit: (formName: string, success?: boolean) => void
  trackFeatureUsage: (feature: string, action: string) => void
  trackBusinessAction: (action: string, type: 'client' | 'invoice' | 'reminder', details?: Record<string, any>) => void
}

/**
 * Main Analytics Hook
 * 
 * @param config - Configuration options for the hook
 * @returns Analytics tracking functions
 */
export function useAnalytics(config: UseAnalyticsConfig = {}): UseAnalyticsReturn {
  const location = useLocation()
  const previousPath = useRef<string>('')
  
  const {
    trackPageViews = true,
    trackUserInteractions = true,
    enableDebugMode = false
  } = config

  /**
   * Track page views automatically on route changes
   */
  useEffect(() => {
    if (!trackPageViews) return

    // Skip if same page (prevents duplicate tracking)
    if (previousPath.current === location.pathname) return
    
    // Determine content group based on path
    const getContentGroup = (path: string): string => {
      if (path.startsWith('/dashboard')) return 'dashboard'
      if (path.startsWith('/clients')) return 'clients'
      if (path.startsWith('/reminders')) return 'reminders'
      if (path.startsWith('/invoices')) return 'invoices'
      if (path.startsWith('/settings')) return 'settings'
      if (path === '/login' || path === '/signup') return 'auth'
      return 'other'
    }

    // Track the page view
    trackPageView({
      page_path: location.pathname,
      page_location: window.location.href,
      content_group1: getContentGroup(location.pathname),
      content_group2: location.pathname.includes('/login') || location.pathname.includes('/signup') ? 'public' : 'authenticated'
    })

    // Update previous path
    previousPath.current = location.pathname

    if (enableDebugMode) {
      console.log('📊 Page view tracked:', location.pathname)
    }
  }, [location.pathname, trackPageViews, enableDebugMode])

  /**
   * Track custom events with error handling
   */
  const handleTrackEvent = useCallback((event: AnalyticsEvent) => {
    try {
      trackEvent(event)
      
      if (enableDebugMode) {
        console.log('📊 Event tracked:', event)
      }
    } catch (error) {
      console.error('📊 Event tracking failed:', error)
    }
  }, [enableDebugMode])

  /**
   * Track page views manually
   */
  const handleTrackPageView = useCallback((data?: PageViewData) => {
    try {
      trackPageView(data)
      
      if (enableDebugMode) {
        console.log('📊 Manual page view tracked:', data)
      }
    } catch (error) {
      console.error('📊 Page view tracking failed:', error)
    }
  }, [enableDebugMode])

  /**
   * Set user properties with error handling
   */
  const handleSetUserProperties = useCallback((properties: UserProperties) => {
    try {
      setUserProperties(properties)
      
      if (enableDebugMode) {
        console.log('📊 User properties set:', properties)
      }
    } catch (error) {
      console.error('📊 User properties setting failed:', error)
    }
  }, [enableDebugMode])

  /**
   * Track click events
   */
  const trackClick = useCallback((elementName: string, category: string = 'ui_interaction') => {
    if (!trackUserInteractions) return

    handleTrackEvent({
      action: 'click',
      category,
      label: elementName,
      custom_parameters: {
        element_name: elementName,
        page: location.pathname
      }
    })
  }, [handleTrackEvent, location.pathname, trackUserInteractions])

  /**
   * Track form submissions
   */
  const trackFormSubmit = useCallback((formName: string, success: boolean = true) => {
    if (!trackUserInteractions) return

    handleTrackEvent({
      action: success ? 'form_submit_success' : 'form_submit_error',
      category: 'form_interaction',
      label: formName,
      custom_parameters: {
        form_name: formName,
        success,
        page: location.pathname
      }
    })
  }, [handleTrackEvent, location.pathname, trackUserInteractions])

  /**
   * Track feature usage
   */
  const trackFeatureUsage = useCallback((feature: string, action: string) => {
    handleTrackEvent({
      action,
      category: 'feature_usage',
      label: feature,
      custom_parameters: {
        feature_name: feature,
        page: location.pathname
      }
    })
  }, [handleTrackEvent, location.pathname])

  /**
   * Track business-specific actions
   */
  const trackBusinessAction = useCallback((
    action: string, 
    type: 'client' | 'invoice' | 'reminder' | 'expense', 
    details?: Record<string, any>
  ) => {
    handleTrackEvent({
      action,
      category: `business_${type}`,
      custom_parameters: {
        business_type: type,
        page: location.pathname,
        ...details
      }
    })
  }, [handleTrackEvent, location.pathname])

  return {
    trackEvent: handleTrackEvent,
    trackPageView: handleTrackPageView,
    setUserProperties: handleSetUserProperties,
    trackClick,
    trackFormSubmit,
    trackFeatureUsage,
    trackBusinessAction
  }
}

/**
 * Specialized hooks for specific use cases
 */

/**
 * Hook for authentication-related analytics
 */
export function useAuthAnalytics() {
  const { trackEvent, setUserProperties } = useAnalytics()

  const trackLogin = useCallback((method: string = 'email') => {
    trackEvent({
      action: 'login',
      category: 'authentication',
      label: method,
      custom_parameters: { method }
    })
  }, [trackEvent])

  const trackSignup = useCallback((method: string = 'email') => {
    trackEvent({
      action: 'signup',
      category: 'authentication',
      label: method,
      custom_parameters: { method }
    })
  }, [trackEvent])

  const trackLogout = useCallback(() => {
    trackEvent({
      action: 'logout',
      category: 'authentication'
    })
  }, [trackEvent])

  const setUserProfile = useCallback((userId: string, userType: 'free' | 'pro' | 'super_pro', signupMethod?: string) => {
    setUserProperties({
      user_id: userId,
      user_type: userType,
      signup_method: signupMethod
    })
  }, [setUserProperties])

  return {
    trackLogin,
    trackSignup,
    trackLogout,
    setUserProfile
  }
}

/**
 * Hook for business analytics (clients, invoices, reminders)
 */
export function useBusinessAnalytics() {
  const { trackBusinessAction } = useAnalytics()

  const trackClientAction = useCallback((action: string, details?: Record<string, any>) => {
    trackBusinessAction(action, 'client', details)
  }, [trackBusinessAction])

  const trackInvoiceAction = useCallback((action: string, details?: Record<string, any>) => {
    trackBusinessAction(action, 'invoice', details)
  }, [trackBusinessAction])

  const trackReminderAction = useCallback((action: string, details?: Record<string, any>) => {
    trackBusinessAction(action, 'reminder', details)
  }, [trackBusinessAction])

  const trackExpenseAction = useCallback((action: string, details?: Record<string, any>) => {
    trackBusinessAction(action, 'expense', details)
  }, [trackBusinessAction])

  return {
    trackClientAction,
    trackInvoiceAction,
    trackReminderAction,
    trackExpenseAction
  }
}

export default useAnalytics