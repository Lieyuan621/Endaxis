/**
 * 把 Buff 生命周期回执投影成时间轴可画的持续段。
 * 这里只解释已发生的施加、叠层、数值变化和结束事实；展示位置和样式属于 UI。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

export interface BuffTimelineSegment {
  readonly attributeEffects?: readonly import('../combat/receipt/combatReceipt').BuffAttributeEffect[];
  readonly damageEffects?: readonly import('../combat/receipt/combatReceipt').BuffDamageEffect[];
  readonly sourceId?: string;
  readonly sourceActionId?: string;
  readonly targetId: string;
  readonly buffId: string;
  readonly instanceId: number;
  readonly startFrame: number;
  /** 形成这一展示段的回执序号；同帧的多次叠层或改值仍保留各自历史。 */
  readonly startSequence?: number;
  readonly endFrame: number;
  /** 切段或生命周期结束回执序号，区分同帧先命中后改值与相反顺序。 */
  readonly endSequence?: number;
  /** 图标持续条的原生倒计时终点；缺省与 Buff 生命周期终点一致。 */
  readonly durationEndFrame?: number;
  /** 原生容器是否选中此实例；禁用候选仍保留生命周期，不能计入生效层数。 */
  readonly enabled: boolean;
  /** 实例原始增强次数；合并展示段为生效成员的总和，原值保存在 windows 中。 */
  readonly enhanceCount: number;
  /** 原生明确提供的显示等级（如法术异常）；不以增强次数冒充等级。 */
  readonly displayCount?: number;
  /** 图标显示数量；原始段为显示等级或增强次数，合并段只统计生效成员。 */
  readonly layers: number;
  /** 当前展示段从何种生命周期或数值变化开始。 */
  readonly startReason?:
    | 'applied'
    | 'reapplied'
    | 'presentationStarted'
    | 'modifierChanged'
    | 'enabledChanged'
    | 'stackChanged';
  /** 当前展示段为何结束；simulationEnd 表示模拟结束时 Buff 仍然存在。 */
  readonly endReason?:
    | 'reapplied'
    | 'modifierChanged'
    | 'enabledChanged'
    | 'stackChanged'
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
 * 每个输出段对应一次层数、数值或启用状态变化；只统计原生容器启用的成员。
 * 同 ID 可以属于不同 stackingKey 分组，不能由叠加类型猜测应生效几份。
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
        // 同帧连续改值只画最后的状态；中间事实仍保留在详情窗口，不能产生重叠旧图标。
        const superseded = componentSegments.filter(
          segment => segment.startFrame === segment.endFrame,
        );
        result.push(
          ...componentSegments
            .filter(
              segment => segment.enabled && segment.layers > 0 && !superseded.includes(segment),
            )
            .map(segment => ({
              ...segment,
              members: [segment],
              windows: [
                segment,
                ...componentSegments.filter(
                  previous =>
                    previous !== segment &&
                    (!previous.enabled ||
                      (superseded.includes(previous) &&
                        previous.startFrame === segment.startFrame)),
                ),
              ],
            })),
        );
        continue;
      }
      const boundaries = [
        ...new Set(componentSegments.flatMap(s => [s.startFrame, s.endFrame])),
      ].sort((a, b) => a - b);
      for (let index = 0; index < boundaries.length - 1; index++) {
        const startFrame = boundaries[index]!;
        const endFrame = boundaries[index + 1]!;
        if (endFrame <= startFrame) continue;
        const members = componentSegments.filter(
          segment =>
            segment.enabled && segment.startFrame <= startFrame && segment.endFrame >= endFrame,
        );
        const layers = members.reduce((sum, segment) => sum + segment.layers, 0);
        if (layers <= 0 || members.length === 0) continue;
        const representative = members.at(-1)!;
        const {
          simpleModifierAttribute: _attribute,
          simpleModifierSlot: _slot,
          simpleModifierValue: _value,
          displayCount: _displayCount,
          startSequence: _startSequence,
          endSequence: _endSequence,
          ...presentation
        } = representative;
        const modifier = unambiguousModifierFact(members);
        const startSequences = boundarySequences(componentSegments, startFrame);
        const endSequences = boundarySequences(componentSegments, endFrame);
        result.push({
          ...presentation,
          attributeEffects: members.flatMap(member => member.attributeEffects ?? []),
          damageEffects: members.flatMap(member => member.damageEffects ?? []),
          ...(modifier ?? {}),
          ...(members.every(member => member.displayCount !== undefined)
            ? { displayCount: layers }
            : {}),
          enhanceCount: members.reduce((sum, member) => sum + member.enhanceCount, 0),
          startFrame,
          ...(startSequences.length === 0 ? {} : { startSequence: Math.max(...startSequences) }),
          endFrame,
          ...(endSequences.length === 0 ? {} : { endSequence: Math.min(...endSequences) }),
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

/** 合并阶段开始于同帧最后一次状态变化；结束于该帧第一次切段。 */
function boundarySequences(segments: readonly BuffTimelineSegment[], frame: number): number[] {
  return segments.flatMap(segment => [
    ...(segment.startFrame === frame && segment.startSequence !== undefined
      ? [segment.startSequence]
      : []),
    ...(segment.endFrame === frame && segment.endSequence !== undefined
      ? [segment.endSequence]
      : []),
  ]);
}

/** 原生修正槽可以非加算；摘要只保留各生效实例完全一致的事实，不推测合并公式。 */
function unambiguousModifierFact(
  members: readonly BuffTimelineSegment[],
): SimpleModifierFact | undefined {
  const first = members[0];
  if (
    first?.simpleModifierAttribute === undefined ||
    first.simpleModifierSlot === undefined ||
    first.simpleModifierValue === undefined ||
    !members.every(
      member =>
        member.simpleModifierAttribute === first.simpleModifierAttribute &&
        member.simpleModifierSlot === first.simpleModifierSlot &&
        member.simpleModifierValue === first.simpleModifierValue,
    )
  )
    return undefined;
  return {
    simpleModifierAttribute: first.simpleModifierAttribute,
    simpleModifierSlot: first.simpleModifierSlot,
    simpleModifierValue: first.simpleModifierValue,
  };
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
  // Start 内的首次伤害可能先记录，Applied 随后才写入；只允许首次施加作同帧回退。
  const isInitialStart = (candidate: BuffTimelineSegment) =>
    candidate.startFrame === entry.frame &&
    (candidate.startReason === 'applied' || candidate.startReason === 'presentationStarted');
  const matchesInstance = (candidate: BuffTimelineSegment) =>
    candidate.targetId === entry.targetId &&
    candidate.targetId === entry.data!.buffOwnerId &&
    candidate.buffId === entry.data!.buffId &&
    candidate.instanceId === entry.data!.buffInstanceId &&
    candidate.startFrame <= entry.frame &&
    candidate.endFrame >= entry.frame &&
    (candidate.startFrame !== entry.frame ||
      candidate.startSequence === undefined ||
      candidate.startSequence <= entry.sequence ||
      isInitialStart(candidate));
  return segments
    .filter(segment => {
      if (segment.startFrame > entry.frame || segment.endFrame < entry.frame) return false;
      const candidates =
        'members' in segment && Array.isArray(segment.members)
          ? (segment.members as readonly BuffTimelineSegment[])
          : [segment];
      if (
        segment.startFrame === entry.frame &&
        segment.startSequence !== undefined &&
        segment.startSequence > entry.sequence
      )
        return [
          ...candidates,
          ...('windows' in segment && Array.isArray(segment.windows)
            ? (segment.windows as readonly BuffTimelineSegment[])
            : []),
        ].some(candidate => matchesInstance(candidate) && isInitialStart(candidate));
      if (candidates.some(matchesInstance)) return true;
      // 同帧终结伤害的来源可能已从最终生效成员中移除，仍可用原始窗口追溯。
      return (
        'windows' in segment &&
        Array.isArray(segment.windows) &&
        (segment.windows as readonly BuffTimelineSegment[]).some(matchesInstance)
      );
    })
    .sort(
      (a, b) => b.startFrame - a.startFrame || (b.startSequence ?? -1) - (a.startSequence ?? -1),
    )[0];
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

function requireBoolean(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): boolean {
  const value = data[key];
  if (typeof value !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no boolean ${key}`);
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
interface InheritedModifierFact {
  readonly fact: SimpleModifierFact;
  readonly sourceInstances: ReadonlySet<string>;
}

function buffOwnerInstanceKey(ownerId: string, instanceId: number): string {
  return `${ownerId}\u0000${instanceId}`;
}

function collectUnambiguousModifierFacts(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, InheritedModifierFact> {
  const candidates = new Map<
    string,
    Map<string, { fact: SimpleModifierFact; sourceInstances: Set<string> }>
  >();
  for (const entry of entries) {
    if (entry.event !== 'BuffApplied' || entry.data === undefined) continue;
    const key = sourceFrameKey(entry);
    const fact = simpleModifierFact(entry.data);
    if (key === undefined || fact === undefined) continue;
    const identity = `${fact.simpleModifierAttribute}\u0000${fact.simpleModifierSlot}\u0000${fact.simpleModifierValue}`;
    const values =
      candidates.get(key) ??
      new Map<string, { fact: SimpleModifierFact; sourceInstances: Set<string> }>();
    const candidate = values.get(identity) ?? { fact, sourceInstances: new Set<string>() };
    const instanceId = optionalNumber(entry.data, 'instanceId');
    if (entry.targetId !== undefined && instanceId !== undefined)
      candidate.sourceInstances.add(buffOwnerInstanceKey(entry.targetId, instanceId));
    values.set(identity, candidate);
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

/** 轴上只展示原生头顶或队伍栏开启图标的 Buff。 */
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
  const visible = projectBuffSegments(entries, endFrame, isVisibleBuff);
  const parents = new Map<string, string>();
  const hidden = new Set<string>();
  for (const entry of entries) {
    if (entry.event !== 'BuffApplied' || !entry.data || !entry.targetId) continue;
    const instanceId = optionalNumber(entry.data, 'instanceId');
    if (instanceId === undefined) continue;
    const key = buffOwnerInstanceKey(entry.targetId, instanceId);
    if (!isVisibleBuff(entry.data)) hidden.add(key);
    if (entry.producedBy?.kind === 'buff')
      parents.set(key, buffOwnerInstanceKey(entry.producedBy.ownerId, entry.producedBy.instanceId));
  }
  const needed = new Set(
    visible.flatMap(segment => {
      const parent = parents.get(buffOwnerInstanceKey(segment.targetId, segment.instanceId));
      return parent &&
        hidden.has(parent) &&
        !segment.attributeEffects?.length &&
        !segment.damageEffects?.length
        ? [parent]
        : [];
    }),
  );
  if (!needed.size) return visible;
  const parentWindows = new Map<string, BuffTimelineSegment[]>();
  for (const segment of projectBuffSegments(entries, endFrame, () => true)) {
    const key = buffOwnerInstanceKey(segment.targetId, segment.instanceId);
    if (!needed.has(key)) continue;
    const windows = parentWindows.get(key) ?? [];
    windows.push(segment);
    parentWindows.set(key, windows);
  }
  // 展示层经验规则，不是原生保证：无自身修正的图标借用未实际显示图标的直接产生者的修正。
  // 是否显示取决于显示位置开关，不以是否配置图标资源判断。
  // producedBy 只证明创建关系，不保证图标代表父效果；因此仅追一层，不按同帧/同来源猜测。
  // 按父实例的历史窗口取值，禁用或结束后不借用；不改变战斗属性，也不把子层数再次相乘。
  return visible.flatMap(segment => {
    if (segment.attributeEffects?.length || segment.damageEffects?.length || !segment.enabled)
      return [segment];
    const parent = parents.get(buffOwnerInstanceKey(segment.targetId, segment.instanceId));
    const windows = parent && hidden.has(parent) ? parentWindows.get(parent) : undefined;
    if (!windows?.length || segment.startFrame === segment.endFrame) return [segment];
    const boundaries = [
      ...new Set([
        segment.startFrame,
        segment.endFrame,
        ...windows.flatMap(window =>
          [window.startFrame, window.endFrame].filter(
            frame => frame > segment.startFrame && frame < segment.endFrame,
          ),
        ),
      ]),
    ].sort((a, b) => a - b);
    return boundaries.slice(0, -1).map((startFrame, index) => {
      const parentWindow = windows
        .filter(window => window.startFrame <= startFrame && window.endFrame > startFrame)
        .at(-1);
      return {
        ...segment,
        startFrame,
        endFrame: boundaries[index + 1]!,
        attributeEffects: parentWindow?.enabled
          ? parentWindow.attributeEffects
          : segment.attributeEffects,
        damageEffects: parentWindow?.enabled ? parentWindow.damageEffects : segment.damageEffects,
      };
    });
  });
}

/** 伤害图标和物理异常仍需内部 Buff 身份，即使它不在轴上显示。 */
export function projectBuffIconTimelineMetadata(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): readonly BuffTimelineSegment[] {
  return projectBuffSegments(
    entries,
    endFrame,
    data =>
      data.visible !== false &&
      (data.visible === true ||
        optionalString(data, 'iconPath') !== undefined ||
        optionalString(data, 'iconId') !== undefined),
  );
}

function projectBuffSegments(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  include: (data: Readonly<Record<string, CombatReceiptValue>>) => boolean,
): readonly BuffTimelineSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  const open = new Map<string, BuffTimelineSegment>();
  const closed: BuffTimelineSegment[] = [];
  const inheritedModifierFacts = collectUnambiguousModifierFacts(entries);
  const modifierSourceByInstance = new Map<string, string>();
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
    const isModifierChanged = entry.event === 'BuffModifierChanged';
    const isEnabledChanged = entry.event === 'BuffEnabledChanged';
    const isStackChanged = entry.event === 'BuffStackChanged';
    if (!isApplied && !isFinished && !isModifierChanged && !isEnabledChanged && !isStackChanged)
      continue;
    if (entry.targetId === undefined) {
      throw new Error(`receipt ${entry.sequence} '${entry.event}' has no targetId`);
    }
    const data = requireData(entry);
    const buffId = requireString(entry, data, 'buffId');
    const instanceId = requireNumber(entry, data, 'instanceId');
    const key = instanceKey(entry.targetId, buffId, instanceId);

    if (isEnabledChanged || isStackChanged) {
      const enabled = isEnabledChanged ? requireBoolean(entry, data, 'enabled') : undefined;
      const enhanceCount = isStackChanged ? requireNumber(entry, data, 'layers') : undefined;
      // 只有同一实例的虚拟子图标沿用父状态；真正创建的子 Buff 拥有自己的启用与叠层事实。
      // 首次 Applied 前的启用通知没有旧展示段，后续 Applied 会给出完整状态。
      for (const [activeKey, active] of open) {
        if (
          active.targetId !== entry.targetId ||
          active.instanceId !== instanceId ||
          (active.buffId !== buffId && active.parentBuffId !== buffId)
        )
          continue;
        if (
          (isEnabledChanged && active.enabled === enabled) ||
          (isStackChanged && active.enhanceCount === enhanceCount)
        )
          continue;
        const reason = isEnabledChanged ? 'enabledChanged' : 'stackChanged';
        closed.push({
          ...active,
          endFrame: entry.frame,
          endSequence: entry.sequence,
          endReason: reason,
          ...(active.durationEndFrame === undefined
            ? {}
            : { durationEndFrame: Math.min(active.durationEndFrame, entry.frame) }),
        });
        open.set(activeKey, {
          ...active,
          ...(enabled === undefined ? {} : { enabled }),
          ...(enhanceCount === undefined
            ? {}
            : { enhanceCount, layers: active.displayCount ?? enhanceCount }),
          startFrame: entry.frame,
          startSequence: entry.sequence,
          startReason: reason,
        });
      }
      continue;
    }

    if (isModifierChanged) {
      // 子图标沿用真实父实例的属性摘要；不改变层数、来源或生命周期。
      for (const [activeKey, active] of open) {
        const isOwnOrPresentation =
          active.targetId === entry.targetId &&
          active.instanceId === instanceId &&
          (active.buffId === buffId || active.parentBuffId === buffId);
        const isProducedChild =
          modifierSourceByInstance.get(activeKey) ===
          buffOwnerInstanceKey(entry.targetId, instanceId);
        if (!isOwnOrPresentation && !isProducedChild) continue;
        const fact = simpleModifierFact(data);
        if (
          active.simpleModifierAttribute === fact?.simpleModifierAttribute &&
          active.simpleModifierSlot === fact?.simpleModifierSlot &&
          active.simpleModifierValue === fact?.simpleModifierValue &&
          (!isOwnOrPresentation ||
            JSON.stringify(active.attributeEffects ?? []) ===
              JSON.stringify(entry.buffAttributeEffects ?? [])) &&
          (!isOwnOrPresentation ||
            JSON.stringify(active.damageEffects ?? []) ===
              JSON.stringify(entry.buffDamageEffects ?? []))
        )
          continue;
        closed.push({
          ...active,
          endFrame: entry.frame,
          endSequence: entry.sequence,
          endReason: 'modifierChanged',
          ...(active.durationEndFrame === undefined
            ? {}
            : { durationEndFrame: Math.min(active.durationEndFrame, entry.frame) }),
        });
        const {
          simpleModifierAttribute: _attribute,
          simpleModifierSlot: _slot,
          simpleModifierValue: _value,
          ...unchanged
        } = active;
        open.set(activeKey, {
          ...unchanged,
          attributeEffects: isOwnOrPresentation
            ? (entry.buffAttributeEffects ?? [])
            : active.attributeEffects,
          damageEffects: isOwnOrPresentation
            ? (entry.buffDamageEffects ?? [])
            : active.damageEffects,
          ...(fact ?? {}),
          startFrame: entry.frame,
          startSequence: entry.sequence,
          startReason: 'modifierChanged',
        });
      }
      continue;
    }

    if (isFinished) {
      const active = open.get(key);
      if (active !== undefined) {
        open.delete(key);
        const finishReason = optionalString(data, 'reason');
        closed.push({
          ...active,
          endFrame: entry.frame,
          endSequence: entry.sequence,
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
    if (
      !include(data) &&
      !(
        entry.event === 'BuffPresentationStarted' &&
        data.visible !== false &&
        (optionalString(data, 'iconPath') !== undefined ||
          optionalString(data, 'iconId') !== undefined)
      )
    )
      continue;
    const ownModifierFact = simpleModifierFact(data);
    const inheritedFact =
      sourceFrameKey(entry) === undefined
        ? undefined
        : inheritedModifierFacts.get(sourceFrameKey(entry)!);
    const modifierFact = ownModifierFact ?? inheritedFact?.fact;
    modifierSourceByInstance.delete(key);
    // 真正创建出的子 Buff 与父 Buff 的实例号不同。只有摘要来自明确的产生者时才跟随其更新，
    // 同帧同来源的旧回退本身不构成父子关系，也不能把相同数值的其他实例误连起来。
    if (ownModifierFact === undefined && entry.producedBy?.kind === 'buff') {
      const sourceKey = buffOwnerInstanceKey(entry.producedBy.ownerId, entry.producedBy.instanceId);
      if (inheritedFact?.sourceInstances.has(sourceKey))
        modifierSourceByInstance.set(key, sourceKey);
    }
    const previous = open.get(key);
    if (previous !== undefined) {
      closed.push({
        ...previous,
        endFrame: entry.frame,
        endSequence: entry.sequence,
        endReason: 'reapplied',
      });
    }
    open.set(key, {
      ...(entry.buffAttributeEffects === undefined
        ? {}
        : { attributeEffects: entry.buffAttributeEffects }),
      ...(entry.buffDamageEffects === undefined ? {} : { damageEffects: entry.buffDamageEffects }),
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
      enabled: requireBoolean(entry, data, 'enabled'),
      enhanceCount: requireNumber(entry, data, 'layers'),
      ...(optionalNumber(data, 'displayCount') === undefined
        ? {}
        : { displayCount: optionalNumber(data, 'displayCount') }),
      layers: optionalNumber(data, 'displayCount') ?? requireNumber(entry, data, 'layers'),
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
