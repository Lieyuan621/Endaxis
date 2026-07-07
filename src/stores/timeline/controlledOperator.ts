/**
 * Controlled-operator resolution.
 *
 * The "controlled operator" is whoever the player is actively controlling at a given moment. It is
 * derived (not stored): the initial controlled operator is the first track's operator, and each
 * `switchEvent` (created by the "switch character here" action) changes control from its time onward.
 *
 * These helpers are pure so they can be unit-tested without the Pinia store; the store wraps them
 * with its live `tracks` / `switchEvents` state.
 */

import type { SwitchEvent } from '@/simulation/compiler/types';

export interface ControlSegment {
  /** Inclusive start time of this control segment. */
  startTime: number;
  /** Operator (track) id in control during this segment, or null if none. */
  operatorId: string | null;
}

/**
 * Build the ordered list of control segments: the initial operator from time 0, followed by one
 * segment per switch event sorted by time ascending (stable — ties keep array order, so the
 * most-recently-added switch at a given time wins).
 */
export function buildControlledOperatorSegments(
  initialOperatorId: string | null,
  switchEvents: readonly SwitchEvent[] = [],
): ControlSegment[] {
  const segments: ControlSegment[] = [{ startTime: 0, operatorId: initialOperatorId ?? null }];

  const ordered = (switchEvents ?? [])
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => Number.isFinite(Number(event?.time)))
    .sort((a, b) => Number(a.event.time) - Number(b.event.time) || a.index - b.index);

  for (const { event } of ordered) {
    segments.push({ startTime: Number(event.time), operatorId: event.characterId ?? null });
  }

  return segments;
}

/**
 * Resolve the controlled operator (track id) at `time`: the latest switch event with `time <= T`,
 * or the initial operator when none applies. Returns null when nobody is in control.
 */
export function resolveControlledOperatorAt(
  initialOperatorId: string | null,
  switchEvents: readonly SwitchEvent[] = [],
  time: number,
): string | null {
  const t = Number(time);
  if (!Number.isFinite(t)) return initialOperatorId ?? null;

  const segments = buildControlledOperatorSegments(initialOperatorId, switchEvents);

  // Segments are time-ascending; the last one starting at or before t wins.
  let current = segments[0]?.operatorId ?? null;
  for (const segment of segments) {
    if (segment.startTime <= t) current = segment.operatorId;
    else break;
  }
  return current;
}
