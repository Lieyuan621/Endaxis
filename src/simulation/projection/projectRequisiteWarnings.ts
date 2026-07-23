import { getOperator } from '@/data';
import type { SpPoint } from './projectSpSeries';
import type { GaugePoint } from './projectUltimateSeries';
import { snapTimeToFrame } from '@/utils/time';
import type { ComboWindowLayout } from './projectComboWindows';
import type { OperatorStateEvent } from '@/simulation/engine/types';
import type { SimLogEntry } from '@/simulation/events/event.types';

const COMBO_SKILL_TYPE = 'comboSkill';
const COMBO_WINDOW_EFFECT_ID_SUFFIX = 'combo-window';

/**
 * Sum the active `ultimateEnergyCostReduction` status buffs on a track at `time`, as a percentage
 * (value*stacks; 100 = 100%). This is the DYNAMIC, per-cast reduction (e.g. a temporary "free ult"
 * buff) that the compile-time static max-gauge reduction cannot represent — so ult-cost requisite
 * checks must fold it in at the specific cast time.
 */
function sumActiveUltReductionPct(
  operatorLog: OperatorStateEvent[],
  trackId: string,
  time: number,
): number {
  const appliesById = new Map<string, { time: number; value: number; stacks: number }[]>();
  const expiresById = new Map<string, number[]>();
  for (const e of operatorLog) {
    if (e.targetTrackId !== trackId) continue;
    if (e.type === 'OPERATOR_EFFECT_APPLY') {
      if (e.stat?.modifier !== 'ultimateEnergyCostReduction') continue;
      const list = appliesById.get(e.id) ?? [];
      list.push({ time: e.time, value: e.value, stacks: e.cumulativeStacks ?? e.stacks ?? 1 });
      appliesById.set(e.id, list);
    } else if (e.type === 'OPERATOR_EFFECT_EXPIRE') {
      const list = expiresById.get(e.id) ?? [];
      list.push(e.time);
      expiresById.set(e.id, list);
    }
  }
  const eps = 1e-6;
  let pct = 0;
  for (const [id, applies] of appliesById) {
    const active = applies
      .filter(a => a.time <= time + eps)
      .sort((a, b) => a.time - b.time)
      .pop();
    if (!active) continue;
    const expired = (expiresById.get(id) ?? []).some(t => t > active.time + eps && t <= time + eps);
    if (expired) continue;
    pct += active.value * active.stacks;
  }
  return pct;
}

/** A skill that cannot execute because its prerequisite is unmet. */
export type RequisiteWarning =
  | { kind: 'comboWindow' }
  | { kind: 'comboOrder'; blockingTrackId: string }
  | { kind: 'sp'; need: number; current: number }
  | { kind: 'gauge'; need: number; current: number }
  | {
      kind: 'skillRequisite';
      requisiteId: string;
      messageKey?: string;
      params?: Record<string, unknown>;
    };

interface RegisteredTriggerEffect {
  sourceTrackId?: string;
  sourceSkillType?: string;
  triggerEffect?: {
    effects?: RegisteredEffect[];
  };
}

interface RegisteredEffect {
  kind?: string;
  id?: string;
  name?: string;
}

