/**
 * A text node bound to the telemetry channel.
 *
 * Renders exactly once. Afterwards the driver writes its `textContent`
 * directly at 10 Hz, so a live distance readout costs zero React commits.
 */

import { useCallback } from 'react';
import { bindTelemetry, type TelemetryField } from '../state/telemetry';

interface LiveProps {
  field: TelemetryField;
  className?: string;
}

export function Live({ field, className }: LiveProps) {
  const ref = useCallback(
    (el: HTMLSpanElement | null) => {
      if (!el) return;
      return bindTelemetry(field, el);
    },
    [field]
  );
  return <span ref={ref} className={className} />;
}
