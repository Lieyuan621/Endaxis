import { requireExactFields, requireRecord } from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface NormalSkillUltimateEnergyActionSource {
  readonly kind: 'normalSkillUltimateEnergy';
  readonly source: TargetReferenceSource;
  readonly coefficient: ScalarSource;
}

/** 严格读取普通战技实际非返还技力消耗转全队终结技能量的公共动作。 */
export function parseNormalSkillUltimateEnergyActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): NormalSkillUltimateEnergyActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'source',
      'coefficient',
    ]),
    path,
  );
  return {
    kind: 'normalSkillUltimateEnergy',
    source: parseTargetReferenceSource(action.source, `${path}.source`),
    coefficient: parseScalarSource(action.coefficient, `${path}.coefficient`, inheritedBlackboard),
  };
}
