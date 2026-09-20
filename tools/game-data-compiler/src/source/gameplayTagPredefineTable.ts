import { requireExactFields, requireNonEmptyString, requireRecord } from './primitives.ts';
import {
  parseCachedTagQuerySource,
  parseTagIdSource,
  parseTagIdsSource,
  type TagQuerySource,
} from './tagQuery.ts';

/** 来源保留 tagName2Immune 的路径键与原始数字引用；公共编译层统一解析为可读路径。 */
export interface GameplayTagPredefineTableSource {
  readonly predefinedTags: Readonly<Record<string, number>>;
  readonly predefinedQuery: Readonly<Record<string, TagQuerySource>>;
  readonly tagName2Immune: Readonly<Record<string, readonly number[]>>;
}

/** 严格读取 GameplayTagPredefineData 的三个字典及各自载荷。 */
export function parseGameplayTagPredefineTableSource(
  value: unknown,
  path: string,
): GameplayTagPredefineTableSource {
  const table = requireRecord(value, path);
  requireExactFields(table, new Set(['predefinedTags', 'predefinedQuery', 'tagName2Immune']), path);
  return {
    predefinedTags: parseDictionary(
      table.predefinedTags,
      `${path}.predefinedTags`,
      parseTagIdSource,
    ),
    predefinedQuery: parseDictionary(
      table.predefinedQuery,
      `${path}.predefinedQuery`,
      parseCachedTagQuerySource,
    ),
    tagName2Immune: parseDictionary(
      table.tagName2Immune,
      `${path}.tagName2Immune`,
      (entry, entryPath) => {
        const immune = requireRecord(entry, entryPath);
        requireExactFields(immune, new Set(['predefinedTag']), entryPath);
        return parseTagIdsSource(immune.predefinedTag, `${entryPath}.predefinedTag`);
      },
    ),
  };
}

function parseDictionary<T>(
  value: unknown,
  path: string,
  parse: (value: unknown, path: string) => T,
): Readonly<Record<string, T>> {
  return Object.fromEntries(
    Object.entries(requireRecord(value, path)).map(([key, entry]) => {
      requireNonEmptyString(key, `${path} key`);
      return [key, parse(entry, `${path}.${key}`)];
    }),
  );
}
