import {
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

/** 角色表身份读取动作；值必须在运行装配时来自 CharacterTable，不能由展示属性反推。 */
export interface CharacterTypeIdReadActionSource {
  readonly kind: 'characterTypeIdRead';
  readonly target: TargetReferenceSource;
  readonly outputKey: string;
}

export function parseCharacterTypeIdReadActionSource(
  value: unknown,
  path: string,
): CharacterTypeIdReadActionSource {
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
      'storeKey',
    ]),
    path,
  );
  return {
    kind: 'characterTypeIdRead',
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    outputKey: requireNonEmptyString(action.storeKey, `${path}.storeKey`),
  };
}
