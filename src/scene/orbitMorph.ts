/**
 * Shared scale-morph value.
 *
 * The driver owns the spring; the orbit-line overlay reads the settled value.
 * A module-level cell rather than a store because this is written every frame
 * and must never touch React.
 */

let value = 0;

export function setOrbitMorph(v: number): void {
  value = v;
}

export function getOrbitMorph(): number {
  return value;
}
