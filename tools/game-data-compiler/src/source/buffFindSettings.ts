import {
  requireArray,
  requireExactFields,
  requireNativeEnum,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseTagQuerySource, type TagQuerySource } from './tagQuery.ts';

// 原生 BuffFindSettings.CheckType，不是所有名为 checkType 的字段。
const CHECK_TYPES = new Map([
  [0, 'Id'],
  [1, 'Tag'],
  [2, 'Environment'],
  [3, 'Context'],
] as const);
const STACK_NUM_TYPES = new Map([
  [0, 'BuffCount'],
  [1, 'BuffIdCount'],
] as const);

/** 原生 BuffStackNumType，与 Buff 查询配套但不是 CheckType 枚举。 */
export function readBuffStackNumType(value: unknown, path: string) {
  return requireNativeEnum(value, STACK_NUM_TYPES, path);
}

export interface BuffFindSettingsSource {
  readonly checkType: string;
  /** 原数组空占位也保留；具体查询消费规则不在编码适配时改变。 */
  readonly buffIds: readonly string[];
  readonly tagQuery: TagQuerySource;
}

export function readBuffFindCheckType(value: unknown, path: string) {
  return requireNativeEnum(value, CHECK_TYPES, path);
}

export function parseBuffFindSettingsSource(value: unknown, path: string): BuffFindSettingsSource {
  const settings = requireRecord(value, path);
  requireExactFields(settings, new Set(['checkType', 'buffIdList', 'tagQuery']), path);
  return {
    checkType: readBuffFindCheckType(settings.checkType, `${path}.checkType`),
    buffIds: requireArray(settings.buffIdList, `${path}.buffIdList`).map((item, index) =>
      requireString(item, `${path}.buffIdList[${index}]`),
    ),
    tagQuery: parseTagQuerySource(settings.tagQuery, `${path}.tagQuery`),
  };
}
