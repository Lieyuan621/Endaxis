/** 单次失衡计算包，以及 Buff 实例持有的失衡修正器。 */
import type { ModifierConditionRuntime } from '../actions/modifierConditionRuntime';
import { resolveBuffModifierNumber } from '../buffs/buffModifierNumberSource';
import { applyPoiseModifier } from './poiseModifierExecution';
import {
  type PoiseModifierDefinition,
  type PoiseModifierSide,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import { type PoiseModifier as PoiseModifierState } from '../state/foundationState';

import type { DamageFeature, DamageTag } from '../../game-data/operatorDefinition';
import type { BuffModifierNumberSource } from '../state/foundationState';

/** 同一次失衡计算持有的可变倍率快照。 */
export class PoiseCalculationContext {
  constructor(
    readonly attackerId: string,
    readonly defenderId: string,
    readonly tags: readonly DamageTag[],
    readonly features: readonly DamageFeature[],
    public outputMultiplier: number,
    public takenMultiplier: number,
  ) {}

  getEntityId(side: PoiseModifierSide): string {
    return side === 'attacker' ? this.attackerId : this.defenderId;
  }
}

/** 本次失衡计算的只读条件输入；不保存可变结算包。 */
export interface PoiseModifierConditionInput {
  readonly side: PoiseModifierSide;
  readonly attackerId: string;
  readonly defenderId: string;
  readonly tags: readonly DamageTag[];
  readonly features: readonly DamageFeature[];
}
export class PoiseModifier {
  readonly runtimeState: PoiseModifierState;
  constructor(
    readonly ownerId: string,
    readonly definition: Omit<PoiseModifierDefinition, 'condition'>,
    readonly numberSource: BuffModifierNumberSource,
    readonly condition?: ModifierConditionRuntime<PoiseModifierConditionInput>,
    restoredState?: PoiseModifierState,
  ) {
    this.runtimeState = restoredState ?? {
      ownerId,
      definition: { enabledSide: definition.enabledSide, processors: definition.processors },
      numberSource,
      condition: condition?.runtimeState ?? null,
    };
    if (restoredState && restoredState.condition !== (condition?.runtimeState ?? null))
      throw new Error('restored poise modifier condition is not bound to its saved state');
  }
  apply(
    timing: import('../../../../packages/game-data-contract/src/modifiers').PoiseProcessTiming,
    side: PoiseModifierSide,
    context: PoiseCalculationContext,
  ): void {
    applyPoiseModifier(
      this.ownerId,
      this.definition,
      value => resolveBuffModifierNumber(this.numberSource, value, 'poise'),
      timing,
      side,
      context,
      this.condition,
    );
  }
}
