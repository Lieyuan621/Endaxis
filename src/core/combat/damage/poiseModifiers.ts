import { attributeModifierValues, CombatAttributeSet } from '../attributes/combatAttributes';
import { cloneCombatAttributes } from '../attributes/combatAttributeExecution';
import type {
  AttributeModifierSlot,
  AttributeModifierValues,
} from '../../../../packages/game-data-contract/src/modifiers';
/** 单次失衡计算包，以及 Buff 实例持有的失衡修正器。 */
import type { PoiseProcessTiming } from '../../../../packages/game-data-contract/src/modifiers';
import type {
  PoiseModifierDefinition,
  PoiseModifierSide,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import type { ModifierConditionRuntime } from '../actions/modifierConditionRuntime';
import { resolveBuffModifierNumber } from '../buffs/buffModifierNumberSource';
import type { PoiseModifier as PoiseModifierState } from '../state/foundationState';
import { applyPoiseModifier } from './poiseModifierExecution';

import type { DamageFeature, DamageTag } from '../../game-data/operatorDefinition';
import type { BuffModifierNumberSource } from '../state/foundationState';

/** 同一次失衡计算持有的可变倍率快照。 */
export class PoiseCalculationContext {
  readonly #outputAttributes = new CombatAttributeSet<string>();
  readonly #takenAttributes = new CombatAttributeSet<string>();
  readonly #outputModifiers: AttributeModifierValues[] = [];
  readonly #takenModifiers: AttributeModifierValues[] = [];
  constructor(
    readonly attackerId: string,
    readonly defenderId: string,
    readonly tags: readonly DamageTag[],
    readonly features: readonly DamageFeature[],
    outputMultiplier: number,
    takenMultiplier: number,
    attributes?: {
      readonly output: CombatAttributeSet<string>;
      readonly taken: CombatAttributeSet<string>;
    },
  ) {
    if (attributes) {
      cloneCombatAttributes(attributes.output.runtimeState, this.#outputAttributes.runtimeState);
      cloneCombatAttributes(attributes.taken.runtimeState, this.#takenAttributes.runtimeState);
    }
    // 兼容没有实体属性容器的独立伤害输入；已有属性保留原始值和全部公式槽。
    if (!this.#outputAttributes.has('PoiseDamageOutputScalar'))
      this.#outputAttributes.define('PoiseDamageOutputScalar', outputMultiplier, {});
    if (!this.#takenAttributes.has('PoiseDamageTakenScalar'))
      this.#takenAttributes.define('PoiseDamageTakenScalar', takenMultiplier, {});
  }

  get outputMultiplier(): number {
    return this.#outputAttributes.getWithAdditionalModifiers(
      'PoiseDamageOutputScalar',
      this.#outputModifiers,
    );
  }

  get takenMultiplier(): number {
    return this.#takenAttributes.getWithAdditionalModifiers(
      'PoiseDamageTakenScalar',
      this.#takenModifiers,
    );
  }

  modifyScalar(side: PoiseModifierSide, slot: AttributeModifierSlot, value: number): void {
    (side === 'attacker' ? this.#outputModifiers : this.#takenModifiers).push(
      attributeModifierValues(slot, value),
    );
  }

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
    timing: PoiseProcessTiming,
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
