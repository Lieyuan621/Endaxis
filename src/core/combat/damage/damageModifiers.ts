/** Buff 实例持有的伤害修正器；条件状态随战斗切面保存。 */
import type { ModifierConditionRuntime } from '../actions/modifierConditionRuntime';

import { type DamageModifierDefinition } from '../../../../packages/game-data-contract/src/modifiers.ts';

import { resolveBuffModifierNumber } from '../buffs/buffModifierNumberSource';
import type { DamageModifierState } from '../state/foundationState';
import { type BuffModifierNumberSource } from '../state/foundationState';
import { applyDamageModifier } from './damageModifierExecution';
import type {
  DamageModifierSide,
  DamageProcessTiming,
  PlayerDamageContext,
} from './playerDamageContext';

/** 同步条件只能读取本次伤害身份；不能持有或任意修改可变 DamageContext。 */
export interface DamageModifierConditionInput {
  readonly side: DamageModifierSide;
  readonly sourceId: string;
  readonly targetId: string;
  readonly skillCastId: number | null;
  readonly damageType: PlayerDamageContext['damageType'];
  readonly tags: PlayerDamageContext['tags'];
  readonly gameplayTags?: PlayerDamageContext['gameplayTags'];
  readonly features: PlayerDamageContext['features'];
}

/** 已编译动作程序的运行端口，不属于可保存的游戏数据协议。 */
export interface DamageModifierConditionRuntime extends ModifierConditionRuntime<DamageModifierConditionInput> {
  /** 单一伤害类型筛选的展示摘要；实际判断仍执行动作序列。 */
  readonly damageTypes?: readonly PlayerDamageContext['damageType'][];
  readonly summary?: import('../receipt/combatReceipt').BuffConditionSummary;
}

/** 由一个已启用 Buff 实例持有的运行时修正。 */
export class DamageModifier {
  readonly runtimeState: DamageModifierState;
  constructor(
    readonly ownerId: string,
    readonly definition: Omit<DamageModifierDefinition, 'condition'>,
    readonly numberSource?: BuffModifierNumberSource,
    readonly condition?: DamageModifierConditionRuntime,
    restoredState?: DamageModifierState,
  ) {
    this.runtimeState = restoredState ?? {
      ownerId,
      numberSource,
      condition: condition?.runtimeState ?? null,
      // Buff 装配定义可能附带工厂函数，只保留伤害协议字段。
      definition: {
        enabledSide: definition.enabledSide,
        processors: definition.processors,
      },
    };
    if (restoredState !== undefined) {
      if (restoredState.ownerId !== ownerId)
        throw new Error('restored damage modifier owner does not match its Buff owner');
      if (restoredState.condition !== (condition?.runtimeState ?? null))
        throw new Error('restored damage modifier condition is not bound to its saved state');
    }
  }

  apply(
    timing: DamageProcessTiming,
    side: DamageModifierSide,
    context: PlayerDamageContext,
    recordModifier?: (
      side: import('./damageScale').DamageScaleSide,
      result: import('./damageScale').DamageModifierResult,
    ) => void,
  ): void {
    applyDamageModifier(
      this.runtimeState.ownerId,
      this.runtimeState.definition,
      value => resolveBuffModifierNumber(this.runtimeState.numberSource, value, 'damage'),
      this.condition,
      timing,
      side,
      context,
      recordModifier,
    );
  }
}
