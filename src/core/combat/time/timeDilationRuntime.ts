/**
 * 管理战斗中的全局与实体时间倍率。这里复现原生实例仲裁和生命周期，
 * 只提供各时间域的倍率，不决定技能、Buff 或资源具体使用哪一路时钟。
 */
import type { FrameRuntime } from '../runtime/combatSimulation';
import { COMBAT_FRAME_INTERVAL } from './combatClock';
import {
  createTimeDilationState,
  type TimeDilationState,
  type MutableTimeDilationInstance,
  type GlobalTimeDilationInstance,
  type EntityTimeDilationInstance,
  type TimeDilationInstanceSnapshot,
  type TimeDilationSource,
} from '../state/environmentState';

const VALIDITY_EPSILON = 0.00001;
const GLOBAL_SCALE_SELECTION_EPSILON = 0.00001;

export type TimeScaleCurve = (progress: number) => number;

/**
 * 时间膨胀切面只保存曲线编号，实际函数固定保存在同一切面树共享的程序目录中。
 * 目录按函数身份编号；内容相同但身份不同的函数不会被错误合并。
 */
export class TimeDilationPrograms {
  readonly #ids = new WeakMap<TimeScaleCurve, number>();
  readonly #curves: TimeScaleCurve[] = [];

  register(curve: TimeScaleCurve): number {
    const existing = this.#ids.get(curve);
    if (existing !== undefined) return existing;
    const id = this.#curves.length;
    this.#curves.push(curve);
    this.#ids.set(curve, id);
    return id;
  }

  resolve(id: number): TimeScaleCurve {
    const curve = this.#curves[id];
    if (curve === undefined) throw new Error(`unknown time-dilation curve program '${id}'`);
    return curve;
  }

  get values(): readonly TimeScaleCurve[] {
    return this.#curves;
  }
}

/** 普通动作使用原生数值槽位；终结技使用独立语义槽位，避免伪造尚未恢复的原生标签。 */
export type TimeDilationSlot = string;

/** AbilitySystem 一帧内按不同原生用途消费的四路时间增量。 */
export interface AbilityTickDeltas {
  readonly defaultDeltaSeconds: number;
  readonly globalScaledDeltaSeconds: number;
  readonly selfScaledDeltaSeconds: number;
  readonly skillCooldownDeltaSeconds: number;
}

export function uniformAbilityTickDeltas(deltaSeconds: number): AbilityTickDeltas {
  return {
    defaultDeltaSeconds: deltaSeconds,
    globalScaledDeltaSeconds: deltaSeconds,
    selfScaledDeltaSeconds: deltaSeconds,
    skillCooldownDeltaSeconds: deltaSeconds,
  };
}

export interface TimeDilationRuntimeConfig {
  /** 仅列出寿命使用全局时间的实体槽位；未列出的槽位使用原始帧时间。 */
  readonly entityLifetimeUsesGlobalScaleBySlot?: ReadonlyMap<string, boolean>;
  readonly curves?: ReadonlyMap<string, TimeScaleCurve>;
}

export interface RestoredTimeDilationRuntime {
  readonly state: TimeDilationState;
  /** 必须来自保存该切面的运行时；新建空目录无法解释状态中的曲线编号。 */
  readonly programs: TimeDilationPrograms;
}

export interface StartGlobalTimeDilationOptions {
  readonly durationSeconds: number;
  readonly slot: TimeDilationSlot;
  readonly priority: number;
  readonly curve?: TimeScaleCurve;
  readonly constantScale?: number;
  readonly influenceSkillCooldownSeconds?: number;
  readonly ignoredOperatorIds?: readonly string[];
  readonly source?: TimeDilationSource;
}

export interface StartEntityTimeDilationOptions {
  readonly entityId: string;
  readonly durationSeconds: number;
  readonly slot: string;
  readonly priority: number;
  readonly curve: TimeScaleCurve;
  readonly ignoreSlotCheck?: boolean;
  readonly source?: TimeDilationSource;
}

