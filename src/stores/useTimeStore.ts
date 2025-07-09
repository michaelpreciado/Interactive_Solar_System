import { create } from 'zustand'

interface TimeStore {
  // Current time in years (0-10000)
  currentTime: number
  
  // Current Julian date
  julianDate: number
  
  // Current formatted date string
  currentDate: string
  
  // Time controls
  isPlaying: boolean
  timeSpeed: number
  
  // Actions
  setCurrentTime: (time: number) => void
  setIsPlaying: (playing: boolean) => void
  setTimeSpeed: (speed: number) => void
  tick: () => void
}

// Convert year to Julian date
const yearToJulianDate = (year: number): number => {
  // J2000.0 epoch: January 1, 2000, 12:00 TT
  const J2000 = 2451545.0
  
  // For simplicity, use 365.25 days per year
  const daysPerYear = 365.25
  
  // Calculate Julian date
  return J2000 + (year * daysPerYear)
}

// Convert Julian date to readable date string
const julianDateToString = (julianDate: number): string => {
  try {
    // Convert Julian date to JavaScript date
    const jsDate = new Date((julianDate - 2440587.5) * 86400000)
    
    // Check if the date is valid
    if (isNaN(jsDate.getTime())) {
      // If invalid, fall back to a calculated year
      const year = Math.floor(2000 + (julianDate - 2451545) / 365.25)
      return `Year ${year}`
    }
    
    // Format the date
    const year = jsDate.getFullYear()
    const month = jsDate.getMonth() + 1
    const day = jsDate.getDate()
    
    // Handle extreme dates gracefully
    if (year < 1 || year > 9999) {
      const calculatedYear = Math.floor(2000 + (julianDate - 2451545) / 365.25)
      return `Year ${calculatedYear}`
    }
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  } catch (error) {
    // Fallback for any errors
    const year = Math.floor(2000 + (julianDate - 2451545) / 365.25)
    return `Year ${year}`
  }
}

export const useTimeStore = create<TimeStore>((set, get) => ({
  currentTime: 0, // Start at year 0 (2000 AD)
  julianDate: yearToJulianDate(0),
  currentDate: julianDateToString(yearToJulianDate(0)),
  isPlaying: false,
  timeSpeed: 1, // 1 day per second
  
  setCurrentTime: (time) => {
    const clampedTime = Math.max(0, Math.min(10000, time))
    const julianDate = yearToJulianDate(clampedTime)
    const currentDate = julianDateToString(julianDate)
    
    set({
      currentTime: clampedTime,
      julianDate,
      currentDate,
    })
  },
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  
  tick: () => {
    const { currentTime, isPlaying, timeSpeed } = get()
    
    if (!isPlaying) return
    
    // Calculate time increment based on speed
    // Speed 1 = 1 day per tick (at 60fps = 60 days per second)
    const timeIncrement = timeSpeed / (60 * 365.25) // Convert to years
    
    const newTime = currentTime + timeIncrement
    
    // Wrap around if we exceed the range
    if (newTime > 10000) {
      get().setCurrentTime(0)
    } else {
      get().setCurrentTime(newTime)
    }
  },
}))

// Export utility functions for external use
export { yearToJulianDate, julianDateToString } 