import {
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseScalarSource, type BlackboardLevelValues, type ScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const ACTION_META_FIELDS = [
  '$type',
  'isEnable',
  'priorityLevel',
  'priorityOffset',
  'serverActionIndex',
];

/** 完整保留 ChangeSkillAction 的原生槽位替换载荷。 */
export interface SkillSlotReplacementActionSource {
  readonly kind: 'skillSlotReplacement';
  readonly skillSource: TargetReferenceSource;
  readonly skillSlot: 'NormalSkill' | 'ComboSkill' | 'UltimateSkill';
  readonly targetSkillId: string;
  readonly overrideCacheTime: boolean;
  readonly cacheTime: ScalarSource;
  readonly lifetime: 'SpecificTime' | 'Infinite' | 'FinishByAction';
  readonly duration: ScalarSource;
  readonly inheritOriginSkillCooldownProgress: boolean;
  readonly specificRevertedSkillId: boolean;
  readonly revertedSkillId: string;
}

export function parseSkillSlotReplacementActionSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): SkillSlotReplacementActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...ACTION_META_FIELDS,
      'skillSource',
      'skillSlot',
      'targetSkillId',
      'overrideCacheTime',
      'cacheTime',
      'lifeTimeType',
      'duration',
      'inheritOriginSkillCdProgress',
      'specificRevertedSkillId',
      'revertedSkillId',
    ]),
    path,
  );
  const skillSlot = requireNonEmptyString(action.skillSlot, `${path}.skillSlot`);
  if (!['NormalSkill', 'ComboSkill', 'UltimateSkill'].includes(skillSlot)) {
    throw new Error(`${path}.skillSlot: unsupported value ${JSON.stringify(skillSlot)}`);
  }
  const lifetime = requireNonEmptyString(action.lifeTimeType, `${path}.lifeTimeType`);
  if (!['SpecificTime', 'Infinite', 'FinishByAction'].includes(lifetime)) {
    throw new Error(`${path}.lifeTimeType: unsupported value ${JSON.stringify(lifetime)}`);
  }
  return {
    kind: 'skillSlotReplacement',
    skillSource: parseTargetReferenceSource(action.skillSource, `${path}.skillSource`),
    skillSlot: skillSlot as SkillSlotReplacementActionSource['skillSlot'],
    targetSkillId: requireNonEmptyString(action.targetSkillId, `${path}.targetSkillId`),
    overrideCacheTime: requireBoolean(action.overrideCacheTime, `${path}.overrideCacheTime`),
    cacheTime: parseScalarSource(action.cacheTime, `${path}.cacheTime`, inheritedBlackboard),
    lifetime: lifetime as SkillSlotReplacementActionSource['lifetime'],
    duration: parseScalarSource(action.duration, `${path}.duration`, inheritedBlackboard),
    inheritOriginSkillCooldownProgress: requireBoolean(
      action.inheritOriginSkillCdProgress,
      `${path}.inheritOriginSkillCdProgress`,
    ),
    specificRevertedSkillId: requireBoolean(
      action.specificRevertedSkillId,
      `${path}.specificRevertedSkillId`,
    ),
    revertedSkillId: requireString(action.revertedSkillId, `${path}.revertedSkillId`),
  };
}
