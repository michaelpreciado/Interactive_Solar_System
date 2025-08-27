// Performance utilities for mobile optimization targeting 120fps
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
  enableAntialiasing: boolean
  
  // Animation settings
  enableAnimations: boolean
  animationFrameRate: number
  targetFPS: number
  
  // UI settings
  enableGlassEffects: boolean
  enableRippleEffects: boolean
  backdropBlurStrength: number
  
  // Mobile-specific optimizations
  useInstancedRendering: boolean
  enableFrustumCulling: boolean
  enableLOD: boolean
  reducedPrecision: boolean
}

// Detect device type and capabilities with enhanced mobile detection
export const detectDeviceCapabilities = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent)
  
  // Enhanced device specs detection
  const memory = (navigator as any).deviceMemory || 4 // Fallback to 4GB
  const cores = navigator.hardwareConcurrency || 4
  const pixelRatio = window.devicePixelRatio || 1
  
  // Check WebGL capabilities and extensions
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null
  const renderer = gl ? gl.getParameter(gl.RENDERER) || '' : ''
  const vendor = gl ? gl.getParameter(gl.VENDOR) || '' : ''
  
  // Check for specific GPU capabilities
  const hasInstancedArrays = gl?.getExtension('ANGLE_instanced_arrays') || gl2
  const hasFloatTextures = gl?.getExtension('OES_texture_float') || gl2
  const hasHalfFloatTextures = gl?.getExtension('OES_texture_half_float') || gl2
  
  // Detect high refresh rate displays (120Hz+)
  const supportsHighRefreshRate = isIOS && (screen as any).maximumFramesPerSecond >= 120
  
  // More sophisticated performance tier detection
  let performanceTier: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
  
  if (isMobile) {
    // Mobile performance classification
    if (memory <= 2 || cores <= 4) {
      performanceTier = 'low'
    } else if (memory >= 8 && cores >= 8 && supportsHighRefreshRate) {
      performanceTier = 'ultra' // Latest flagship phones
    } else if (memory >= 6 && cores >= 6) {
      performanceTier = 'high'
    }
  } else {
    // Desktop performance classification
    if (memory >= 16 && cores >= 8) {
      performanceTier = 'ultra'
    } else if (memory >= 8 && cores >= 8) {
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
    supportsWebGL2: !!gl2,
    hasInstancedArrays: !!hasInstancedArrays,
    hasFloatTextures: !!hasFloatTextures,
    hasHalfFloatTextures: !!hasHalfFloatTextures,
    supportsHighRefreshRate,
    screenWidth: screen.width,
    screenHeight: screen.height
  }
}

