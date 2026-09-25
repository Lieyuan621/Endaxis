/**
 * 把 Buff 生命周期回执投影成时间轴可画的持续段。
 * 这里只解释已发生的施加、叠层和结束事实；展示位置和样式属于 UI。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

export interface BuffTimelineSegment {
  readonly sourceId?: string;
  readonly sourceActionId?: string;
  readonly targetId: string;
  readonly buffId: string;
  readonly instanceId: number;
  readonly startFrame: number;
  /** 形成这一展示段的回执序号；同帧的多次叠层也必须分别截断。 */
  readonly startSequence?: number;
  readonly endFrame: number;
  /** 图标持续条的原生倒计时终点；缺省与 Buff 生命周期终点一致。 */
  readonly durationEndFrame?: number;
  readonly layers: number;
  /** 当前展示段从何种生命周期变化开始。 */
  readonly startReason?: 'applied' | 'reapplied' | 'presentationStarted';
  /** 当前展示段为何结束；simulationEnd 表示模拟结束时 Buff 仍然存在。 */
  readonly endReason?:
    | 'reapplied'
    | 'lifetime'
    | 'ignite'
    | 'early'
    | 'dispelled'
    | 'absorbed'
    | 'other'
    | 'released'
    | 'simulationEnd';
  /** 再次施加同一实例时，用于说明刷新、延长或叠层等具体行为。 */
  readonly stackingType?: string;
  /** 纯展示子 Buff 所跟随的父 Buff。 */
  readonly parentBuffId?: string;
  /** 原生 Buff 是否具有有限生命周期；用于 Default 图标样式的原生回退。 */
  readonly hasFiniteLifetime?: boolean;
  /** 旧版可视分区：干员来源位于技能块上方，配装来源位于下方。 */
  readonly placement: 'upper' | 'lower';
  /** 严格单属性修正的事实字段；本地化摘要由 UI 生成。 */
  readonly simpleModifierAttribute?: string;
  readonly simpleModifierSlot?: string;
  readonly simpleModifierValue?: number;
  readonly iconId?: string;
  readonly iconPath?: string;
  readonly showInHeadBarCommon?: boolean;
  readonly showInHeadBarAttached?: boolean;
  readonly showInSquadIcon?: boolean;
  readonly onlyShowForMainCharacter?: boolean;
  readonly showProgressInHpBar?: boolean;
  readonly showProgressInNormalSkillButton?: boolean;
  readonly useWeakProgressInNormalSkillButton?: boolean;
  readonly showProgressInUltimateSkillButton?: boolean;
  readonly showWarningBackground?: boolean;
  readonly iconStyleInSquad?: string;
  readonly abnormalColorType?: string;
  readonly orderUseDirectoryValue?: boolean;
  readonly orderPriorityValue?: number;
  readonly orderPriorityCategory?: string;
}

export interface PositionedBuffTimelineSegment extends BuffTimelineSegment {
  readonly lane: number;
}

/** 时间轴展示段。members 是该时段内实际生效的 Buff 实例切段。 */
export interface DisplayBuffTimelineSegment extends BuffTimelineSegment {
  /** 当前层数阶段内实际生效的实例切段。 */
  readonly members: readonly BuffTimelineSegment[];
  /** 本次重叠合并包含的全部原始窗口，供详情面板切换。 */
  readonly windows: readonly BuffTimelineSegment[];
}

export interface PositionedDisplayBuffTimelineSegment extends DisplayBuffTimelineSegment {
  readonly lane: number;
}

interface BuffInstanceRun {
  readonly startFrame: number;
  readonly endFrame: number;
  readonly segments: readonly BuffTimelineSegment[];
}

function buildContinuousInstanceRuns(
  segments: readonly BuffTimelineSegment[],
): readonly BuffInstanceRun[] {
  const byInstance = new Map<number, BuffTimelineSegment[]>();
  for (const segment of segments) {
    const values = byInstance.get(segment.instanceId) ?? [];
    values.push(segment);
    byInstance.set(segment.instanceId, values);
  }

  const runs: BuffInstanceRun[] = [];
  for (const values of byInstance.values()) {
    const sorted = [...values].sort((a, b) => a.startFrame - b.startFrame);
    let current: BuffTimelineSegment[] = [];
    let endFrame = -1;
    const flush = () => {
      if (current.length === 0) return;
      runs.push({ startFrame: current[0]!.startFrame, endFrame, segments: current });
    };
    for (const segment of sorted) {
      if (current.length > 0 && segment.startFrame > endFrame) {
        flush();
        current = [];
      }
      current.push(segment);
      endFrame = Math.max(endFrame, segment.endFrame);
    }
    flush();
  }
  return runs.sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
}

