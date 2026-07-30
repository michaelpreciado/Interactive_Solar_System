/**
 * The live-readout channel.
 *
 * Values that change continuously -- the date, distances, light-travel time,
 * frame rate -- never enter React. A component binds a DOM node once via a ref
 * callback, and a 10 Hz publisher writes `textContent` directly.
 *
 * This is the difference between 10 React commits per second across the whole
 * tree and zero. It also means a readout can update while the camera is flying
 * without touching reconciliation at all.
 */

export type TelemetryField =
  | 'date'
  | 'time'
  | 'speed'
  | 'focusName'
  | 'focusDistance'
  | 'focusAltitude'
  | 'sunDistance'
  | 'lightTime'
  | 'fps'
  | 'frameMs'
  | 'drawCalls'
  | 'triangles'
  | 'tier'
  | 'accuracy';

const values = new Map<TelemetryField, string>();
const bindings = new Map<TelemetryField, Set<HTMLElement>>();

/**
 * Attach a DOM node to a field. Returns a cleanup function, so it can be used
 * directly as a React ref callback.
 */
export function bindTelemetry(field: TelemetryField, el: HTMLElement): () => void {
  let set = bindings.get(field);
  if (!set) {
    set = new Set();
    bindings.set(field, set);
  }
  set.add(el);
  const current = values.get(field);
  if (current !== undefined) el.textContent = current;
  return () => {
    set!.delete(el);
  };
}

/**
 * Publish new values. String-equality deduped, so an unchanged field costs one
 * map lookup and no DOM write.
 */
export function publishTelemetry(next: Partial<Record<TelemetryField, string>>): void {
  for (const key in next) {
    const field = key as TelemetryField;
    const value = next[field];
    if (value === undefined) continue;
    if (values.get(field) === value) continue;
    values.set(field, value);
    const set = bindings.get(field);
    if (!set) continue;
    for (const el of set) el.textContent = value;
  }
}

export function readTelemetry(field: TelemetryField): string {
  return values.get(field) ?? '';
}

/** Test/debug seam. */
export function clearTelemetry(): void {
  values.clear();
  bindings.clear();
}

// ---------------------------------------------------------------- formatters

const NBSP = ' '; // thin space, for digit grouping that doesn't wrap

export function formatDistanceKm(km: number): string {
  if (km < 1000) return `${km.toFixed(0)}${NBSP}km`;
  if (km < 1e6) return `${(km / 1000).toFixed(1)}${NBSP}thousand${NBSP}km`;
  if (km < 1.5e8) return `${(km / 1e6).toFixed(2)}${NBSP}million${NBSP}km`;
  return `${(km / 149597870.7).toFixed(3)}${NBSP}AU`;
}

export function formatLightTime(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)}${NBSP}ms`;
  if (seconds < 90) return `${seconds.toFixed(1)}${NBSP}seconds`;
  if (seconds < 5400) return `${(seconds / 60).toFixed(1)}${NBSP}minutes`;
  if (seconds < 172800) return `${(seconds / 3600).toFixed(1)}${NBSP}hours`;
  return `${(seconds / 86400).toFixed(1)}${NBSP}days`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${y}`;
}

export function formatClock(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m} UTC`;
}

export function formatSpeed(daysPerSecond: number): string {
  if (daysPerSecond === 0) return 'Paused';
  const abs = Math.abs(daysPerSecond);
  const sign = daysPerSecond < 0 ? '-' : '';
  if (abs < 1 / 3600) return `${sign}${(abs * 86400).toFixed(1)}${NBSP}sec/s`;
  if (abs < 1) return `${sign}${(abs * 24).toFixed(1)}${NBSP}hours/s`;
  if (abs < 30) return `${sign}${abs.toFixed(1)}${NBSP}days/s`;
  if (abs < 365) return `${sign}${(abs / 30.44).toFixed(1)}${NBSP}months/s`;
  return `${sign}${(abs / 365.25).toFixed(1)}${NBSP}years/s`;
}
