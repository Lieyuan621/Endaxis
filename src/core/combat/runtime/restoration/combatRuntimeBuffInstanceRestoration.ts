/**
 * 在完整 Buff 目标表上恢复普通实例和全局父实例。
 *
 * 本阶段要求敌人、干员和能力实体外壳已经全部存在。它只完成实例对象绑定；来源宿主所有权、能力
 * 实体子关系及 Buff 间对象关系仍由后续阶段按固定顺序提交。
 */
import type { ResolvedSkillBuffDefinition } from '../../../compiler/combatProgram';
import { CombatBuffRestoration, type CombatBuffRestorationOptions } from './combatBuffRestoration';
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import { GlobalBuffRuntime } from '../../buffs/globalBuffRuntime';

export interface RestoreCombatBuffInstancesOptions {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly resolveDefinition: CombatBuffRestorationOptions['resolveDefinition'];
  readonly resolveGlobalDefinition: CombatBuffRestorationOptions['resolveGlobalDefinition'];
  /** 完整装配可先公开目录，供普通 Buff 生命周期操作链闭包同一恢复分支。 */
  readonly globalBuffs?: GlobalBuffRuntime;
  readonly resolvePartyBuffDefinition?: (
    sourceOperatorId: string,
    buffId: string,
  ) => ResolvedSkillBuffDefinition | undefined;
}

export interface RestoredCombatBuffInstances {
  readonly globalBuffs: GlobalBuffRuntime;
  readonly restoration: CombatBuffRestoration;
}

export function bindRestoredCombatBuffInstances(
  options: RestoreCombatBuffInstancesOptions,
): RestoredCombatBuffInstances {
  const partyTargets = [...options.preparation.programs.keys()].map(operatorId => {
    const target = options.entities.targets.get(operatorId);
    if (target === undefined)
      throw new Error(`restored party Buff target '${operatorId}' is missing`);
    return target;
  });
  const resolvePartyBuffDefinition =
    options.resolvePartyBuffDefinition ??
    ((sourceOperatorId: string, buffId: string) =>
      options.resolveDefinition(sourceOperatorId, buffId));
  const resources = options.foundation.shared.resources;
  const globalBuffs =
    options.globalBuffs ??
    new GlobalBuffRuntime(
      () => partyTargets,
      resolvePartyBuffDefinition,
      resources.sharedSpGainModifiers,
      resources.sharedSpRecoveryModifiers,
      options.preparation.graph.instances.globalBuffs,
    );
  if (globalBuffs.runtimeState !== options.preparation.graph.instances.globalBuffs) {
    throw new Error('restored global Buff directory uses another state');
  }
  const restoration = new CombatBuffRestoration({
    targets: options.entities.targets,
    globalBuffs,
    resolveDefinition: options.resolveDefinition,
    resolveGlobalDefinition: options.resolveGlobalDefinition,
  });
  restoration.bindInstances();
  return { globalBuffs, restoration };
}
