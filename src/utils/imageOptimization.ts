/**
 * Image optimization utilities
 */

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  lazy?: boolean
}

/**
 * Optimize image URL for better performance
 */
export function optimizeImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
  if (!url) return ''
  
  const { width, height, quality = 80, format = 'webp' } = options
  
  // For external URLs (like Pexels), add optimization parameters
  if (url.includes('pexels.com')) {
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('auto', 'compress')
    params.set('cs', 'tinysrgb')
    params.set('fit', 'crop')
    
    return `${url}?${params.toString()}`
  }
  
  // For other external images, try to add basic optimization
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url)
      if (width) urlObj.searchParams.set('w', width.toString())
      if (height) urlObj.searchParams.set('h', height.toString())
      return urlObj.toString()
    } catch {
      return url
    }
  }
  
  return url
}

/**
 * Create responsive image srcset
 */
export function createResponsiveSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes
    .map(size => `${optimizeImageUrl(baseUrl, { width: size })} ${size}w`)
    .join(', ')
}

/**
 * Get optimal image sizes for different breakpoints
 */
export function getResponsiveSizes(): string {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src
          img.classList.remove('loading')
          observer.unobserve(img)
        }
      })
    }, {
      rootMargin: '50px'
    })
    
    observer.observe(img)
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src
  }
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Convert image to WebP format if supported
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  try {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg'
  } catch {
    return 'jpeg'
  }
}