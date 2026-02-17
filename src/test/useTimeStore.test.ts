import { beforeEach, describe, expect, it } from 'vitest'
import { julianDateToString, useTimeStore, yearToJulianDate } from '../stores/useTimeStore'

describe('useTimeStore', () => {
  beforeEach(() => {
    useTimeStore.setState({
      currentTime: 0,
      julianDate: yearToJulianDate(0),
      currentDate: julianDateToString(yearToJulianDate(0)),
      isPlaying: false,
      timeSpeed: 1,
    })
  })

  it('clamps current time inputs into simulation range', () => {
    useTimeStore.getState().setCurrentTime(-50)
    expect(useTimeStore.getState().currentTime).toBe(0)

    useTimeStore.getState().setCurrentTime(12000)
    expect(useTimeStore.getState().currentTime).toBe(10000)
  })

  it('sanitizes invalid time speed values', () => {
    useTimeStore.getState().setTimeSpeed(Number.NaN)
    expect(useTimeStore.getState().timeSpeed).toBe(1)

    useTimeStore.getState().setTimeSpeed(5000)
    expect(useTimeStore.getState().timeSpeed).toBe(1000)
  })

  it('handles invalid julian values with a fallback year string', () => {
    expect(julianDateToString(Number.NaN)).toContain('Year')
  })
})
