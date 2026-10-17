/**
 * 投射物生命周期数据与当前分支执行端口的绑定。
 * 数据只保存投射物、回调程序和 reset 订阅的稳定身份；恢复装配按这些身份重新连接宿主行为。
 */
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import type {
  AbilityEntityTargetRef,
  RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';
import type { AbilityResetReference } from '../events/combatAbilityEvent';
import type { FrameRuntime } from '../runtime/combatSimulation';
import { createProjectileLifecycleState } from '../state/instanceState';
import { AbilityEntityInstanceIdAllocator } from './abilityEntityInstanceIdAllocator';
import { ProjectileCallbackPrograms } from './projectileCallbackPrograms';
import {
  advanceProjectileAbilityFrame,
  advanceProjectileLifetimes,
  beginProjectileAbilityFrame,
  finishProjectileByAction,
  launchProjectile,
  registerProjectileReset,
  unregisterProjectileReset,
  type ProjectileLaunchData,
} from './projectileLifecycleExecution';

export type { ProjectileFinishTiming } from './projectileLifecycleExecution';

/** 引用一个具体投射物，来源技能结束后它仍可独立存活。 */
export type ProjectileLifetimeReference = AbilityResetReference & {
  readonly target: AbilityEntityTargetRef;
};

export interface ProjectileHostPorts {
  /** reset 引用通知完成后解除 RootComponent 持有的外部关系。 */
  readonly released?: () => void;
  readonly resolveTickDeltaSeconds: () => number | null;
  readonly reach?: () => void;
  readonly block?: () => void;
  readonly hit?: () => boolean;
  readonly finish: () => void;
  readonly beforeReset: () => void;
  readonly abilityRuntime?: FrameRuntime;
}

interface ProjectileHostBinding extends ProjectileHostPorts {
  readonly resetRegistrations: Set<number>;
}

/** Buff 在技能之前计时，技能之后回收；宿主回收另行处理。 */
export interface ProjectileBuffLifecycle {
  readonly tick: (instanceId: number) => void;
  readonly recycleFinished: (instanceId: number) => void;
  readonly recycled: (instanceId: number) => void;
}

export class ProjectileLifecycleRuntime implements FrameRuntime {
  readonly callbackPrograms: ProjectileCallbackPrograms;
  readonly #state: ReturnType<typeof createProjectileLifecycleState>;
  readonly #bindings = new Map<number, ProjectileHostBinding>();
  readonly #resetHandlers = new Map<number, () => void>();
  readonly #allocateInstanceId: () => number;
  #relationsBound: boolean;

  /** 生命周期目录的唯一数据；结束回调绑定不在其中。 */
  get runtimeState(): ReturnType<typeof createProjectileLifecycleState> {
    return this.#state;
  }

  constructor(
    allocateInstanceId?: () => number,
    restored?: {
      readonly state: ReturnType<typeof createProjectileLifecycleState>;
      readonly callbackPrograms?: ProjectileCallbackPrograms;
      readonly resolveHost?: (instanceId: number) => ProjectileHostPorts;
      readonly resolveResetHandler?: (handlerId: number) => () => void;
    },
    private readonly buffLifecycle?: ProjectileBuffLifecycle,
  ) {
    if (restored !== undefined && allocateInstanceId === undefined)
      throw new Error('restoring projectiles requires the restored instance id allocator');
    this.#state = restored?.state ?? createProjectileLifecycleState();
    this.callbackPrograms = restored?.callbackPrograms ?? new ProjectileCallbackPrograms();
    const instanceIds = new AbilityEntityInstanceIdAllocator();
    this.#allocateInstanceId = allocateInstanceId ?? (() => instanceIds.allocate());
    this.#relationsBound = restored === undefined || this.#state.instances.size === 0;
    if (restored !== undefined) {
      if (this.#state.admittedAbilities !== null)
        throw new Error('cannot restore projectiles during an ability frame');
      for (const [id, instance] of this.#state.instances) {
        for (const callback of instance.callbacks) {
          if (callback.programId === null)
            throw new Error(`projectile ${id} has no callback program registration`);
          const program = this.callbackPrograms.resolve(callback.programId);
          if (program.skillId !== callback.skillId)
            throw new Error(`projectile ${id} callback program identity mismatch`);
        }
      }
      if (restored.resolveHost !== undefined) {
        if (!this.#relationsBound)
          this.bindRestoredRelations({
            resolveHost: restored.resolveHost,
            ...(restored.resolveResetHandler === undefined
              ? {}
              : { resolveResetHandler: restored.resolveResetHandler }),
          });
      } else if (restored.resolveResetHandler !== undefined) {
        throw new Error('projectile reset resolver requires the host resolver');
      }
    }
  }

  /**
   * 全部技能、回调和实体宿主建立后接回投射物关系。此阶段不推进寿命、不执行结束回调。
   */
  bindRestoredRelations(options: {
    readonly resolveHost: (instanceId: number) => ProjectileHostPorts;
    readonly resolveResetHandler?: (handlerId: number) => (() => void) | undefined;
  }): void {
    if (this.#relationsBound || this.#bindings.size !== 0)
      throw new Error('projectile relations are already bound');
    const bindings = new Map<number, ProjectileHostBinding>();
    const resetHandlers = new Map<number, () => void>();
    for (const [id, instance] of this.#state.instances) {
      if (instance.phase === 'reset') continue;
      try {
        const ports = options.resolveHost(id);
        if (ports === undefined) throw new Error(`missing projectile host ${id}`);
        if (instance.firstTickHit?.pending && ports.hit === undefined)
          throw new Error(`projectile ${id} first-tick hit requires a hit port`);
        if (instance.pendingBlock && ports.block === undefined)
          throw new Error(`projectile ${id} pending landing requires a block port`);
        const resetRegistrations = new Set(instance.resetListeners.values());
        for (const handlerId of resetRegistrations) {
          if (resetHandlers.has(handlerId)) {
            throw new Error(`projectile reset handler '${handlerId}' has multiple registrations`);
          }
          const handler =
            this.#resetHandlers.get(handlerId) ?? options.resolveResetHandler?.(handlerId);
          if (handler === undefined)
            throw new Error(`missing projectile reset handler ${handlerId}`);
          resetHandlers.set(handlerId, handler);
        }
        bindings.set(id, { ...ports, resetRegistrations });
      } catch (error) {
        bindings.clear();
        resetHandlers.clear();
        throw error;
      }
    }
    for (const [id, binding] of bindings) this.#bindings.set(id, binding);
    for (const [id, handler] of resetHandlers) this.#resetHandlers.set(id, handler);
    this.#relationsBound = true;
  }

  /** 按保存的登记编号接回对象持有者的 reset 处理函数，不申请新编号。 */
  bindRestoredResetCallback(
    instanceId: number,
    registrationId: number,
    callback: () => void,
  ): { readonly registrationId: number; dispose(): void } {
    const instance = this.#state.instances.get(instanceId);
    if (instance === undefined) throw new Error(`missing projectile ${instanceId}`);
    const handlerId = instance.resetListeners.get(registrationId);
    if (handlerId === undefined) {
      throw new Error(`projectile ${instanceId} reset registration '${registrationId}' is missing`);
    }
    if (this.#resetHandlers.has(handlerId)) {
      throw new Error(`projectile reset handler '${handlerId}' is already bound`);
    }
    this.#resetHandlers.set(handlerId, callback);
    this.#bindings.get(instanceId)?.resetRegistrations.add(handlerId);
    return {
      registrationId,
      dispose: () => {
        if (this.#resetHandlers.get(handlerId) !== callback) return;
        instance.resetListeners.delete(registrationId);
        this.#resetHandlers.delete(handlerId);
        this.#bindings.get(instanceId)?.resetRegistrations.delete(handlerId);
      },
    };
  }

  /** reset 通知完成前仍可查询来源。 */
  findSource(instanceId: number): RuntimeTargetRef | undefined {
    const instance = this.#state.instances.get(instanceId);
    return (
      instance?.source ??
      (instance?.phase === 'reset' ? { kind: 'abilityEntity', instanceId } : undefined)
    );
  }

  finishByAction(target: RuntimeTargetRef): boolean {
    this.#requireRelations();
    return (
      target.kind === 'abilityEntity' && finishProjectileByAction(this.#state, target.instanceId)
    );
  }

  /** 原生 children 在回收时脱链，已结束但未回收的投射物仍属于来源。 */
  findOwnerSpawned(ownerId: string): readonly AbilityEntityTargetRef[] {
    return [...this.#state.instances.values()]
      .filter(instance => {
        if (instance.phase === 'reset') return false;
        const source = instance.source;
        return source?.kind === 'operator'
          ? source.operatorId === ownerId
          : source?.kind === 'enemy'
            ? ownerId === 'enemy'
            : source?.kind === 'abilityEntity' && ownerId === `ability-entity:${source.instanceId}`;
      })
      .map(instance => ({ kind: 'abilityEntity', instanceId: instance.instanceId }));
  }

  isActive(target: RuntimeTargetRef): boolean {
    if (target.kind !== 'abilityEntity') return false;
    const instance = this.#state.instances.get(target.instanceId);
    return instance !== undefined && instance.phase !== 'reset';
  }

  /**
   * 查找器的投射物候选。结束后尚未回收的对象仍可被旧引用访问，但不再参与新的查找。
   * 这里只筛生命周期；空间形状和其他选择条件由查询方继续处理。
   */
  getUnfinishedTargets(): readonly AbilityEntityTargetRef[] {
    const targets: AbilityEntityTargetRef[] = [];
    for (const instance of this.#state.instances.values()) {
      if (instance.phase === 'active')
        targets.push({ kind: 'abilityEntity', instanceId: instance.instanceId });
    }
    return targets;
  }

  beginAbilityFrame(): void {
    this.#requireRelations();
    beginProjectileAbilityFrame(this.#state);
  }

  advanceAbilityFrame(): void {
    this.#requireRelations();
    advanceProjectileAbilityFrame(this.#state, id => {
      this.buffLifecycle?.tick(id);
      this.#bindings.get(id)!.abilityRuntime?.advanceFrame();
      this.buffLifecycle?.recycleFinished(id);
    });
  }

  launch(
    request: ProjectileLaunchData & {
      readonly callbackPrograms?: readonly CompiledAbilityEntityChildSkillProgram[];
      readonly resolveTickDeltaSeconds: () => number | null;
      readonly reach?: () => void;
      readonly block?: () => void;
      readonly hit?: () => boolean;
      readonly finish: () => void;
      readonly beforeReset: () => void;
      readonly released?: () => void;
      readonly abilityRuntime?: FrameRuntime;
    },
  ): ProjectileLifetimeReference {
    this.#requireRelations();
    if (request.firstTickHit !== undefined && request.hit === undefined)
      throw new Error('projectile first-tick hit requires a hit port');
    const callbacks = request.callbacks ?? [];
    if (callbacks.length !== (request.callbackPrograms?.length ?? 0))
      throw new Error('projectile callbacks require matching fixed programs');
    callbacks.forEach((callback, index) => {
      const program = request.callbackPrograms![index]!;
      if (program.skillId !== callback.skillId)
        throw new Error('projectile callback program identity mismatch');
      callback.programId = this.callbackPrograms.register(program);
    });
    const instanceId = this.#allocateInstanceId();
    launchProjectile(this.#state, instanceId, request);
    const binding: ProjectileHostBinding = {
      resolveTickDeltaSeconds: request.resolveTickDeltaSeconds,
      ...(request.reach === undefined ? {} : { reach: request.reach }),
      ...(request.block === undefined ? {} : { block: request.block }),
      ...(request.hit === undefined ? {} : { hit: request.hit }),
      finish: request.finish,
      beforeReset: request.beforeReset,
      ...(request.released === undefined ? {} : { released: request.released }),
      ...(request.abilityRuntime === undefined ? {} : { abilityRuntime: request.abilityRuntime }),
      resetRegistrations: new Set(),
    };
    this.#bindings.set(instanceId, binding);
    return {
      instanceId,
      target: { kind: 'abilityEntity', instanceId },
      onReset: callback => {
        if (this.#bindings.get(instanceId) !== binding)
          throw new Error('cannot retain an already reset projectile');
        const handlerId = this.#state.nextResetRegistrationId;
        const id = registerProjectileReset(this.#state, instanceId, handlerId);
        this.#resetHandlers.set(handlerId, callback);
        binding.resetRegistrations.add(handlerId);
        return {
          registrationId: handlerId,
          dispose: () => {
            if (this.#bindings.get(instanceId) !== binding) return;
            unregisterProjectileReset(this.#state, instanceId, id);
            this.#resetHandlers.delete(handlerId);
            binding.resetRegistrations.delete(handlerId);
          },
        };
      },
    };
  }

  advanceFrame(): void {
    this.#requireRelations();
    advanceProjectileLifetimes(this.#state, {
      resolveTickDeltaSeconds: id => this.#bindings.get(id)!.resolveTickDeltaSeconds(),
      reach: id => this.#bindings.get(id)!.reach?.(),
      block: id => this.#bindings.get(id)!.block?.(),
      hit: id => {
        const hit = this.#bindings.get(id)!.hit;
        if (hit === undefined) throw new Error('projectile first-tick hit requires a hit port');
        return hit();
      },
      finish: id => this.#bindings.get(id)!.finish(),
      beforeReset: id => {
        this.#bindings.get(id)!.beforeReset();
      },
      resolveResetHandler: id => this.#resetHandlers.get(id)!,
      released: id => {
        this.buffLifecycle?.recycled(id);
        this.#bindings.get(id)!.released?.();
        for (const registrationId of this.#bindings.get(id)!.resetRegistrations)
          this.#resetHandlers.delete(registrationId);
        this.#bindings.delete(id);
      },
    });
  }

  get activeCount(): number {
    let count = 0;
    for (const instance of this.#state.instances.values()) if (instance.phase !== 'reset') count++;
    return count;
  }

  #requireRelations(): void {
    if (!this.#relationsBound) throw new Error('restored projectile relations have not been bound');
  }
}
