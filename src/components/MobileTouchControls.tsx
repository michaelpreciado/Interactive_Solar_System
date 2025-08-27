import React, { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import * as THREE from 'three'
import { useUIStore } from '../stores/useUIStore'

interface TouchControlsProps {
  enabled?: boolean
  enablePan?: boolean
  enableZoom?: boolean
  enableRotate?: boolean
  minDistance?: number
  maxDistance?: number
  polarAngleLimit?: [number, number]
  azimuthAngleLimit?: [number, number]
  zoomSpeed?: number
  rotateSpeed?: number
  panSpeed?: number
}

export const MobileTouchControls: React.FC<TouchControlsProps> = ({
  enabled = true,
  enablePan = true,
  enableZoom = true,
  enableRotate = true,
  minDistance = 10,
  maxDistance = 1000,
  polarAngleLimit = [0, Math.PI],
  azimuthAngleLimit = [-Infinity, Infinity],
  zoomSpeed = 1,
  rotateSpeed = 1,
  panSpeed = 1
}) => {
  const { camera, gl, invalidate } = useThree()
  const { setTouchState, deviceCapabilities, performanceSettings } = useUIStore()
  
  const spherical = useRef(new THREE.Spherical())
  const sphericalDelta = useRef(new THREE.Spherical())
  const target = useRef(new THREE.Vector3())
  const panOffset = useRef(new THREE.Vector3())
  const lastQuaternion = useRef(new THREE.Quaternion())
  const lastPosition = useRef(new THREE.Vector3())
  
  // Enhanced mobile-specific settings
  const mobileSettings = {
    dampingFactor: deviceCapabilities.isMobile ? 0.08 : 0.05,
    minZoomSpeed: 0.95,
    maxZoomSpeed: 1.05,
    enableDamping: true,
    autoRotateSpeed: deviceCapabilities.isMobile ? 0.5 : 1.0,
    touchSensitivity: deviceCapabilities.isMobile ? 0.8 : 1.0,
    hapticFeedback: deviceCapabilities.isMobile && 'vibrate' in navigator
  }
  
  // Haptic feedback for interactions
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!mobileSettings.hapticFeedback) return
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    }
    
    try {
      navigator.vibrate(patterns[intensity])
    } catch (e) {
      // Ignore if vibration not supported
    }
  }, [mobileSettings.hapticFeedback])
  
  // Initialize camera position
  useEffect(() => {
    const cameraPosition = camera.position.clone()
    spherical.current.setFromVector3(cameraPosition.sub(target.current))
  }, [camera])
  
  // Enhanced gesture handling
  const bind = useGesture({
    onDrag: ({ movement: [mx, my], velocity: [vx, vy], first, last, cancel }) => {
      if (!enabled || !enableRotate) return
      
      if (first) {
        setTouchState({ isGesturing: true, gestureType: 'rotate' })
        triggerHapticFeedback('light')
      }
      
      if (last) {
        setTouchState({ isGesturing: false, gestureType: null })
      }
      
      // Calculate rotation with velocity-based smoothing
      const rotateSpeed = mobileSettings.touchSensitivity * rotateSpeed
      const deltaTheta = mx * rotateSpeed * 0.01
      const deltaPhi = my * rotateSpeed * 0.01
      
      // Apply velocity-based damping for smoother feel
      const velocityFactor = Math.min(Math.sqrt(vx * vx + vy * vy) * 0.1, 1)
      
      sphericalDelta.current.theta -= deltaTheta * (1 + velocityFactor)
      sphericalDelta.current.phi -= deltaPhi * (1 + velocityFactor)
      
      invalidate()
    },
    
    onPinch: ({ movement: [distance], velocity: [v], first, last, cancel }) => {
      if (!enabled || !enableZoom) return
      
      if (first) {
        setTouchState({ isGesturing: true, gestureType: 'zoom' })
        triggerHapticFeedback('medium')
      }
      
      if (last) {
        setTouchState({ isGesturing: false, gestureType: null })
      }
      
      // Enhanced pinch-to-zoom with velocity
      const zoomFactor = 1 + (distance * zoomSpeed * 0.01)
      const velocityFactor = Math.abs(v) * 0.1
      
      const currentDistance = spherical.current.radius
      const newDistance = THREE.MathUtils.clamp(
        currentDistance / (zoomFactor + velocityFactor),
        minDistance,
        maxDistance
      )
      
      spherical.current.radius = newDistance
      invalidate()
    },
    
    onWheel: ({ movement: [, my], velocity: [, vy] }) => {
      if (!enabled || !enableZoom) return
      
      const zoomFactor = 1 + (my * zoomSpeed * 0.001)
      const velocityFactor = Math.abs(vy) * 0.0001
      
      const currentDistance = spherical.current.radius
      const newDistance = THREE.MathUtils.clamp(
        currentDistance * (zoomFactor + velocityFactor),
        minDistance,
        maxDistance
      )
      
      spherical.current.radius = newDistance
      invalidate()
    },
    
    // Two-finger pan gesture
    onMove: ({ movement: [mx, my], touches, first, last }) => {
      if (!enabled || !enablePan || touches !== 2) return
      
      if (first) {
        setTouchState({ isGesturing: true, gestureType: 'pan' })
        triggerHapticFeedback('light')
      }
      
      if (last) {
        setTouchState({ isGesturing: false, gestureType: null })
      }
      
      // Calculate pan offset
      const panDelta = new THREE.Vector3()
      const cameraDirection = camera.getWorldDirection(new THREE.Vector3())
      const cameraUp = camera.up.clone()
      const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, cameraUp)
      
      panDelta.addScaledVector(cameraRight, -mx * panSpeed * 0.01)
      panDelta.addScaledVector(cameraUp, my * panSpeed * 0.01)
      
      panOffset.current.add(panDelta)
      invalidate()
    }
  }, {
    // Gesture configuration for better mobile experience
    drag: {
      filterTaps: true,
      threshold: 5,
      rubberband: true
    },
    pinch: {
      scaleBounds: { min: 0.1, max: 10 },
      rubberband: true
    },
    wheel: {
      preventDefault: true
    },
    move: {
      threshold: 10
    }
  })
  
  // Animation loop with damping
  useFrame((state, delta) => {
    if (!enabled) return
    
    // Apply spherical coordinate changes with damping
    if (mobileSettings.enableDamping) {
      sphericalDelta.current.theta *= (1 - mobileSettings.dampingFactor)
      sphericalDelta.current.phi *= (1 - mobileSettings.dampingFactor)
      
      if (Math.abs(sphericalDelta.current.theta) < 0.001) sphericalDelta.current.theta = 0
      if (Math.abs(sphericalDelta.current.phi) < 0.001) sphericalDelta.current.phi = 0
    }
    
    // Update spherical coordinates
    spherical.current.theta += sphericalDelta.current.theta
    spherical.current.phi += sphericalDelta.current.phi
    
    // Apply limits
    spherical.current.phi = Math.max(polarAngleLimit[0], Math.min(polarAngleLimit[1], spherical.current.phi))
    spherical.current.theta = Math.max(azimuthAngleLimit[0], Math.min(azimuthAngleLimit[1], spherical.current.theta))
    spherical.current.radius = Math.max(minDistance, Math.min(maxDistance, spherical.current.radius))
    
    // Convert back to Cartesian coordinates
    const position = new THREE.Vector3().setFromSpherical(spherical.current)
    position.add(target.current).add(panOffset.current)
    
    // Apply damping to pan offset
    if (mobileSettings.enableDamping) {
      panOffset.current.multiplyScalar(1 - mobileSettings.dampingFactor)
      
      if (panOffset.current.length() < 0.001) {
        panOffset.current.set(0, 0, 0)
      }
    }
    
    // Update camera
    camera.position.copy(position)
    camera.lookAt(target.current)
    
    // Check if we need to invalidate the frame
    const hasChanged = !lastPosition.current.equals(camera.position) || 
                      !lastQuaternion.current.equals(camera.quaternion)
    
    if (hasChanged) {
      lastPosition.current.copy(camera.position)
      lastQuaternion.current.copy(camera.quaternion)
      invalidate()
    }
  })
  
  // Auto-rotation for demonstration mode
  useFrame((state) => {
    if (!performanceSettings.enableAnimations || state.clock.elapsedTime < 5) return
    
    // Gentle auto-rotation when not interacting
    const { isGesturing } = useUIStore.getState().touchState
    if (!isGesturing) {
      sphericalDelta.current.theta += mobileSettings.autoRotateSpeed * 0.001
    }
  })
  
  // Bind gestures to the WebGL canvas
  useEffect(() => {
    const canvas = gl.domElement
    const cleanupGestures = bind()
    
    // Prevent default touch behaviors
    const preventDefault = (e: Event) => {
      e.preventDefault()
    }
    
    canvas.addEventListener('touchstart', preventDefault, { passive: false })
    canvas.addEventListener('touchmove', preventDefault, { passive: false })
    
    // Apply gesture handlers
    const gestureTarget = canvas.parentElement || canvas
    const gestureCleanup = cleanupGestures(gestureTarget)
    
    return () => {
      canvas.removeEventListener('touchstart', preventDefault)
      canvas.removeEventListener('touchmove', preventDefault)
      if (typeof gestureCleanup === 'function') {
        gestureCleanup()
      }
    }
  }, [gl.domElement, bind])
  
  return null
}

// Hook for mobile-specific touch optimizations
export const useMobileTouchOptimizations = () => {
  const { deviceCapabilities } = useUIStore()
  
  useEffect(() => {
    if (!deviceCapabilities.isMobile) return
    
    // Optimize touch delay for better responsiveness
    const style = document.createElement('style')
    style.textContent = `
      * {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
      }
      
      canvas {
        touch-action: none;
      }
    `
    document.head.appendChild(style)
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }
    
    document.addEventListener('touchend', preventZoom, { passive: false })
    
    return () => {
      document.head.removeChild(style)
      document.removeEventListener('touchend', preventZoom)
    }
  }, [deviceCapabilities.isMobile])
}