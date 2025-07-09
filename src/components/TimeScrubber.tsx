import React, { useEffect, useRef } from 'react'
import { useTimeStore } from '../stores/useTimeStore'

export const TimeScrubber: React.FC = () => {
  const timeStore = useTimeStore()
  const animationRef = useRef<number>()

  // Handle animation loop
  useEffect(() => {
    const animate = () => {
      timeStore.tick()
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [timeStore])

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    timeStore.setCurrentTime(newTime)
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value)
    timeStore.setTimeSpeed(newSpeed)
  }

  const togglePlayPause = () => {
    timeStore.setIsPlaying(!timeStore.isPlaying)
  }

  const decreaseSpeed = () => {
    const newSpeed = Math.max(0.1, timeStore.timeSpeed - 0.1)
    timeStore.setTimeSpeed(newSpeed)
  }

  const increaseSpeed = () => {
    const newSpeed = Math.min(100, timeStore.timeSpeed + 0.1)
    timeStore.setTimeSpeed(newSpeed)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 liquid-glass-panel-compact border-t border-white/20 rounded-t-2xl">
      <div className="flex items-center justify-center p-3 gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="liquid-glass-play-compact liquid-glass-ripple"
          aria-label={timeStore.isPlaying ? 'Pause simulation' : 'Play simulation'}
        >
          {timeStore.isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6L7 16V4z" />
            </svg>
          )}
        </button>

        {/* Time Slider */}
        <div className="flex-1 max-w-md space-y-1">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="10000"
              step="0.1"
              value={timeStore.currentTime}
              onChange={handleTimeChange}
              className="liquid-glass-slider-compact w-full"
              aria-label="Time scrubber"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span className="px-1 py-0.5 rounded bg-white/10 backdrop-blur-sm text-[10px]">2000 AD</span>
              <span className="px-1 py-0.5 rounded bg-white/10 backdrop-blur-sm text-[10px]">12000 AD</span>
            </div>
          </div>
        </div>

        {/* Current Date Display */}
        <div className="min-w-0 flex-shrink-0">
          <div className="text-white font-medium text-xs text-center liquid-glass-button-compact px-3 py-2 min-w-[100px]">
            <div className="text-xs text-gray-300 mb-0.5 text-[10px]">Current Date</div>
            <div className="font-mono text-xs">{timeStore.currentDate}</div>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseSpeed}
            className="liquid-glass-button-compact px-2 py-1 text-white text-xs"
            aria-label="Decrease speed"
          >
            -
          </button>
          <div className="text-white text-xs font-medium min-w-[40px] text-center">
            {timeStore.timeSpeed.toFixed(1)}x
          </div>
          <button
            onClick={increaseSpeed}
            className="liquid-glass-button-compact px-2 py-1 text-white text-xs"
            aria-label="Increase speed"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
} 