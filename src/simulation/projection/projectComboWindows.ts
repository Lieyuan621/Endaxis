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

export interface ComboWindowSegment {
  start: number;
  end: number;
  duration: number;
  color: string;
}

export type ComboWindowLayout = ComboWindowSegment[];

const COMBO_WINDOW_COLOR = '#fdd900'; // gold — matches comboSkill theme color

type Marker = { kind: 'apply' | 'expire'; time: number };

export function projectComboWindows(
  operatorLog: OperatorStateEvent[],
  trackId: string,
  maxTime: number,
): ComboWindowLayout {
  const markers: Marker[] = [];

  for (const e of operatorLog) {
    if (e.type === 'OPERATOR_EFFECT_APPLY' && (e as OperatorEffectApplyEvent).targetTrackId === trackId) {
      const ae = e as OperatorEffectApplyEvent;
      if (ae.id.endsWith('combo-window')) {
        markers.push({ kind: 'apply', time: ae.time });
      }
    }
    if (e.type === 'OPERATOR_EFFECT_EXPIRE' && (e as OperatorEffectExpireEvent).targetTrackId === trackId) {
      const ee = e as OperatorEffectExpireEvent;
      if (ee.id.endsWith('combo-window')) {
        markers.push({ kind: 'expire', time: ee.time });
      }
    }
  }

  if (markers.length === 0) return [];

  // Stable sort: apply then expire at the same timestamp (consume+reapply in same tick)
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
    });
  }

  return segments;
}

/**
 * Build a map of trackId → ComboWindowLayout for all tracks.
 */
export function projectAllComboWindows(
  operatorLog: OperatorStateEvent[],
  trackIds: string[],
  maxTime: number,
): Map<string, ComboWindowLayout> {
  const result = new Map<string, ComboWindowLayout>();
  for (const trackId of trackIds) {
    const layout = projectComboWindows(operatorLog, trackId, maxTime);
    if (layout.length > 0) {
      result.set(trackId, layout);
    }
  }
  return result;
}