export type TimeDilationInstanceKind = 'global' | 'entity';
export type TimeDilationEndReason = 'natural' | 'replaced' | 'stopped';

export interface TimeDilationRuntimeObserver {
  readonly started?: (
    kind: TimeDilationInstanceKind,
    instance: TimeDilationInstanceSnapshot,
    entityId?: string,
  ) => void;
  readonly rejected?: (
    kind: TimeDilationInstanceKind,
    instance: TimeDilationInstanceSnapshot,
    entityId?: string,
  ) => void;
  readonly ended?: (
    kind: TimeDilationInstanceKind,
    instance: TimeDilationInstanceSnapshot,
    reason: TimeDilationEndReason,
    entityId?: string,
  ) => void;
}

/** 原生时间膨胀管理器的行为等价边界；生成定义已保存可直接比较的优先级数值。 */
export class TimeDilationRuntime implements FrameRuntime {
  readonly #entityLifetimeUsesGlobalScaleBySlot: ReadonlyMap<string, boolean>;
  readonly #curves: ReadonlyMap<string, TimeScaleCurve>;
  readonly runtimeState: TimeDilationState;
  readonly programs: TimeDilationPrograms;
  readonly #observer: TimeDilationRuntimeObserver;

  constructor(
    config: TimeDilationRuntimeConfig,
    observer: TimeDilationRuntimeObserver = {},
    restored?: RestoredTimeDilationRuntime,
  ) {
    this.#entityLifetimeUsesGlobalScaleBySlot =
      config.entityLifetimeUsesGlobalScaleBySlot ?? new Map();
    this.#curves = config.curves ?? new Map();
    this.#observer = observer;
    this.runtimeState = restored?.state ?? createTimeDilationState();
    this.programs = restored?.programs ?? new TimeDilationPrograms();
    validateTimeDilationPrograms(this.runtimeState, this.programs);
  }

  get currentGlobalScale(): number {
    return this.#selectActiveGlobal()?.currentScale ?? 1;
  }

  /** TimedMarker useTimeDilationDt 对应的 allScaledDeltaTime 累计时钟。 */
  get time(): number {
    return this.runtimeState.globalScaledTime;
  }

  get activeGlobalInfluencesSkillCooldown(): boolean {
    const active = this.#selectActiveGlobal();
    return (
      active?.influenceSkillCooldownSeconds !== undefined &&
      active.elapsedSeconds <= active.influenceSkillCooldownSeconds
    );
  }

  get globalInstances(): readonly TimeDilationInstanceSnapshot[] {
    return this.runtimeState.globalInstances.map(snapshotInstance);
  }

  get entityInstances(): readonly (TimeDilationInstanceSnapshot & { entityId: string })[] {
    return this.runtimeState.entityInstances.map(instance => ({
      ...snapshotInstance(instance),
      entityId: instance.entityId,
    }));
  }

  resolveCurve(key: string): TimeScaleCurve {
    if (key.length === 0) throw new Error('time-dilation curve key must not be empty');
    const curve = this.#curves.get(key);
    if (curve === undefined) throw new Error(`unknown time-dilation curve '${key}'`);
    return curve;
  }

