/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  fcp?: number
  ttfb?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.metrics.lcp = lastEntry.startTime
          this.reportMetric('LCP', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
            this.reportMetric('FID', entry.processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cls = clsValue
          this.reportMetric('CLS', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (error) {
        console.warn('CLS observer not supported')
      }
    }
  }

  private reportMetric(name: string, value: number): void {
    // Report to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'performance',
        event_label: name,
        value: Math.round(value),
        custom_parameters: {
          metric_name: name,
          metric_value: value
        }
      })
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`📊 ${name}: ${value.toFixed(2)}ms`)
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Resource loading optimization
export class ResourceLoader {
  private loadedResources = new Set<string>()
  private loadingPromises = new Map<string, Promise<void>>()

  /**
   * Load script with caching and error handling
   */
  async loadScript(src: string, async: boolean = true): Promise<void> {
    if (this.loadedResources.has(src)) {
      return Promise.resolve()
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = async
      
      script.onload = () => {
        this.loadedResources.add(src)
        resolve()
      }
      
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`))
      }
      
      document.head.appendChild(script)
    })

    this.loadingPromises.set(src, promise)
    return promise
  }

  /**
   * Load CSS with caching
   */
  async loadCSS(href: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      
      link.onload = () => {
        this.loadedResources.add(href)
        resolve()
      }
      
      link.onerror = () => {
        reject(new Error(`Failed to load CSS: ${href}`))
      }
      
      document.head.appendChild(link)
    })
  }

  /**
   * Preload resource
   */
  preload(href: string, as: string): void {
    if (this.loadedResources.has(href)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  }
}

// Critical resource loading
export const criticalResources = {
  /**
   * Load critical CSS inline
   */
  loadCriticalCSS(): void {
    // This would contain critical above-the-fold CSS
    const criticalCSS = `
      .hero-section { min-height: 100vh; }
      .nav-bar { position: fixed; top: 0; width: 100%; z-index: 50; }
    `
    
    const style = document.createElement('style')
    style.textContent = criticalCSS
    document.head.appendChild(style)
  },

  /**
   * Defer non-critical resources
   */
  deferNonCriticalResources(): void {
    // Defer loading of non-critical scripts
    window.addEventListener('load', () => {
      // Load analytics after page load
      this.loadAnalytics()
      
      // Load other non-critical resources
      this.loadNonCriticalCSS()
    })
  },

  loadAnalytics(): void {
    const resourceLoader = new ResourceLoader()
    resourceLoader.loadScript('https://www.googletagmanager.com/gtag/js?id=G-8PSN0Z7MMP')
      .then(() => {
        // Analytics is loaded and ready
        console.log('📊 Analytics loaded successfully')
      })
      .catch(error => {
        console.warn('📊 Analytics failed to load:', error)
      })
  },

  loadNonCriticalCSS(): void {
    // Load non-critical CSS after page load
    const resourceLoader = new ResourceLoader()
    
    // Example: Load additional icon fonts or animations
    resourceLoader.loadCSS('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')
      .catch(error => {
        console.warn('Failed to load non-critical CSS:', error)
      })
  }
}

// Bundle size optimization
export const bundleOptimization = {
  /**
   * Lazy load components
   */
  createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> {
    return React.lazy(importFunc)
  },

  /**
   * Code splitting utility
   */
  async loadChunk(chunkName: string): Promise<any> {
    try {
      switch (chunkName) {
        case 'charts':
          return await import('../pages/ProgressCharts')
        case 'settings':
          return await import('../pages/Settings')
        default:
          throw new Error(`Unknown chunk: ${chunkName}`)
      }
    } catch (error) {
      console.error(`Failed to load chunk ${chunkName}:`, error)
      throw error
    }
  }
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor()
export const resourceLoader = new ResourceLoader()

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.destroy()
})

export default {
  performanceMonitor,
  resourceLoader,
  criticalResources,
  bundleOptimization
}