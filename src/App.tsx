import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { SolarSystem } from './components/SolarSystem'
import { ControlPanel } from './components/ControlPanel'
import { TimeScrubber } from './components/TimeScrubber'
import { PlanetInfo } from './components/PlanetInfo'
import { EducationalDashboard } from './components/EducationalDashboard'
import { FactDisplay } from './components/FactDisplay'
import { QuizDisplay } from './components/QuizDisplay'
import { LessonPlayer } from './components/LessonPlayer'
import { PlanetComparison } from './components/PlanetComparison'
import { useUIStore, useReducedMotionDetector, usePerformanceMonitor } from './stores/useUIStore'
import { useEducationStore } from './stores/useEducationStore'
import { useTimeStore } from './stores/useTimeStore'
import { getPlanetPositions } from './utils/planetaryCalculations'
import { createMemoryMonitor, throttle, debounce } from './utils/performanceUtils'

// Loading component with performance considerations
const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-space-dark flex items-center justify-center z-50">
    <div className="liquid-glass-panel text-center">
      <div className="animate-spin w-8 h-8 border-2 border-cosmic-purple border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-white">Loading Solar System...</p>
    </div>
  </div>
)

function App() {
  const { 
    selectedPlanet, 
    scaleMode, 
    performanceSettings, 
    deviceCapabilities,
    setDevicePixelRatio 
  } = useUIStore()
  
  const { currentTime } = useTimeStore()
  
  // Educational state
  const { showComparison } = useEducationStore()
  
  // Local state for educational UI
  const [showEducationalDashboard, setShowEducationalDashboard] = useState(false)
  
  // Initialize performance hooks
  useReducedMotionDetector()
  usePerformanceMonitor()
  
  // Memory monitoring
  const memoryMonitor = useMemo(() => createMemoryMonitor(), [])
  
  // Throttled memory check for performance
  const checkMemory = useMemo(
    () => throttle(() => {
      const result = memoryMonitor.checkMemoryUsage()
      if (result.warning) {
        console.warn('High memory usage detected, consider reducing quality settings')
      }
    }, 5000),
    [memoryMonitor]
  )
  
  // Debounced resize handler
  const handleResize = useMemo(
    () => debounce(() => {
      setDevicePixelRatio(window.devicePixelRatio)
    }, 300),
    [setDevicePixelRatio]
  )
  
  // Performance monitoring and optimization
  useEffect(() => {
    // Set up memory monitoring
    const memoryInterval = setInterval(checkMemory, 10000) // Check every 10 seconds
    
    // Set up resize listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      clearInterval(memoryInterval)
      window.removeEventListener('resize', handleResize)
    }
  }, [checkMemory, handleResize])
  
  // Calculate planet positions with performance considerations
  const planets = useMemo(() => {
    return getPlanetPositions(currentTime, scaleMode)
  }, [currentTime, scaleMode])
  
  // Find the selected planet data
  const selectedPlanetData = useMemo(() => {
    if (!selectedPlanet) return null
    return planets.find(planet => planet.name.toLowerCase() === selectedPlanet.toLowerCase()) || null
  }, [selectedPlanet, planets])

  // Camera settings optimized for mobile
  const cameraSettings = useMemo(() => ({
    position: [50, 50, 50] as [number, number, number],
    fov: deviceCapabilities.isMobile ? 60 : 75,
    near: 0.1,
    far: scaleMode === 'realistic' ? 10000 : scaleMode === 'logarithmic' ? 5000 : 2000
  }), [deviceCapabilities.isMobile, scaleMode])

  // Canvas configuration optimized for device capabilities
  const canvasConfig = useMemo(() => ({
    dpr: deviceCapabilities.pixelRatio,
    antialias: !deviceCapabilities.isMobile, // Disable antialiasing on mobile for performance
    alpha: false, // Better performance
    powerPreference: 'high-performance' as WebGLPowerPreference,
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: false, // Better performance
    premultipliedAlpha: false,
    depth: true,
    stencil: false,
    shadows: performanceSettings.enableShadows
  }), [deviceCapabilities.pixelRatio, deviceCapabilities.isMobile, performanceSettings.enableShadows])

  // Controls configuration
  const controlsConfig = useMemo(() => {
    const baseDistance = scaleMode === 'realistic' ? 2000 : scaleMode === 'logarithmic' ? 1000 : 500
    return {
      enablePan: true,
      enableZoom: true,
      enableRotate: true,
      zoomSpeed: deviceCapabilities.isMobile ? 0.3 : 0.6,
      panSpeed: deviceCapabilities.isMobile ? 0.3 : 0.8,
      rotateSpeed: deviceCapabilities.isMobile ? 0.3 : 0.5,
      minDistance: 5,
      maxDistance: baseDistance,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      enableDamping: true,
      dampingFactor: 0.05,
      touches: {
        ONE: 2, // TOUCH.ROTATE
        TWO: 1  // TOUCH.DOLLY_PAN
      }
    }
  }, [scaleMode, deviceCapabilities.isMobile])

  // Stars configuration based on performance
  const starsConfig = useMemo(() => {
    if (!performanceSettings.enableStarfield) return null
    
    return {
      radius: scaleMode === 'realistic' ? 1500 : scaleMode === 'logarithmic' ? 1000 : 600,
      depth: 100,
      count: performanceSettings.starfieldCount,
      factor: 4,
      saturation: 0,
      fade: true,
      speed: 0.5
    }
  }, [performanceSettings.enableStarfield, performanceSettings.starfieldCount, scaleMode])

  return (
    <div className="w-full h-screen bg-space-dark overflow-hidden">
      {/* Main Canvas */}
      <Canvas
        camera={cameraSettings}
        {...canvasConfig}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Lighting optimized for mobile */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            castShadow={performanceSettings.enableShadows}
            shadow-mapSize-width={performanceSettings.shadowMapSize}
            shadow-mapSize-height={performanceSettings.shadowMapSize}
          />
          
          {/* Starfield */}
          {starsConfig && (
            <Stars
              radius={starsConfig.radius}
              depth={starsConfig.depth}
              count={starsConfig.count}
              factor={starsConfig.factor}
              saturation={starsConfig.saturation}
              fade={starsConfig.fade}
              speed={starsConfig.speed}
            />
          )}
          
          {/* Solar System */}
          <SolarSystem planets={planets} />
          
          {/* Camera Controls */}
          <OrbitControls {...controlsConfig} />
        </Suspense>
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Control Panel */}
        <div className="absolute top-2 left-2 pointer-events-auto">
          <ControlPanel />
        </div>
        
        {/* Educational Dashboard Button */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <button
            onClick={() => setShowEducationalDashboard(true)}
            className="liquid-glass-button-compact px-3 py-1 text-xs"
          >
            🎓 Learning Center
          </button>
        </div>
        
        {/* Time Scrubber */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-auto">
          <TimeScrubber />
        </div>
        
        {/* Planet Info */}
        {selectedPlanetData && (
          <div className="absolute top-2 right-2 pointer-events-auto">
            <PlanetInfo planet={selectedPlanetData} />
          </div>
        )}
      </div>
      
      {/* Educational Components */}
      <EducationalDashboard
        isOpen={showEducationalDashboard}
        onClose={() => setShowEducationalDashboard(false)}
      />
      
      <PlanetComparison
        isOpen={showComparison}
        onClose={() => {/* Close comparison logic */}}
      />
      
      <FactDisplay />
      <QuizDisplay />
      <LessonPlayer />
      
      {/* Loading Fallback */}
      <Suspense fallback={<LoadingSpinner />}>
        <div />
      </Suspense>
    </div>
  )
}

export default App 