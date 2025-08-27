import React, { useEffect, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useUIStore } from '../stores/useUIStore'
import { createPerformanceMonitor, mobileOptimizations } from '../utils/performanceUtils'

interface QualityLevel {
  name: string
  planetDetail: number
  starfieldCount: number
  enableEffects: boolean
  shadowMapSize: number
  pixelRatio: number
  enableShadows: boolean
  maxLights: number
}

const QUALITY_LEVELS: QualityLevel[] = [
  {
    name: 'ultra-low',
    planetDetail: 8,
    starfieldCount: 250,
    enableEffects: false,
    shadowMapSize: 256,
    pixelRatio: 0.75,
    enableShadows: false,
    maxLights: 1
  },
  {
    name: 'low',
    planetDetail: 12,
    starfieldCount: 500,
    enableEffects: false,
    shadowMapSize: 256,
    pixelRatio: 1,
    enableShadows: false,
    maxLights: 1
  },
  {
    name: 'medium',
    planetDetail: 24,
    starfieldCount: 1500,
    enableEffects: true,
    shadowMapSize: 512,
    pixelRatio: 1.5,
    enableShadows: false,
    maxLights: 2
  },
  {
    name: 'high',
    planetDetail: 32,
    starfieldCount: 3000,
    enableEffects: true,
    shadowMapSize: 1024,
    pixelRatio: 2,
    enableShadows: true,
    maxLights: 4
  },
  {
    name: 'ultra',
    planetDetail: 48,
    starfieldCount: 5000,
    enableEffects: true,
    shadowMapSize: 2048,
    pixelRatio: 2,
    enableShadows: true,
    maxLights: 6
  }
]

