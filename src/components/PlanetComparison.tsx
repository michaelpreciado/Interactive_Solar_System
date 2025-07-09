import React from 'react'
import { useEducationStore } from '../stores/useEducationStore'

// Planet data for comparison
const planetsData = {
  mercury: {
    distanceFromSun: 57909000,
    radius: 2439.7,
    mass: 3.3011e23,
    orbitalPeriod: 87.97,
    surfaceGravity: 3.7,
    averageTemperature: 167
  },
  venus: {
    distanceFromSun: 108209000,
    radius: 6051.8,
    mass: 4.8675e24,
    orbitalPeriod: 224.70,
    surfaceGravity: 8.9,
    averageTemperature: 464
  },
  earth: {
    distanceFromSun: 149596000,
    radius: 6371.0,
    mass: 5.9724e24,
    orbitalPeriod: 365.25,
    surfaceGravity: 9.8,
    averageTemperature: 15
  },
  mars: {
    distanceFromSun: 227923000,
    radius: 3389.5,
    mass: 6.4171e23,
    orbitalPeriod: 686.98,
    surfaceGravity: 3.7,
    averageTemperature: -65
  },
  jupiter: {
    distanceFromSun: 778299000,
    radius: 69911,
    mass: 1.8982e27,
    orbitalPeriod: 4331.57,
    surfaceGravity: 24.8,
    averageTemperature: -110
  },
  saturn: {
    distanceFromSun: 1426666000,
    radius: 58232,
    mass: 5.6834e26,
    orbitalPeriod: 10759.22,
    surfaceGravity: 10.4,
    averageTemperature: -140
  },
  uranus: {
    distanceFromSun: 2870658000,
    radius: 25362,
    mass: 8.6810e25,
    orbitalPeriod: 30688.5,
    surfaceGravity: 8.7,
    averageTemperature: -195
  },
  neptune: {
    distanceFromSun: 4498396000,
    radius: 24622,
    mass: 1.0243e26,
    orbitalPeriod: 60182,
    surfaceGravity: 11.0,
    averageTemperature: -200
  }
}

interface PlanetComparisonProps {
  isOpen: boolean
  onClose: () => void
}