  startGlobal(options: StartGlobalTimeDilationOptions): number {
    validateDuration(options.durationSeconds);
    if (options.curve === undefined && options.constantScale === undefined) {
      throw new Error('global time dilation requires a curve or constant scale');
    }
    if (options.constantScale !== undefined) validateScale(options.constantScale);
    validatePriority(options.priority);

    const instance: GlobalTimeDilationInstance = {
      id: ++this.runtimeState.nextInstanceId,
      durationSeconds: options.durationSeconds,
      elapsedSeconds: 0,
      slot: options.slot,
      priority: options.priority,
      currentScale: 1,
      active: false,
      ...(options.curve === undefined ? {} : { curveId: this.#registerCurve(options.curve) }),
      ...(options.constantScale === undefined ? {} : { constantScale: options.constantScale }),
      ...(options.influenceSkillCooldownSeconds === undefined
        ? {}
        : { influenceSkillCooldownSeconds: options.influenceSkillCooldownSeconds }),
      ignoredOperatorIds: new Set(options.ignoredOperatorIds ?? []),
      ...(options.source === undefined ? {} : { source: options.source }),
    };
    if (!this.#tryAddGlobal(instance)) {
      this.#observer.rejected?.('global', snapshotInstance(instance));
      return instance.id;
    }
    this.#tickGlobal(instance, 0);
    this.#observer.started?.('global', snapshotInstance(instance));
    return instance.id;
  }

  startUltimate(
    priority: number,
    targetScale: number,
    ignoredOperatorIds: readonly string[],
    source?: TimeDilationSource,
  ): number {
    return this.startGlobal({
      durationSeconds: Number.MAX_VALUE,
      slot: 'ultimate',
      priority,
      constantScale: targetScale,
      ignoredOperatorIds,
      ...(source === undefined ? {} : { source }),
    });
  }

  startEntity(options: StartEntityTimeDilationOptions): number {
    if (options.entityId.length === 0) throw new Error('entity id must not be empty');
    validateDuration(options.durationSeconds);
    validatePriority(options.priority);
    const instance: EntityTimeDilationInstance = {
      id: ++this.runtimeState.nextInstanceId,
      entityId: options.entityId,
      durationSeconds: options.durationSeconds,
      elapsedSeconds: 0,
      slot: options.slot,
      priority: options.priority,
      currentScale: 1,
      active: false,
      curveId: this.#registerCurve(options.curve),
      lifetimeUsesGlobalScale: this.#entityLifetimeUsesGlobalScaleBySlot.get(options.slot) ?? false,
      ...(options.source === undefined ? {} : { source: options.source }),
    };
    if (!this.#tryAddEntity(instance, options.ignoreSlotCheck === true)) {
      this.#observer.rejected?.('entity', snapshotInstance(instance), instance.entityId);
      return instance.id;
    }
    this.#tickEntity(instance, 0, this.currentGlobalScale);
    this.#observer.started?.('entity', snapshotInstance(instance), instance.entityId);
    return instance.id;
  }

  stop(instanceId: number): void {
    const entityIndex = this.runtimeState.entityInstances.findIndex(
      instance => instance.id === instanceId,
    );
    if (entityIndex >= 0) {
      const [instance] = this.runtimeState.entityInstances.splice(entityIndex, 1);
      this.#observer.ended?.('entity', snapshotInstance(instance!), 'stopped', instance!.entityId);
      return;
    }
    const globalIndex = this.runtimeState.globalInstances.findIndex(
      instance => instance.id === instanceId,
    );
    if (globalIndex >= 0) {
      const [instance] = this.runtimeState.globalInstances.splice(globalIndex, 1);
      this.#observer.ended?.('global', snapshotInstance(instance!), 'stopped');
    }
  }

  getEntityScale(entityId: string): number {
    const localScale = this.runtimeState.entityInstances
      .filter(instance => instance.entityId === entityId)
      .reduce((scale, instance) => scale * instance.currentScale, 1);
    const ignoresGlobal =
      this.runtimeState.ignoreGlobalTimeScaleEntityIds.has(entityId) ||
      this.runtimeState.globalInstances.some(
        instance => instance.active && instance.ignoredOperatorIds.has(entityId),
      );
    return Math.max(0, localScale * (ignoresGlobal ? 1 : this.currentGlobalScale));
  }

  setIgnoreGlobalTimeScale(entityId: string, ignore: boolean): void {
    if (entityId.length === 0) throw new Error('entity id must not be empty');
    if (ignore) this.runtimeState.ignoreGlobalTimeScaleEntityIds.add(entityId);
    else this.runtimeState.ignoreGlobalTimeScaleEntityIds.delete(entityId);
  }

  /** AbilitySystem 的兼容入口；干员也是具有稳定运行时身份的实体。 */
  getOperatorScale(operatorId: string): number {
    return this.getEntityScale(operatorId);
  }

  /** 按原生 AbilitySystem.PreLateTick 分支生成本实体使用的四路时钟。 */
  getAbilityTickDeltas(operatorId: string, rawDeltaSeconds: number): AbilityTickDeltas {
    if (!Number.isFinite(rawDeltaSeconds) || rawDeltaSeconds < 0) {
      throw new RangeError('raw delta seconds must be a non-negative finite number');
    }
    const globalScaledDeltaSeconds = rawDeltaSeconds * this.currentGlobalScale;
    // 本管理器只注册 TimeDilation 来源；原生对此原因使用未缩放的默认时间。
    // 无膨胀时倍率为 1，两者等价。菜单暂停等其他缩放来源不在本模拟范围内。
    const defaultDeltaSeconds = rawDeltaSeconds;
    return {
      defaultDeltaSeconds,
      globalScaledDeltaSeconds,
      selfScaledDeltaSeconds: rawDeltaSeconds * this.getOperatorScale(operatorId),
      skillCooldownDeltaSeconds: this.activeGlobalInfluencesSkillCooldown
        ? globalScaledDeltaSeconds
        : defaultDeltaSeconds,
    };
  }

  advanceFrame(): void {
    return advanceTimeDilation(this.runtimeState, this.programs.values, this.#observer);
  }

  #tryAddGlobal(candidate: GlobalTimeDilationInstance): boolean {
    for (let index = this.runtimeState.globalInstances.length - 1; index >= 0; index -= 1) {
      const current = this.runtimeState.globalInstances[index]!;
      if (current.slot !== candidate.slot) continue;
      if (current.priority > candidate.priority) return false;
      const [removed] = this.runtimeState.globalInstances.splice(index, 1);
      this.#observer.ended?.('global', snapshotInstance(removed!), 'replaced');
    }
    this.runtimeState.globalInstances.push(candidate);
    return true;
  }

  #tryAddEntity(candidate: EntityTimeDilationInstance, ignoreSlotCheck: boolean): boolean {
    for (let index = this.runtimeState.entityInstances.length - 1; index >= 0; index -= 1) {
      const current = this.runtimeState.entityInstances[index]!;
      if (
        current.entityId !== candidate.entityId ||
        ignoreSlotCheck ||
        current.slot !== candidate.slot
      ) {
        continue;
      }
      if (current.priority > candidate.priority) return false;
      const [removed] = this.runtimeState.entityInstances.splice(index, 1);
      this.#observer.ended?.('entity', snapshotInstance(removed!), 'replaced', removed!.entityId);
    }
    this.runtimeState.entityInstances.push(candidate);
    return true;
  }

  #selectActiveGlobal(): GlobalTimeDilationInstance | undefined {
    return selectActiveGlobalTimeDilation(this.runtimeState);
  }

