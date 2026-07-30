/**
 * Performance overlay.
 *
 * Bound to the telemetry channel rather than React state, so the instrument
 * does not perturb the measurement.
 */

import { useUIStore } from '../state/uiStore';
import { Live } from '../ui/Live';

export function DebugHud() {
  const show = useUIStore((s) => s.showDebugHud);
  if (!show) return null;

  return (
    <div className="debug-hud" role="status" aria-label="Performance statistics">
      <Row label="FPS"><Live field="fps" /></Row>
      <Row label="Frame p95"><Live field="frameMs" /></Row>
      <Row label="Draw calls"><Live field="drawCalls" /></Row>
      <Row label="Triangles"><Live field="triangles" /></Row>
      <Row label="Tier"><Live field="tier" /></Row>
      <p className="debug-hud__hint">Press ` to hide</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="debug-hud__row">
      <span>{label}</span>
      <b>{children}</b>
    </div>
  );
}