/**
 * 仅合并挂在同一目标上的同 ID Buff，且不同实例的连续生命周期必须真正重叠。
 * 每个输出段对应一次层数变化，层数为该时段内所有实例层数之和；归零不产生段。
 */
export function mergeOverlappingBuffTimelineSegments(
  segments: readonly BuffTimelineSegment[],
): readonly DisplayBuffTimelineSegment[] {
  const groups = new Map<string, BuffTimelineSegment[]>();
  for (const segment of segments) {
    const key = `${segment.targetId}\u0000${segment.buffId}`;
    const values = groups.get(key) ?? [];
    values.push(segment);
    groups.set(key, values);
  }

  const result: DisplayBuffTimelineSegment[] = [];
  for (const values of groups.values()) {
    const components: BuffInstanceRun[][] = [];
    for (const run of buildContinuousInstanceRuns(values)) {
      const current = components.at(-1);
      const componentEnd =
        current === undefined ? -1 : Math.max(...current.map(item => item.endFrame));
      if (current === undefined || run.startFrame >= componentEnd) components.push([run]);
      else current.push(run);
    }

    for (const component of components) {
      const componentSegments = component.flatMap(run => run.segments);
      if (component.length === 1) {
        result.push(
          ...componentSegments
            .filter(segment => segment.layers > 0)
            .map(segment => ({ ...segment, members: [segment], windows: [segment] })),
        );
        continue;
      }
      const placement = componentSegments[0]!.placement;
      const boundaries = [
        ...new Set(componentSegments.flatMap(s => [s.startFrame, s.endFrame])),
      ].sort((a, b) => a - b);
      for (let index = 0; index < boundaries.length - 1; index++) {
        const startFrame = boundaries[index]!;
        const endFrame = boundaries[index + 1]!;
        if (endFrame <= startFrame) continue;
        const members = componentSegments.filter(
          segment => segment.startFrame <= startFrame && segment.endFrame >= endFrame,
        );
        const layers = members.reduce((sum, segment) => sum + segment.layers, 0);
        if (layers <= 0 || members.length === 0) continue;
        const representative = members.at(-1)!;
        result.push({
          ...representative,
          placement,
          startFrame,
          endFrame,
          durationEndFrame: endFrame,
          layers,
          members,
          windows: componentSegments,
        });
      }
    }
  }
  return result.sort(
    (left, right) => left.startFrame - right.startFrame || left.instanceId - right.instanceId,
  );
}

/** 仅使用执行实例的可见段；末帧伤害可归属结束段，叠层边界优先使用新段。 */
export function findBuffTimelineSegmentForDamage<T extends BuffTimelineSegment>(
  entry: CombatReceiptEntry,
  segments: readonly T[],
): T | undefined {
  if (
    entry.event !== 'DamageApplied' ||
    typeof entry.data?.buffId !== 'string' ||
    typeof entry.data.buffOwnerId !== 'string' ||
    !Number.isInteger(entry.data.buffInstanceId)
  )
    return undefined;
  return segments
    .filter(segment => {
      const candidates =
        'members' in segment && Array.isArray(segment.members)
          ? (segment.members as readonly BuffTimelineSegment[])
          : [segment];
      return candidates.some(
        candidate =>
          candidate.targetId === entry.targetId &&
          candidate.targetId === entry.data!.buffOwnerId &&
          candidate.buffId === entry.data!.buffId &&
          candidate.instanceId === entry.data!.buffInstanceId &&
          candidate.startFrame <= entry.frame &&
          candidate.endFrame >= entry.frame,
      );
    })
    .sort((a, b) => b.startFrame - a.startFrame)[0];
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined)
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no data`);
  return entry.data;
}

function requireString(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no ${key}`);
  }
  return value;
}

