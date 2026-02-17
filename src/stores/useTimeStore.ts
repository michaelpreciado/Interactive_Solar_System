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

const J2000_EPOCH = 2451545.0
const DAYS_PER_YEAR = 365.25
const MIN_SIMULATION_YEAR = 0
const MAX_SIMULATION_YEAR = 10000
const DEFAULT_TIME_SPEED = 1
const MIN_TIME_SPEED = 0.1
const MAX_TIME_SPEED = 1000

const clampValue = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

const sanitizeFiniteNumber = (input: number, fallback: number): number =>
  Number.isFinite(input) ? input : fallback

// Convert year to Julian date
const yearToJulianDate = (year: number): number => J2000_EPOCH + year * DAYS_PER_YEAR

// Convert Julian date to readable date string
const julianDateToString = (julianDate: number): string => {
  const millisecondsFromUnixEpoch = (julianDate - 2440587.5) * 86400000
  const jsDate = new Date(millisecondsFromUnixEpoch)

  if (!Number.isFinite(millisecondsFromUnixEpoch) || Number.isNaN(jsDate.getTime())) {
    const fallbackYear = Math.floor(2000 + (julianDate - J2000_EPOCH) / DAYS_PER_YEAR)
    return `Year ${fallbackYear}`
  }

  const year = jsDate.getUTCFullYear()
  const month = jsDate.getUTCMonth() + 1
  const day = jsDate.getUTCDate()

  if (year < 1 || year > 9999) {
    const fallbackYear = Math.floor(2000 + (julianDate - J2000_EPOCH) / DAYS_PER_YEAR)
    return `Year ${fallbackYear}`
  }

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export const useTimeStore = create<TimeStore>((set, get) => ({
  currentTime: 0,
  julianDate: yearToJulianDate(0),
  currentDate: julianDateToString(yearToJulianDate(0)),
  isPlaying: false,
  timeSpeed: DEFAULT_TIME_SPEED,

  setCurrentTime: (time) => {
    const normalizedInput = sanitizeFiniteNumber(time, MIN_SIMULATION_YEAR)
    const clampedTime = clampValue(normalizedInput, MIN_SIMULATION_YEAR, MAX_SIMULATION_YEAR)
    const julianDate = yearToJulianDate(clampedTime)

    set({
      currentTime: clampedTime,
      julianDate,
      currentDate: julianDateToString(julianDate),
    })
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setTimeSpeed: (speed) => {
    const normalizedSpeed = sanitizeFiniteNumber(speed, DEFAULT_TIME_SPEED)
    set({ timeSpeed: clampValue(normalizedSpeed, MIN_TIME_SPEED, MAX_TIME_SPEED) })
  },

  tick: () => {
    const { currentTime, isPlaying, timeSpeed } = get()

    if (!isPlaying) return

    const timeIncrement = timeSpeed / (60 * DAYS_PER_YEAR)
    const newTime = currentTime + timeIncrement

    get().setCurrentTime(newTime > MAX_SIMULATION_YEAR ? MIN_SIMULATION_YEAR : newTime)
  },
}))

export { yearToJulianDate, julianDateToString }
