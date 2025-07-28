import React from 'react'
import { useUIStore } from '../stores/useUIStore'
import { getDistanceInfo } from '../utils/planetaryCalculations'

export const ControlPanel: React.FC = () => {
  const { 
    showOrbits, 
    showLabels, 
    showHelp,
    scaleMode,
    toggleOrbits, 
    toggleLabels, 
    setShowHelp,
    toggleScaleMode
  } = useUIStore()

  const distanceInfo = getDistanceInfo(scaleMode)

  return (
    <div className="liquid-glass-panel-compact p-2 space-y-2 w-44">
      <h3 className="text-sm font-semibold text-white mb-2">Controls</h3>
      
      {/* Scale Mode Toggle */}
      <div className="space-y-2">
        <label className="text-xs text-gray-300 font-medium">Distance Scale</label>
        <button
          onClick={toggleScaleMode}
          className="w-full liquid-glass-button-compact liquid-glass-button-primary liquid-glass-ripple p-1.5 text-left"
          aria-label="Toggle distance scale mode"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium capitalize text-xs truncate">{scaleMode}</div>
              <div className="text-xs text-gray-300 mt-0.5 text-[10px] truncate">{distanceInfo.scaleDescription}</div>
            </div>
            <div className="text-sm ml-1 transform transition-transform duration-300 hover:scale-110 flex-shrink-0">
              {scaleMode === 'compressed' && '🔄'}
              {scaleMode === 'realistic' && '📏'}
              {scaleMode === 'logarithmic' && '📊'}
            </div>
          </div>
        </button>
        <div className="text-xs text-gray-400 px-1 text-[10px] truncate">
          <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full mr-1"></span>
          Max: {distanceInfo.maxDistance} units
        </div>
      </div>

      {/* Visibility Controls */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-300 font-medium">Visibility</label>
        
        <button
          onClick={toggleOrbits}
          className={`w-full liquid-glass-button-compact liquid-glass-ripple p-1.5 text-left ${
            showOrbits ? 'liquid-glass-button-success liquid-glass-toggle-active' : ''
          }`}
          aria-label="Toggle orbit visibility"
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-xs truncate flex-1">Orbit Paths</span>
            <span className="text-sm ml-1 transform transition-transform duration-300 hover:scale-110 flex-shrink-0">
              {showOrbits ? '👁️' : '🙈'}
            </span>
          </div>
        </button>
        
        <button
          onClick={toggleLabels}
          className={`w-full liquid-glass-button-compact liquid-glass-ripple p-1.5 text-left ${
            showLabels ? 'liquid-glass-button-success liquid-glass-toggle-active' : ''
          }`}
          aria-label="Toggle label visibility"
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium text-xs truncate flex-1">Planet Labels</span>
            <span className="text-sm ml-1 transform transition-transform duration-300 hover:scale-110 flex-shrink-0">
              🏷️
            </span>
          </div>
        </button>
      </div>

      {/* Help Toggle */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className={`w-full liquid-glass-button-compact liquid-glass-ripple p-1.5 text-left ${
          showHelp ? 'liquid-glass-button-primary liquid-glass-toggle-active' : ''
        }`}
        aria-label="Toggle help"
      >
        <div className="flex items-center justify-between">
          <span className="text-white font-medium text-xs truncate flex-1">Help & Controls</span>
          <span className="text-sm ml-1 transform transition-transform duration-300 hover:scale-110 flex-shrink-0">
            ❓
          </span>
        </div>
      </button>

      {/* Help Content */}
      {showHelp && (
        <div className="mt-2 p-2 liquid-glass-panel-compact rounded-lg text-xs text-gray-300 space-y-2 animate-slide-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <strong className="text-blue-200 text-xs">Mouse Controls:</strong>
            </div>
            <div className="ml-3 space-y-0.5 text-[10px]">
              <div>• Left drag: Rotate view</div>
              <div>• Right drag: Pan view</div>
              <div>• Scroll: Zoom in/out</div>
              <div>• Click: View details</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
              <strong className="text-purple-200 text-xs">Scale Modes:</strong>
            </div>
            <div className="ml-3 space-y-0.5 text-[10px]">
              <div>• <span className="text-purple-300">Compressed</span>: Easy nav</div>
              <div>• <span className="text-blue-300">Realistic</span>: True distances</div>
              <div>• <span className="text-green-300">Logarithmic</span>: Balanced</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
              <strong className="text-orange-200 text-xs">Orbit Lines:</strong>
            </div>
            <div className="ml-3 space-y-0.5 text-[10px]">
              <div>• Show gravitational paths</div>
              <div>• Animated field indicators</div>
              <div>• Direction arrows</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <strong className="text-green-200 text-xs">Time Controls:</strong>
            </div>
            <div className="ml-3 space-y-0.5 text-[10px]">
              <div>• Play/Pause: Animate</div>
              <div>• Slider: Jump to time</div>
              <div>• Speed: Adjust rate</div>
              <div>• <span className="text-yellow-300">+/-</span>: Speed up/down</div>
              <div>• <span className="text-yellow-300">0</span>: Reset speed</div>
              <div>• <span className="text-yellow-300">1-6</span>: Speed presets</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 