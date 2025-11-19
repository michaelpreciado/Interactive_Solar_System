import React, { useState } from 'react'
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

  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const distanceInfo = getDistanceInfo(scaleMode)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="lg-panel-compact p-4 space-y-4 w-64 animate-lg-fade-in">
      {/* Header with gradient */}
      <div className="relative">
        <h3 className="text-base font-bold text-white mb-1 tracking-tight">
          Controls
        </h3>
        <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
      </div>
      
      {/* Scale Mode - Enhanced iOS Card */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
          Distance Scale
        </label>
        <button
          onClick={toggleScaleMode}
          className="w-full lg-button-primary lg-ripple p-4 text-left hover-lift"
          aria-label="Toggle distance scale mode"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold capitalize text-sm mb-1">
                {scaleMode}
              </div>
              <div className="text-xs text-blue-100 opacity-90">
                {distanceInfo.scaleDescription}
              </div>
            </div>
            <div className="text-2xl flex-shrink-0 transform transition-transform duration-300 hover:scale-110 hover:rotate-12">
              {scaleMode === 'compressed' && '🔄'}
              {scaleMode === 'realistic' && '📏'}
              {scaleMode === 'logarithmic' && '📊'}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2 px-2">
          <div className="h-1 flex-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
          <span className="text-[10px] text-gray-400 font-mono">
            Max: {distanceInfo.maxDistance}
          </span>
        </div>
      </div>

      {/* Visibility Controls - iOS Toggle Style */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
          Visibility
        </label>

        <div className="space-y-2">
          <button
            onClick={toggleOrbits}
            className={`w-full lg-button-compact lg-ripple p-3 text-left hover-scale transition-all ${
              showOrbits ? 'lg-toggle-active' : ''
            }`}
            aria-label="Toggle orbit visibility"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-6 rounded-full relative transition-all ${
                  showOrbits ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showOrbits ? 'transform translate-x-4' : ''
                  }`}></div>
                </div>
                <span className="text-white font-semibold text-sm">Orbit Paths</span>
              </div>
              <span className="text-lg flex-shrink-0">
                {showOrbits ? '👁️' : '🙈'}
              </span>
            </div>
          </button>

          <button
            onClick={toggleLabels}
            className={`w-full lg-button-compact lg-ripple p-3 text-left hover-scale transition-all ${
              showLabels ? 'lg-toggle-active' : ''
            }`}
            aria-label="Toggle label visibility"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-6 rounded-full relative transition-all ${
                  showLabels ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    showLabels ? 'transform translate-x-4' : ''
                  }`}></div>
                </div>
                <span className="text-white font-semibold text-sm">Planet Labels</span>
              </div>
              <span className="text-lg flex-shrink-0">🏷️</span>
            </div>
          </button>
        </div>
      </div>

      {/* Help - Expandable Accordion */}
      <div className="space-y-2">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`w-full lg-button-compact lg-ripple p-3 text-left hover-lift transition-all ${
            showHelp ? 'lg-button-primary' : ''
          }`}
          aria-label="Toggle help"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-white font-semibold text-sm">Help & Controls</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">❓</span>
              <span className={`text-xs transition-transform ${showHelp ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </div>
        </button>

        {/* Help Content with Smooth Animation */}
        {showHelp && (
          <div className="lg-panel-compact p-4 space-y-4 animate-lg-scale-in">
            <HelpSection
              icon="🖱️"
              title="Mouse Controls"
              color="blue"
              items={[
                'Left drag: Rotate view',
                'Right drag: Pan view',
                'Scroll: Zoom in/out',
                'Click: View details',
              ]}
            />

            <HelpSection
              icon="📐"
              title="Scale Modes"
              color="purple"
              items={[
                'Compressed: Easy navigation',
                'Realistic: True distances',
                'Logarithmic: Balanced view',
              ]}
            />

            <HelpSection
              icon="🌍"
              title="Orbit Lines"
              color="orange"
              items={[
                'Show gravitational paths',
                'Animated field indicators',
                'Direction arrows',
              ]}
            />

            <HelpSection
              icon="⏰"
              title="Time Controls"
              color="green"
              items={[
                'Play/Pause: Animate',
                'Slider: Jump to time',
                'Speed: Adjust rate',
                '+/-: Speed up/down',
                '0: Reset speed',
                '1-6: Speed presets',
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for help sections
const HelpSection: React.FC<{
  icon: string
  title: string
  color: string
  items: string[]
}> = ({ icon, title, color, items }) => {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    green: 'from-green-500 to-emerald-500',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-sm shadow-lg`}>
          {icon}
        </div>
        <h4 className="font-bold text-sm text-white">{title}</h4>
      </div>
      <div className="ml-10 space-y-1">
        {items.map((item, index) => (
          <div key={index} className="text-xs text-gray-300 flex items-start gap-2">
            <span className="text-gray-500 mt-0.5">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 