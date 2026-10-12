import { requireExactFields, requireNonEmptyString, requireRecord } from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export interface InterruptCurrentSkillActionSource {
  readonly kind: 'interruptCurrentSkill';
  readonly owner: TargetReferenceSource;
}

export interface StoreCurrentSkillExecuteFrameActionSource {
  readonly kind: 'storeCurrentSkillExecuteFrame';
  readonly target: TargetReferenceSource;
  readonly outputKey: string;
}

/** 读取原生动作指定的技能持有者。 */
export function parseInterruptCurrentSkillActionSource(
  value: unknown,
  path: string,
): InterruptCurrentSkillActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'skillOwner',
    ]),
    path,
  );
  return {
    kind: 'interruptCurrentSkill',
    owner: parseTargetReferenceSource(action.skillOwner, `${path}.skillOwner`),
  };
}

export function parseStoreCurrentSkillExecuteFrameActionSource(
  value: unknown,
  path: string,
): StoreCurrentSkillExecuteFrameActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'target',
      'blackboardKey',
    ]),
    path,
  );
  return {
    kind: 'storeCurrentSkillExecuteFrame',
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    outputKey: requireNonEmptyString(action.blackboardKey, `${path}.blackboardKey`),
  };
}