export const AdaptiveQualityManager: React.FC = () => {
  const { 
    performanceSettings, 
    updatePerformanceSettings, 
    deviceCapabilities,
    performanceMode,
    updateFPS,
    currentFPS
  } = useUIStore()
  
  const performanceMonitor = useRef(createPerformanceMonitor(performanceSettings.targetFPS))
  const currentQualityIndex = useRef(2) // Start at medium
  const lastAdjustmentTime = useRef(0)
  const stabilityCheckCount = useRef(0)
  const thermalCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const emergencyModeActive = useRef(false)
  
  // Minimum time between quality adjustments (in milliseconds)
  const ADJUSTMENT_COOLDOWN = 3000
  const STABILITY_REQUIRED_FRAMES = 120 // 2 seconds at 60fps
  const EMERGENCY_FPS_THRESHOLD = 15
  const TARGET_FPS_THRESHOLD = performanceSettings.targetFPS * 0.85
  
  // Initialize quality based on device capabilities
  useEffect(() => {
    const initialQuality = () => {
      switch (deviceCapabilities.performanceTier) {\n        case 'low': return 1\n        case 'medium': return 2\n        case 'high': return 3\n        case 'ultra': return 4\n        default: return 2\n      }\n    }\n    \n    currentQualityIndex.current = initialQuality()\n    applyQualityLevel(currentQualityIndex.current)\n  }, [deviceCapabilities.performanceTier])\n  \n  // Apply quality level settings\n  const applyQualityLevel = useCallback((qualityIndex: number) => {\n    const quality = QUALITY_LEVELS[qualityIndex]\n    if (!quality) return\n    \n    const newSettings = {\n      planetGeometryDetail: quality.planetDetail,\n      starfieldCount: quality.starfieldCount,\n      enableAtmosphere: quality.enableEffects && !deviceCapabilities.isMobile,\n      enableRings: quality.enableEffects,\n      shadowMapSize: quality.shadowMapSize,\n      pixelRatio: Math.min(quality.pixelRatio, deviceCapabilities.pixelRatio),\n      enableShadows: quality.enableShadows && !deviceCapabilities.isMobile,\n      maxLights: quality.maxLights\n    }\n    \n    updatePerformanceSettings(newSettings)\n    \n    // Log quality change for debugging\n    console.log(`Quality adjusted to: ${quality.name}`, {\n      fps: currentFPS,\n      settings: newSettings,\n      emergencyMode: emergencyModeActive.current\n    })\n  }, [updatePerformanceSettings, deviceCapabilities, currentFPS])\n  \n  // Emergency performance mode for very low FPS\n  const activateEmergencyMode = useCallback(() => {\n    if (emergencyModeActive.current) return\n    \n    emergencyModeActive.current = true\n    console.warn('Emergency performance mode activated!')\n    \n    updatePerformanceSettings({\n      planetGeometryDetail: 6,\n      starfieldCount: 100,\n      enableAtmosphere: false,\n      enableRings: false,\n      enableShadows: false,\n      shadowMapSize: 128,\n      pixelRatio: 0.5,\n      maxLights: 1,\n      enableAnimations: false\n    })\n    \n    // Force garbage collection if available\n    if (typeof window.gc === 'function') {\n      window.gc()\n    }\n  }, [updatePerformanceSettings])\n  \n  // Deactivate emergency mode when performance improves\n  const deactivateEmergencyMode = useCallback(() => {\n    if (!emergencyModeActive.current) return\n    \n    emergencyModeActive.current = false\n    console.log('Emergency performance mode deactivated')\n    \n    // Return to appropriate quality level\n    currentQualityIndex.current = Math.max(0, currentQualityIndex.current - 1)\n    applyQualityLevel(currentQualityIndex.current)\n  }, [applyQualityLevel])\n  \n  // Thermal throttling check\n  const checkThermalThrottling = useCallback(async () => {\n    try {\n      const shouldReduce = await mobileOptimizations.shouldReduceQualityForThermal()\n      if (shouldReduce && currentQualityIndex.current > 0) {\n        console.log('Reducing quality due to thermal concerns')\n        currentQualityIndex.current = Math.max(0, currentQualityIndex.current - 1)\n        applyQualityLevel(currentQualityIndex.current)\n      }\n    } catch (error) {\n      // Ignore thermal check errors\n    }\n  }, [applyQualityLevel])\n  \n  // Set up thermal monitoring for mobile devices\n  useEffect(() => {\n    if (!deviceCapabilities.isMobile) return\n    \n    thermalCheckInterval.current = setInterval(checkThermalThrottling, 30000) // Check every 30 seconds\n    \n    return () => {\n      if (thermalCheckInterval.current) {\n        clearInterval(thermalCheckInterval.current)\n      }\n    }\n  }, [deviceCapabilities.isMobile, checkThermalThrottling])\n  \n  // Main performance monitoring and adjustment logic\n  useFrame(() => {\n    // Skip if performance mode is not auto\n    if (performanceMode !== 'auto') return\n    \n    const currentTime = performance.now()\n    const fps = performanceMonitor.current.update()\n    updateFPS(fps)\n    \n    // Emergency mode activation\n    if (fps < EMERGENCY_FPS_THRESHOLD && !emergencyModeActive.current) {\n      activateEmergencyMode()\n      return\n    }\n    \n    // Emergency mode deactivation\n    if (fps > TARGET_FPS_THRESHOLD && emergencyModeActive.current) {\n      deactivateEmergencyMode()\n      return\n    }\n    \n    // Skip if in emergency mode or too soon since last adjustment\n    if (emergencyModeActive.current || currentTime - lastAdjustmentTime.current < ADJUSTMENT_COOLDOWN) {\n      return\n    }\n    \n    const monitor = performanceMonitor.current\n    const shouldReduce = monitor.shouldReduceQuality()\n    const shouldIncrease = monitor.shouldIncreaseQuality()\n    const isStable = monitor.isPerformanceStable()\n    \n    // Performance degradation detected\n    if (shouldReduce && currentQualityIndex.current > 0) {\n      if (isStable) {\n        stabilityCheckCount.current++\n        \n        // Require multiple stable frames before reducing quality\n        if (stabilityCheckCount.current >= STABILITY_REQUIRED_FRAMES / 4) {\n          currentQualityIndex.current--\n          applyQualityLevel(currentQualityIndex.current)\n          lastAdjustmentTime.current = currentTime\n          stabilityCheckCount.current = 0\n        }\n      } else {\n        stabilityCheckCount.current = 0\n      }\n    }\n    // Performance improvement detected\n    else if (shouldIncrease && currentQualityIndex.current < QUALITY_LEVELS.length - 1) {\n      if (isStable) {\n        stabilityCheckCount.current++\n        \n        // Require more stable frames before increasing quality\n        if (stabilityCheckCount.current >= STABILITY_REQUIRED_FRAMES) {\n          currentQualityIndex.current++\n          applyQualityLevel(currentQualityIndex.current)\n          lastAdjustmentTime.current = currentTime\n          stabilityCheckCount.current = 0\n        }\n      } else {\n        stabilityCheckCount.current = 0\n      }\n    }\n    // Reset stability counter if no adjustment needed\n    else if (isStable) {\n      stabilityCheckCount.current = 0\n    }\n  })\n  \n  // Monitor memory usage and trigger GC if needed\n  useEffect(() => {\n    if (!deviceCapabilities.isMobile) return\n    \n    const memoryCheckInterval = setInterval(() => {\n      if ('memory' in performance) {\n        const memory = (performance as any).memory\n        const usagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit\n        \n        // If memory usage is high, try to reduce quality\n        if (usagePercent > 0.85 && currentQualityIndex.current > 0) {\n          console.warn('High memory usage detected, reducing quality')\n          currentQualityIndex.current = Math.max(0, currentQualityIndex.current - 1)\n          applyQualityLevel(currentQualityIndex.current)\n          \n          // Force garbage collection if available\n          if (typeof window.gc === 'function') {\n            window.gc()\n          }\n        }\n      }\n    }, 10000) // Check every 10 seconds\n    \n    return () => clearInterval(memoryCheckInterval)\n  }, [deviceCapabilities.isMobile, applyQualityLevel])\n  \n  // Visibility change optimization\n  useEffect(() => {\n    const handleVisibilityChange = () => {\n      if (document.hidden) {\n        // Reduce quality when tab is not visible\n        updatePerformanceSettings({\n          animationFrameRate: 15,\n          enableAnimations: false\n        })\n      } else {\n        // Restore settings when tab becomes visible\n        updatePerformanceSettings({\n          animationFrameRate: performanceSettings.targetFPS,\n          enableAnimations: true\n        })\n      }\n    }\n    \n    document.addEventListener('visibilitychange', handleVisibilityChange)\n    \n    return () => {\n      document.removeEventListener('visibilitychange', handleVisibilityChange)\n    }\n  }, [updatePerformanceSettings, performanceSettings.targetFPS])\n  \n  return null\n}\n\n// Debug component to display performance metrics\nexport const PerformanceDebugOverlay: React.FC<{ visible?: boolean }> = ({ visible = false }) => {\n  const { currentFPS, performanceSettings, deviceCapabilities } = useUIStore()\n  \n  if (!visible || !deviceCapabilities.isMobile) return null\n  \n  return (\n    <div className=\"fixed top-20 right-2 z-50 bg-black bg-opacity-50 text-white p-2 rounded text-xs font-mono\">\n      <div>FPS: {currentFPS}</div>\n      <div>Target: {performanceSettings.targetFPS}</div>\n      <div>Planet Detail: {performanceSettings.planetGeometryDetail}</div>\n      <div>Stars: {performanceSettings.starfieldCount}</div>\n      <div>Pixel Ratio: {performanceSettings.pixelRatio.toFixed(1)}</div>\n      <div>Memory: {typeof window !== 'undefined' && 'memory' in performance \n        ? `${Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024))}MB`\n        : 'N/A'\n      }</div>\n    </div>\n  )\n}