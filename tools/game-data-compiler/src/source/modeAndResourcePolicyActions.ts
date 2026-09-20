import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

const META = ['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex'];

export interface SwitchModeActionSource {
  readonly kind: 'switchMode';
  readonly modeId: string;
  readonly resetOnEnd: boolean;
  readonly interruptCurrentSkillWhenStart: boolean;
  readonly interruptCurrentSkillWhenEnd: boolean;
}

export interface RefrainUltimateEnergyRecoveryActionSource {
  readonly kind: 'refrainUltimateEnergyRecovery';
  readonly target: TargetReferenceSource;
  readonly allowedRecoveryTagIds: readonly number[];
  readonly clearUltimateEnergyOnEnd: boolean;
}

export function parseSwitchModeActionSource(value: unknown, path: string): SwitchModeActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      ...META,
      'modeId',
      'resetOnEnd',
      'interruptCurSkillWhenStart',
      'interruptCurSkillWhenEnd',
    ]),
    path,
  );
  return {
    kind: 'switchMode',
    modeId: requireNonEmptyString(action.modeId, `${path}.modeId`),
    resetOnEnd: requireBoolean(action.resetOnEnd, `${path}.resetOnEnd`),
    interruptCurrentSkillWhenStart: requireBoolean(
      action.interruptCurSkillWhenStart,
      `${path}.interruptCurSkillWhenStart`,
    ),
    interruptCurrentSkillWhenEnd: requireBoolean(
      action.interruptCurSkillWhenEnd,
      `${path}.interruptCurSkillWhenEnd`,
    ),
  };
}

export function parseRefrainUltimateEnergyRecoveryActionSource(
  value: unknown,
  path: string,
): RefrainUltimateEnergyRecoveryActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([...META, 'targetSettings', 'refrainObtainUspTags', 'clearUspOnEnd']),
    path,
  );
  const tagsPath = `${path}.refrainObtainUspTags`;
  const tags = requireRecord(action.refrainObtainUspTags, tagsPath);
  requireExactFields(tags, new Set(['predefinedTag']), tagsPath);
  return {
    kind: 'refrainUltimateEnergyRecovery',
    target: parseTargetReferenceSource(action.targetSettings, `${path}.targetSettings`),
    allowedRecoveryTagIds: requireArray(tags.predefinedTag, `${tagsPath}.predefinedTag`).map(
      (value, index) => {
        const tagPath = `${tagsPath}.predefinedTag[${index}]`;
        const tag = requireRecord(value, tagPath);
        requireExactFields(tag, new Set(['tagId']), tagPath);
        return requireInteger(tag.tagId, `${tagPath}.tagId`);
      },
    ),
    clearUltimateEnergyOnEnd: requireBoolean(action.clearUspOnEnd, `${path}.clearUspOnEnd`),
  };
}
