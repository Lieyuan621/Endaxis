import {
  type PoiseModifierDefinition,
  type PoiseModifierSide,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import { type PoiseModifier } from '../state/foundationState';
// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  type ModifyPoiseScalarProcessorDefinition,
  type PoiseModifierCondition,
  type PoiseModifierDefinition,
  type PoiseModifierNumber,
  type PoiseModifierSide,
  type PoiseProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
/**
 * Buff 对单次失衡包的声明式修正。
 * 该模型属于通用 Buff 运行时；武器、装备和干员只负责生成相同的定义。
 */
import type { DamageTag } from '../../game-data/operatorDefinition';
import type { BuffModifierNumberSource } from '../state/foundationState';

/** 同一次失衡计算持有的可变倍率快照。 */
export class PoiseCalculationContext {
  constructor(
    readonly attackerId: string,
    readonly defenderId: string,
    readonly tags: readonly DamageTag[],
    readonly isAttackerControlled: boolean,
    public outputMultiplier: number,
    public takenMultiplier: number,
  ) {}

  getEntityId(side: PoiseModifierSide): string {
    return side === 'attacker' ? this.attackerId : this.defenderId;
  }
}

export function createPoiseModifier(
  ownerId: string,
  definition: PoiseModifierDefinition,
  numberSource: BuffModifierNumberSource,
): PoiseModifier {
  return { ownerId, definition, numberSource };
}
