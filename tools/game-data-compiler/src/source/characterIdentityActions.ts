import {
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
  requireInteger,
} from './primitives.ts';
import { parseIntegerScalarSource, type IntegerScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

/** 角色表身份读取动作；值必须在运行装配时来自 CharacterTable，不能由展示属性反推。 */
export interface CharacterTypeIdReadActionSource {
  readonly kind: 'characterTypeIdRead';
  readonly target: TargetReferenceSource;
  readonly outputKey: string;
}

export type SquadSlotActionSource =
  | {
      readonly kind: 'findCharacterBySquadSlot';
      readonly slotIndex: IntegerScalarSource;
      readonly saveToContextKey: string;
    }
  | {
      readonly kind: 'storeCharacterTypeBySquadSlot';
      readonly slotIndex: IntegerScalarSource;
      readonly outputKey: string;
      readonly defaultValue: number;
    };

export function parseSquadSlotActionSource(
  value: unknown,
  path: string,
  store: boolean,
): SquadSlotActionSource {
  const action = requireRecord(value, path);
  requireExactFields(
    action,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'slotIndex',
      ...(store ? ['storeKey', 'defaultValue'] : ['targetGroupKey']),
    ]),
    path,
  );
  const slotIndex = parseIntegerScalarSource(action.slotIndex, `${path}.slotIndex`);
  return store
    ? {
        kind: 'storeCharacterTypeBySquadSlot',
        slotIndex,
        outputKey: requireNonEmptyString(action.storeKey, `${path}.storeKey`),
        defaultValue: requireInteger(action.defaultValue, `${path}.defaultValue`),
      }
    : {
        kind: 'findCharacterBySquadSlot',
        slotIndex,
        saveToContextKey: requireNonEmptyString(action.targetGroupKey, `${path}.targetGroupKey`),
      };
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
