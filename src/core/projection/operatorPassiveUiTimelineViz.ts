import type {
  NumericPassiveUiDefinition,
  LiinoPassiveUiDefinition,
  TyphoeaPassiveUiDefinition,
  AbilityEntityCountPassiveUiDefinition,
} from '../../../packages/game-data-contract/src/operators';
import { projectAbilityEntityCountStatus } from './abilityEntityCountStatus';
import type { AbilityEntityTargetRef } from '../game-data/logicalAbilityEntity';
/**
 * 把干员专属 UI 的离散回执投影成时间轴持续段。
 *
 * 专属 UI 不是 Buff，不能借用 Buff 身份；但二者都需要在时间轴上表达生命周期。
 * 数值型 UI 以“非零即存在”为边界，数值每次变化都会切出新段，从而保留变化过程。
 */
import type { OperatorPassiveUiDefinition } from '../game-data/operatorDefinition';
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

export interface OperatorPassiveUiTimelineSource {
  readonly operatorId: string;
  readonly definition: OperatorPassiveUiDefinition;
}

export type OperatorPassiveUiTimelineSegment =
  | (AbilityEntityCountPassiveUiDefinition & {
      readonly operatorId: string;
      readonly startFrame: number;
      readonly endFrame: number;
      readonly entities: readonly AbilityEntityTargetRef[];
    })
  | {
      readonly kind: 'numeric';
      readonly appearance: NumericPassiveUiDefinition['appearance'];
      readonly operatorId: string;
      readonly startFrame: number;
      readonly endFrame: number;
      readonly value: number;
      readonly maximum: number;
      readonly active: boolean;
    }
  | {
      readonly kind: 'buffProgress';
      readonly appearance: LiinoPassiveUiDefinition['appearance'];
      readonly operatorId: string;
      readonly startFrame: number;
      readonly endFrame: number;
      readonly mode: 'normal' | 'ultimate';
      readonly buffId: string;
      readonly instanceId: number;
    }
  | {
      readonly kind: 'buffCounters';
      readonly appearance: TyphoeaPassiveUiDefinition['appearance'];
      readonly operatorId: string;
      readonly startFrame: number;
      readonly endFrame: number;
      readonly battleArrows: number;
      readonly points: number;
      readonly maximumArrows: number;
      readonly maximumPoints: number;
    };

export type PositionedOperatorPassiveUiTimelineSegment = OperatorPassiveUiTimelineSegment & {
  readonly lane: number;
};