export const PlanetComparison: React.FC<PlanetComparisonProps> = ({ isOpen, onClose }) => {
  const {
    selectedPlanetsForComparison,
    addPlanetToComparison,
    removePlanetFromComparison,
    clearComparison,
    learningLevel,
    showMetricUnits,
    showScientificNotation
  } = useEducationStore()

  if (!isOpen) return null

  const availablePlanets = Object.keys(planetsData).filter(
    planet => !selectedPlanetsForComparison.includes(planet)
  )

  const formatDistance = (distance: number) => {
    if (showScientificNotation) {
      return `${distance.toExponential(2)} ${showMetricUnits ? 'km' : 'mi'}`
    }
    return `${distance.toLocaleString()} ${showMetricUnits ? 'km' : 'mi'}`
  }

  const formatMass = (mass: number) => {
    if (showScientificNotation) {
      return `${mass.toExponential(2)} kg`
    }
    return `${mass.toLocaleString()} kg`
  }

  const getComparisonData = (planetName: string) => {
    const planet = (planetsData as any)[planetName]
    if (!planet) return null

    const earthMass = 5.972e24
    const earthRadius = 6371

    return {
      name: planetName.charAt(0).toUpperCase() + planetName.slice(1),
      ...planet,
      massComparisonToEarth: planet.mass / earthMass,
      radiusComparisonToEarth: planet.radius / earthRadius,
      surfaceGravityComparisonToEarth: planet.surfaceGravity / 9.8
    }
  }

  const getColorForPlanet = (planetName: string) => {
    const colors: Record<string, string> = {
      mercury: 'text-gray-400',
      venus: 'text-yellow-400',
      earth: 'text-blue-400',
      mars: 'text-red-400',
      jupiter: 'text-orange-400',
      saturn: 'text-yellow-500',
      uranus: 'text-cyan-400',
      neptune: 'text-blue-600'
    }
    return colors[planetName] || 'text-gray-400'
  }

  const getEducationalFacts = (planetName: string) => {
    const facts: Record<string, string[]> = {
      mercury: ['Smallest planet', 'Closest to Sun', 'No atmosphere', 'Extreme temperature variation'],
      venus: ['Hottest planet', 'Thick atmosphere', 'Rotates backwards', 'Covered in volcanoes'],
      earth: ['Only planet with life', 'Liquid water', 'Protective atmosphere', 'One large moon'],
      mars: ['Red planet', 'Polar ice caps', 'Largest volcano', 'Day length similar to Earth'],
      jupiter: ['Largest planet', 'Gas giant', 'Great Red Spot', 'Over 95 moons'],
      saturn: ['Beautiful rings', 'Less dense than water', 'Hexagonal storm', 'Over 140 moons'],
      uranus: ['Tilted on its side', 'Ice giant', 'Faint rings', 'Coldest atmosphere'],
      neptune: ['Windiest planet', 'Farthest from Sun', 'Deep blue color', 'Takes 165 years to orbit']
    }
    return facts[planetName] || []
  }

  const formatNumber = (value: number, decimals = 2) => {
    if (showScientificNotation && (value > 1000000 || value < 0.001)) {
      return value.toExponential(decimals)
    }
    return value.toFixed(decimals)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="liquid-glass-panel max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🌍 Planet Comparison Tool</h1>
            <p className="text-gray-300">Compare up to 4 planets side by side</p>
          </div>
          <button
            onClick={onClose}
            className="liquid-glass-close"
            aria-label="Close Planet Comparison"
          >
            ×
          </button>
        </div>

        {/* Planet Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">📌 Select Planets to Compare</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availablePlanets.map((planet) => (
              <button
                key={planet}
                onClick={() => addPlanetToComparison(planet)}
                disabled={selectedPlanetsForComparison.length >= 4}
                className={`liquid-glass-button text-sm px-4 py-2 ${
                  selectedPlanetsForComparison.length >= 4 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                + {planet.charAt(0).toUpperCase() + planet.slice(1)}
              </button>
            ))}
          </div>
          
          {selectedPlanetsForComparison.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {selectedPlanetsForComparison.map((planet) => (
                  <div
                    key={planet}
                    className="liquid-glass-panel px-3 py-1 flex items-center space-x-2"
                  >
                    <span className={`${getColorForPlanet(planet)} capitalize`}>
                      {planet}
                    </span>
                    <button
                      onClick={() => removePlanetFromComparison(planet)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={clearComparison}
                className="liquid-glass-button liquid-glass-danger text-sm"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedPlanetsForComparison.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">📊 Comparison Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3 text-gray-300">Property</th>
                    {selectedPlanetsForComparison.map((planet) => (
                      <th key={planet} className={`text-center p-3 ${getColorForPlanet(planet)} capitalize`}>
                        {planet}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Basic Properties */}
                  <tr className="border-b border-white/10">
                    <td className="p-3 text-gray-300 font-medium">Distance from Sun</td>
                    {selectedPlanetsForComparison.map((planet) => {
                      const data = getComparisonData(planet)
                      return (
                        <td key={planet} className="p-3 text-center text-white">
                          {data ? formatDistance(data.distanceFromSun) : 'N/A'}
                        </td>
                      )
                    })}
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-3 text-gray-300 font-medium">Radius</td>
                    {selectedPlanetsForComparison.map((planet) => {
                      const data = getComparisonData(planet)
                      return (
                        <td key={planet} className="p-3 text-center text-white">
                          {data ? `${formatNumber(data.radius)} km` : 'N/A'}
                          <div className="text-xs text-gray-400 mt-1">
                            {data ? `${formatNumber(data.radiusComparisonToEarth)}× Earth` : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-3 text-gray-300 font-medium">Mass</td>
                    {selectedPlanetsForComparison.map((planet) => {
                      const data = getComparisonData(planet)
                      return (
                        <td key={planet} className="p-3 text-center text-white">
                          {data ? formatMass(data.mass) : 'N/A'}
                          <div className="text-xs text-gray-400 mt-1">
                            {data ? `${formatNumber(data.massComparisonToEarth)}× Earth` : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-3 text-gray-300 font-medium">Orbital Period</td>
                    {selectedPlanetsForComparison.map((planet) => {
                      const data = getComparisonData(planet)
                      return (
                        <td key={planet} className="p-3 text-center text-white">
                          {data ? `${formatNumber(data.orbitalPeriod)} days` : 'N/A'}
                          <div className="text-xs text-gray-400 mt-1">
                            {data ? `${formatNumber(data.orbitalPeriod / 365.25, 1)} Earth years` : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  <tr className="border-b border-white/10">
                    <td className="p-3 text-gray-300 font-medium">Surface Gravity</td>
                    {selectedPlanetsForComparison.map((planet) => {
                      const data = getComparisonData(planet)
                      return (
                        <td key={planet} className="p-3 text-center text-white">
                          {data ? `${formatNumber(data.surfaceGravity)} m/s²` : 'N/A'}
                          <div className="text-xs text-gray-400 mt-1">
                            {data ? `${formatNumber(data.surfaceGravityComparisonToEarth)}× Earth` : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  
                  {learningLevel !== 'elementary' && (
                    <tr className="border-b border-white/10">
                      <td className="p-3 text-gray-300 font-medium">Average Temperature</td>
                      {selectedPlanetsForComparison.map((planet) => {
                        const data = getComparisonData(planet)
                        return (
                          <td key={planet} className="p-3 text-center text-white">
                            {data ? `${formatNumber(data.averageTemperature)}°C` : 'N/A'}
                            <div className="text-xs text-gray-400 mt-1">
                              {data ? `${formatNumber(data.averageTemperature * 9/5 + 32)}°F` : ''}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Educational Facts */}
        {selectedPlanetsForComparison.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">🧠 Key Facts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedPlanetsForComparison.map((planet) => (
                <div key={planet} className="liquid-glass-panel p-4">
                  <h3 className={`font-bold mb-3 capitalize ${getColorForPlanet(planet)}`}>
                    {planet}
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                                         {getEducationalFacts(planet).map((fact: string, index: number) => (
                       <li key={index} className="flex items-start">
                         <span className="text-blue-400 mr-2 mt-1">•</span>
                         <span>{fact}</span>
                       </li>
                     ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Comparison */}
        {selectedPlanetsForComparison.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">📏 Size Comparison</h2>
            <div className="liquid-glass-panel p-6">
              <div className="flex items-end justify-center space-x-4 min-h-[200px]">
                {selectedPlanetsForComparison.map((planet) => {
                  const data = getComparisonData(planet)
                  if (!data) return null
                  
                  const maxRadius = Math.max(...selectedPlanetsForComparison.map(p => 
                    getComparisonData(p)?.radius || 0
                  ))
                  const sizeRatio = data.radius / maxRadius
                  const circleSize = Math.max(20, sizeRatio * 100)
                  
                  return (
                    <div key={planet} className="flex flex-col items-center">
                      <div
                        className={`rounded-full border-2 border-current ${getColorForPlanet(planet)} mb-2`}
                        style={{
                          width: `${circleSize}px`,
                          height: `${circleSize}px`,
                          backgroundColor: `currentColor`,
                          opacity: 0.3
                        }}
                      />
                      <div className="text-center">
                        <div className={`text-sm font-medium ${getColorForPlanet(planet)} capitalize`}>
                          {planet}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatNumber(data.radius)} km
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Learning Tips */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 mt-0.5">💡</span>
            <div className="text-sm text-gray-400">
              <p className="mb-2">
                <strong>Learning Tips:</strong>
              </p>
              <ul className="space-y-1">
                {learningLevel === 'elementary' && (
                  <>
                    <li>• Notice which planets are bigger or smaller than Earth</li>
                    <li>• See how far each planet is from the Sun</li>
                    <li>• Compare how long it takes each planet to go around the Sun</li>
                  </>
                )}
                {learningLevel === 'middle' && (
                  <>
                    <li>• Look for patterns between size, distance, and orbital period</li>
                    <li>• Consider how gravity differs on each planet</li>
                    <li>• Think about what makes each planet unique</li>
                  </>
                )}
                {learningLevel === 'high' && (
                  <>
                    <li>• Analyze the relationship between mass and gravity</li>
                    <li>• Consider how distance from the Sun affects temperature</li>
                    <li>• Examine the mathematical relationships between planetary properties</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 