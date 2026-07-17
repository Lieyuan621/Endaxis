/**
 * Extract combo window segments from the operator log for track-row
 * bottom-bar rendering (similar to combo skill cooldown bar style).
 *
 * Combo windows are `OPERATOR_EFFECT_APPLY` events whose id ends with `combo-window`
 * (the stable programmatic identifier set by collect.ts).
 * They are NOT rendered through TimelineBuffLayer — instead they get a dedicated
 * thin horizontal bar at the bottom of the track row.
 *
 * Merging is handled implicitly by the state-machine approach:
 * multiple APPLY events before an EXPIRE are collapsed into a single window
 * from the first apply to the expire.
 */
import type {
  OperatorStateEvent,
  OperatorEffectApplyEvent,
  OperatorEffectExpireEvent,
} from '@/simulation/engine/types';
import { timeToFrame } from '@/utils/time';

export interface ComboWindowSegment {
  /** Visible segment start time. This may be later than the original window start after splitting. */
  start: number;
  /** Visible segment end time, clipped by the projection max time. */
  end: number;
  /** Visible segment duration, equal to `end - start`. */
  duration: number;
  /** Render color for the combo window bar. */
  color: string;
  /** Original combo window apply time. Used for queue-order checks after perfect-timing splits. */
  windowStart: number;
  /** True when this visible slice overlaps a perfect-timing window. */
  perfectTiming?: boolean;
}

export type ComboWindowLayout = ComboWindowSegment[];

const COMBO_WINDOW_COLOR = '#fdd900'; // gold — matches comboSkill theme color

type Marker = { kind: 'apply' | 'expire'; time: number };

export function projectComboWindows(
  operatorLog: OperatorStateEvent[],
  trackId: string,
  maxTime: number,
  suffix = 'combo-window',
): ComboWindowLayout {
  const markers: Marker[] = [];

  for (const e of operatorLog) {
    if (
      e.type === 'OPERATOR_EFFECT_APPLY' &&
      (e as OperatorEffectApplyEvent).targetTrackId === trackId
    ) {
      const ae = e as OperatorEffectApplyEvent;
      if (ae.id.endsWith(suffix)) {
        markers.push({ kind: 'apply', time: ae.time });
      }
    }
    if (
      e.type === 'OPERATOR_EFFECT_EXPIRE' &&
      (e as OperatorEffectExpireEvent).targetTrackId === trackId
    ) {
      const ee = e as OperatorEffectExpireEvent;
      if (ee.id.endsWith(suffix)) {
        markers.push({ kind: 'expire', time: ee.time });
      }
    }
  }

  if (markers.length === 0) return [];

  // Same-timestamp consume+reapply should close the old window before opening a new one.
  markers.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.kind === 'expire' ? -1 : 1; // expire before apply at same tick
  });

  const segments: ComboWindowSegment[] = [];
  let windowStart: number | null = null;

  for (const m of markers) {
    if (m.kind === 'apply') {
      if (windowStart == null) windowStart = m.time;
      // else: window already open — skip this apply (it's a refresh/restack)
    } else {
      // expire
      if (windowStart != null) {
        const end = Math.min(m.time, maxTime);
        if (end > windowStart) {
          segments.push({
            start: windowStart,
            end,
            duration: end - windowStart,
            color: COMBO_WINDOW_COLOR,
            windowStart,
          });
        }
        windowStart = null;
      }
    }
  }

  // Close any window still open at end of timeline
  if (windowStart != null && maxTime > windowStart) {
    segments.push({
      start: windowStart,
      end: maxTime,
      duration: maxTime - windowStart,
      color: COMBO_WINDOW_COLOR,
      windowStart,
    });
  }

  return segments;
}

/**
 * Build a map of trackId → ComboWindowLayout for all tracks.
 * Perfect-timing windows are split into the combo window layout — they appear
 * as sub-segments within the main window, not as separate bars.
 */
export function projectAllComboWindows(
  operatorLog: OperatorStateEvent[],
  trackIds: string[],
  maxTime: number,
): Map<string, ComboWindowLayout> {
  const comboWindows = new Map<string, ComboWindowLayout>();
  for (const trackId of trackIds) {
    const raw = projectComboWindows(operatorLog, trackId, maxTime, 'combo-window');
    const pt = projectComboWindows(operatorLog, trackId, maxTime, 'combo-perfect-timing');
    const layout = mergeWithPerfectTiming(raw, pt);
    if (layout.length > 0) comboWindows.set(trackId, layout);
  }
  return comboWindows;
}

/**
 * Split combo window segments where perfect-timing overlaps, inserting
 * perfectTiming-flagged sub-segments.
 */
function mergeWithPerfectTiming(
  combo: ComboWindowSegment[],
  perfect: ComboWindowSegment[],
): ComboWindowSegment[] {
  if (perfect.length === 0) return combo;

  const times = new Set<number>();
  for (const s of combo) {
    times.add(s.start);
    times.add(s.end);
  }
  for (const s of perfect) {
    times.add(s.start);
    times.add(s.end);
  }
  const sorted = [...times].sort((a, b) => a - b);

  const segments: ComboWindowSegment[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const start = sorted[i - 1]!;
    const end = sorted[i]!;
    // Skip if both ends land on the same frame — no real duration
    if (timeToFrame(start) === timeToFrame(end)) continue;

    const comboSegment = combo.find(
      s => timeToFrame(start) >= timeToFrame(s.start) && timeToFrame(end) <= timeToFrame(s.end),
    );
    const inCombo = !!comboSegment;
    if (!inCombo) continue;

    const inPerfect = perfect.some(
      s => timeToFrame(start) >= timeToFrame(s.start) && timeToFrame(end) <= timeToFrame(s.end),
    );

    segments.push({
      start,
      end,
      duration: end - start,
      color: COMBO_WINDOW_COLOR,
      windowStart: comboSegment.windowStart,
      perfectTiming: inPerfect ? true : undefined,
    });
  }

  return segments;
}
