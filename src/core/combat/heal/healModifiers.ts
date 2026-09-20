import type { GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
import {
  type HealModifierDefinition,
  type HealModifierSide,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { CombatVitals } from '../resources/combatVitals';
import type { BuffModifierNumberSource } from '../state/foundationState';
import { type HealModifier } from '../state/foundationState';
// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  type HealModifierCondition,
  type HealModifierDefinition,
  type HealModifierNumber,
  type HealModifierSide,
  type HealProcessTiming,
  type ModifyHealCalculationResultProcessorDefinition,
  type ModifyHealingIncreaseProcessorDefinition,
} from '../../../../packages/game-data-contract/src/modifiers.ts';

export class HealCalculationContext {
  constructor(
    readonly healerId: string,
    readonly receiverId: string,
    readonly receiverVitals: CombatVitals,
    public value: number,
    readonly tags: readonly GameplayTag[] = [],
    public healerOutputIncrease = 0,
    public receiverTakenIncrease = 0,
  ) {}

  getEntityId(side: HealModifierSide): string {
    return side === 'healer' ? this.healerId : this.receiverId;
  }
}

export function createHealModifier(
  ownerId: string,
  definition: HealModifierDefinition,
  numberSource: BuffModifierNumberSource,
): HealModifier {
  return { ownerId, definition, numberSource };
}
