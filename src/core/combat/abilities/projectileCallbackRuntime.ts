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

/** 将已绑定的回调接到投射物生命周期的两个推进阶段，时间增量由当前分支读取。 */
export function bindProjectileCallbackLifecycle(
  callback: ProjectileCallbackRuntime,
  resolveTickDeltaSeconds: () => number | null,
): ProjectileHostPorts {
  return {
    resolveTickDeltaSeconds,
    finish: () => callback.reach(),
    beforeReset: () => callback.beforeReset(),
    abilityRuntime: {
      advanceFrame: () => {
        const delta = resolveTickDeltaSeconds();
        if (delta !== null) callback.advance(delta);
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
): ProjectileCallbackRuntime {
  if (state.programId === null) throw new Error('projectile callback has no fixed program');
  if (state.definitionOperatorId.length === 0)
    throw new Error('projectile callback has no definition operator');
  const program = programs.resolve(state.programId);
  if (program.skillId !== state.skillId)
    throw new Error('projectile callback program identity mismatch');
  if (state.skillCastInfo === null)
    throw new Error('projectile callback has no inherited cast information');
  if (!Number.isSafeInteger(instanceId) || instanceId <= 0)
    throw new Error('invalid projectile identity');
  const context = {
    blackboard: ActionBlackboard.bindRuntimeState(state.blackboard),
    skillCastInfo: state.skillCastInfo,
    actionOwnerAbilityEntity: { kind: 'abilityEntity' as const, instanceId },
    actionOwnerId: `ability-entity:${instanceId}`,
    actionSourceId: `ability-entity:${instanceId}`,
    ...dependencies,
  };
  return new ProjectileCallbackRuntime(state, saved =>
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
  );
}

export class ProjectileCallbackRuntime {
  #host: CallbackSkillHost | null;

  constructor(
    readonly runtimeState: ProjectileCallbackState,
    readonly createHost: (saved: CallbackSkillHostState | null) => CallbackSkillHost,
  ) {
    this.#host = runtimeState.host === null ? null : createHost(runtimeState.host);
    if (this.#host !== null && this.#host.runtimeState !== runtimeState.host)
      throw new Error('restored projectile callback must bind the saved host data');
  }

  reach(): void {
    if (this.#host !== null) throw new Error('projectile callback has already reached');
    this.#host = this.createHost(null);
    this.runtimeState.host = this.#host.runtimeState;
    this.#host.start();
  }

  advance(deltaSeconds: number): void {
    this.#host?.advance(deltaSeconds);
  }

  beforeReset(): void {
    this.#host?.end();
  }
}
