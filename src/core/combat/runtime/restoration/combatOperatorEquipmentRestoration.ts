/**
 * 恢复一名干员的装备来源宿主。
 *
 * 装备贡献按编译数组下标保持身份，事件订阅按保存编号重绑。构造阶段只建立当前分支的处理函数和
 * 黑板对象，不重新执行装备初始化；Buff 实例全部完成后再统一接回各贡献持有的子 Buff。
 */
import type { CompiledEquipmentContribution } from '../../../compiler/compileEquipment';
import {
  EquipmentEventRuntime,
  type CreateEquipmentEventOperationExecutor,
  type RegisterEquipmentAbilityEventAction,
} from '../../abilities/equipmentEventRuntime';
import { buffReferenceKey } from '../../buffs/buffReference';
import type { BuffApplicationHandle } from '../../buffs/combatBuffs';
import type { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import type { EquipmentEventState } from '../../state/abilityState';
import { type BuffReference } from '../../state/foundationState';

export interface RestoreCombatOperatorEquipmentOptions {
  readonly operatorId: string;
  readonly contributions: readonly CompiledEquipmentContribution[];
  readonly state: EquipmentEventState;
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly createExecutor: CreateEquipmentEventOperationExecutor;
  readonly registerAbilityEventAction?: RegisterEquipmentAbilityEventAction;
}

export interface RestoredCombatOperatorEquipment {
  readonly runtime: EquipmentEventRuntime;
  bindRestoredChildren(
    resolve: (reference: BuffReference) => BuffApplicationHandle | undefined,
  ): void;
}

export function bindRestoredCombatOperatorEquipment(
  options: RestoreCombatOperatorEquipmentOptions,
): RestoredCombatOperatorEquipment {
  const runtime = new EquipmentEventRuntime(
    options.semanticEvents,
    options.operatorId,
    options.contributions,
    options.createExecutor,
    options.registerAbilityEventAction,
    options.state,
  );
  return {
    runtime,
    bindRestoredChildren(resolve) {
      const children = new Map<string, BuffApplicationHandle>();
      for (const contribution of options.state.contributions.values()) {
        for (const reference of contribution.host.childBuffs) {
          const key = buffReferenceKey(reference);
          if (children.has(key)) continue;
          const child = resolve(reference);
          if (child === undefined) {
            throw new Error(
              `restored equipment child Buff '${reference.ownerId}:${reference.instanceId}' is missing`,
            );
          }
          children.set(key, child);
        }
      }
      runtime.bindRestoredChildren(reference => children.get(buffReferenceKey(reference)));
    },
  };
}
