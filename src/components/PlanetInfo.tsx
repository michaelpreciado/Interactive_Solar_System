import React from 'react'
import { PlanetData } from '../utils/planetaryCalculations'
import { useUIStore } from '../stores/useUIStore'

interface PlanetInfoProps {
  planet: PlanetData
}

export const PlanetInfo: React.FC<PlanetInfoProps> = ({ planet }) => {
  const { setSelectedPlanet } = useUIStore()

  const handleClose = () => {
    setSelectedPlanet(null)
  }

  return (
    <div className="liquid-glass-panel-compact w-full max-w-xs sm:w-64 max-h-[50vh] overflow-y-auto animate-slide-in">
      <div className="flex justify-between items-start mb-2 sm:mb-3 sticky top-0 bg-black/20 backdrop-blur-sm -m-3 p-3 sm:-m-4 sm:p-4 z-10">
        <h2 className="text-sm sm:text-base font-bold text-white">{planet.name}</h2>
        <button
          onClick={handleClose}
          className="liquid-glass-close-compact flex-shrink-0"
          aria-label="Close"
        >
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div className="space-y-1">
            <div className="text-gray-400 text-[10px]">Distance from Sun:</div>
            <div className="text-white font-mono bg-white/10 rounded px-2 py-1 text-xs">
              {planet.distanceFromSun.toFixed(2)} AU
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-[10px]">Radius:</div>
            <div className="text-white font-mono bg-white/10 rounded px-2 py-1 text-xs">
              {planet.radius.toFixed(1)} units
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-[10px]">Day Length:</div>
            <div className="text-white font-mono bg-white/10 rounded px-2 py-1 text-xs">
              {planet.dayLength.toFixed(0)} hrs
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-[10px]">Year Length:</div>
            <div className="text-white font-mono bg-white/10 rounded px-2 py-1 text-xs">
              {planet.yearLength.toFixed(0)} days
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-[10px]">Temperature:</div>
            <div className="text-white font-mono bg-white/10 rounded px-2 py-1 text-xs">
              {planet.temperature}K
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-[10px]">Mass:</div>
            <div className="text-white font-mono bg-white/10 rounded px-2 py-1 text-xs">
              {planet.mass} Earth
            </div>
          </div>
        </div>

        {/* Distance comparison */}
        <div className="liquid-glass-panel-compact p-1.5 sm:p-2 rounded">
          <div className="flex items-center space-x-1 mb-1 sm:mb-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <div className="text-[10px] sm:text-xs font-medium text-blue-200">Distance Info</div>
          </div>
          <div className="space-y-0.5 sm:space-y-1 text-[9px] sm:text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">In km:</span>
              <span className="text-white font-mono bg-white/10 rounded px-1 py-0.5">
                {(planet.distanceFromSun * 149597870.7 / 1000000).toFixed(0)}M km
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Light time:</span>
              <span className="text-white font-mono bg-white/10 rounded px-1 py-0.5">
                {planet.distanceFromSun < 0.1 
                  ? `${(planet.distanceFromSun * 8.32).toFixed(1)} min`
                  : planet.distanceFromSun < 1
                  ? `${(planet.distanceFromSun * 8.32).toFixed(0)} min`
                  : `${(planet.distanceFromSun * 8.32 / 60).toFixed(1)} hrs`
                }
              </span>
            </div>
          </div>
        </div>


        {planet.moons.length > 0 && (
          <div className="liquid-glass-panel-compact p-1.5 sm:p-2 rounded">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <h3 className="text-[10px] sm:text-xs font-semibold text-purple-200">Moons</h3>
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-400 bg-white/10 rounded px-1 py-0.5">
                {planet.moons.length}
              </div>
            </div>
            <div className="space-y-0.5 sm:space-y-1 max-h-16 sm:max-h-20 overflow-y-auto">
              {planet.moons.slice(0, 3).map((moon, index) => (
                <div key={moon.name} className="flex justify-between items-center p-1 bg-white/5 rounded text-[10px]">
                  <div className="text-white">{moon.name}</div>
                  <div className="text-gray-400">
                    {moon.radius.toFixed(1)}u
                  </div>
                </div>
              ))}
              {planet.moons.length > 3 && (
                <div className="text-[10px] text-gray-400 text-center">
                  +{planet.moons.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 