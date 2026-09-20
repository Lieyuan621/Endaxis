import {
  nativeActionName,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseAttributeTypeName, type AttributeTypeSource } from './attributeModifiers.ts';

/** HealAction、DamageAction 等原生动作共用的数值计算结构。 */
export type NativeCalculationSource =
  | {
      readonly kind: 'attackScale';
      readonly attackScale: ScalarSource;
    }
  | {
      readonly kind: 'breakingAttack';
      readonly attackScale: ScalarSource;
      readonly multiplier: ScalarSource;
    }
  | {
      readonly kind: 'attribute';
      readonly valueSource: string;
      readonly attributeType: AttributeTypeSource;
      readonly multiplier: ScalarSource;
      readonly addition: ScalarSource;
    }
  | {
      readonly kind: 'definite';
      readonly value: ScalarSource;
      readonly applyScale: boolean;
      readonly valueScale: ScalarSource;
    };

/** 严格读取已取证的四种公共 Calculation，不判断某个消费动作是否允许该公式。 */
export function parseNativeCalculationSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeCalculationSource {
  const calculation = requireRecord(value, path);
  const sourceType =
    typeof calculation.$type === 'string' ? nativeActionName(calculation.$type) : '';
  switch (sourceType) {
    case 'AtkScaleCalculation':
      requireExactFields(calculation, new Set(['$type', 'atkScale']), path);
      return {
        kind: 'attackScale',
        attackScale: parseScalarSource(
          calculation.atkScale,
          `${path}.atkScale`,
          inheritedBlackboard,
        ),
      };
    case 'BreakingAttackCalculation':
      requireExactFields(calculation, new Set(['$type', 'atkScale', 'multiplier']), path);
      return {
        kind: 'breakingAttack',
        attackScale: parseScalarSource(
          calculation.atkScale,
          `${path}.atkScale`,
          inheritedBlackboard,
        ),
        multiplier: parseScalarSource(
          calculation.multiplier,
          `${path}.multiplier`,
          inheritedBlackboard,
        ),
      };
    case 'MultiplyAttributeCalculation':
      requireExactFields(
        calculation,
        new Set(['$type', 'valueSource', 'attributeType', 'multiplier', 'addition']),
        path,
      );
      return {
        kind: 'attribute',
        valueSource: requireNonEmptyString(calculation.valueSource, `${path}.valueSource`),
        attributeType: parseAttributeTypeName(calculation.attributeType, `${path}.attributeType`),
        multiplier: parseScalarSource(
          calculation.multiplier,
          `${path}.multiplier`,
          inheritedBlackboard,
        ),
        addition: parseScalarSource(calculation.addition, `${path}.addition`, inheritedBlackboard),
      };
    case 'DefiniteValueCalculation':
      requireExactFields(
        calculation,
        new Set(['$type', 'value', 'applyScale', 'valueScale']),
        path,
      );
      return {
        kind: 'definite',
        value: parseScalarSource(calculation.value, `${path}.value`, inheritedBlackboard),
        applyScale: requireBoolean(calculation.applyScale, `${path}.applyScale`),
        valueScale: parseScalarSource(
          calculation.valueScale,
          `${path}.valueScale`,
          inheritedBlackboard,
        ),
      };
    default:
      throw new Error(`${path}: unsupported native calculation ${JSON.stringify(sourceType)}`);
  }
}
