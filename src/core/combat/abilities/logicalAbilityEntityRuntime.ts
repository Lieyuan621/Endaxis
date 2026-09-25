import { type LogicalAbilityEntityFinishReason } from '../state/foundationState';
/**
 * 零空间、单敌人模型中的逻辑能力实体目录。
 *
 * 它不保存坐标、碰撞体或朝向；所有空间查找均从同一活动实例集合开始，
 * 然后只应用 owner、生成期已解析的实体身份和存活等仍有战斗意义的筛选。
 */
import type {
  AbilityEntityTargetRef,
  LogicalAbilityEntityDefinition,
  OwnerSpawnedAbilityEntityQuery,
  RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';
import { logicalAbilityEntityRuntimeId } from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard, type ActionBlackboardValue } from '../actions/actionBlackboard';
import type { BuffApplicationHandle } from '../buffs/combatBuffs';
import type { FrameRuntime } from '../runtime/combatSimulation';
import { createTimedMarkerState, type TimedMarkerSnapshot } from '../state/environmentState';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type {
  LogicalAbilityEntityDirectoryState,
  LogicalAbilityEntityState,
} from '../state/instanceState';
import {
  TimedMarkerContainer,
  type TimedMarkerClock,
  type TimedMarkerFinishReason,
} from '../status/timedMarkers';
import type { GameplayTag } from '../tags/gameplayTags';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { AbilityEntityInstanceIdAllocator } from './abilityEntityInstanceIdAllocator';
import { EntitySkillHostGroup } from './callbackSkillHost';
import {
  advanceAbilityEntityLifetime,
  advanceAbilityEntityRelease,
  killLogicalAbilityEntity,
} from './logicalAbilityEntityExecution';

export interface LogicalAbilityEntitySpawnRequest {
  /** 固定程序目录中的实体定义；独立使用实体目录时可不提供。 */
  readonly definitionProgramId?: number;
  readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
  /** 出生时传入控制器的完整来源；null 为明确不继承，undefined 为未提供。 */
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly abilityEntityId: string;
  readonly definition: LogicalAbilityEntityDefinition;
  readonly ownerId: string;
  readonly source: RuntimeTargetRef;
  readonly target?: RuntimeTargetRef;
  readonly overrideDurationSeconds?: number;
  readonly dieWhenSourceDies?: boolean;
  readonly blackboardAssignments?: Readonly<Record<string, ActionBlackboardValue>>;
  readonly sourceSkillCastId?: number;
  /** 由操作解释链创建；目录只负责用实体局部时间推进和对称结束。 */
  readonly createChildRuntime?: (
    entity: RuntimeTargetRef,
    blackboard: ActionBlackboard,
  ) => LogicalAbilityEntityChildRuntime;
}

export interface LogicalAbilityEntityChildRuntime {
  readonly skillId?: string;
  start(): void;
  advance(deltaSeconds: number): void;
  finish(): void;
}

export interface LogicalAbilityEntitySnapshot {
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly instanceId: number;
  readonly abilityEntityId: string;
  readonly bornTags: readonly GameplayTag[];
  readonly ownerId: string;
  readonly source: RuntimeTargetRef;
  readonly sourceSkillCastId?: number;
  readonly target?: RuntimeTargetRef;
  readonly childSkillId?: string;
  readonly remainingDurationSeconds: number | null;
  readonly elapsedDurationSeconds: number;
  readonly dieWhenSourceDies: boolean;
  /** FinishOwner 后到控制器回收 Tick 前实例仍在目录中，但已不存活。 */
  readonly isAlive: boolean;
  readonly blackboard: Readonly<Record<string, ActionBlackboardValue>>;
}

/** 每帧推进只需要稳定实体身份；不会为时间倍率或 Buff 阶段复制完整黑板。 */
export interface LogicalAbilityEntityIdentity {
  readonly instanceId: number;
  readonly abilityEntityId: string;
}

