/** 单次治疗计算包，以及 Buff 实例持有的治疗修正器。 */
import type { ModifierConditionRuntime } from '../actions/modifierConditionRuntime';
import { resolveBuffModifierNumber } from '../buffs/buffModifierNumberSource';
import { applyHealModifier } from './healModifierExecution';
import type { GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
import {
  type HealModifierDefinition,
  type HealModifierSide,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { CombatVitals } from '../resources/combatVitals';
import type { BuffModifierNumberSource } from '../state/foundationState';
import { type HealModifier as HealModifierState } from '../state/foundationState';

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

/** 本次治疗计算的只读条件输入；不保存可变结算包。 */
export interface HealModifierConditionInput {
  readonly side: HealModifierSide;
  readonly healerId: string;
  readonly receiverId: string;
  readonly tags: readonly GameplayTag[];
}
export class HealModifier {
  readonly runtimeState: HealModifierState;
  constructor(
    readonly ownerId: string,
    readonly definition: Omit<HealModifierDefinition, 'condition'>,
    readonly numberSource: BuffModifierNumberSource,
    readonly condition?: ModifierConditionRuntime<HealModifierConditionInput>,
    restoredState?: HealModifierState,
  ) {
    this.runtimeState = restoredState ?? {
      ownerId,
      definition: { enabledSide: definition.enabledSide, processors: definition.processors },
      numberSource,
      condition: condition?.runtimeState ?? null,
    };
    if (restoredState && restoredState.condition !== (condition?.runtimeState ?? null))
      throw new Error('restored heal modifier condition is not bound to its saved state');
  }
  apply(
    timing: import('../../../../packages/game-data-contract/src/modifiers').HealProcessTiming,
    side: HealModifierSide,
    context: HealCalculationContext,
  ): void {
    applyHealModifier(
      this.ownerId,
      this.definition,
      value => resolveBuffModifierNumber(this.numberSource, value, 'heal'),
      timing,
      side,
      context,
      this.condition,
    );
  }
}
