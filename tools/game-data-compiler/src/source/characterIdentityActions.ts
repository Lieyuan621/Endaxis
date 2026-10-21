import {
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
  requireInteger,
} from './primitives.ts';
import { parseIntegerScalarSource, type IntegerScalarSource } from './scalar.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';

export const CHARACTER_IDENTITY_READ_KINDS = {
  SaveCharTypeId: 'characterTypeIdRead',
  SaveCharTypeIdToInt: 'characterTypeCodeRead',
  SaveProfession: 'professionRead',
  SaveSquadSlot: 'squadSlotRead',
} as const;

/** 角色身份读取动作；属性、职业来自原生角色配置，槽位来自当前队伍，不能由展示顺序反推。 */
export interface CharacterIdentityReadActionSource {
  readonly kind: (typeof CHARACTER_IDENTITY_READ_KINDS)[keyof typeof CHARACTER_IDENTITY_READ_KINDS];
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
      readonly kind: 'findNextAliveCharacterBySquadSlot';
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
  kind: SquadSlotActionSource['kind'],
): SquadSlotActionSource {
  const action = requireRecord(value, path);
  const store = kind === 'storeCharacterTypeBySquadSlot';
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
        kind,
        slotIndex,
        saveToContextKey: requireNonEmptyString(action.targetGroupKey, `${path}.targetGroupKey`),
      };
}

export function parseCharacterIdentityReadActionSource(
  value: unknown,
  path: string,
  kind: CharacterIdentityReadActionSource['kind'] = 'characterTypeIdRead',
): CharacterIdentityReadActionSource {
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
    kind,
    target: parseTargetReferenceSource(action.target, `${path}.target`),
    outputKey: requireNonEmptyString(action.storeKey, `${path}.storeKey`),
  };
}
