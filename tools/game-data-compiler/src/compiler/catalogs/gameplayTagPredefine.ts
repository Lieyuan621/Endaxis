import type { GameplayTagPredefineDefinition } from '../../../../../packages/game-data-contract/src/gameplayTags.ts';
import {
  gameplayTagIdFromPath,
  type GameplayTagRegistry,
} from '../../source/nativeGameplayTags.ts';
import type { GameplayTagPredefineTableSource } from '../../source/gameplayTagPredefineTable.ts';

/** 标签、查询及准入配置在同一来源目录下解析；未知身份阻断整份输出。 */
export function compileGameplayTagPredefine(
  source: GameplayTagPredefineTableSource,
  registry: GameplayTagRegistry,
): GameplayTagPredefineDefinition {
  const tags = Object.fromEntries(
    Object.entries(source.predefinedTags).map(([name, id]) => [
      name,
      registry.resolve(id, 'predefinedTags.' + name),
    ]),
  );
  const queries = Object.fromEntries(
    Object.entries(source.predefinedQuery).map(([name, query]) => [
      name,
      {
        queryType: query.queryType,
        tags: query.tagIds.map(id => registry.resolve(id, 'predefinedQuery.' + name)),
      },
    ]),
  );
  const immunityQueries = Object.entries(source.tagName2Immune).map(([path, ids]) => ({
    tag: registry.resolve(gameplayTagIdFromPath(path), 'tagName2Immune.' + path),
    query: {
      queryType: 'hasAny' as const,
      tags: ids.map(id => registry.resolve(id, 'tagName2Immune.' + path)),
    },
  }));
  return { tags, queries, immunityQueries };
}
