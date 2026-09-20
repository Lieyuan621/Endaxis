// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  DAMAGE_SCALE_ZONES,
  type DamageScaleZone,
  DAMAGE_SCALE_SIDES,
  type DamageScaleSide,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
import {
  DAMAGE_SCALE_ZONES,
  type DamageScaleSide,
  type DamageScaleZone,
} from '../../../../packages/game-data-contract/src/modifiers.ts';
export type { AppliedDamageModifier, DamageModifierResult } from '../state/foundationState';
interface DamageScaleZoneDefinition {
  readonly multiplyWithinSide: boolean;
  readonly mergeSidesAdditively: boolean;
}

const ZONE_DEFINITIONS: Readonly<Record<DamageScaleZone, DamageScaleZoneDefinition>> = {
  product: { multiplyWithinSide: true, mergeSidesAdditively: false },
  normal: { multiplyWithinSide: false, mergeSidesAdditively: false },
  abnormalAndBurst: { multiplyWithinSide: false, mergeSidesAdditively: false },
  enhanced: { multiplyWithinSide: false, mergeSidesAdditively: false },
  combo: { multiplyWithinSide: false, mergeSidesAdditively: false },
  vulnerable: { multiplyWithinSide: false, mergeSidesAdditively: false },
  race: { multiplyWithinSide: false, mergeSidesAdditively: false },
};

function createInitialValues(): Record<DamageScaleZone, number> {
  return Object.fromEntries(DAMAGE_SCALE_ZONES.map(zone => [zone, 1])) as Record<
    DamageScaleZone,
    number
  >;
}

/** 最终伤害公式前使用的、已还原的七区间累加器。 */
export class DamageScaleAccumulator {
  readonly #attacker = createInitialValues();
  readonly #defender = createInitialValues();

  modify(side: DamageScaleSide, zone: DamageScaleZone, addition: number): void {
    const values = side === 'attacker' ? this.#attacker : this.#defender;
    const definition = ZONE_DEFINITIONS[zone];
    values[zone] = definition.multiplyWithinSide
      ? values[zone] * (1 + addition)
      : values[zone] + addition;
  }

  getSideValue(side: DamageScaleSide, zone: DamageScaleZone): number {
    return (side === 'attacker' ? this.#attacker : this.#defender)[zone];
  }

  getZoneValue(zone: DamageScaleZone): number {
    const definition = ZONE_DEFINITIONS[zone];
    const attacker = this.#attacker[zone];
    const defender = this.#defender[zone];
    const value =
      !definition.multiplyWithinSide && definition.mergeSidesAdditively
        ? attacker + defender - 1
        : attacker * defender;
    return value < 0 || Number.isNaN(value) ? 0 : value;
  }

  getFinalValue(): number {
    let value = 1;
    for (const zone of DAMAGE_SCALE_ZONES) value *= this.getZoneValue(zone);
    return value;
  }
}
