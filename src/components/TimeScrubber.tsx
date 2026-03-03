import React, { useEffect, useRef, useCallback } from 'react'
import { useTimeStore } from '../stores/useTimeStore'

export const TimeScrubber: React.FC = () => {
  // Subscribe to individual values to avoid re-creating the animation loop on
  // every state change (previously the whole store object was a dep).
  const isPlaying = useTimeStore((s) => s.isPlaying)
  const timeSpeed = useTimeStore((s) => s.timeSpeed)
  const currentTime = useTimeStore((s) => s.currentTime)
  const currentDate = useTimeStore((s) => s.currentDate)
  const tick = useTimeStore((s) => s.tick)
  const setCurrentTime = useTimeStore((s) => s.setCurrentTime)
  const setIsPlaying = useTimeStore((s) => s.setIsPlaying)
  const setTimeSpeed = useTimeStore((s) => s.setTimeSpeed)
  const increaseTimeSpeed = useTimeStore((s) => s.increaseTimeSpeed)
  const decreaseTimeSpeed = useTimeStore((s) => s.decreaseTimeSpeed)

  const animationRef = useRef<number>()

  // Animation loop — `tick` is a stable store reference, no restart on every render.
  useEffect(() => {
    const animate = () => {
      tick()
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [tick])

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value))
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeSpeed(parseFloat(e.target.value))
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const setSpeedPreset = (speed: number) => {
    setTimeSpeed(speed)
  }

  const resetSpeed = () => {
    setTimeSpeed(1)
  }

  // Keyboard shortcuts — store actions are stable references, no stale closure.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    switch (e.key) {
      case '-':
      case '_':
        e.preventDefault()
        decreaseTimeSpeed()
        break
      case '+':
      case '=':
        e.preventDefault()
        increaseTimeSpeed()
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
  }, [decreaseTimeSpeed, increaseTimeSpeed, setTimeSpeed])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="lg-panel-compact p-4 rounded-2xl backdrop-blur-3xl border border-white/10">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="lg-play hover-scale lg-ripple flex-shrink-0"
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6L7 16V4z" />
            </svg>
          )}
        </button>

        {/* Time Slider */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="10000"
                step="0.1"
                value={currentTime}
                onChange={handleTimeChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 backdrop-blur-sm [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-400 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                aria-label="Time scrubber"
              />
            </div>

            {/* Current Date Display */}
            <div className="lg-island px-6 py-2 min-w-[140px] text-center">
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
                Date
              </div>
              <div className="font-mono text-sm font-bold text-white">
                {currentDate}
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 px-1">
            <span>2000 AD</span>
            <span>12000 AD</span>
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex-shrink-0">
          <div className="lg-glass-secondary rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={decreaseTimeSpeed}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white font-bold text-lg transition-all hover-scale"
                aria-label="Decrease speed"
              >
                −
              </button>

              <div className="min-w-[100px] text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={`text-2xl font-bold bg-gradient-to-r ${
                    timeSpeed <= 0.5 ? 'from-green-400 to-emerald-400' :
                    timeSpeed <= 2 ? 'from-blue-400 to-cyan-400' :
                    timeSpeed <= 10 ? 'from-yellow-400 to-orange-400' :
                    timeSpeed <= 100 ? 'from-orange-400 to-red-400' :
                    timeSpeed <= 1000 ? 'from-red-400 to-pink-400' :
                    'from-purple-400 to-pink-400'
                  } bg-clip-text text-transparent`}>
                    {timeSpeed >= 1000 ? (timeSpeed / 1000).toFixed(1) + 'k' :
                     timeSpeed >= 100 ? timeSpeed.toFixed(0) :
                     timeSpeed.toFixed(1)}×
                  </span>
                  <span className="text-xl">
                    {timeSpeed <= 0.5 ? '🐌' :
                     timeSpeed <= 2 ? '🚶' :
                     timeSpeed <= 10 ? '🏃' :
                     timeSpeed <= 100 ? '🚀' :
                     timeSpeed <= 1000 ? '⚡' : '💫'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Speed
                </div>
              </div>

              <button
                onClick={increaseTimeSpeed}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white font-bold text-lg transition-all hover-scale"
                aria-label="Increase speed"
              >
                +
              </button>
            </div>

            {/* Speed Presets */}
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {[
                { value: 0.1, label: '0.1×' },
                { value: 1, label: '1×' },
                { value: 10, label: '10×' },
                { value: 100, label: '100×' },
                { value: 1000, label: '1K×' },
                { value: 10000, label: '10K×' }
              ].map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setSpeedPreset(preset.value)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all hover-scale ${
                    timeSpeed === preset.value
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
