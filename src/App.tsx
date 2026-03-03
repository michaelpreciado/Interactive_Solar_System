import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { SolarSystem } from './components/SolarSystem';
import { ControlPanel } from './components/ControlPanel';
import { TimeScrubber } from './components/TimeScrubber';
import { PlanetInfo } from './components/PlanetInfo';
import { EducationalDashboard } from './components/EducationalDashboard';
import { FactDisplay } from './components/FactDisplay';
import { QuizDisplay } from './components/QuizDisplay';
import { LessonPlayer } from './components/LessonPlayer';
import { PlanetComparison } from './components/PlanetComparison';
import {
  useUIStore,
  useReducedMotionDetector,
  usePerformanceMonitor,
} from './stores/useUIStore';
import { useEducationStore } from './stores/useEducationStore';
import { useTimeStore } from './stores/useTimeStore';
import { getPlanetPositions } from './utils/planetaryCalculations';
import {
  createMemoryMonitor,
  throttle,
  debounce,
} from './utils/performanceUtils';
import { logger } from './utils/logger';

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xl">
    <div className="lg-island text-center p-8 animate-lg-scale-in">
      <div className="loading-spinner mx-auto mb-6"></div>
      <h3 className="text-white font-bold text-lg mb-2">
        Loading Solar System
      </h3>
      <p className="text-gray-400 text-sm">Preparing your cosmic journey...</p>
      <div className="mt-6 space-y-3">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text w-3/4 mx-auto"></div>
      </div>
    </div>
  </div>
);

function App() {
  const {
    selectedPlanet,
    scaleMode,
    performanceSettings,
    deviceCapabilities,
    prefersReducedMotion,
    setDevicePixelRatio,
  } = useUIStore();

  const { currentTime } = useTimeStore();

  const { showComparison, clearComparison } = useEducationStore();

  const [showEducationalDashboard, setShowEducationalDashboard] =
    useState(false);

  useReducedMotionDetector();
  usePerformanceMonitor();

  const memoryMonitor = useMemo(() => createMemoryMonitor(), []);

  const checkMemory = useMemo(
    () =>
      throttle(() => {
        const result = memoryMonitor.checkMemoryUsage();
        if (result.warning) {
          logger.warn(
            'High memory usage detected; consider reducing quality settings.',
            { usage: result.usage }
          );
        }
      }, 5000),
    [memoryMonitor]
  );

  const handleResize = useMemo(
    () =>
      debounce(() => {
        setDevicePixelRatio(window.devicePixelRatio);
      }, 300),
    [setDevicePixelRatio]
  );

  useEffect(() => {
    const memoryInterval = setInterval(checkMemory, 10000);
    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(memoryInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkMemory, handleResize]);

  const planets = useMemo(() => {
    return getPlanetPositions(currentTime, scaleMode);
  }, [currentTime, scaleMode]);

  const selectedPlanetData = useMemo(() => {
    if (!selectedPlanet) return null;
    return (
      planets.find(
        (planet) => planet.name.toLowerCase() === selectedPlanet.toLowerCase()
      ) || null
    );
  }, [selectedPlanet, planets]);

  const cameraSettings = useMemo(
    () => ({
      position: [50, 50, 50] as [number, number, number],
      fov: deviceCapabilities.isMobile ? 60 : 75,
      near: 0.1,
      far:
        scaleMode === 'realistic'
          ? 10000
          : scaleMode === 'logarithmic'
            ? 5000
            : 2000,
    }),
    [deviceCapabilities.isMobile, scaleMode]
  );

  const canvasConfig = useMemo(
    () => ({
      dpr: deviceCapabilities.pixelRatio,
      antialias: !deviceCapabilities.isMobile,
      alpha: false,
      powerPreference: 'high-performance' as WebGLPowerPreference,
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
      depth: true,
      stencil: false,
      shadows: performanceSettings.enableShadows,
    }),
    [
      deviceCapabilities.pixelRatio,
      deviceCapabilities.isMobile,
      performanceSettings.enableShadows,
    ]
  );

  const controlsConfig = useMemo(() => {
    const baseDistance =
      scaleMode === 'realistic'
        ? 2000
        : scaleMode === 'logarithmic'
          ? 1000
          : 500;
    return {
      enablePan: true,
      enableZoom: true,
      enableRotate: true,
      autoRotate: !prefersReducedMotion,
      autoRotateSpeed: 0.3,
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
        ONE: 2,
        TWO: 1,
      },
    };
  }, [scaleMode, deviceCapabilities.isMobile, prefersReducedMotion]);

  const starsConfig = useMemo(() => {
    if (!performanceSettings.enableStarfield) return null;
    return {
      radius:
        scaleMode === 'realistic'
          ? 1500
          : scaleMode === 'logarithmic'
            ? 1000
            : 600,
      depth: 100,
      count: performanceSettings.starfieldCount,
      factor: 4,
      saturation: 0,
      fade: true,
      speed: prefersReducedMotion ? 0 : 0.5,
    };
  }, [
    performanceSettings.enableStarfield,
    performanceSettings.starfieldCount,
    scaleMode,
    prefersReducedMotion,
  ]);

  return (
    <div className="w-full h-screen bg-space-dark overflow-hidden">
      {/* Main Canvas */}
      <Canvas
        camera={cameraSettings}
        {...canvasConfig}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
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

          {/* Solar System (includes its own lights) */}
          <SolarSystem planets={planets} />

          {/* Camera Controls */}
          <OrbitControls {...controlsConfig} />
        </Suspense>
      </Canvas>

      {/* Responsive UI Overlay */}
      <div className="absolute inset-0 pointer-events-none safe-top safe-bottom safe-left safe-right">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="absolute top-4 left-4 pointer-events-auto animate-lg-slide-in">
            <ControlPanel />
          </div>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto animate-lg-fade-in">
            <button
              onClick={() => setShowEducationalDashboard(true)}
              className="lg-button-primary px-6 py-3 hover-lift hover-glow shadow-lg"
            >
              <span className="text-lg mr-2">🎓</span>
              <span className="font-semibold">Learning Center</span>
            </button>
          </div>

          {selectedPlanetData && (
            <div className="absolute top-4 right-4 pointer-events-auto animate-lg-scale-in">
              <PlanetInfo planet={selectedPlanetData} />
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            <TimeScrubber />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="absolute top-3 left-3 pointer-events-auto animate-lg-slide-in">
            <ControlPanel />
          </div>

          <div className="absolute top-3 right-3 pointer-events-auto animate-lg-fade-in">
            <button
              onClick={() => setShowEducationalDashboard(true)}
              className="lg-play-compact hover-scale shadow-lg"
              aria-label="Open Learning Center"
            >
              <span className="text-xl">🎓</span>
            </button>
          </div>

          {selectedPlanetData && (
            <div className="absolute bottom-20 left-3 right-3 pointer-events-auto animate-lg-bounce-in">
              <PlanetInfo planet={selectedPlanetData} />
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 pointer-events-auto">
            <TimeScrubber />
          </div>
        </div>
      </div>

      {/* Educational Components */}
      <EducationalDashboard
        isOpen={showEducationalDashboard}
        onClose={() => setShowEducationalDashboard(false)}
      />

      <PlanetComparison
        isOpen={showComparison}
        onClose={clearComparison}
      />

      <FactDisplay />
      <QuizDisplay />
      <LessonPlayer />
    </div>
  );
}

export default App;