// Get optimized performance settings based on device capabilities
export const getPerformanceSettings = (): PerformanceSettings => {
  const capabilities = detectDeviceCapabilities()
  
  // Base settings for different performance tiers targeting 120fps
  const settings: Record<string, PerformanceSettings> = {
    low: {
      // Minimal geometry detail
      planetGeometryDetail: 12,
      moonGeometryDetail: 8,
      orbitSegments: 24,
      
      // Disable heavy visual effects
      enableAtmosphere: false,
      enableRings: false,
      enableMoonFeatures: false,
      enableOrbitalLights: false,
      enableStarfield: true,
      starfieldCount: 500,
      
      // Minimal rendering quality
      shadowMapSize: 256,
      enableShadows: false,
      maxLights: 1,
      pixelRatio: Math.min(capabilities.pixelRatio, 1),
      enableAntialiasing: false,
      
      // Performance-focused animations
      enableAnimations: true,
      animationFrameRate: 60,
      targetFPS: 60,
      
      // Simplified UI
      enableGlassEffects: false,
      enableRippleEffects: false,
      backdropBlurStrength: 0,
      
      // Mobile optimizations
      useInstancedRendering: false,
      enableFrustumCulling: true,
      enableLOD: true,
      reducedPrecision: true,
    },
    
    medium: {
      // Moderate geometry detail
      planetGeometryDetail: 24,
      moonGeometryDetail: 16,
      orbitSegments: 48,
      
      // Some visual effects enabled
      enableAtmosphere: false, // Still disabled for performance
      enableRings: true,
      enableMoonFeatures: false,
      enableOrbitalLights: capabilities.isMobile ? false : true,
      enableStarfield: true,
      starfieldCount: capabilities.isMobile ? 1500 : 3000,
      
      // Moderate rendering quality
      shadowMapSize: capabilities.isMobile ? 512 : 1024,
      enableShadows: false, // Disabled for mobile performance
      maxLights: capabilities.isMobile ? 2 : 4,
      pixelRatio: Math.min(capabilities.pixelRatio, capabilities.isMobile ? 1.5 : 2),
      enableAntialiasing: !capabilities.isMobile,
      
      // Standard animations
      enableAnimations: true,
      animationFrameRate: capabilities.supportsHighRefreshRate ? 120 : 60,
      targetFPS: capabilities.supportsHighRefreshRate ? 120 : 60,
      
      // Standard UI
      enableGlassEffects: !capabilities.isMobile,
      enableRippleEffects: false, // Disabled for performance
      backdropBlurStrength: capabilities.isMobile ? 5 : 15,
      
      // Mobile optimizations
      useInstancedRendering: capabilities.hasInstancedArrays,
      enableFrustumCulling: true,
      enableLOD: true,
      reducedPrecision: capabilities.isMobile,
    },
    
    high: {
      // High geometry detail
      planetGeometryDetail: 48,
      moonGeometryDetail: 24,
      orbitSegments: 96,
      
      // More visual effects enabled
      enableAtmosphere: !capabilities.isMobile, // Still cautious on mobile
      enableRings: true,
      enableMoonFeatures: true,
      enableOrbitalLights: true,
      enableStarfield: true,
      starfieldCount: capabilities.isMobile ? 3000 : 5000,
      
      // High rendering quality
      shadowMapSize: capabilities.isMobile ? 1024 : 2048,
      enableShadows: !capabilities.isMobile, // Still disabled on mobile
      maxLights: capabilities.isMobile ? 4 : 8,
      pixelRatio: Math.min(capabilities.pixelRatio, capabilities.isMobile ? 2 : 2),
      enableAntialiasing: !capabilities.isMobile,
      
      // High-performance animations
      enableAnimations: true,
      animationFrameRate: capabilities.supportsHighRefreshRate ? 120 : 60,
      targetFPS: capabilities.supportsHighRefreshRate ? 120 : 60,
      
      // Enhanced UI
      enableGlassEffects: true,
      enableRippleEffects: !capabilities.isMobile,
      backdropBlurStrength: capabilities.isMobile ? 10 : 25,
      
      // Mobile optimizations
      useInstancedRendering: capabilities.hasInstancedArrays,
      enableFrustumCulling: true,
      enableLOD: true,
      reducedPrecision: false,
    },
    
    ultra: {
      // Ultra geometry detail for flagship devices
      planetGeometryDetail: capabilities.isMobile ? 32 : 64,
      moonGeometryDetail: capabilities.isMobile ? 20 : 32,
      orbitSegments: capabilities.isMobile ? 64 : 128,
      
      // All visual effects for ultra devices
      enableAtmosphere: true,
      enableRings: true,
      enableMoonFeatures: true,
      enableOrbitalLights: true,
      enableStarfield: true,
      starfieldCount: capabilities.isMobile ? 4000 : 8000,
      
      // Ultra rendering quality
      shadowMapSize: capabilities.isMobile ? 1024 : 4096,
      enableShadows: true, // Enabled for ultra tier
      maxLights: capabilities.isMobile ? 6 : 12,
      pixelRatio: Math.min(capabilities.pixelRatio, capabilities.isMobile ? 2 : 3),
      enableAntialiasing: true,
      
      // Maximum performance animations
      enableAnimations: true,
      animationFrameRate: capabilities.supportsHighRefreshRate ? 120 : 60,
      targetFPS: capabilities.supportsHighRefreshRate ? 120 : 60,
      
      // Full UI effects
      enableGlassEffects: true,
      enableRippleEffects: true,
      backdropBlurStrength: capabilities.isMobile ? 15 : 30,
      
      // All optimizations
      useInstancedRendering: capabilities.hasInstancedArrays,
      enableFrustumCulling: true,
      enableLOD: true,
      reducedPrecision: false,
    }
  }
  
  return settings[capabilities.performanceTier] || settings.medium
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

// Enhanced performance monitoring for 120fps targets
export const createPerformanceMonitor = (targetFPS: number = 60) => {
  let frameCount = 0
  let lastTime = performance.now()
  let fps = targetFPS
  let frameTimeHistory: number[] = []
  let lastFrameTime = performance.now()
  
  const maxHistoryLength = 60 // Keep last 60 frame times
  
  return {
    update: () => {
      frameCount++
      const currentTime = performance.now()
      
      // Track individual frame times for better analysis
      const frameTime = currentTime - lastFrameTime
      frameTimeHistory.push(frameTime)
      if (frameTimeHistory.length > maxHistoryLength) {
        frameTimeHistory.shift()
      }
      lastFrameTime = currentTime
      
      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
      }
      
      return fps
    },
    
    getFPS: () => fps,
    
    getAverageFrameTime: () => {
      if (frameTimeHistory.length === 0) return 16.67 // ~60fps default
      return frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length
    },
    
    getFrameTimeVariance: () => {
      if (frameTimeHistory.length < 2) return 0
      const avg = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length
      const variance = frameTimeHistory.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / frameTimeHistory.length
      return Math.sqrt(variance)
    },
    
    // More sophisticated quality adjustment based on target FPS
    shouldReduceQuality: () => {
      const threshold = targetFPS * 0.8 // 80% of target
      return fps < threshold || frameTimeHistory.some(time => time > (1000 / targetFPS) * 1.5)
    },
    
    shouldIncreaseQuality: () => {
      const threshold = targetFPS * 0.95 // 95% of target
      const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length
      return fps > threshold && avgFrameTime < (1000 / targetFPS) * 0.8
    },
    
    // Check if performance is stable
    isPerformanceStable: () => {
      if (frameTimeHistory.length < 30) return false
      const variance = frameTimeHistory.reduce((sum, time) => {
        const target = 1000 / targetFPS
        return sum + Math.abs(time - target)
      }, 0) / frameTimeHistory.length
      return variance < 2 // Stable if average deviation is less than 2ms
    }
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

// High-performance frame rate limiter for 120fps
export const createFrameRateLimiter = (targetFPS: number) => {
  const targetFrameTime = 1000 / targetFPS
  let lastFrameTime = 0
  
  return (callback: () => void) => {
    const currentTime = performance.now()
    const deltaTime = currentTime - lastFrameTime
    
    if (deltaTime >= targetFrameTime) {
      lastFrameTime = currentTime - (deltaTime % targetFrameTime)
      callback()
    }
  }
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

// Mobile-optimized WebGL context creation
export const createOptimizedWebGLContext = (canvas: HTMLCanvasElement, targetFPS: number = 60) => {
  const contextAttributes: WebGLContextAttributes = {
    alpha: false, // Better performance
    antialias: false, // Disable for mobile performance
    depth: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false,
    desynchronized: targetFPS > 60, // Enable for high refresh rate
  }
  
  const gl = canvas.getContext('webgl2', contextAttributes) || 
             canvas.getContext('webgl', contextAttributes)
  
  if (gl && targetFPS > 60) {
    // Request high refresh rate if supported
    try {
      (canvas as any).style.imageRendering = 'pixelated'
    } catch (e) {
      // Ignore if not supported
    }
  }
  
  return gl
}

// Debounce function for resize events
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// Mobile-specific performance utilities
export const mobileOptimizations = {
  // Reduce precision for mobile shaders
  getShaderPrecision: (isMobile: boolean, isLowEnd: boolean) => {
    if (isLowEnd) return 'lowp'
    return isMobile ? 'mediump' : 'highp'
  },
  
  // Optimize texture sizes for mobile
  getOptimalTextureSize: (originalSize: number, isMobile: boolean, performanceTier: string) => {
    if (!isMobile) return originalSize
    
    const maxSizes = {
      low: 512,
      medium: 1024,
      high: 2048,
      ultra: 2048
    }
    
    return Math.min(originalSize, maxSizes[performanceTier as keyof typeof maxSizes] || 1024)
  },
  
  // Battery and thermal management
  shouldReduceQualityForThermal: () => {
    // Check if device is getting warm (if supported)
    if ('getBattery' in navigator) {
      return (navigator as any).getBattery().then((battery: any) => {
        return battery.level < 0.2 // Reduce quality if battery is low
      })
    }
    return Promise.resolve(false)
  }
} 