import React from 'react'
import { Canvas } from '@react-three/fiber'
import { useUIStore } from '../stores/useUIStore'

// This component wraps the canvas with mobile-specific optimizations
export const MobileOptimizedCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deviceCapabilities, performanceSettings } = useUIStore()
  
  // Mobile-specific canvas props
  const mobileCanvasProps = {
    // Force high refresh rate for compatible devices
    frameloop: deviceCapabilities.supportsHighRefreshRate ? 'always' : 'demand' as const,
    
    // Optimized pixel ratio
    dpr: Math.min(deviceCapabilities.pixelRatio, performanceSettings.pixelRatio),
    
    // Performance optimizations
    flat: true, // Disable tone mapping for better performance
    legacy: false, // Use modern WebGL features
    orthographic: false,
    
    // WebGL context attributes
    gl: {
      alpha: false,
      antialias: false, // Disabled for mobile performance
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
    }
  }
  
  return (
    <Canvas {...mobileCanvasProps}>
      {children}
    </Canvas>
  )
}

// Performance hints for the browser
export const MobilePerformanceHints: React.FC = () => {
  const { deviceCapabilities } = useUIStore()
  
  React.useEffect(() => {
    if (!deviceCapabilities.isMobile) return
    
    // Request high performance mode
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      (window as any).scheduler.postTask(() => {
        // This helps ensure our animation tasks get priority
      }, { priority: 'user-blocking' })
    }
    
    // Prevent system-level optimizations that might interfere
    const meta = document.createElement('meta')
    meta.name = 'format-detection'
    meta.content = 'telephone=no, address=no, email=no'
    document.head.appendChild(meta)
    
    return () => {
      if (meta.parentNode) {
        meta.parentNode.removeChild(meta)
      }
    }
  }, [deviceCapabilities.isMobile])
  
  return null
}