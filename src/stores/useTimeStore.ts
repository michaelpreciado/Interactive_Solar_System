import { create } from 'zustand';

const J2000_JULIAN_DATE = 2451545.0;
const DAYS_PER_YEAR = 365.25;
const UNIX_EPOCH_JULIAN_DATE = 2440587.5;
const MILLISECONDS_PER_DAY = 86400000;
const MIN_TIME_YEAR = 0;
const MAX_TIME_YEAR = 10000;

interface TimeStore {
  currentTime: number;
  julianDate: number;
  currentDate: string;
  isPlaying: boolean;
  timeSpeed: number;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setTimeSpeed: (speed: number) => void;
  tick: () => void;
}

const clampTime = (time: number): number =>
  Math.max(MIN_TIME_YEAR, Math.min(MAX_TIME_YEAR, time));

const getFallbackYearLabel = (julianDate: number): string => {
  const calculatedYear = Math.floor(
    2000 + (julianDate - J2000_JULIAN_DATE) / DAYS_PER_YEAR
  );
  return `Year ${calculatedYear}`;
};

const yearToJulianDate = (year: number): number =>
  J2000_JULIAN_DATE + year * DAYS_PER_YEAR;

const julianDateToString = (julianDate: number): string => {
  if (!Number.isFinite(julianDate)) {
    return getFallbackYearLabel(J2000_JULIAN_DATE);
  }

  const jsDate = new Date(
    (julianDate - UNIX_EPOCH_JULIAN_DATE) * MILLISECONDS_PER_DAY
  );
  if (!Number.isFinite(jsDate.getTime())) {
    return getFallbackYearLabel(julianDate);
  }

  const year = jsDate.getUTCFullYear();
  if (year < 1 || year > 9999) {
    return getFallbackYearLabel(julianDate);
  }

  const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useTimeStore = create<TimeStore>((set, get) => ({
  currentTime: 0,
  julianDate: yearToJulianDate(0),
  currentDate: julianDateToString(yearToJulianDate(0)),
  isPlaying: false,
  timeSpeed: 1,

  setCurrentTime: (time) => {
    const clampedTime = clampTime(time);
    const julianDate = yearToJulianDate(clampedTime);

    set({
      currentTime: clampedTime,
      julianDate,
      currentDate: julianDateToString(julianDate),
    });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setTimeSpeed: (speed) => {
    if (!Number.isFinite(speed) || speed <= 0) {
      return;
    }

    set({ timeSpeed: speed });
  },

  tick: () => {
    const { currentTime, isPlaying, timeSpeed } = get();
    if (!isPlaying) {
      return;
    }

    const timeIncrement = timeSpeed / (60 * DAYS_PER_YEAR);
    const newTime = currentTime + timeIncrement;
    get().setCurrentTime(newTime > MAX_TIME_YEAR ? MIN_TIME_YEAR : newTime);
  },
}));

export { yearToJulianDate, julianDateToString };