function requireNumber(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no finite ${key}`);
  }
  return value;
}

function optionalString(
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string | undefined {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalBoolean(
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): boolean | undefined {
  const value = data[key];
  return typeof value === 'boolean' ? value : undefined;
}

function instanceKey(targetId: string, buffId: string, instanceId: number): string {
  return `${targetId}\u0000${buffId}\u0000${instanceId}`;
}

interface SimpleModifierFact {
  readonly simpleModifierAttribute: string;
  readonly simpleModifierSlot: string;
  readonly simpleModifierValue: number;
}

function simpleModifierFact(
  data: Readonly<Record<string, CombatReceiptValue>>,
): SimpleModifierFact | undefined {
  const simpleModifierAttribute = optionalString(data, 'simpleModifierAttribute');
  const simpleModifierSlot = optionalString(data, 'simpleModifierSlot');
  const simpleModifierValue = optionalNumber(data, 'simpleModifierValue');
  return simpleModifierAttribute === undefined ||
    simpleModifierSlot === undefined ||
    simpleModifierValue === undefined
    ? undefined
    : { simpleModifierAttribute, simpleModifierSlot, simpleModifierValue };
}

function sourceFrameKey(entry: CombatReceiptEntry): string | undefined {
  if (entry.targetId === undefined || entry.data === undefined) return undefined;
  const sourceActionId = optionalString(entry.data, 'sourceActionId');
  return sourceActionId === undefined
    ? undefined
    : `${entry.targetId}\u0000${sourceActionId}\u0000${entry.frame}`;
}

/**
 * 原生“战斗修正父 Buff + 纯展示子 Buff”会在同帧使用同一 sourceActionId。
 * 仅当该来源帧只有一种严格单属性事实时才允许展示子项继承摘要；多项效果保持无摘要。
 */
function collectUnambiguousModifierFacts(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, SimpleModifierFact> {
  const candidates = new Map<string, Map<string, SimpleModifierFact>>();
  for (const entry of entries) {
    if (entry.event !== 'BuffApplied' || entry.data === undefined) continue;
    const key = sourceFrameKey(entry);
    const fact = simpleModifierFact(entry.data);
    if (key === undefined || fact === undefined) continue;
    const identity = `${fact.simpleModifierAttribute}\u0000${fact.simpleModifierSlot}\u0000${fact.simpleModifierValue}`;
    const values = candidates.get(key) ?? new Map<string, SimpleModifierFact>();
    values.set(identity, fact);
    candidates.set(key, values);
  }
  return new Map(
    [...candidates].flatMap(([key, values]) =>
      values.size === 1 ? [[key, [...values.values()][0]!] as const] : [],
    ),
  );
}

function presentationPlacement(
  data: Readonly<Record<string, CombatReceiptValue>>,
): BuffTimelineSegment['placement'] {
  const sourceActionId = optionalString(data, 'sourceActionId');
  const equipmentInitialization =
    sourceActionId?.startsWith('upgrade-initialization:weapon-trait:') === true ||
    sourceActionId?.startsWith('upgrade-initialization:gear-trait:') === true ||
    sourceActionId?.startsWith('upgrade-initialization:gear-set:') === true;
  return sourceActionId?.startsWith('equipment:') === true || equipmentInitialization
    ? 'lower'
    : 'upper';
}

/**
 * 普通 Buff 仅展示原生开启头顶或队伍图标的状态。有图标资源不代表应当显示。
 * 显式 visible: false 仍优先隐藏；干员专属 UI 由独立投影负责。
 */
function isVisibleBuff(data: Readonly<Record<string, CombatReceiptValue>>): boolean {
  return (
    data.visible !== false &&
    (data.showInHeadBarCommon === true ||
      data.showInHeadBarAttached === true ||
      data.showInSquadIcon === true)
  );
}

export function projectBuffTimelineViz(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): readonly BuffTimelineSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  const open = new Map<string, BuffTimelineSegment>();
  const closed: BuffTimelineSegment[] = [];
  const inheritedModifierFacts = collectUnambiguousModifierFacts(entries);
  const iconDurationSourceFinishFrames = new Map<string, number>();
  for (const entry of entries) {
    if (
      (entry.event === 'AbilityEntityFinished' || entry.event === 'TimedMarkerFinished') &&
      entry.targetId !== undefined
    ) {
      iconDurationSourceFinishFrames.set(entry.targetId, entry.frame);
    }
  }

  for (const entry of entries) {
    const isApplied = entry.event === 'BuffApplied' || entry.event === 'BuffPresentationStarted';
    const isFinished =
      entry.event === 'BuffFinished' ||
      entry.event === 'BuffReleased' ||
      entry.event === 'BuffPresentationFinished';
    if (!isApplied && !isFinished) continue;
    if (entry.targetId === undefined) {
      throw new Error(`receipt ${entry.sequence} '${entry.event}' has no targetId`);
    }
    const data = requireData(entry);
    const buffId = requireString(entry, data, 'buffId');
    const instanceId = requireNumber(entry, data, 'instanceId');
    const key = instanceKey(entry.targetId, buffId, instanceId);

    if (isFinished) {
      const active = open.get(key);
      if (active !== undefined) {
        open.delete(key);
        const finishReason = optionalString(data, 'reason');
        closed.push({
          ...active,
          endFrame: entry.frame,
          endReason:
            entry.event === 'BuffReleased'
              ? 'released'
              : finishReason === 'lifetime' ||
                  finishReason === 'ignite' ||
                  finishReason === 'early' ||
                  finishReason === 'dispelled' ||
                  finishReason === 'absorbed' ||
                  finishReason === 'other'
                ? finishReason
                : 'other',
          ...(active.durationEndFrame === undefined
            ? {}
            : { durationEndFrame: Math.min(active.durationEndFrame, entry.frame) }),
        });
      }
      continue;
    }
    if (!isVisibleBuff(data)) continue;
    const modifierFact =
      simpleModifierFact(data) ??
      (sourceFrameKey(entry) === undefined
        ? undefined
        : inheritedModifierFacts.get(sourceFrameKey(entry)!));
    const previous = open.get(key);
    if (previous !== undefined) {
      closed.push({ ...previous, endFrame: entry.frame, endReason: 'reapplied' });
    }
    open.set(key, {
      ...(entry.sourceId === undefined ? {} : { sourceId: entry.sourceId }),
      ...(optionalString(data, 'sourceActionId') === undefined
        ? {}
        : { sourceActionId: optionalString(data, 'sourceActionId') }),
      targetId: entry.targetId,
      buffId,
      instanceId,
      startFrame: entry.frame,
      startSequence: entry.sequence,
      endFrame,
      startReason:
        entry.event === 'BuffPresentationStarted'
          ? 'presentationStarted'
          : previous === undefined
            ? 'applied'
            : 'reapplied',
      endReason: 'simulationEnd',
      ...(optionalString(data, 'stackingType') === undefined
        ? {}
        : { stackingType: optionalString(data, 'stackingType') }),
      ...(optionalString(data, 'parentBuffId') === undefined
        ? {}
        : { parentBuffId: optionalString(data, 'parentBuffId') }),
      ...(optionalString(data, 'iconDurationSourceTargetId') === undefined
        ? {}
        : {
            durationEndFrame:
              iconDurationSourceFinishFrames.get(
                optionalString(data, 'iconDurationSourceTargetId')!,
              ) ?? endFrame,
          }),
      layers: requireNumber(entry, data, 'layers'),
      ...copyOptionalBoolean(data, 'hasFiniteLifetime'),
      placement: presentationPlacement(data),
      ...(modifierFact ?? {}),
      ...(optionalString(data, 'iconId') === undefined
        ? {}
        : { iconId: optionalString(data, 'iconId') }),
      ...(optionalString(data, 'iconPath') === undefined
        ? {}
        : { iconPath: optionalString(data, 'iconPath') }),
      ...copyOptionalBoolean(data, 'showInHeadBarCommon'),
      ...copyOptionalBoolean(data, 'showInHeadBarAttached'),
      ...copyOptionalBoolean(data, 'showInSquadIcon'),
      ...copyOptionalBoolean(data, 'onlyShowForMainCharacter'),
      ...copyOptionalBoolean(data, 'showProgressInHpBar'),
      ...copyOptionalBoolean(data, 'showProgressInNormalSkillButton'),
      ...copyOptionalBoolean(data, 'useWeakProgressInNormalSkillButton'),
      ...copyOptionalBoolean(data, 'showProgressInUltimateSkillButton'),
      ...copyOptionalBoolean(data, 'showWarningBackground'),
      ...(optionalString(data, 'iconStyleInSquad') === undefined
        ? {}
        : { iconStyleInSquad: optionalString(data, 'iconStyleInSquad') }),
      ...(optionalString(data, 'abnormalColorType') === undefined
        ? {}
        : { abnormalColorType: optionalString(data, 'abnormalColorType') }),
      ...copyOptionalBoolean(data, 'orderUseDirectoryValue'),
      ...(optionalNumber(data, 'orderPriorityValue') === undefined
        ? {}
        : { orderPriorityValue: optionalNumber(data, 'orderPriorityValue') }),
      ...(optionalString(data, 'orderPriorityCategory') === undefined
        ? {}
        : { orderPriorityCategory: optionalString(data, 'orderPriorityCategory') }),
    });
  }
  return [...closed, ...open.values()].sort(
    (left, right) => left.startFrame - right.startFrame || left.instanceId - right.instanceId,
  );
}

function optionalNumber(
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number | undefined {
  const value = data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function copyOptionalBoolean(
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): Readonly<Record<string, boolean>> {
  const value = optionalBoolean(data, key);
  return value === undefined ? {} : { [key]: value };
}

/** 复刻旧版的紧凑排布：同一行不重叠即可复用，避免无意义地撑高轨道。 */
export function layoutBuffTimelineSegments<T extends BuffTimelineSegment>(
  segments: readonly T[],
): readonly (T & PositionedBuffTimelineSegment)[] {
  const laneEnds: number[] = [];
  return segments.map(segment => {
    let lane = laneEnds.findIndex(endFrame => endFrame <= segment.startFrame);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = segment.endFrame;
    return { ...segment, lane };
  });
}