interface TrackData {
  id?: string;
  triggerEffects?: RegisteredTriggerEffect[];
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

/** Build instanceId → SpPoint[] map for SP deduction lookups. */
function buildSpIndex(spSeries: SpPoint[]): Map<string, SpPoint[]> {
  const index = new Map<string, SpPoint[]>();
  for (const p of spSeries) {
    const id = (p as any).actionId as string | undefined;
    if (!id) continue;
    let arr = index.get(id);
    if (!arr) {
      arr = [];
      index.set(id, arr);
    }
    arr.push(p);
  }
  return index;
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

function operatorSheetDefinesComboWindow(trackId: string): boolean {
  const operator = getOperator(trackId);
  if (!operator) return false;
  if (operator.combatSkills?.comboSkill?.comboWindow) return true;
  return (operator.forms?.forms ?? []).some(form => !!form.combatSkills?.comboSkill?.comboWindow);
}

function isComboWindowEffect(effect: RegisteredEffect): boolean {
  if (effect.kind !== 'status') return false;
  return String(effect.id || '').endsWith(COMBO_WINDOW_EFFECT_ID_SUFFIX);
}

function isCurrentTrackComboTrigger(trackId: string, entry: RegisteredTriggerEffect): boolean {
  if (entry.sourceTrackId && entry.sourceTrackId !== trackId) return false;
  return entry.sourceSkillType === COMBO_SKILL_TYPE;
}

function hasRegisteredComboWindowTrigger(track: TrackData): boolean {
  const trackId = track.id;
  if (!trackId || !Array.isArray(track.triggerEffects)) return false;
  return track.triggerEffects.some(entry => {
    if (!isCurrentTrackComboTrigger(trackId, entry)) return false;
    return (entry.triggerEffect?.effects ?? []).some(isComboWindowEffect);
  });
}

function requiresComboWindowCheck(track: TrackData): boolean {
  if (!track.id) return false;

  // `triggerEffects` 是当前轨道实例/形态最终注册进模拟器的触发器。
  // 存在该字段时以它为准；没有该字段时再退回静态表，兼容轻量测试和旧数据。
  if (Array.isArray(track.triggerEffects)) {
    return hasRegisteredComboWindowTrigger(track);
  }

  return operatorSheetDefinesComboWindow(track.id);
}

/**
 * Build a map of actionId → RequisiteWarning for all skill blocks
 * that cannot execute because their prerequisites are unmet.
 *
 * Checks:
 * - comboSkill  → must overlap a combo window (if the operator has one)
 * - comboSkill  → active combo windows must be consumed in queue order
 * - battleSkill → SP_CHANGE log shows sp < 0 after cost deduction
 * - ultimate     → must have enough gauge at start time
 * - skill-specific release requisites emitted by the simulator
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
  operatorLog: OperatorStateEvent[] = [],
  simLog: SimLogEntry[] = [],
): Map<string, RequisiteWarning> {
  const warnings = new Map<string, RequisiteWarning>();
  const spIndex = buildSpIndex(spSeries);

  for (const track of tracks) {
    const tid = track.id;
    if (!tid || !track.actions) continue;

    const requiresComboWindow = requiresComboWindowCheck(track);
    const gaugeSeries = gaugeSeriesByTrackId.get(tid) ?? [];
    const comboWindowLayout = comboWindowLayouts.get(tid) ?? [];

    for (const a of track.actions) {
      if (a.isDisabled || !a.instanceId) continue;
      // TODO Some times are frame-snapped, others not — comparison breaks.
      //  Solutions besides sprinkling snapTimeToFrame everywhere?
      const start = snapTimeToFrame(a.startTime ?? 0);

      // ── Combo skill: must overlap a combo window ────────────────────
      if (a.type === COMBO_SKILL_TYPE) {
        if (!requiresComboWindow) continue;
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

      // ── Battle skill: find SP deduction in SpPoint log ─────────────
      if (a.type === 'battleSkill') {
        const points = spIndex.get(a.instanceId);
        if (!points) continue;
        for (const p of points) {
          const change = Number((p as any).change) || 0;
          // skip recovery, only check costs
          if (change >= 0) continue;
          const spAfter = Number(p.sp) || 0;
          if (spAfter < 0) {
            // change is negative, so spBefore = spAfter + |change|
            const spBefore = spAfter - change;
            warnings.set(a.instanceId, { kind: 'sp', need: -change, current: spBefore });
          }
          // first deduction is the cost
          break;
        }
        continue;
      }

      // ── Ultimate: gauge at action start ≥ gaugeCost ─────────────────
      if (a.type === 'ultimate') {
        const rawCost = Number(a.gaugeCost) || 0;
        if (rawCost > 0) {
          // Static reduction (fraction, from operatorStatus) is baked into the compile-time max gauge;
          // the DYNAMIC per-cast reduction (temporary ultimateEnergyCostReduction buffs active at this
          // cast, as a percentage) must be folded in here so a "free ult" buff clears the warning.
          const staticReduction = Number(track?.operatorStatus?.ultimateEnergyCostReduction) || 0;
          const dynamicReduction = sumActiveUltReductionPct(operatorLog, tid, start) / 100;
          const totalReduction = Math.max(0, Math.min(staticReduction + dynamicReduction, 1));
          const effectiveCost = rawCost * (1 - totalReduction);
          const now = gaugeAtTime(gaugeSeries, start);
          if (now < effectiveCost) {
            warnings.set(a.instanceId, { kind: 'gauge', need: effectiveCost, current: now });
          }
        }
        continue;
      }
    }
  }

  // Action-spec requisite
  // Overrides previous checks
  for (const entry of simLog) {
    if (entry.type !== 'ACTION_REQUISITE_FAILED') continue;
    const actionId = entry.payload?.actionId;
    if (!actionId) continue;
    warnings.set(actionId, {
      kind: 'skillRequisite',
      requisiteId: entry.payload.requisiteId,
      messageKey: entry.payload.messageKey,
      params: entry.payload.params,
    });
  }

  return warnings;
}