function numberData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): number | undefined {
  const value = data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizedNumericValue(value: number, maximum: number): number {
  return Math.min(maximum, Math.max(0, Math.round(value)));
}

function projectNumericSegments(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  source: OperatorPassiveUiTimelineSource & {
    readonly definition: NumericPassiveUiDefinition;
  },
): readonly OperatorPassiveUiTimelineSegment[] {
  const segments: OperatorPassiveUiTimelineSegment[] = [];
  let value = 0;
  let startFrame = 0;

  const close = (frame: number): void => {
    if (value === 0 || frame <= startFrame) return;
    segments.push({
      kind: 'numeric',
      appearance: source.definition.appearance,
      operatorId: source.operatorId,
      startFrame,
      endFrame: frame,
      value,
      maximum: source.definition.maximum,
      active: source.definition.activeAt !== undefined && value >= source.definition.activeAt,
    });
  };

  for (const entry of entries) {
    if (
      entry.frame > endFrame ||
      entry.event !== 'CharacterPassiveUiValueChanged' ||
      entry.targetId !== source.operatorId
    ) {
      continue;
    }
    const rawValue = numberData(entry.data, 'value');
    if (rawValue === undefined) continue;
    const nextValue = normalizedNumericValue(rawValue, source.definition.maximum);
    if (nextValue === value) continue;
    close(entry.frame);
    value = nextValue;
    startFrame = entry.frame;
  }
  close(endFrame);
  return segments;
}

function projectLiinoSegments(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  source: OperatorPassiveUiTimelineSource & {
    readonly definition: LiinoPassiveUiDefinition;
  },
): readonly OperatorPassiveUiTimelineSegment[] {
  type OpenSegment = Extract<OperatorPassiveUiTimelineSegment, { readonly kind: 'buffProgress' }>;
  const segments: OperatorPassiveUiTimelineSegment[] = [];
  let open: OpenSegment | null = null;

  const close = (frame: number): void => {
    if (open !== null && frame > open.startFrame) segments.push({ ...open, endFrame: frame });
    open = null;
  };

  for (const entry of entries) {
    if (entry.frame > endFrame || entry.targetId !== source.operatorId) continue;
    const buffId = stringData(entry.data, 'buffId');
    const instanceId = numberData(entry.data, 'instanceId');
    if (buffId === undefined || instanceId === undefined) continue;
    const mode =
      buffId === source.definition.normalBuffId
        ? ('normal' as const)
        : buffId === source.definition.ultimateBuffId
          ? ('ultimate' as const)
          : null;
    if (mode === null) continue;

    if (entry.event === 'BuffApplied') {
      close(entry.frame);
      open = {
        kind: 'buffProgress',
        appearance: source.definition.appearance,
        operatorId: source.operatorId,
        startFrame: entry.frame,
        endFrame,
        mode,
        buffId,
        instanceId,
      };
    } else if (
      (entry.event === 'BuffFinished' || entry.event === 'BuffReleased') &&
      open?.buffId === buffId &&
      open.instanceId === instanceId
    ) {
      close(entry.frame);
    }
  }
  close(endFrame);
  return segments;
}

interface BuffCounterState {
  readonly battleArrows: number;
  readonly points: number;
}

function counterValue(entry: CombatReceiptEntry, maximum: number): number | undefined {
  if (entry.event !== 'BuffApplied') return undefined;
  return normalizedNumericValue(numberData(entry.data, 'layers') ?? 1, maximum);
}

function projectTyphoeaSegments(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  source: OperatorPassiveUiTimelineSource & {
    readonly definition: TyphoeaPassiveUiDefinition;
  },
): readonly OperatorPassiveUiTimelineSegment[] {
  const segments: OperatorPassiveUiTimelineSegment[] = [];
  let state: BuffCounterState = { battleArrows: 0, points: 0 };
  let startFrame = 0;
  const close = (frame: number): void => {
    if (frame <= startFrame || (state.battleArrows === 0 && state.points === 0)) return;
    segments.push({
      kind: 'buffCounters',
      appearance: source.definition.appearance,
      operatorId: source.operatorId,
      startFrame,
      endFrame: frame,
      ...state,
      maximumArrows: source.definition.maximumArrows,
      maximumPoints: source.definition.maximumPoints,
    });
  };

  for (const entry of entries) {
    if (entry.frame > endFrame || entry.targetId !== source.operatorId) continue;
    const buffId = stringData(entry.data, 'buffId');
    if (buffId === undefined) continue;
    const field =
      buffId === source.definition.battleArrowBuffId
        ? ('battleArrows' as const)
        : buffId === source.definition.pointBuffId
          ? ('points' as const)
          : null;
    if (field === null) continue;
    const maximum =
      field === 'points' ? source.definition.maximumPoints : source.definition.maximumArrows;
    const nextValue =
      entry.event === 'BuffFinished' || entry.event === 'BuffReleased'
        ? 0
        : counterValue(entry, maximum);
    if (nextValue === undefined || state[field] === nextValue) continue;
    close(entry.frame);
    state = { ...state, [field]: nextValue };
    startFrame = entry.frame;
  }
  close(endFrame);
  return segments;
}

export function projectOperatorPassiveUiTimelineViz(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  sources: readonly OperatorPassiveUiTimelineSource[],
): readonly OperatorPassiveUiTimelineSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  return sources.flatMap(source => {
    switch (source.definition.kind) {
      case 'abilityEntityCount': {
        const definition = source.definition;
        return projectAbilityEntityCountStatus(
          entries,
          endFrame,
          source.operatorId,
          definition.abilityEntityId,
        ).segments.map(segment => ({
          ...definition,
          ...segment,
          operatorId: source.operatorId,
        }));
      }
      case 'numeric':
        return projectNumericSegments(entries, endFrame, {
          ...source,
          definition: source.definition,
        });
      case 'buffProgress':
        return projectLiinoSegments(entries, endFrame, {
          ...source,
          definition: source.definition,
        });
      case 'buffCounters':
        return projectTyphoeaSegments(entries, endFrame, {
          ...source,
          definition: source.definition,
        });
    }
  });
}

/** 与 Buff 轨道相同的最早可复用 lane 排布；laneOffset 用于接在已有上方 Buff 后。 */
export function layoutOperatorPassiveUiTimelineSegments(
  segments: readonly OperatorPassiveUiTimelineSegment[],
  laneOffset = 0,
): readonly PositionedOperatorPassiveUiTimelineSegment[] {
  const laneEnds: number[] = [];
  return segments.map(segment => {
    let lane = laneEnds.findIndex(endFrame => endFrame <= segment.startFrame);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = segment.endFrame;
    return { ...segment, lane: lane + laneOffset };
  });
}
