import { useEffect, useRef } from 'react'
import { useUIStore } from '../stores/useUIStore'

export interface TouchGestureOptions {
  onRotate?: (deltaX: number, deltaY: number) => void
  onZoom?: (scale: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
}

export const useTouchGestures = (options: TouchGestureOptions) => {
  const { setTouchState } = useUIStore()
  const elementRef = useRef<HTMLElement>(null)
  const gestureStateRef = useRef({
    isGesturing: false,
    startTouches: [] as Touch[],
    lastTouches: [] as Touch[],
    gestureType: null as 'rotate' | 'zoom' | 'pan' | null,
    initialDistance: 0,
    initialAngle: 0,
    lastDistance: 0,
    lastAngle: 0,
  })

  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getTouchAngle = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.atan2(dy, dx)
  }

  const handleTouchStart = (event: TouchEvent) => {
    const touches = Array.from(event.touches)
    const state = gestureStateRef.current

    state.isGesturing = true
    state.startTouches = touches
    state.lastTouches = touches

    if (touches.length === 1) {
      state.gestureType = 'rotate'
    } else if (touches.length === 2) {
      state.gestureType = 'zoom'
      state.initialDistance = getTouchDistance(touches[0], touches[1])
      state.lastDistance = state.initialDistance
      state.initialAngle = getTouchAngle(touches[0], touches[1])
      state.lastAngle = state.initialAngle
    }

    setTouchState({
      isGesturing: true,
      gestureType: state.gestureType,
    })
  }

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault()
    const touches = Array.from(event.touches)
    const state = gestureStateRef.current

    if (!state.isGesturing) return

    if (touches.length === 1 && state.gestureType === 'rotate') {
      const touch = touches[0]
      const lastTouch = state.lastTouches[0]
      
      if (lastTouch) {
        const deltaX = touch.clientX - lastTouch.clientX
        const deltaY = touch.clientY - lastTouch.clientY
        options.onRotate?.(deltaX, deltaY)
      }
    } else if (touches.length === 2 && state.gestureType === 'zoom') {
      const currentDistance = getTouchDistance(touches[0], touches[1])
      const currentAngle = getTouchAngle(touches[0], touches[1])
      
      // Handle zoom
      if (state.lastDistance > 0) {
        const scale = currentDistance / state.lastDistance
        options.onZoom?.(scale)
      }
      
      // Handle pan (center point movement)
      const currentCenterX = (touches[0].clientX + touches[1].clientX) / 2
      const currentCenterY = (touches[0].clientY + touches[1].clientY) / 2
      
      if (state.lastTouches.length === 2) {
        const lastCenterX = (state.lastTouches[0].clientX + state.lastTouches[1].clientX) / 2
        const lastCenterY = (state.lastTouches[0].clientY + state.lastTouches[1].clientY) / 2
        
        const deltaX = currentCenterX - lastCenterX
        const deltaY = currentCenterY - lastCenterY
        options.onPan?.(deltaX, deltaY)
      }
      
      state.lastDistance = currentDistance
      state.lastAngle = currentAngle
    }

    state.lastTouches = touches
  }

  const handleTouchEnd = (event: TouchEvent) => {
    const touches = Array.from(event.touches)
    const state = gestureStateRef.current

    if (touches.length === 0) {
      state.isGesturing = false
      state.gestureType = null
      setTouchState({
        isGesturing: false,
        gestureType: null,
      })
    } else if (touches.length === 1 && state.gestureType === 'zoom') {
      // Switch from zoom to rotate
      state.gestureType = 'rotate'
      setTouchState({
        isGesturing: true,
        gestureType: 'rotate',
      })
    }

    state.lastTouches = touches
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const options = { passive: false }
    
    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchEnd, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [])

  return elementRef
}

// Performance monitoring utilities
export const usePerformanceMonitor = () => {
  const fpsRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)

  const updateFPS = (timestamp: number) => {
    frameCountRef.current++
    
    if (timestamp - lastTimeRef.current >= 1000) {
      fpsRef.current = frameCountRef.current
      frameCountRef.current = 0
      lastTimeRef.current = timestamp
    }
  }

  const getFPS = () => fpsRef.current

  return { updateFPS, getFPS }
}

// Device capability detection
export const detectDeviceCapabilities = () => {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  
  const capabilities = {
    hasWebGL: !!gl,
    maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
    maxVertexTextures: gl ? gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) : 0,
    maxFragmentTextures: gl ? gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) : 0,
    hasHighPrecisionFragmentShader: false,
    hasHighPrecisionVertexShader: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    isLowEndDevice: false,
  }

  if (gl) {
    const fragmentShaderPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
    const vertexShaderPrecision = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT)
    
    capabilities.hasHighPrecisionFragmentShader = fragmentShaderPrecision?.precision > 0
    capabilities.hasHighPrecisionVertexShader = vertexShaderPrecision?.precision > 0
  }

  // Heuristic for low-end device detection
  const memoryGB = (navigator as any).deviceMemory || 4
  const hardwareConcurrency = navigator.hardwareConcurrency || 4
  const isLowEndDevice = memoryGB < 4 || hardwareConcurrency < 4 || capabilities.devicePixelRatio < 2

  capabilities.isLowEndDevice = isLowEndDevice

  return capabilities
}

// Adaptive quality settings based on device capabilities
export const getAdaptiveQualitySettings = () => {
  const capabilities = detectDeviceCapabilities()
  
  if (capabilities.isLowEndDevice) {
    return {
      shadowMapSize: 1024,
      antialias: false,
      pixelRatio: Math.min(capabilities.devicePixelRatio, 1.5),
      particleCount: 2500,
      geometryDetail: 'low',
      postProcessing: false,
    }
  } else {
    return {
      shadowMapSize: 2048,
      antialias: true,
      pixelRatio: Math.min(capabilities.devicePixelRatio, 2),
      particleCount: 5000,
      geometryDetail: 'high',
      postProcessing: true,
    }
  }
} 