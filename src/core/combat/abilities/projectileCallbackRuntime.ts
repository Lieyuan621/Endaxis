import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { ProjectileHitTargets } from '../state/instanceState';
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

export interface ProjectileHitBinding {
  readonly state: ProjectileHitTargets;
  readonly matchesTags?: (
    target: RuntimeTargetRef,
    query: NonNullable<ProjectileHitTargets['hitTagFilter']>,
  ) => boolean;
}

/** 新建与恢复共用事件绑定；命中目标和标签条件随投射物状态保存。 */
export function bindProjectileCallbackLifecycle(
  callbacks: readonly ProjectileCallbackRuntime[],
  resolveTickDeltaSeconds: () => number | null,
  hit?: ProjectileHitBinding,
): ProjectileHostPorts {
  return {
    resolveTickDeltaSeconds,
    invokeScheduledCallback: index => {
      const callback = callbacks[index];
      if (!callback) throw new Error(`unknown projectile callback index ${index}`);
      if (callback.runtimeState.event !== 'hit') {
        callback.invoke();
        return;
      }
      if (!hit) throw new Error('scheduled hit requires target binding');
      for (const target of hit.state.targets) {
        if (hit.state.hitTagFilter) {
          if (!hit.matchesTags) throw new Error('projectile hit filtering requires target tags');
          if (!hit.matchesTags(target, hit.state.hitTagFilter)) continue;
        }
        callback.invoke(target);
      }
    },
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
    if (
      runtimeState.event !== 'hit' &&
      runtimeState.event !== 'launch' &&
      runtimeState.event !== 'reach' &&
      runtimeState.event !== 'finish' &&
      runtimeState.event !== 'block'
    )
      throw new Error('projectile callback requires a launch, hit, block, reach or finish event');
    this.#host = runtimeState.host === null ? null : createHost(runtimeState.host);
    if (this.#host !== null && this.#host.runtimeState !== runtimeState.host)
      throw new Error('restored projectile callback must bind the saved host data');
  }

  /** 时间表允许再次调用同一回调，复用原能力系统的重启语义。 */
  invoke(inputTarget = this.runtimeState.inputTarget): void {
    this.runtimeState.inputTarget = inputTarget;
    this.#host ??= this.createHost(null);
    this.runtimeState.host = this.#host.runtimeState;
    this.#host.start(inputTarget);
  }

  advance(deltaSeconds: number): void {
    this.#host?.advance(deltaSeconds);
  }

  beforeReset(): void {
    this.#host?.end();
  }
}
