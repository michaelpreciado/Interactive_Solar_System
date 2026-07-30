/**
 * A text node bound to the telemetry channel.
 *
 * Renders exactly once. Afterwards the driver writes its `textContent`
 * directly at 10 Hz, so a live distance readout costs zero React commits.
 */

import { useEffect, useRef } from 'react';
import { bindTelemetry, type TelemetryField } from '../state/telemetry';

interface LiveProps {
  field: TelemetryField;
  className?: string;
}

export function Live({ field, className }: LiveProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // Binding has to happen in an effect, not in a ref callback. React 18
  // *ignores* a cleanup function returned from a ref callback (that is a React
  // 19 feature), so the unbind would never run and every unmounted node would
  // stay in the telemetry set forever. The inspector remounts on each focus
  // change, so that leaks a node per planet you visit.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return bindTelemetry(field, el);
  }, [field]);

  return <span ref={ref} className={className} />;
}
