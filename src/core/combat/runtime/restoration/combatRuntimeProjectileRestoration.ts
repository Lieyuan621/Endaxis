/**
 * 建立投射物纯数据目录，并在回调宿主和对象 reset 处理函数齐备后提交关系。
 *
 * 数据阶段只核对固定回调程序编号，不创建回调技能。关系阶段用回调状态保存的定义干员选择当前
 * 操作链；命中前的回调仍保持未创建，命中后的回调宿主从保存技能帧继续。
 */
import type { CallbackSkillHostFactory } from '../../abilities/callbackSkillHost';
import { logicalAbilityEntityRuntimeId } from '../../../game-data/logicalAbilityEntity';
import type { ProjectileCallbackPrograms } from '../../abilities/projectileCallbackPrograms';
import {
  bindProjectileCallbackLifecycle,
  restoreProjectileCallback,
} from '../../abilities/projectileCallbackRuntime';
import { ProjectileLifecycleRuntime } from '../../abilities/projectileLifecycleRuntime';
import type { BuffApplicationHandle } from '../../buffs/combatBuffs';
import type {
  CombatOperationExecutor,
  ProjectileRuntimeDependencies,
} from '../../skills/skillRuntime';
import type { BuffReference } from '../../state/foundationState';
import type { ProjectileCallbackState } from '../../state/instanceState';
import { COMBAT_FRAME_INTERVAL } from '../../time/combatClock';
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';

export interface ProjectileCallbackRestoreBindings {
  readonly operations: CombatOperationExecutor;
  readonly createCallbackSkillHost: CallbackSkillHostFactory;
  readonly launchProjectile: ProjectileRuntimeDependencies['launchProjectile'];
}

export function createRestoredCombatProjectileDirectory(options: {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly callbackPrograms: ProjectileCallbackPrograms;
}): ProjectileLifecycleRuntime {
  for (const [instanceId, state] of options.preparation.graph.instances.projectiles.instances) {
    for (const callback of state.callbacks) {
      if (!options.preparation.programs.has(callback.definitionOperatorId)) {
        throw new Error(
          `restored projectile '${instanceId}' definition operator '${callback.definitionOperatorId}' does not exist`,
        );
      }
    }
  }
  return new ProjectileLifecycleRuntime(
    () => options.foundation.shared.abilityEntityInstanceIds.allocate(),
    {
      state: options.preparation.graph.instances.projectiles,
      callbackPrograms: options.callbackPrograms,
    },
  );
}

export function bindRestoredCombatProjectileRelations(options: {
  readonly projectiles: ProjectileLifecycleRuntime;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly createCallbackBindings: (input: {
    readonly instanceId: number;
    readonly definitionOperatorId: string;
    readonly state: ProjectileCallbackState;
  }) => ProjectileCallbackRestoreBindings;
}): void {
  if (options.projectiles.runtimeState.instances.size === 0) return;
  const resolveAttachedBuff = (reference: BuffReference): BuffApplicationHandle | undefined =>
    options.entities.targets.get(reference.ownerId)?.resolveHandle?.(reference);
  options.projectiles.bindRestoredRelations({
    resolveHost: instanceId => {
      const resolveTickDeltaSeconds = () =>
        COMBAT_FRAME_INTERVAL *
        (options.foundation.shared.timeDilation?.getEntityScale(
          logicalAbilityEntityRuntimeId(instanceId),
        ) ?? 1);
      const state = options.projectiles.runtimeState.instances.get(instanceId);
      if (state === undefined) throw new Error(`restored projectile '${instanceId}' is missing`);
      const callbacks = state.callbacks.map(callback => {
        const bindings = options.createCallbackBindings({
          instanceId,
          definitionOperatorId: callback.definitionOperatorId,
          state: callback,
        });
        return restoreProjectileCallback(
          callback,
          instanceId,
          options.projectiles.callbackPrograms,
          bindings.operations,
          bindings,
          resolveAttachedBuff,
          state.source?.kind === 'operator'
            ? state.source.operatorId
            : state.source?.kind === 'enemy'
              ? 'enemy'
              : state.source?.kind === 'abilityEntity'
                ? logicalAbilityEntityRuntimeId(state.source.instanceId)
                : undefined,
        );
      });
      return {
        ...bindProjectileCallbackLifecycle(callbacks, resolveTickDeltaSeconds),
        released: () =>
          options.foundation.shared.timeDilation?.releaseInheritedEntityScale(
            logicalAbilityEntityRuntimeId(instanceId),
          ),
      };
    },
  });
}
