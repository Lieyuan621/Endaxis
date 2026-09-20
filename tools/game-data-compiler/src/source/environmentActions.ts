import { parseNativeCalculationSource, type NativeCalculationSource } from './calculation.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface BreakInteractiveActionSource {
  readonly kind: 'breakInteractive';
  readonly attacker: string;
  readonly damageType: string;
  readonly calculation: NativeCalculationSource;
  readonly target: TargetReferenceSource;
}

/** 可破坏场景物件不属于 Endaxis 木桩战斗，但完整载荷仍需通过公共来源校验。 */
export function parseBreakInteractiveActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): BreakInteractiveActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'attacker',
      'damageType',
      'atkCalculation',
      'damageProcessors',
      'targetInteractives',
    ]),
    path,
  );
  if (requireArray(action.damageProcessors, `${path}.damageProcessors`).length > 0)
    throw new Error(`${path}.damageProcessors: interactive damage processors are unsupported`);
  return {
    kind: 'breakInteractive',
    attacker: requireNonEmptyString(action.attacker, `${path}.attacker`),
    damageType: requireNonEmptyString(action.damageType, `${path}.damageType`),
    calculation: parseNativeCalculationSource(
      action.atkCalculation,
      `${path}.atkCalculation`,
      inheritedBlackboard,
    ),
    target: parseTargetReferenceSource(action.targetInteractives, `${path}.targetInteractives`),
  };
}
