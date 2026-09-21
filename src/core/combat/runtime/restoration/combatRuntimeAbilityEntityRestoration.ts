/**
 * 恢复整场候选的能力实体目录，并收齐敌人、干员和能力实体的全部 Buff 目标外壳。
 *
 * 本阶段只绑定实体身份、寿命、黑板、定时标记和可选 Buff 容器，不启动子技能、不发布生成事件，
 * 也不恢复 Buff 实例。返回的完整目标表供后续整场 Buff 协调器统一建立实例与关系。
 */
import { collectRestoredCombatBuffTargets } from './combatBuffRestoration';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import {
  LogicalAbilityEntityRuntime,
  type LogicalAbilityEntityRuntimeHooks,
} from '../../abilities/logicalAbilityEntityRuntime';
import { logicalAbilityEntityRuntimeId } from '../../../game-data/logicalAbilityEntity';
import { COMBAT_FRAME_INTERVAL } from '../../time/combatClock';
import type { BuffOperationTarget } from '../../buffs/buffOperationExecutor';
import type { AbilityEntityBuffRuntime } from '../combatRuntimeAssembly';
import { uniformAbilityTickDeltas } from '../../time/timeDilationRuntime';

export interface RestoreCombatAbilityEntityDirectoryOptions {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly hooks?: LogicalAbilityEntityRuntimeHooks;
  /** 恢复后新生成的实体由完整装配登记；目录仍须推进它们的 Buff。 */
  readonly resolveDynamicBuffs?: (instanceId: number) => AbilityEntityBuffRuntime | undefined;
}

export interface RestoredCombatAbilityEntityDirectory {
  readonly runtime: LogicalAbilityEntityRuntime;
  readonly targets: ReadonlyMap<string, BuffOperationTarget>;
}

export function bindRestoredCombatAbilityEntityDirectory(
  options: RestoreCombatAbilityEntityDirectoryOptions,
): RestoredCombatAbilityEntityDirectory {
  const shared = options.foundation.shared;
  const targets = new Map<string, BuffOperationTarget>();
  const resolveEntityBuffs = (instanceId: number): AbilityEntityBuffRuntime | undefined =>
    (targets.get(logicalAbilityEntityRuntimeId(instanceId)) as
      AbilityEntityBuffRuntime | undefined) ?? options.resolveDynamicBuffs?.(instanceId);
  const runtime = new LogicalAbilityEntityRuntime({
    restoredState: options.preparation.graph.instances.abilityEntities,
    allocateInstanceId: () => shared.abilityEntityInstanceIds.allocate(),
    resolveDeltaSeconds: entity =>
      COMBAT_FRAME_INTERVAL *
      (shared.timeDilation?.getEntityScale(logicalAbilityEntityRuntimeId(entity.instanceId)) ?? 1),
    timedMarkerClocks: {
      global: shared.timeDilation ?? shared.clock,
      globalScaled: shared.timeDilation ?? shared.clock,
    },
    hooks: {
      ...options.hooks,
      tickBuffs: entity => {
        const buffs = resolveEntityBuffs(entity.instanceId);
        if (buffs !== undefined) {
          buffs.advanceWithDeltas(
            shared.timeDilation === null
              ? uniformAbilityTickDeltas(COMBAT_FRAME_INTERVAL)
              : shared.timeDilation.getAbilityTickDeltas(
                  logicalAbilityEntityRuntimeId(entity.instanceId),
                  COMBAT_FRAME_INTERVAL,
                ),
          );
        }
        options.hooks?.tickBuffs?.(entity);
      },
      recycleBuffs: entity => {
        resolveEntityBuffs(entity.instanceId)?.recycleFinishedBuffs?.();
        options.hooks?.recycleBuffs?.(entity);
      },
      finished: (entity, reason) => {
        options.hooks?.finished?.(entity, reason);
        resolveEntityBuffs(entity.instanceId)?.releaseAll();
        targets.delete(logicalAbilityEntityRuntimeId(entity.instanceId));
      },
    },
  });
  const createAbilityEntityTarget =
    options.foundation.environment.runtimeOptions.createAbilityEntityBuffRuntime;
  if (createAbilityEntityTarget === undefined) {
    throw new Error('standard environment cannot create AbilityEntity Buff targets');
  }
  const operatorStates = new Map(
    [...options.preparation.graph.operators].map(([operatorId, state]) => [
      operatorId,
      state.buffs,
    ]),
  );
  for (const [ownerId, target] of collectRestoredCombatBuffTargets({
    enemyState: options.preparation.graph.enemy.buffs,
    enemyTarget: options.foundation.enemyBuffTarget,
    operatorStates,
    operatorTargets: options.foundation.operatorBuffTargets,
    abilityEntities: runtime,
    createAbilityEntityTarget,
  })) {
    targets.set(ownerId, target);
  }
  return { runtime, targets };
}