  /** 函数身份只属于程序绑定，编号不随分支回退而复用。 */
  #registerCurve(curve: TimeScaleCurve): number {
    return this.programs.register(curve);
  }

  #tickGlobal(instance: GlobalTimeDilationInstance, deltaSeconds: number): void {
    return tickGlobalTimeDilation(this.programs.values, instance, deltaSeconds);
  }

  #tickEntity(
    instance: EntityTimeDilationInstance,
    deltaSeconds: number,
    globalScale: number,
  ): void {
    return tickEntityTimeDilation(this.programs.values, instance, deltaSeconds, globalScale);
  }
}

function validateTimeDilationPrograms(
  state: TimeDilationState,
  programs: TimeDilationPrograms,
): void {
  for (const instance of state.globalInstances) {
    if (instance.curveId !== undefined) programs.resolve(instance.curveId);
  }
  for (const instance of state.entityInstances) programs.resolve(instance.curveId);
}

function curveProgress(instance: MutableTimeDilationInstance): number {
  if (instance.durationSeconds === 0) return 0;
  return Math.min(1, Math.max(0, instance.elapsedSeconds / instance.durationSeconds));
}

function isValid(instance: MutableTimeDilationInstance): boolean {
  return (
    instance.active &&
    (instance.durationSeconds < 0 ||
      instance.elapsedSeconds <= instance.durationSeconds + VALIDITY_EPSILON)
  );
}

