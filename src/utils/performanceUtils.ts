// Performance utilities for mobile optimization
export interface PerformanceSettings {
  // Geometry settings
  planetGeometryDetail: number
  moonGeometryDetail: number
  orbitSegments: number
  
  // Visual effects
  enableAtmosphere: boolean
  enableRings: boolean
  enableMoonFeatures: boolean
  enableOrbitalLights: boolean
  enableStarfield: boolean
  starfieldCount: number
  
  // Rendering settings
  shadowMapSize: number
  enableShadows: boolean
  maxLights: number
  pixelRatio: number
  
  // Animation settings
  enableAnimations: boolean
  animationFrameRate: number
  
  // UI settings
  enableGlassEffects: boolean
  enableRippleEffects: boolean
  backdropBlurStrength: number
}

// Detect device type and capabilities
export const detectDeviceCapabilities = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent)
  
  // Detect performance level based on device and specs
  const memory = (navigator as any).deviceMemory || 4 // Fallback to 4GB
  const cores = navigator.hardwareConcurrency || 4
  const pixelRatio = window.devicePixelRatio || 1
  
  // Check WebGL capabilities
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  const renderer = gl ? gl.getParameter(gl.RENDERER) || '' : ''
  const vendor = gl ? gl.getParameter(gl.VENDOR) || '' : ''
  
  // Determine performance tier
  let performanceTier: 'low' | 'medium' | 'high' = 'medium'
  
  if (isMobile) {
    if (memory <= 2 || cores <= 2) {
      performanceTier = 'low'
    } else if (memory >= 6 && cores >= 6) {
      performanceTier = 'high'
    }
  } else {
    if (memory >= 8 && cores >= 8) {
      performanceTier = 'high'
    } else if (memory <= 4 || cores <= 4) {
      performanceTier = 'low'
    }
  }
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    isTablet,
    memory,
    cores,
    pixelRatio,
    renderer,
    vendor,
    performanceTier,
    supportsWebGL2: !!document.createElement('canvas').getContext('webgl2')
  }
}

// Get optimized performance settings based on device capabilities
export const getPerformanceSettings = (): PerformanceSettings => {
  const capabilities = detectDeviceCapabilities()
  
  // Base settings for different performance tiers
  const settings: Record<string, PerformanceSettings> = {
    low: {
      // Minimal geometry detail
      planetGeometryDetail: 16,
      moonGeometryDetail: 12,
      orbitSegments: 32,
      
      // Disable heavy visual effects
      enableAtmosphere: false,
      enableRings: true, // Keep rings but simplified
      enableMoonFeatures: false,
      enableOrbitalLights: false,
      enableStarfield: true,
      starfieldCount: 1000,
      
      // Minimal rendering quality
      shadowMapSize: 512,
      enableShadows: false,
      maxLights: 2,
      pixelRatio: Math.min(capabilities.pixelRatio, 1.5),
      
      // Reduced animations
      enableAnimations: true,
      animationFrameRate: 30,
      
      // Simplified UI
      enableGlassEffects: false,
      enableRippleEffects: false,
      backdropBlurStrength: 5,
    },
    
    medium: {
      // Moderate geometry detail
      planetGeometryDetail: 32,
      moonGeometryDetail: 20,
      orbitSegments: 64,
      
      // Some visual effects enabled
      enableAtmosphere: capabilities.isMobile ? false : true,
      enableRings: true,
      enableMoonFeatures: true,
      enableOrbitalLights: true,
      enableStarfield: true,
      starfieldCount: 3000,
      
      // Moderate rendering quality
      shadowMapSize: 1024,
      enableShadows: !capabilities.isMobile,
      maxLights: 4,
      pixelRatio: Math.min(capabilities.pixelRatio, 2),
      
      // Standard animations
      enableAnimations: true,
      animationFrameRate: 60,
      
      // Standard UI
      enableGlassEffects: !capabilities.isMobile,
      enableRippleEffects: !capabilities.isMobile,
      backdropBlurStrength: capabilities.isMobile ? 10 : 20,
    },
    
    high: {
      // High geometry detail
      planetGeometryDetail: 64,
      moonGeometryDetail: 32,
      orbitSegments: 128,
      
      // All visual effects enabled
      enableAtmosphere: true,
      enableRings: true,
      enableMoonFeatures: true,
      enableOrbitalLights: true,
      enableStarfield: true,
      starfieldCount: 5000,
      
      // High rendering quality
      shadowMapSize: 2048,
      enableShadows: true,
      maxLights: 8,
      pixelRatio: Math.min(capabilities.pixelRatio, 2),
      
      // Full animations
      enableAnimations: true,
      animationFrameRate: 60,
      
      // Full UI effects
      enableGlassEffects: true,
      enableRippleEffects: true,
      backdropBlurStrength: 25,
    }
  }
  
  return settings[capabilities.performanceTier]
}

// Memory management utilities
export const createMemoryMonitor = () => {
  let lastMemoryCheck = 0
  const memoryWarningThreshold = 0.8 // 80% of available memory
  
  return {
    checkMemoryUsage: () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedPercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        
        if (usedPercent > memoryWarningThreshold) {
          console.warn('High memory usage detected:', Math.round(usedPercent * 100) + '%')
          return { warning: true, usage: usedPercent }
        }
        
        return { warning: false, usage: usedPercent }
      }
      return { warning: false, usage: 0 }
    },
    
    triggerGarbageCollection: () => {
      // Force garbage collection if available (Chrome dev tools)
      if ('gc' in window) {
        (window as any).gc()
      }
    }
  }
}

// Performance monitoring
export const createPerformanceMonitor = () => {
  let frameCount = 0
  let lastTime = performance.now()
  let fps = 60
  
  return {
    update: () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
      }
      
      return fps
    },
    
    getFPS: () => fps,
    
    shouldReduceQuality: () => fps < 30,
    
    shouldIncreaseQuality: () => fps > 55
  }
}

// Disposal utilities for Three.js objects
export const disposeObject3D = (object: any) => {
  if (!object) return
  
  // Dispose geometry
  if (object.geometry) {
    object.geometry.dispose()
  }
  
  // Dispose material(s)
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach((material: any) => {
        disposeMaterial(material)
      })
    } else {
      disposeMaterial(object.material)
    }
  }
  
  // Dispose textures
  if (object.texture) {
    object.texture.dispose()
  }
  
  // Recursively dispose children
  if (object.children) {
    object.children.forEach((child: any) => {
      disposeObject3D(child)
    })
  }
}

const disposeMaterial = (material: any) => {
  if (!material) return
  
  // Dispose textures
  Object.keys(material).forEach(key => {
    const value = material[key]
    if (value && typeof value.dispose === 'function') {
      value.dispose()
    }
  })
  
  material.dispose()
}

// Throttle function for expensive operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Debounce function for resize events
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
} 