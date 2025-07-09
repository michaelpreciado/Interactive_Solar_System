import React from 'react'
import { Html } from '@react-three/drei'

export const LoadingScreen: React.FC = () => {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center text-star-white">
        <div className="relative">
          {/* Animated solar system loader */}
          <div className="w-16 h-16 border-2 border-transparent border-t-cosmic-purple rounded-full animate-spin"></div>
          <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-t-space-blue rounded-full animate-spin-slow"></div>
          <div className="absolute inset-4 w-8 h-8 border-2 border-transparent border-t-star-white rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-4 text-sm text-gray-300 animate-pulse">
          Calculating planetary orbits...
        </p>
      </div>
    </Html>
  )
} 