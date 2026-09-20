import {
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
} from './primitives.ts';
import type {
  CombatResource,
  SkillCastResourceDefinition,
} from '../../../../packages/game-data-contract/src/index.ts';

/** Native CastData.CostData, also referenced by DamageUnit.costDataList. */
export interface SkillCostSource {
  readonly costType: string;
  readonly costValue: number;
  readonly atbValueThreshold: number;
}

function parseCostType(value: unknown, path: string): string {
  if (typeof value !== 'number') return requireNonEmptyString(value, path);
  const index = requireInteger(value, path);
  const costType = (['UltimateSp', 'Atb'] as const)[index];
  if (costType === undefined) throw new Error(`${path}: unknown CostType ${index}`);
  return costType;
}

export function parseSkillCostSource(value: unknown, path: string): SkillCostSource {
  const cost = requireRecord(value, path);
  requireExactFields(cost, new Set(['costType', 'costValue', 'atbValueThreshold']), path);
  return {
    costType: parseCostType(cost.costType, `${path}.costType`),
    costValue: requireNumber(cost.costValue, `${path}.costValue`),
    atbValueThreshold: requireNumber(cost.atbValueThreshold, `${path}.atbValueThreshold`),
  };
}

export function projectSkillCastResourceDefinitionSource(
  source: {
    readonly startCdFrame: number;
    readonly cooldownTime: number;
    readonly maxChargeTime: number;
    readonly costData: SkillCostSource;
  },
  path: string,
): SkillCastResourceDefinition {
  const resource: CombatResource | undefined = {
    Atb: 'sp' as const,
    UltimateSp: 'ultimateEnergy' as const,
  }[source.costData.costType];
  if (resource === undefined)
    throw new Error(`${path}.costData.costType: unsupported value '${source.costData.costType}'`);
  return {
    costFrame: source.startCdFrame,
    cooldownSeconds: source.cooldownTime,
    maxChargeTime: source.maxChargeTime,
    cost: {
      resource,
      value: source.costData.costValue,
      availabilityThreshold: source.costData.atbValueThreshold,
    },
  };
}
