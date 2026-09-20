import { requireExactFields, requireInteger, requireNumber, requireRecord } from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface InterruptActionSource {
  readonly kind: 'interrupt';
  readonly attacker: TargetReferenceSource;
  readonly defender: TargetReferenceSource;
  readonly overrideSuperArmorLimit: number;
  readonly immobilizedTime: number;
}

/** 保留完整原生载荷；Endaxis 在静态木桩目标上显式省略控制结果。 */
export function parseInterruptActionSource(value: unknown, path: string): InterruptActionSource {
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
      'defender',
      'overrideSuperArmorLimit',
      'immobilizedTime',
    ]),
    path,
  );
  const immobilizedTime = requireNumber(action.immobilizedTime, `${path}.immobilizedTime`);
  if (!Number.isFinite(immobilizedTime) || immobilizedTime < 0)
    throw new Error(`${path}.immobilizedTime: expected finite non-negative number`);
  return {
    kind: 'interrupt',
    attacker: parseTargetReferenceSource(action.attacker, `${path}.attacker`),
    defender: parseTargetReferenceSource(action.defender, `${path}.defender`),
    overrideSuperArmorLimit: requireInteger(
      action.overrideSuperArmorLimit,
      `${path}.overrideSuperArmorLimit`,
    ),
    immobilizedTime,
  };
}
