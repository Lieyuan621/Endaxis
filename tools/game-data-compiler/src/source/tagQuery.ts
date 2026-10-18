import { requireArray, requireExactFields, requireInteger, requireRecord } from './primitives.ts';
import {
  GAMEPLAY_TAG_QUERY_TYPES,
  type GameplayTagQueryType,
} from '../../../../packages/game-data-contract/src/gameplayTags.ts';

export type TagQueryType = GameplayTagQueryType;
/** 来源解析保留原生身份；不可作为公开契约输出。 */
export interface TagQuerySource {
  readonly queryType: TagQueryType;
  readonly tagIds: readonly number[];
}

export const NATIVE_GAMEPLAY_TAG_QUERY_NAMES = [
  'HasAny',
  'HasAll',
  'ExceptAny',
  'ExceptAll',
] as const;

const QUERY_TYPES: Readonly<Record<string, TagQueryType>> = {
  HasAny: 'hasAny',
  HasAll: 'hasAll',
  ExceptAny: 'exceptAny',
  ExceptAll: 'exceptAll',
  hasAny: 'hasAny',
  hasAll: 'hasAll',
  exceptAny: 'exceptAny',
  exceptAll: 'exceptAll',
};

export function projectNativeTagQueryType(value: unknown, path: string): TagQueryType {
  const projected =
    typeof value === 'number'
      ? GAMEPLAY_TAG_QUERY_TYPES[value]
      : typeof value === 'string'
        ? QUERY_TYPES[value]
        : undefined;
  if (projected === undefined)
    throw new Error(`${path}: unsupported value ${JSON.stringify(value)}`);
  return projected;
}

/** 读取 GameplayTag 查询；这里只保留原生 ID，不为 ID 猜测显示语义。 */
export function parseTagQuerySource(value: unknown, path: string): TagQuerySource {
  const query = requireRecord(value, path);
  requireExactFields(query, new Set(['queryType', 'tags']), path);

  const queryType = projectNativeTagQueryType(query.queryType, `${path}.queryType`);

  return { queryType, tagIds: parseTagIdsSource(query.tags, `${path}.tags`) };
}

/** 缓存查询与动作查询同形；导出器可能以枚举数值或名称表示 queryType。 */
export function parseCachedTagQuerySource(value: unknown, path: string): TagQuerySource {
  return parseTagQuerySource(value, path);
}

export function parseTagIdsSource(value: unknown, path: string): number[] {
  return requireArray(value, path).map((rawTag, index) => {
    return parseTagIdSource(rawTag, `${path}[${index}]`);
  });
}

export function parseTagIdSource(value: unknown, path: string): number {
  const tag = requireRecord(value, path);
  requireExactFields(tag, new Set(['tagId']), path);
  const id = requireInteger(tag.tagId, `${path}.tagId`);
  if (id < -0x80000000 || id > 0x7fffffff) {
    throw new Error(`${path}.tagId: expected signed 32-bit integer`);
  }
  return id;
}
