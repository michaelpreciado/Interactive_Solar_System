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
    <div className="lg-panel-compact rounded-2xl backdrop-blur-3xl border border-white/10">
      <div className="flex flex-col md:flex-row items-center gap-2 sm:gap-3 md:gap-4">
        {/* Play/Pause Button - iOS Style */}
        <button
          onClick={togglePlayPause}
          className="lg-play hover-scale lg-ripple flex-shrink-0"
          aria-label={timeStore.isPlaying ? 'Pause simulation' : 'Play simulation'}
        >
          {timeStore.isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6L7 16V4z" />
            </svg>
          )}
        </button>

        {/* Time Slider - iOS Style */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="10000"
                step="0.1"
                value={timeStore.currentTime}
                onChange={handleTimeChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 backdrop-blur-sm [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-400 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                aria-label="Time scrubber"
              />
            </div>

            {/* Current Date Display - Dynamic Island Style */}
            <div className="lg-island px-3 py-1.5 sm:px-4 sm:py-2 min-w-[100px] sm:min-w-[120px] text-center">
              <div className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                Date
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-white">
                {timeStore.currentDate}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 px-1">
            <span>2000 AD</span>
            <span>12000 AD</span>
          </div>
        </div>

        {/* Speed Control - iOS Style */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <div className="lg-glass-secondary rounded-2xl p-2 sm:p-2.5 border border-white/10">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Decrease Speed */}
              <button
                onClick={decreaseSpeed}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white font-bold text-base sm:text-lg transition-all hover-scale"
                aria-label="Decrease speed"
              >
                −
              </button>

              {/* Speed Display */}
              <div className="min-w-[80px] sm:min-w-[90px] text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                  <span className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${
                    timeStore.timeSpeed <= 0.5 ? 'from-green-400 to-emerald-400' :
                    timeStore.timeSpeed <= 2 ? 'from-blue-400 to-cyan-400' :
                    timeStore.timeSpeed <= 10 ? 'from-yellow-400 to-orange-400' :
                    timeStore.timeSpeed <= 100 ? 'from-orange-400 to-red-400' :
                    timeStore.timeSpeed <= 1000 ? 'from-red-400 to-pink-400' :
                    'from-purple-400 to-pink-400'
                  } bg-clip-text text-transparent`}>
                    {timeStore.timeSpeed >= 1000 ? (timeStore.timeSpeed / 1000).toFixed(1) + 'k' :
                     timeStore.timeSpeed >= 100 ? timeStore.timeSpeed.toFixed(0) :
                     timeStore.timeSpeed.toFixed(1)}×
                  </span>
                  <span className="text-base sm:text-lg">
                    {timeStore.timeSpeed <= 0.5 ? '🐌' :
                     timeStore.timeSpeed <= 2 ? '🚶' :
                     timeStore.timeSpeed <= 10 ? '🏃' :
                     timeStore.timeSpeed <= 100 ? '🚀' :
                     timeStore.timeSpeed <= 1000 ? '⚡' : '💫'}
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Speed
                </div>
              </div>

              {/* Increase Speed */}
              <button
                onClick={increaseSpeed}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white font-bold text-base sm:text-lg transition-all hover-scale"
                aria-label="Increase speed"
              >
                +
              </button>
            </div>

            {/* Speed Presets - iOS Pill Style */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-2.5 justify-center">
              {[
                { value: 0.1, label: '0.1×', hideMobile: false },
                { value: 1, label: '1×', hideMobile: false },
                { value: 10, label: '10×', hideMobile: false },
                { value: 100, label: '100×', hideMobile: false },
                { value: 1000, label: '1K×', hideMobile: true },
                { value: 10000, label: '10K×', hideMobile: true }
              ].map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setSpeedPreset(preset.value)}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold transition-all hover-scale ${
                    preset.hideMobile ? 'hidden sm:inline-block' : ''
                  } ${
                    timeStore.timeSpeed === preset.value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                  title={`Set speed to ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 