function snapshotInstance(instance: MutableTimeDilationInstance): TimeDilationInstanceSnapshot {
  return Object.freeze({
    id: instance.id,
    durationSeconds: instance.durationSeconds,
    elapsedSeconds: instance.elapsedSeconds,
    slot: instance.slot,
    priority: instance.priority,
    currentScale: instance.currentScale,
    ...(instance.source === undefined ? {} : { source: Object.freeze({ ...instance.source }) }),
  });
}

function validateDuration(value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError('time-dilation duration must be finite');
  }
}

function validatePriority(value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError('time-dilation priority must be finite');
  }
}

function validateScale(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('time scale must be a non-negative finite number');
  }
}

/** 按原有实体、全局顺序推进一帧；曲线和通知仅在执行时传入。 */
export function advanceTimeDilation(
  state: TimeDilationState,
  curves: readonly TimeScaleCurve[],
  observer: TimeDilationRuntimeObserver,
): void {
  const globalScale = selectActiveGlobalTimeDilation(state)?.currentScale ?? 1;
  for (let index = state.entityInstances.length - 1; index >= 0; index -= 1) {
    const instance = state.entityInstances[index]!;
    if (isValid(instance)) {
      tickEntityTimeDilation(curves, instance, COMBAT_FRAME_INTERVAL, globalScale);
    } else {
      const [removed] = state.entityInstances.splice(index, 1);
      observer.ended?.('entity', snapshotInstance(removed!), 'natural', removed!.entityId);
    }
  }
  for (let index = state.globalInstances.length - 1; index >= 0; index -= 1) {
    const instance = state.globalInstances[index]!;
    if (isValid(instance)) {
      tickGlobalTimeDilation(curves, instance, COMBAT_FRAME_INTERVAL);
    } else {
      const [removed] = state.globalInstances.splice(index, 1);
      observer.ended?.('global', snapshotInstance(removed!), 'natural');
    }
  }
  // 本运行时先于 AbilitySystem 推进；使用更新后的当前倍率，与本帧其余 Ability tick 一致。
  state.globalScaledTime +=
    COMBAT_FRAME_INTERVAL * (selectActiveGlobalTimeDilation(state)?.currentScale ?? 1);
}

function selectActiveGlobalTimeDilation(
  state: TimeDilationState,
): GlobalTimeDilationInstance | undefined {
  let selected: GlobalTimeDilationInstance | undefined;
  let selectedScale = Number.MAX_VALUE;
  for (const instance of state.globalInstances) {
    if (selectedScale - GLOBAL_SCALE_SELECTION_EPSILON <= instance.currentScale) continue;
    selected = instance;
    selectedScale = instance.currentScale;
  }
  return selected;
}

function tickGlobalTimeDilation(
  curves: readonly TimeScaleCurve[],
  instance: GlobalTimeDilationInstance,
  deltaSeconds: number,
): void {
  instance.currentScale = Math.max(
    0,
    instance.constantScale ?? curves[instance.curveId!]!(curveProgress(instance)),
  );
  instance.active = true;
  instance.elapsedSeconds += deltaSeconds;
}

function tickEntityTimeDilation(
  curves: readonly TimeScaleCurve[],
  instance: EntityTimeDilationInstance,
  deltaSeconds: number,
  globalScale: number,
): void {
  instance.currentScale = Math.max(0, curves[instance.curveId]!(curveProgress(instance)));
  instance.active = true;
  instance.elapsedSeconds += instance.lifetimeUsesGlobalScale
    ? deltaSeconds * globalScale
    : deltaSeconds;
}
