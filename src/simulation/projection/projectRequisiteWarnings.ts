import { getOperator } from '@/data';
import type { SpPoint } from './projectSpSeries';
import type { GaugePoint } from './projectUltimateSeries';
import { snapTimeToFrame } from '@/utils/time';
import type { ComboWindowLayout } from './projectComboWindows';

/** A skill that cannot execute because its prerequisite is unmet. */
export type RequisiteWarning =
  | { kind: 'comboWindow' }
  | { kind: 'comboOrder'; blockingTrackId: string }
  | { kind: 'sp'; need: number; current: number }
  | { kind: 'gauge'; need: number; current: number };

interface TrackData {
  id?: string;
  actions?: {
    isDisabled?: boolean;
    startTime?: number;
    type?: string;
    instanceId?: string;
    spCost?: number;
    gaugeCost?: number;
  }[];
  operatorStatus?: {
    ultimateEnergyCostReduction?: number;
  };
}

interface ActiveComboWindow {
  trackId: string;
  trackIndex: number;
  windowStart: number;
}

/** Binary-search SP value just before `time`.
 *  Same-frame hours have two points (pre-deduction, post-deduction).
 *  `actionId` identifies which deduction belongs to this action. */
function spAtTime(series: SpPoint[], time: number, actionId?: string): number {
  if (!series.length) return 0;
  if (time <= 0) return Number(series[0]!.sp) || 0;
  let lo = 0;
  let hi = series.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (snapTimeToFrame(series[mid]!.time) <= time) lo = mid;
    else hi = mid - 1;
  }
  // If this is the deduction point for our action, back up to the pre-deduction point
  if (actionId && lo > 0 && (series[lo] as any).actionId === actionId) lo--;
  return Number(series[lo]!.sp) || 0;
}

/** Binary-search gauge value just before `time`.
 *  Same-frame hours have two points (pre-consumption, post-consumption). */
function gaugeAtTime(series: GaugePoint[], time: number): number {
  if (!series.length) return 0;
  if (time <= 0) return Number(series[0]!.val) || 0;
  let lo = 0;
  let hi = series.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (snapTimeToFrame(series[mid]!.time) <= time) lo = mid;
    else hi = mid - 1;
  }
  // If the point at this time is post-consumption, back up to the pre-consumption point
  while (lo > 0 && snapTimeToFrame(series[lo - 1]!.time) === snapTimeToFrame(series[lo]!.time))
    lo--;
  return Number(series[lo]!.val) || 0;
}

function isInComboWindow(seg: ComboWindowLayout[number], time: number): boolean {
  return time >= snapTimeToFrame(seg.start) && time <= snapTimeToFrame(seg.end);
}

function getActiveComboWindow(
  layout: ComboWindowLayout,
  time: number,
): ActiveComboWindow['windowStart'] | null {
  const activeSegments = layout.filter(seg => isInComboWindow(seg, time));
  if (!activeSegments.length) return null;

  activeSegments.sort((left, right) => {
    const leftStart = snapTimeToFrame(left.windowStart);
    const rightStart = snapTimeToFrame(right.windowStart);
    if (leftStart !== rightStart) return leftStart - rightStart;
    return snapTimeToFrame(left.start) - snapTimeToFrame(right.start);
  });

  const first = activeSegments[0]!;
  return snapTimeToFrame(first.windowStart);
}

function getActiveComboQueue(
  tracks: TrackData[],
  comboWindowLayouts: Map<string, ComboWindowLayout>,
  time: number,
): ActiveComboWindow[] {
  const active: ActiveComboWindow[] = [];

  tracks.forEach((track, trackIndex) => {
    const trackId = track.id;
    if (!trackId) return;
    const windowStart = getActiveComboWindow(comboWindowLayouts.get(trackId) ?? [], time);
    if (windowStart == null) return;
    active.push({ trackId, trackIndex, windowStart });
  });

  active.sort((left, right) => {
    if (left.windowStart !== right.windowStart) return left.windowStart - right.windowStart;
    return left.trackIndex - right.trackIndex;
  });

  return active;
}

/**
 * Build a map of actionId → RequisiteWarning for all skill blocks
 * that cannot execute because their prerequisites are unmet.
 *
 * Four checks:
 * - comboSkill  → must overlap a combo window (if the operator has one)
 * - comboSkill  → active combo windows must be consumed in queue order
 * - battleSkill → must have enough SP at start time
 * - ultimate     → must have enough gauge at start time
 *
 * Disabled actions (isDisabled) are skipped entirely.
 * Combo checks use frame-snapped times to avoid floating-point drift
 * when the action's stored startTime differs from the expire event that
 * closed the window.
 */
export function projectRequisiteWarnings(
  tracks: TrackData[],
  comboWindowLayouts: Map<string, ComboWindowLayout>,
  spSeries: SpPoint[],
  gaugeSeriesByTrackId: Map<string, GaugePoint[]>,
): Map<string, RequisiteWarning> {
  const warnings = new Map<string, RequisiteWarning>();

  for (const track of tracks) {
    const tid = track.id;
    if (!tid || !track.actions) continue;

    // Determine once per track — does this operator define a comboWindow?
    const hasComboWindow = !!(
      track.id && getOperator(track.id)?.combatSkills?.comboSkill?.comboWindow
    );
    const gaugeSeries = gaugeSeriesByTrackId.get(tid) ?? [];
    const comboWindowLayout = comboWindowLayouts.get(tid) ?? [];

    for (const a of track.actions) {
      if (a.isDisabled || !a.instanceId) continue;
      // TODO Some times are frame-snapped, others not — comparison breaks.
      //  Solutions besides sprinkling snapTimeToFrame everywhere?
      const start = snapTimeToFrame(a.startTime ?? 0);

      // ── Combo skill: must overlap a combo window ────────────────────
      if (a.type === 'comboSkill') {
        if (!hasComboWindow) continue;
        if (!comboWindowLayout.some(seg => isInComboWindow(seg, start))) {
          warnings.set(a.instanceId, { kind: 'comboWindow' });
          continue;
        }

        const activeComboQueue = getActiveComboQueue(tracks, comboWindowLayouts, start);
        const firstWindow = activeComboQueue[0];
        if (firstWindow && firstWindow.trackId !== tid) {
          warnings.set(a.instanceId, {
            kind: 'comboOrder',
            blockingTrackId: firstWindow.trackId,
          });
        }
        continue;
      }

      // ── Battle skill: SP at action start ≥ spCost ───────────────────
      if (a.type === 'battleSkill') {
        const sc = Number(a.spCost) || 0;
        if (sc > 0) {
          const now = spAtTime(spSeries, start, a.instanceId);
          if (now < sc) {
            warnings.set(a.instanceId, { kind: 'sp', need: sc, current: now });
          }
        }
        continue;
      }

      // ── Ultimate: gauge at action start ≥ gaugeCost ─────────────────
      if (a.type === 'ultimate') {
        const rawCost = Number(a.gaugeCost) || 0;
        if (rawCost > 0) {
          // TODO ultimateEnergyCostReduction is scattered — consolidate or just compute max once and always deduct to 0?
          const reduction = Number(track?.operatorStatus?.ultimateEnergyCostReduction) || 0;
          const effectiveCost = rawCost * (1 - Math.max(0, Math.min(reduction, 0.99)));
          const now = gaugeAtTime(gaugeSeries, start);
          if (now < effectiveCost) {
            warnings.set(a.instanceId, { kind: 'gauge', need: effectiveCost, current: now });
          }
        }
        continue;
      }
    }
  }

  return warnings;
}