export interface LogicalAbilityEntityRuntimeHooks {
  /** 宿主阶段：Buff → 子技能时间轴 → 普通Buff回收。不是公共能力事件。 */
  tickBuffs?(entity: LogicalAbilityEntityIdentity): void;
  recycleBuffs?(entity: LogicalAbilityEntityIdentity): void;
  spawned?(
    snapshot: LogicalAbilityEntitySnapshot,
    producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
  ): void;
  childSkillRequested?(snapshot: LogicalAbilityEntitySnapshot, skillId: string): void;
  killed?(snapshot: LogicalAbilityEntitySnapshot, reason: LogicalAbilityEntityFinishReason): void;
  finished?(snapshot: LogicalAbilityEntitySnapshot, reason: LogicalAbilityEntityFinishReason): void;
  timedMarkerCreated?(snapshot: TimedMarkerSnapshot): void;
  timedMarkerFinished?(snapshot: TimedMarkerSnapshot, reason: TimedMarkerFinishReason): void;
}

interface LogicalAbilityEntityInstance {
  readonly skillHosts: EntitySkillHostGroup;
  readonly state: LogicalAbilityEntityState;
  readonly identity: LogicalAbilityEntityIdentity;
  readonly blackboard: ActionBlackboard;
  readonly timedMarkers: TimedMarkerContainer;
  readonly childRuntimes: LogicalAbilityEntityChildRuntime[];
  readonly childBuffs: BuffApplicationHandle[];
  readonly resetCallbacks: Map<number, () => void>;
}

