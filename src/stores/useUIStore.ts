import { create } from 'zustand'
import React from 'react'
import { getPerformanceSettings, detectDeviceCapabilities, PerformanceSettings } from '../utils/performanceUtils'

export interface UIState {
  // Selected planet for info display
  selectedPlanet: string | null
  
  // Whether the time scrubber is visible
  showTimeScrubber: boolean
  
  // Whether orbit lines are visible
  showOrbits: boolean
  
  // Whether planet labels are visible
  showLabels: boolean
  
  // Whether the help menu is open
  showHelp: boolean
  
  // Whether reduced motion is preferred
  prefersReducedMotion: boolean
  
  // Device pixel ratio for performance optimization
  devicePixelRatio: number
  
  // Scale mode for planetary distances
  scaleMode: 'compressed' | 'realistic' | 'logarithmic'
  
  // Performance settings
  performanceSettings: PerformanceSettings
  deviceCapabilities: ReturnType<typeof detectDeviceCapabilities>
  
  // Touch gesture state
  touchState: {
    isGesturing: boolean
    gestureType: 'rotate' | 'zoom' | 'pan' | null
  }
  
  // Performance monitoring
  currentFPS: number
  performanceMode: 'auto' | 'low' | 'medium' | 'high'
  
  // Actions
  setSelectedPlanet: (planet: string | null) => void
  setShowTimeScrubber: (show: boolean) => void
  setShowOrbits: (show: boolean) => void
  setShowLabels: (show: boolean) => void
  setShowHelp: (show: boolean) => void
  setPrefersReducedMotion: (prefers: boolean) => void
  setDevicePixelRatio: (ratio: number) => void
  setScaleMode: (mode: 'compressed' | 'realistic' | 'logarithmic') => void
  setTouchState: (state: { isGesturing: boolean; gestureType: 'rotate' | 'zoom' | 'pan' | null }) => void
  updatePerformanceSettings: (settings: Partial<PerformanceSettings>) => void
  setPerformanceMode: (mode: 'auto' | 'low' | 'medium' | 'high') => void
  updateFPS: (fps: number) => void
  toggleOrbits: () => void
  toggleLabels: () => void
  toggleScaleMode: () => void
}

// Initialize device capabilities and performance settings
const deviceCapabilities = detectDeviceCapabilities()
const initialPerformanceSettings = getPerformanceSettings()

export const useUIStore = create<UIState>((set, get) => ({
  selectedPlanet: null,
  showTimeScrubber: true,
  showOrbits: true,
  showLabels: true,
  showHelp: false,
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  devicePixelRatio: Math.min(window.devicePixelRatio, initialPerformanceSettings.pixelRatio),
  scaleMode: 'compressed',
  performanceSettings: initialPerformanceSettings,
  deviceCapabilities,
  touchState: {
    isGesturing: false,
    gestureType: null,
  },
  currentFPS: 60,
  performanceMode: 'auto',
  
  setSelectedPlanet: (planet: string | null) => {
    set({ selectedPlanet: planet })
  },
  
  setShowTimeScrubber: (show: boolean) => {
    set({ showTimeScrubber: show })
  },
  
  setShowOrbits: (show: boolean) => {
    set({ showOrbits: show })
  },
  
  setShowLabels: (show: boolean) => {
    set({ showLabels: show })
  },
  
  setShowHelp: (show: boolean) => {
    set({ showHelp: show })
  },
  
  setPrefersReducedMotion: (prefers: boolean) => {
    set({ prefersReducedMotion: prefers })
  },
  
  setDevicePixelRatio: (ratio: number) => {
    const { performanceSettings } = get()
    set({ devicePixelRatio: Math.min(ratio, performanceSettings.pixelRatio) })
  },
  
  setScaleMode: (mode: 'compressed' | 'realistic' | 'logarithmic') => {
    set({ scaleMode: mode })
  },
  
  setTouchState: (state) => {
    set({ touchState: state })
  },
  
  updatePerformanceSettings: (newSettings: Partial<PerformanceSettings>) => {
    set((state) => ({
      performanceSettings: { ...state.performanceSettings, ...newSettings }
    }))
  },
  
  setPerformanceMode: (mode: 'auto' | 'low' | 'medium' | 'high') => {
    set({ performanceMode: mode })
    
    // Update performance settings based on mode
    if (mode !== 'auto') {
      const tierMapping = {
        low: { ...initialPerformanceSettings, planetGeometryDetail: 16, enableShadows: false },
        medium: { ...initialPerformanceSettings, planetGeometryDetail: 32 },
        high: { ...initialPerformanceSettings, planetGeometryDetail: 64, enableShadows: true }
      }
      
      set({ performanceSettings: tierMapping[mode] })
    }
  },
  
  updateFPS: (fps: number) => {
    set({ currentFPS: fps })
    
    // Auto-adjust performance based on FPS (only in auto mode)
    const { performanceMode, performanceSettings } = get()
    if (performanceMode === 'auto') {
      if (fps < 25 && performanceSettings.planetGeometryDetail > 16) {
        // Reduce quality
        set((state) => ({
          performanceSettings: {
            ...state.performanceSettings,
            planetGeometryDetail: Math.max(16, state.performanceSettings.planetGeometryDetail - 8),
            enableShadows: false,
            starfieldCount: Math.max(1000, state.performanceSettings.starfieldCount - 1000)
          }
        }))
      } else if (fps > 55 && performanceSettings.planetGeometryDetail < 64) {
        // Increase quality gradually
        set((state) => ({
          performanceSettings: {
            ...state.performanceSettings,
            planetGeometryDetail: Math.min(64, state.performanceSettings.planetGeometryDetail + 4),
            starfieldCount: Math.min(5000, state.performanceSettings.starfieldCount + 500)
          }
        }))
      }
    }
  },
  
  toggleOrbits: () => {
    set((state) => ({ showOrbits: !state.showOrbits }))
  },
  
  toggleLabels: () => {
    set((state) => ({ showLabels: !state.showLabels }))
  },
  
  toggleScaleMode: () => {
    const { scaleMode } = get()
    const modes: Array<'compressed' | 'realistic' | 'logarithmic'> = ['compressed', 'realistic', 'logarithmic']
    const currentIndex = modes.indexOf(scaleMode)
    const nextIndex = (currentIndex + 1) % modes.length
    set({ scaleMode: modes[nextIndex] })
  },
}))

// Hook to detect reduced motion preference changes
export const useReducedMotionDetector = () => {
  const setPrefersReducedMotion = useUIStore((state) => state.setPrefersReducedMotion)
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [setPrefersReducedMotion])
}

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const updateFPS = useUIStore((state) => state.updateFPS)
  
  React.useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number
    
    const updateFrameRate = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        updateFPS(fps)
        frameCount = 0
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(updateFrameRate)
    }
    
    animationId = requestAnimationFrame(updateFrameRate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [updateFPS])
} 