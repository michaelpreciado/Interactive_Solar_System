import { describe, it, expect } from 'vitest'
import { getPlanetPositions, planetPositions } from '../utils/planetaryCalculations'

describe('Planetary Calculations', () => {
  it('should return 8 planets', () => {
    const julianDate = 2451545.0 // J2000.0 epoch
    const planets = getPlanetPositions(julianDate)
    
    expect(planets).toHaveLength(8)
    expect(planets.map(p => p.name)).toEqual([
      'Mercury', 'Venus', 'Earth', 'Mars', 
      'Jupiter', 'Saturn', 'Uranus', 'Neptune'
    ])
  })
  
  it('should calculate different positions for different dates', () => {
    const date1 = 2451545.0 // J2000.0 epoch
    const date2 = 2451545.0 + 365.25 // One year later
    
    const planets1 = getPlanetPositions(date1)
    const planets2 = getPlanetPositions(date2)
    
    // Planets should be in different positions
    expect(planets1[0].position.x).not.toBe(planets2[0].position.x)
    expect(planets1[0].position.y).not.toBe(planets2[0].position.y)
    expect(planets1[0].position.z).not.toBe(planets2[0].position.z)
  })
  
  it('should have correct planet properties', () => {
    const julianDate = 2451545.0
    const planets = getPlanetPositions(julianDate)
    
    const earth = planets.find(p => p.name === 'Earth')
    expect(earth).toBeDefined()
    expect(earth!.radius).toBe(1.0) // Earth radius as baseline
    expect(earth!.yearLength).toBe(365.25)
    expect(earth!.moons).toBe(1)
  })
  
  it('should maintain planet order by distance from Sun', () => {
    const julianDate = 2451545.0
    const planets = getPlanetPositions(julianDate)
    
    // Check that inner planets have smaller orbit radii
    const mercury = planets.find(p => p.name === 'Mercury')
    const venus = planets.find(p => p.name === 'Venus')
    const earth = planets.find(p => p.name === 'Earth')
    const mars = planets.find(p => p.name === 'Mars')
    
    expect(mercury!.orbitRadius).toBeLessThan(venus!.orbitRadius)
    expect(venus!.orbitRadius).toBeLessThan(earth!.orbitRadius)
    expect(earth!.orbitRadius).toBeLessThan(mars!.orbitRadius)
  })
  
  it('should have realistic planet colors', () => {
    const julianDate = 2451545.0
    const planets = getPlanetPositions(julianDate)
    
    const mars = planets.find(p => p.name === 'Mars')
    const jupiter = planets.find(p => p.name === 'Jupiter')
    const saturn = planets.find(p => p.name === 'Saturn')
    
    expect(mars!.color).toMatch(/^#[0-9a-f]{6}$/i) // Valid hex color
    expect(jupiter!.color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(saturn!.color).toMatch(/^#[0-9a-f]{6}$/i)
  })
  
  it('should export planetPositions function for WASM compatibility', () => {
    expect(typeof planetPositions).toBe('function')
    
    const julianDate = 2451545.0
    const planets = planetPositions(julianDate)
    
    expect(planets).toHaveLength(8)
    expect(planets[0]).toHaveProperty('name')
    expect(planets[0]).toHaveProperty('position')
    expect(planets[0]).toHaveProperty('radius')
  })
}) 