function requireDuration(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number`);
  }
  return value;
}

/** 一场战斗唯一的能力实体实例目录。 */
export class LogicalAbilityEntityRuntime implements FrameRuntime {
  readonly #instances = new Map<number, LogicalAbilityEntityInstance>();
  readonly runtimeState: LogicalAbilityEntityDirectoryState;
  readonly #hooks: LogicalAbilityEntityRuntimeHooks;
  readonly #resolveDeltaSeconds: (entity: LogicalAbilityEntityIdentity) => number;
  readonly #allocateInstanceId: () => number;
  readonly #timedMarkerClocks: Partial<Record<'global' | 'globalScaled', TimedMarkerClock>>;

  constructor(options: {
    readonly hooks?: LogicalAbilityEntityRuntimeHooks;
    /** 后续时间膨胀接线点；省略时使用一帧的普通实体时间。 */
    readonly resolveDeltaSeconds?: (entity: LogicalAbilityEntityIdentity) => number;
    readonly allocateInstanceId?: () => number;
    readonly timedMarkerClocks?: Partial<Record<'global' | 'globalScaled', TimedMarkerClock>>;
    /** 已复制的目录数据；绑定过程不触发生成、子技能或公共事件。 */
    readonly restoredState?: LogicalAbilityEntityDirectoryState;
  }) {
    this.#hooks = options.hooks ?? {};
    this.#resolveDeltaSeconds = options.resolveDeltaSeconds ?? (() => COMBAT_FRAME_INTERVAL);
    const instanceIds = new AbilityEntityInstanceIdAllocator();
    this.#allocateInstanceId = options.allocateInstanceId ?? (() => instanceIds.allocate());
    this.#timedMarkerClocks = options.timedMarkerClocks ?? {};
    this.runtimeState = options.restoredState ?? { instances: new Map(), deadSources: [] };
    for (const [instanceId, state] of this.runtimeState.instances) {
      if (instanceId !== state.instanceId) {
        throw new Error(
          `AbilityEntity directory key '${instanceId}' does not match instance '${state.instanceId}'`,
        );
      }
      if (this.#instances.has(instanceId)) {
        throw new Error(`duplicate restored AbilityEntity instance id '${instanceId}'`);
      }
      this.#instances.set(instanceId, this.#bindRestoredInstance(state));
    }
  }

  /**
   * 所有实体和 Buff 容器建立后，再接回子技能与子 Buff。恢复不会调用 start 或生成事件。
   * reset 回调由持有该登记的宿主通过 bindResetCallback 单独接回。
   */
  bindRestoredRelations(options: {
    readonly createChildRuntime?: (
      entity: RuntimeTargetRef,
      blackboard: ActionBlackboard,
      state: LogicalAbilityEntityState['childSkills'][number],
    ) => LogicalAbilityEntityChildRuntime;
    readonly resolveChildBuff?: (
      reference: LogicalAbilityEntityState['childBuffs'][number],
    ) => BuffApplicationHandle;
  }): void {
    const prepared: Array<{
      readonly instance: LogicalAbilityEntityInstance;
      readonly childRuntimes: LogicalAbilityEntityChildRuntime[];
      readonly childBuffs: BuffApplicationHandle[];
    }> = [];
    for (const instance of this.#instances.values()) {
      if (instance.childRuntimes.length > 0 || instance.childBuffs.length > 0) {
        throw new Error(`AbilityEntity '${instance.state.instanceId}' relations are already bound`);
      }
      const entity = { kind: 'abilityEntity' as const, instanceId: instance.state.instanceId };
      if (instance.state.childSkills.length > 0 && options.createChildRuntime === undefined) {
        throw new Error(
          `AbilityEntity '${instance.state.instanceId}' child skill binder is missing`,
        );
      }
      if (instance.state.childBuffs.length > 0 && options.resolveChildBuff === undefined) {
        throw new Error(
          `AbilityEntity '${instance.state.instanceId}' child Buff resolver is missing`,
        );
      }
      const childRuntimes = instance.state.childSkills.map(state =>
        options.createChildRuntime!(entity, instance.blackboard, state),
      );
      const childBuffs = instance.state.childBuffs.map(reference =>
        options.resolveChildBuff!(reference),
      );
      prepared.push({ instance, childRuntimes, childBuffs });
    }
    for (const { instance, childRuntimes, childBuffs } of prepared) {
      instance.childRuntimes.push(...childRuntimes);
      instance.childBuffs.push(...childBuffs);
    }
  }

  get activeCount(): number {
    return this.#instances.size;
  }

  isActive(target: RuntimeTargetRef): boolean {
    return target.kind === 'abilityEntity' && this.#instances.has(target.instanceId);
  }

  spawn(request: LogicalAbilityEntitySpawnRequest): AbilityEntityTargetRef {
    if (request.abilityEntityId.length === 0) throw new Error('AbilityEntity id must not be empty');
    if (
      request.sourceSkillCastId !== undefined &&
      (!Number.isInteger(request.sourceSkillCastId) || request.sourceSkillCastId <= 0)
    ) {
      throw new RangeError('AbilityEntity source skill-cast id must be a positive integer');
    }
    if (request.definition.lifetime.kind === 'limited') {
      requireDuration(request.definition.lifetime.durationSeconds, 'AbilityEntity duration');
    }
    const deathReleaseDelaySeconds = requireDuration(
      request.definition.deathReleaseDelaySeconds ?? 0,
      'AbilityEntity death release delay',
    );
    if (deathReleaseDelaySeconds >= 300) {
      throw new RangeError('AbilityEntity death release delay must be less than 300 seconds');
    }
    const maxStackingCount = request.definition.maxStackingCount;
    if (
      maxStackingCount !== undefined &&
      (!Number.isInteger(maxStackingCount) || maxStackingCount <= 0)
    ) {
      throw new RangeError('AbilityEntity max stacking count must be a positive integer');
    }
    if (request.ownerId.length === 0) throw new Error('AbilityEntity owner id must not be empty');
    if (maxStackingCount !== undefined) {
      const matching = [...this.#instances.values()].filter(
        instance => instance.state.abilityEntityId === request.abilityEntityId,
      );
      while (matching.length >= maxStackingCount) {
        this.finish(
          { kind: 'abilityEntity', instanceId: matching.shift()!.state.instanceId },
          'stackingLimit',
        );
      }
    }
    const remainingDurationSeconds =
      request.overrideDurationSeconds === undefined
        ? request.definition.lifetime.kind === 'limited'
          ? request.definition.lifetime.durationSeconds
          : null
        : requireDuration(request.overrideDurationSeconds, 'override duration');
    const instanceId = this.#allocateInstanceId();
    if (!Number.isSafeInteger(instanceId) || instanceId <= 0) {
      throw new RangeError('AbilityEntity instance id must be a positive safe integer');
    }
    if (this.#instances.has(instanceId)) {
      throw new Error(`duplicate AbilityEntity instance id '${instanceId}'`);
    }
    const blackboard = new ActionBlackboard({
      ...request.definition.blackboard,
      ...request.blackboardAssignments,
    });
    let instance!: LogicalAbilityEntityInstance;
    const timedMarkers = createTimedMarkerState();
    instance = {
      identity: Object.freeze({ instanceId, abilityEntityId: request.abilityEntityId }),
      state: {
        ...(request.definitionProgramId === undefined
          ? {}
          : { definitionProgramId: request.definitionProgramId }),
        childBuffs: [],
        childSkills: [],
        passiveAbilities: new Map(),
        buffContainerCreated: false,
        buffs: null,
        resetCallbackIds: [],
        nextResetCallbackId: 0,
        timedMarkers,
        ...(request.skillCastInfo === undefined ? {} : { skillCastInfo: request.skillCastInfo }),
        instanceId,
        abilityEntityId: request.abilityEntityId,
        definition: request.definition,
        ownerId: request.ownerId,
        source: request.source,
        ...(request.sourceSkillCastId === undefined
          ? {}
          : { sourceSkillCastId: request.sourceSkillCastId }),
        ...(request.target === undefined ? {} : { target: request.target }),
        dieWhenSourceDies: request.dieWhenSourceDies ?? false,
        blackboard: blackboard.runtimeState,
        remainingDurationSeconds,
        elapsedDurationSeconds: 0,
        isAlive: true,
        pendingRelease: false,
        pendingReleaseElapsedSeconds: 0,
      },
      blackboard,
      timedMarkers: new TimedMarkerContainer(
        logicalAbilityEntityRuntimeId(instanceId),
        {
          get time() {
            return instance.state.elapsedDurationSeconds;
          },
        },
        {
          created: marker => this.#hooks.timedMarkerCreated?.(marker),
          finished: (marker, reason) => this.#hooks.timedMarkerFinished?.(marker, reason),
        },
        timedMarkers,
        this.#timedMarkerClocks,
      ),
      childRuntimes: [],
      skillHosts: new EntitySkillHostGroup(),
      childBuffs: [],
      resetCallbacks: new Map(),
    };
    this.#instances.set(instance.state.instanceId, instance);
    this.runtimeState.instances.set(instance.state.instanceId, instance.state);
    const snapshot = this.#snapshot(instance);
    this.#hooks.spawned?.(snapshot, request.producedBy);
    const target = { kind: 'abilityEntity' as const, instanceId: instance.state.instanceId };
    if (request.createChildRuntime !== undefined) {
      this.startChildSkill(
        target,
        instance.state.definition.childSkill?.skillId ?? '<spawn-child>',
        request.createChildRuntime,
      );
    } else if (instance.state.definition.childSkill !== undefined) {
      this.#hooks.childSkillRequested?.(snapshot, instance.state.definition.childSkill.skillId);
    }
    return target;
  }

  /** 在既有实例上启动额外子时间轴；调用者负责提供已经编译的隐藏技能。 */
  startChildSkill(
    entity: RuntimeTargetRef,
    skillId: string,
    createRuntime: (
      entity: RuntimeTargetRef,
      blackboard: ActionBlackboard,
    ) => LogicalAbilityEntityChildRuntime,
  ): void {
    if (skillId.length === 0) throw new Error('AbilityEntity child skill id must not be empty');
    const instance = this.#requireInstance(entity);
    this.#hooks.childSkillRequested?.(this.#snapshot(instance), skillId);
    let runtime = instance.childRuntimes.find(child => child.skillId === skillId);
    if (runtime === undefined) {
      runtime = createRuntime(entity, instance.blackboard);
      instance.childRuntimes.push(runtime);
    }
    runtime.start();
  }

  childSkillHosts(entity: RuntimeTargetRef): EntitySkillHostGroup {
    return this.#requireInstance(entity).skillHosts;
  }

  /** 原生 asChildBuff：子 Buff 的寿命归当前能力实体所有。 */
  addChildBuff(entity: RuntimeTargetRef, child: BuffApplicationHandle): void {
    const instance = this.#requireInstance(entity);
    instance.state.childBuffs.push(child.reference);
    instance.childBuffs.push(child);
  }

  /** 零空间范围查找：返回全部活动实例，不应用距离、半径或形状裁剪。 */
  findAll(): readonly AbilityEntityTargetRef[] {
    return [...this.#instances.keys()].map(instanceId => ({ kind: 'abilityEntity', instanceId }));
  }

  findOwnerSpawned(query: OwnerSpawnedAbilityEntityQuery): readonly RuntimeTargetRef[] {
    if (
      query.sourceSkillCastId !== undefined &&
      (!Number.isInteger(query.sourceSkillCastId) || query.sourceSkillCastId <= 0)
    ) {
      throw new RangeError('AbilityEntity query skill-cast id must be a positive integer');
    }
    const result: RuntimeTargetRef[] = [];
    for (const instance of this.#instances.values()) {
      if (instance.state.ownerId !== query.ownerId) continue;
      if (
        query.abilityEntityIds !== undefined &&
        !query.abilityEntityIds.includes(instance.state.abilityEntityId)
      ) {
        continue;
      }
      if (
        query.sourceSkillCastId !== undefined &&
        instance.state.sourceSkillCastId !== query.sourceSkillCastId
      ) {
        continue;
      }
      result.push({ kind: 'abilityEntity', instanceId: instance.state.instanceId });
    }
    return result;
  }

  snapshot(target: RuntimeTargetRef): LogicalAbilityEntitySnapshot {
    return this.#snapshot(this.#requireInstance(target));
  }

  /** 同一实例的子技能与 Buff 共用这一持久黑板；不对场景外暴露实例对象。 */
  entityBlackboard(target: RuntimeTargetRef): ActionBlackboard {
    return this.#requireInstance(target).blackboard;
  }

  /** 能力实体标记使用已经过实体时间膨胀结算的局部 elapsed time。 */
  timedMarkers(target: RuntimeTargetRef): TimedMarkerContainer {
    return this.#requireInstance(target).timedMarkers;
  }

  setTarget(entity: RuntimeTargetRef, target: RuntimeTargetRef): void {
    this.#requireInstance(entity).state.target = target;
  }

  isSourceDead(entity: RuntimeTargetRef): boolean {
    const source = this.#requireInstance(entity).state.source;
    return this.runtimeState.deadSources.some(dead => this.#sameTarget(dead, source));
  }

  /** SetAbilityEntityDuration 的 Assign 路径设置当前剩余时长。 */
  setRemainingDuration(entity: RuntimeTargetRef, seconds: number): void {
    this.#requireInstance(entity).state.remainingDurationSeconds = requireDuration(
      seconds,
      'remaining duration',
    );
  }

  finish(entity: RuntimeTargetRef, reason: LogicalAbilityEntityFinishReason = 'explicit'): void {
    const instance = this.#requireInstance(entity);
    const resetCallbacks = instance.state.resetCallbackIds.map(id => {
      const callback = instance.resetCallbacks.get(id);
      if (callback === undefined) {
        throw new Error(`AbilityEntity reset callback '${id}' is not bound`);
      }
      return callback;
    });
    for (const runtime of instance.childRuntimes) runtime.finish();
    // 实时读取长度，保留清理回调追加子 Buff 时同轮继续结束的行为。
    for (let index = 0; index < instance.state.childBuffs.length; index++) {
      instance.childBuffs[index]!.finish('other', null);
    }
    instance.timedMarkers.finishAll();
    this.#hooks.finished?.(this.#snapshot(instance), reason);
    this.#instances.delete(instance.state.instanceId);
    this.runtimeState.instances.delete(instance.state.instanceId);
    try {
      for (const callback of resetCallbacks) callback();
    } finally {
      instance.resetCallbacks.clear();
      instance.state.resetCallbackIds.length = 0;
    }
  }

  /** 原生onResetAction对应的对象端口；在宿主清理后通知，不是公共战斗事件。 */
  onReset(
    entity: RuntimeTargetRef,
    callback: () => void,
  ): {
    readonly registrationId: number;
    dispose(): void;
  } {
    const instance = this.#requireInstance(entity);
    // 每次订阅保留独立身份，重复传入同一个函数也可分别注销。
    const registrationId = instance.state.nextResetCallbackId++;
    instance.state.resetCallbackIds.push(registrationId);
    return this.bindResetCallback(entity, registrationId, callback);
  }

  /** 给保存的 onReset 登记接回函数，不申请新编号或改变回调顺序。 */
  bindResetCallback(
    entity: RuntimeTargetRef,
    registrationId: number,
    callback: () => void,
  ): { readonly registrationId: number; dispose(): void } {
    const instance = this.#requireInstance(entity);
    if (!instance.state.resetCallbackIds.includes(registrationId)) {
      throw new Error(`AbilityEntity reset callback '${registrationId}' is missing`);
    }
    if (instance.resetCallbacks.has(registrationId)) {
      throw new Error(`AbilityEntity reset callback '${registrationId}' is already bound`);
    }
    instance.resetCallbacks.set(registrationId, callback);
    return {
      registrationId,
      dispose: () => {
        if (!instance.resetCallbacks.delete(registrationId)) return;
        const index = instance.state.resetCallbackIds.indexOf(registrationId);
        if (index >= 0) instance.state.resetCallbackIds.splice(index, 1);
      },
    };
  }

  /**
   * FinishOwner 的死亡分支。死亡不立即脱离实例目录；零回收延迟在下一次 runtime advance
   * 执行 Release，从而保留同一同步帧内 finder 对 dead 实例的可见性。
   */
  kill(entity: RuntimeTargetRef, reason: LogicalAbilityEntityFinishReason = 'explicit'): void {
    const instance = this.#requireInstance(entity);
    if (!killLogicalAbilityEntity(instance.state, reason)) return;
    this.#hooks.killed?.(this.#snapshot(instance), reason);
  }

  finishOwnerSpawned(ownerId: string): number {
    const targets = this.findOwnerSpawned({ ownerId });
    for (const target of targets) this.finish(target, 'ownerFinished');
    return targets.length;
  }

  notifySourceDied(source: RuntimeTargetRef): number {
    if (!this.runtimeState.deadSources.some(dead => this.#sameTarget(dead, source))) {
      this.runtimeState.deadSources.push(source);
    }
    const targets = [...this.#instances.values()]
      .filter(
        instance =>
          instance.state.isAlive &&
          instance.state.dieWhenSourceDies &&
          this.#sameTarget(instance.state.source, source),
      )
      .map(instance => ({ kind: 'abilityEntity' as const, instanceId: instance.state.instanceId }));
    for (const target of targets) this.kill(target, 'sourceDied');
    return targets.length;
  }

  advanceFrame(): void {
    for (const instance of [...this.#instances.values()]) {
      // 前一个宿主的Buff/技能回调可能已释放此实例；快照不延长宿主生命期。
      if (!this.#instances.has(instance.state.instanceId)) continue;
      if (instance.state.pendingRelease) {
        if (
          advanceAbilityEntityRelease(instance.state, this.#resolveDeltaSeconds(instance.identity))
        ) {
          this.finish(
            { kind: 'abilityEntity', instanceId: instance.state.instanceId },
            instance.state.pendingReleaseReason ?? 'explicit',
          );
        }
        continue;
      }
      const delta = this.#resolveDeltaSeconds(instance.identity);
      if (
        advanceAbilityEntityLifetime(instance.state, delta, () => instance.timedMarkers.sweep())
      ) {
        this.finish(
          { kind: 'abilityEntity', instanceId: instance.state.instanceId },
          'durationExpired',
        );
        continue;
      }
      this.#hooks.tickBuffs?.(instance.identity);
      if (!this.#instances.has(instance.state.instanceId) || instance.state.pendingRelease)
        continue;
      if (instance.skillHosts.hasSkills) instance.skillHosts.advance(delta);
      else for (const runtime of instance.childRuntimes) runtime.advance(delta);
      if (this.#instances.has(instance.state.instanceId) && !instance.state.pendingRelease)
        this.#hooks.recycleBuffs?.(instance.identity);
    }
  }

  #requireInstance(target: RuntimeTargetRef): LogicalAbilityEntityInstance {
    if (target.kind !== 'abilityEntity') {
      throw new Error(`target '${target.kind}' is not an AbilityEntity`);
    }
    const instance = this.#instances.get(target.instanceId);
    if (instance === undefined) {
      throw new Error(`unknown or finished AbilityEntity instance '${target.instanceId}'`);
    }
    return instance;
  }

  #bindRestoredInstance(state: LogicalAbilityEntityState): LogicalAbilityEntityInstance {
    const blackboard = ActionBlackboard.bindRuntimeState(state.blackboard);
    let instance!: LogicalAbilityEntityInstance;
    instance = {
      identity: Object.freeze({
        instanceId: state.instanceId,
        abilityEntityId: state.abilityEntityId,
      }),
      state,
      blackboard,
      timedMarkers: new TimedMarkerContainer(
        logicalAbilityEntityRuntimeId(state.instanceId),
        {
          get time() {
            return instance.state.elapsedDurationSeconds;
          },
        },
        {
          created: marker => this.#hooks.timedMarkerCreated?.(marker),
          finished: (marker, reason) => this.#hooks.timedMarkerFinished?.(marker, reason),
        },
        state.timedMarkers,
        this.#timedMarkerClocks,
      ),
      childRuntimes: [],
      skillHosts: new EntitySkillHostGroup(),
      childBuffs: [],
      resetCallbacks: new Map(),
    };
    return instance;
  }

  #snapshot(instance: LogicalAbilityEntityInstance): LogicalAbilityEntitySnapshot {
    return Object.freeze({
      instanceId: instance.state.instanceId,
      abilityEntityId: instance.state.abilityEntityId,
      bornTags: instance.state.definition.bornTags ?? [],
      ownerId: instance.state.ownerId,
      source: instance.state.source,
      ...(instance.state.skillCastInfo === undefined
        ? {}
        : { skillCastInfo: instance.state.skillCastInfo }),
      ...(instance.state.sourceSkillCastId === undefined
        ? {}
        : { sourceSkillCastId: instance.state.sourceSkillCastId }),
      ...(instance.state.target === undefined ? {} : { target: instance.state.target }),
      ...(instance.state.definition.childSkill === undefined
        ? {}
        : { childSkillId: instance.state.definition.childSkill.skillId }),
      remainingDurationSeconds: instance.state.remainingDurationSeconds,
      elapsedDurationSeconds: instance.state.elapsedDurationSeconds,
      dieWhenSourceDies: instance.state.dieWhenSourceDies,
      isAlive: instance.state.isAlive,
      blackboard: instance.blackboard.snapshot(),
    });
  }

  #sameTarget(left: RuntimeTargetRef, right: RuntimeTargetRef): boolean {
    if (left.kind !== right.kind) return false;
    if (left.kind === 'enemy') return true;
    if (left.kind === 'operator' && right.kind === 'operator') {
      return left.operatorId === right.operatorId;
    }
    return (
      left.kind === 'abilityEntity' &&
      right.kind === 'abilityEntity' &&
      left.instanceId === right.instanceId
    );
  }
}
