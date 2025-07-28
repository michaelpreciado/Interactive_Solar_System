import React, { useEffect, useRef, useCallback } from 'react'
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
    // Smart step size based on current speed
    const stepSize = timeStore.timeSpeed >= 1000 ? 100 : timeStore.timeSpeed >= 100 ? 10 : timeStore.timeSpeed >= 10 ? 1 : 0.1
    const newSpeed = Math.max(0.1, timeStore.timeSpeed - stepSize)
    timeStore.setTimeSpeed(newSpeed)
  }

  const increaseSpeed = () => {
    // Smart step size based on current speed
    const stepSize = timeStore.timeSpeed >= 1000 ? 100 : timeStore.timeSpeed >= 100 ? 10 : timeStore.timeSpeed >= 10 ? 1 : 0.1
    const newSpeed = Math.min(10000, timeStore.timeSpeed + stepSize)
    timeStore.setTimeSpeed(newSpeed)
  }

  const setSpeedPreset = (speed: number) => {
    timeStore.setTimeSpeed(speed)
  }

  const resetSpeed = () => {
    timeStore.setTimeSpeed(1)
  }

  // Keyboard shortcuts for speed control
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle shortcuts when not typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (e.key) {
      case '-':
      case '_':
        e.preventDefault()
        decreaseSpeed()
        break
      case '+':
      case '=':
        e.preventDefault()
        increaseSpeed()
        break
      case '0':
        e.preventDefault()
        resetSpeed()
        break
      case '1':
        e.preventDefault()
        setSpeedPreset(0.1)
        break
      case '2':
        e.preventDefault()
        setSpeedPreset(1)
        break
      case '3':
        e.preventDefault()
        setSpeedPreset(10)
        break
      case '4':
        e.preventDefault()
        setSpeedPreset(100)
        break
      case '5':
        e.preventDefault()
        setSpeedPreset(1000)
        break
      case '6':
        e.preventDefault()
        setSpeedPreset(10000)
        break
    }
  }, [])

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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

        {/* Enhanced Speed Control */}
        <div className="flex items-center gap-3">
          {/* Speed Decrease Button */}
          <button
            onClick={decreaseSpeed}
            className="liquid-glass-button-compact px-2 py-1 text-white text-xs hover:bg-white/10 transition-colors"
            aria-label="Decrease speed"
          >
            -
          </button>
          
          {/* Speed Slider */}
          <div className="flex flex-col items-center gap-1 min-w-[120px]">
            <div className="flex items-center gap-2">
              <div className={`text-xs font-medium transition-colors ${
                timeStore.timeSpeed <= 0.5 ? 'text-green-300' :
                timeStore.timeSpeed <= 2 ? 'text-blue-300' :
                timeStore.timeSpeed <= 10 ? 'text-yellow-300' :
                timeStore.timeSpeed <= 100 ? 'text-orange-300' :
                timeStore.timeSpeed <= 1000 ? 'text-red-300' :
                'text-purple-300'
              }`}>
                {timeStore.timeSpeed >= 1000 ? (timeStore.timeSpeed / 1000).toFixed(1) + 'k' : 
                 timeStore.timeSpeed >= 100 ? timeStore.timeSpeed.toFixed(0) : 
                 timeStore.timeSpeed.toFixed(1)}x
              </div>
              {/* Speed indicator icon */}
              <div className="text-xs">
                {timeStore.timeSpeed <= 0.5 ? '🐌' :
                 timeStore.timeSpeed <= 2 ? '🚶' :
                 timeStore.timeSpeed <= 10 ? '🏃' :
                 timeStore.timeSpeed <= 100 ? '🚀' :
                 timeStore.timeSpeed <= 1000 ? '⚡' : '💫'}
              </div>
              {/* Reset to normal speed */}
              {timeStore.timeSpeed !== 1 && (
                <button
                  onClick={resetSpeed}
                  className="text-[10px] text-gray-400 hover:text-white transition-colors px-1 py-0.5 rounded"
                  title="Reset to normal speed (1x)"
                >
                  ↻
                </button>
              )}
            </div>
            <div className="relative w-full">
              <input
                type="range"
                min="0.1"
                max="10000"
                step="any"
                value={timeStore.timeSpeed}
                onChange={handleSpeedChange}
                className="speed-slider w-full h-1.5 bg-gray-600/30 rounded-lg appearance-none cursor-pointer backdrop-blur-sm"
                aria-label="Simulation speed"
              />
              {/* Speed markers and presets */}
              <div className="flex justify-between items-center text-[8px] text-gray-400 mt-1 px-1">
                <button 
                  onClick={() => setSpeedPreset(0.1)}
                  className={`text-[8px] hover:text-white transition-colors px-1 py-0.5 rounded ${timeStore.timeSpeed === 0.1 ? 'text-blue-300' : ''}`}
                  title="Slow: 0.1x speed"
                >
                  0.1x
                </button>
                <button 
                  onClick={() => setSpeedPreset(1)}
                  className={`text-[8px] hover:text-white transition-colors px-1 py-0.5 rounded ${timeStore.timeSpeed === 1 ? 'text-blue-300' : ''}`}
                  title="Normal: 1x speed"
                >
                  1x
                </button>
                <button 
                  onClick={() => setSpeedPreset(10)}
                  className={`text-[8px] hover:text-white transition-colors px-1 py-0.5 rounded ${timeStore.timeSpeed === 10 ? 'text-blue-300' : ''}`}
                  title="Fast: 10x speed"
                >
                  10x
                </button>
                <button 
                  onClick={() => setSpeedPreset(100)}
                  className={`text-[8px] hover:text-white transition-colors px-1 py-0.5 rounded ${timeStore.timeSpeed === 100 ? 'text-blue-300' : ''}`}
                  title="Ultra: 100x speed"
                >
                  100x
                </button>
                <button 
                  onClick={() => setSpeedPreset(1000)}
                  className={`text-[8px] hover:text-white transition-colors px-1 py-0.5 rounded ${timeStore.timeSpeed === 1000 ? 'text-blue-300' : ''}`}
                  title="Hyper: 1000x speed"
                >
                  1000x
                </button>
                <button 
                  onClick={() => setSpeedPreset(10000)}
                  className={`text-[8px] hover:text-white transition-colors px-1 py-0.5 rounded ${timeStore.timeSpeed === 10000 ? 'text-blue-300' : ''}`}
                  title="Extreme: 10000x speed"
                >
                  10000x
                </button>
              </div>
            </div>
          </div>
          
          {/* Speed Increase Button */}
          <button
            onClick={increaseSpeed}
            className="liquid-glass-button-compact px-2 py-1 text-white text-xs hover:bg-white/10 transition-colors"
            aria-label="Increase speed"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
} 