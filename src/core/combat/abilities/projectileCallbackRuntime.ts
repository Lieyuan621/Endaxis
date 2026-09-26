/** 绑定一个投射物的回调宿主。飞行期间不创建技能，恢复已有宿主时不再次施放。 */
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { BuffApplicationHandle } from '../buffs/buffOperationExecutor';
import type {
  CombatOperationExecutor,
  ProjectileRuntimeDependencies,
} from '../skills/skillRuntime';
import type { CallbackSkillHostState } from '../state/abilityState';
import type { BuffReference } from '../state/foundationState';
import type { ProjectileCallbackState } from '../state/instanceState';
import type { CallbackSkillHost } from './callbackSkillHost';
import type { ProjectileCallbackPrograms } from './projectileCallbackPrograms';
import type { ProjectileHostPorts } from './projectileLifecycleRuntime';

/** 新建与恢复共用事件绑定；所有回调使用同一投射物时钟。 */
export function bindProjectileCallbackLifecycle(
  callbacks: readonly ProjectileCallbackRuntime[],
  resolveTickDeltaSeconds: () => number | null,
): ProjectileHostPorts {
  const start = (event: 'block' | 'reach' | 'finish') => {
    for (const callback of callbacks) if (callback.runtimeState.event === event) callback.start();
  };
  return {
    resolveTickDeltaSeconds,
    reach: () => start('reach'),
    block: () => start('block'),
    hit: () => {
      let accepted = false;
      for (const callback of callbacks)
        if (callback.runtimeState.event === 'hit' && callback.hit()) accepted = true;
      return accepted;
    },
    finish: () => start('finish'),
    beforeReset: () => callbacks.forEach(callback => callback.beforeReset()),
    abilityRuntime: {
      advanceFrame: () => {
        const delta = resolveTickDeltaSeconds();
        if (delta !== null) callbacks.forEach(callback => callback.advance(delta));
      },
    },
  };
}

/** 用已保存的输入重建回调绑定。执行器与 Buff 查找必须来自恢复分支。 */
export function restoreProjectileCallback(
  state: ProjectileCallbackState,
  instanceId: number,
  programs: ProjectileCallbackPrograms,
  operations: CombatOperationExecutor,
  dependencies: ProjectileRuntimeDependencies,
  resolveAttachedBuff: (reference: BuffReference) => BuffApplicationHandle | undefined,
  sourceId?: string,
): ProjectileCallbackRuntime {
  if (state.programId === null) throw new Error('projectile callback has no fixed program');
  if (state.definitionOperatorId.length === 0)
    throw new Error('projectile callback has no definition operator');
  const program = programs.resolve(state.programId);
  if (program.skillId !== state.skillId)
    throw new Error('projectile callback program identity mismatch');
  if (!Number.isSafeInteger(instanceId) || instanceId <= 0)
    throw new Error('invalid projectile identity');
  const context = {
    actionInputTarget: state.inputTarget,
    blackboard: ActionBlackboard.bindRuntimeState(state.blackboard),
    skillCastInfo: state.skillCastInfo ?? undefined,
    actionOwnerAbilityEntity: { kind: 'abilityEntity' as const, instanceId },
    actionOwnerId: `ability-entity:${instanceId}`,
    actionSourceId: sourceId ?? `ability-entity:${instanceId}`,
    ...dependencies,
  };
  return new ProjectileCallbackRuntime(
    state,
    saved =>
      dependencies.createCallbackSkillHost(
        program,
        context,
        operations,
        saved === null
          ? undefined
          : {
              state: saved,
              damageSnapshotProgram: programs.resolveDamageSnapshots(state.programId!),
              resolveAttachedBuff,
            },
      ),
    () =>
      state.hitTagFilter === undefined ||
      operations.evaluate(
        { kind: 'entityTagMatch', target: 'enemy', ...state.hitTagFilter },
        context,
      ),
  );
}

export class ProjectileCallbackRuntime {
  #host: CallbackSkillHost | null;

  constructor(
    readonly runtimeState: ProjectileCallbackState,
    readonly createHost: (saved: CallbackSkillHostState | null) => CallbackSkillHost,
    readonly acceptsHit: () => boolean = () => true,
  ) {
    if (
      runtimeState.event !== 'hit' &&
      runtimeState.event !== 'reach' &&
      runtimeState.event !== 'finish' &&
      runtimeState.event !== 'block'
    )
      throw new Error('projectile callback requires a hit, block, reach or finish event');
    this.#host = runtimeState.host === null ? null : createHost(runtimeState.host);
    if (this.#host !== null && this.#host.runtimeState !== runtimeState.host)
      throw new Error('restored projectile callback must bind the saved host data');
  }

  start(inputTarget = this.runtimeState.inputTarget): void {
    if (this.#host !== null) throw new Error('projectile callback has already started');
    this.#startHost(inputTarget);
  }

  #startHost(inputTarget = this.runtimeState.inputTarget): void {
    this.#host ??= this.createHost(null);
    this.runtimeState.host = this.#host.runtimeState;
    this.#host.start(inputTarget);
  }

  hit(): boolean {
    if (!this.acceptsHit()) return false;
    for (const target of this.runtimeState.inputTargets ?? [this.runtimeState.inputTarget])
      this.#startHost(target);
    return true;
  }

  advance(deltaSeconds: number): void {
    this.#host?.advance(deltaSeconds);
  }

  beforeReset(): void {
    this.#host?.end();
  }
}
