/**
 * The time scrubber.
 *
 * A physical jog wheel rather than a slider. Dragging spins it; releasing lets
 * it coast to a stop against friction; the detent ticks give it a texture you
 * can feel through the pointer. It scrubs the simulation clock directly, never
 * through React state, so a scrub is smooth at any frame rate.
 *
 * The design bet: a range input maps a 250-year span onto ~300 pixels, which
 * makes fine control impossible and coarse control unsatisfying. A wheel is
 * *rate*-based, so the same gesture gives you a day or a decade depending on
 * how hard you throw it.
 */

import { useCallback, useEffect, useRef } from 'react';
import { simClock } from '../../sim/SimClock';
import { uiState } from '../../state/uiStore';

const TICKS = 48;
/** Days of simulation time per pixel of drag. */
const DAYS_PER_PIXEL = 1.6;
const FRICTION = 3.4;

interface JogWheelProps {
  size?: number;
}

export function JogWheel({ size = 92 }: JogWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  const state = useRef({
    dragging: false,
    lastAngle: 0,
    angle: 0,
    velocity: 0,
    pointerId: -1,
    raf: 0,
  });

  const angleFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = state.current;

    const applyRotation = (delta: number) => {
      s.angle += delta;
      if (dialRef.current) {
        dialRef.current.style.transform = `rotate(${s.angle}rad)`;
      }
      // Arc length at the rim, converted to simulation days.
      simClock.setJD(simClock.jd + delta * (size / 2) * DAYS_PER_PIXEL, false);
    };

    const tick = () => {
      if (!s.dragging && Math.abs(s.velocity) > 1e-4) {
        const dt = 1 / 60;
        applyRotation(s.velocity * dt);
        s.velocity *= Math.exp(-FRICTION * dt);
        s.raf = requestAnimationFrame(tick);
      } else if (!s.dragging) {
        s.velocity = 0;
        s.raf = 0;
      } else {
        s.raf = requestAnimationFrame(tick);
      }
    };

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      s.pointerId = e.pointerId;
      s.dragging = true;
      s.velocity = 0;
      s.lastAngle = angleFromEvent(e.clientX, e.clientY);
      if (!s.raf) s.raf = requestAnimationFrame(tick);
      el.classList.add('is-grabbing');
    };

    const onMove = (e: PointerEvent) => {
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      const a = angleFromEvent(e.clientX, e.clientY);
      // Unwrap across the +/-pi discontinuity, or a drag past 6 o'clock spins
      // the clock by a full turn in the wrong direction.
      let delta = a - s.lastAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      s.lastAngle = a;
      applyRotation(delta);
      // Exponential average, so a flick releases with the speed it had at the
      // end rather than its average over the whole gesture.
      s.velocity = s.velocity * 0.65 + (delta * 60) * 0.35;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== s.pointerId) return;
      s.dragging = false;
      s.pointerId = -1;
      el.classList.remove('is-grabbing');
      if (uiState().reducedMotion) s.velocity = 0;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      if (s.raf) cancelAnimationFrame(s.raf);
    };
  }, [angleFromEvent, size]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 30 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      simClock.setJD(simClock.jd - step);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      simClock.setJD(simClock.jd + step);
      e.preventDefault();
    } else if (e.key === 'Home') {
      simClock.toNow();
      e.preventDefault();
    }
  };

  return (
    <div
      ref={ref}
      className="jog-wheel"
      style={{ width: size, height: size }}
      role="slider"
      tabIndex={0}
      aria-label="Scrub through time"
      aria-valuetext="Drag to move through time"
      onKeyDown={onKeyDown}
    >
      <div ref={dialRef} className="jog-wheel__dial">
        {Array.from({ length: TICKS }, (_, i) => (
          <span
            key={i}
            className={`jog-wheel__tick${i % 4 === 0 ? ' is-major' : ''}`}
            style={{ transform: `rotate(${(i / TICKS) * 360}deg) translateY(-${size / 2 - 5}px)` }}
          />
        ))}
      </div>
      <div className="jog-wheel__hub">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M12 6v6l4 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
