import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
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
  readonly repeatIntervalSeconds?: number;
  readonly resolveTimeSeconds?: () => number;
  readonly matchesTags?: (
    target: RuntimeTargetRef,
    query: NonNullable<ProjectileHitTargets['hitTagFilter']>,
  ) => boolean;
}

/** 新建与恢复共用事件绑定；命中历史随投射物状态保存。 */
export function bindProjectileCallbackLifecycle(
  callbacks: readonly ProjectileCallbackRuntime[],
  resolveTickDeltaSeconds: () => number | null,
  hit?: ProjectileHitBinding,
): ProjectileHostPorts {
  const start = (event: 'block' | 'reach' | 'finish') => {
    for (const callback of callbacks) if (callback.runtimeState.event === event) callback.start();
  };
  return {
    resolveTickDeltaSeconds,
    reach: () => start('reach'),
    block: () => start('block'),
    hit: () => {
      if (!hit) return 0;
      let accepted = 0;
      const state = hit.state;
      for (const target of state.targets) {
        const key =
          target.kind === 'spatialPoint'
            ? `point:${target.pointId}`
            : runtimeTargetEntityId(target);
        if (key === undefined) continue;
        if (state.hitTagFilter) {
          if (!hit.matchesTags) throw new Error('projectile hit filtering requires target tags');
          if (!hit.matchesTags(target, state.hitTagFilter)) continue;
        }
        const interval = hit.repeatIntervalSeconds;
        const previous = state.hitTimes?.get(key);
        if (previous !== undefined && interval === undefined) continue;
        let now = 0;
        if (interval !== undefined) {
          const time = hit.resolveTimeSeconds?.();
          if (time === undefined || !Number.isFinite(time))
            throw new Error('repeated projectile hits require the scene clock');
          now = Math.fround(time);
          if (previous !== undefined) {
            const elapsed = Math.fround(now - previous);
            if (elapsed < Math.fround(interval - 0.00001) || Math.abs(elapsed) <= 0.00001) continue;
          }
        }
        (state.hitTimes ??= new Map()).set(key, now);
        accepted++;
        for (const callback of callbacks)
          if (callback.runtimeState.event === 'hit') callback.hit(target);
      }
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

  start(inputTarget = this.runtimeState.inputTarget): void {
    if (this.#host !== null) throw new Error('projectile callback has already started');
    this.runtimeState.inputTarget = inputTarget;
    this.#startHost(inputTarget);
  }

  #startHost(inputTarget = this.runtimeState.inputTarget): void {
    this.#host ??= this.createHost(null);
    this.runtimeState.host = this.#host.runtimeState;
    this.#host.start(inputTarget);
  }

  hit(target: RuntimeTargetRef): void {
    this.#startHost(target);
  }

  advance(deltaSeconds: number): void {
    this.#host?.advance(deltaSeconds);
  }

  beforeReset(): void {
    this.#host?.end();
  }
}
