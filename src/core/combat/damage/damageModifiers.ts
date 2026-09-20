// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  type DamageModifierCondition,
  type DamageModifierDefinition,
  type DamageModifierExternalCondition,
  type DamageModifierNumber,
  type DamageProcessorDefinition,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import {
  type DamageModifierDefinition,
  type DamageModifierExternalCondition,
  type DamageModifierNumber,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
/**
 * Buff 定义与伤害包各处理阶段之间的声明式协议。
 * 修正必须明确所属阶段、作用方和条件；可保存定义不接受回调，已编译程序也只获得只读伤害视图。
 */
import { resolveBuffModifierNumber } from '../buffs/buffModifierNumberSource';
import type { DamageModifierState } from '../state/foundationState';
import { type BuffModifierNumberSource } from '../state/foundationState';
import { applyDamageModifier } from './damageModifierExecution';
import type {
  DamageModifierSide,
  DamageProcessTiming,
  PlayerDamageContext,
} from './playerDamageContext';

/** 战斗装配层只判断依赖场景或当前伤害包的叶子条件。 */
export type DamageModifierConditionEvaluator = (
  condition: DamageModifierExternalCondition,
  resolveNumber: (value: DamageModifierNumber) => number,
) => boolean;

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
export interface DamageModifierConditionProgram {
  execute(input: DamageModifierConditionInput): boolean;
}

/** 由一个已启用 Buff 实例持有的运行时修正。 */
export class DamageModifier {
  readonly runtimeState: DamageModifierState;
  constructor(
    readonly ownerId: string,
    readonly definition: DamageModifierDefinition,
    readonly numberSource?: BuffModifierNumberSource,
    readonly sourceSkillCastId: number | null = null,
    readonly conditionProgram?: DamageModifierConditionProgram,
    restoredState?: DamageModifierState,
  ) {
    if (definition.condition !== undefined && conditionProgram !== undefined) {
      throw new Error('damage modifier cannot combine a pure condition with a condition program');
    }
    this.runtimeState = restoredState ?? {
      ownerId,
      numberSource,
      sourceSkillCastId,
      hasConditionProgram: conditionProgram !== undefined,
      // Buff 装配定义可能附带工厂函数，只保留伤害协议字段。
      definition: {
        enabledSide: definition.enabledSide,
        processors: definition.processors,
        condition: definition.condition,
      },
    };
    if (restoredState !== undefined) {
      if (restoredState.ownerId !== ownerId)
        throw new Error('restored damage modifier owner does not match its Buff owner');
      if (restoredState.hasConditionProgram !== (conditionProgram !== undefined))
        throw new Error('restored damage modifier condition program does not match its definition');
    }
  }

  apply(
    timing: DamageProcessTiming,
    side: DamageModifierSide,
    context: PlayerDamageContext,
    evaluateCondition?: DamageModifierConditionEvaluator,
    recordModifier?: (
      side: import('./damageScale').DamageScaleSide,
      result: import('./damageScale').DamageModifierResult,
    ) => void,
  ): void {
    applyDamageModifier(
      this.runtimeState.ownerId,
      this.runtimeState.sourceSkillCastId,
      this.runtimeState.definition,
      value => resolveBuffModifierNumber(this.runtimeState.numberSource, value, 'damage'),
      this.conditionProgram,
      timing,
      side,
      context,
      evaluateCondition,
      recordModifier,
    );
  }
}
