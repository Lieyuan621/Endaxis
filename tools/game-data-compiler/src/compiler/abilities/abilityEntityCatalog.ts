import {
  parseNativeAbilityEntityTemplateSource,
  type NativeAbilityEntityTemplateSource,
} from '../../source/abilityEntity.ts';
import { requireRecord } from '../../source/primitives.ts';
import type { TagQuerySource } from '../../source/tagQuery.ts';
import { gameplayTagId, type GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';

export interface CompiledAbilityEntityTemplateCatalogSource {
  readonly templates: readonly NativeAbilityEntityTemplateSource[];
  readonly byId: ReadonlyMap<string, NativeAbilityEntityTemplateSource>;
  /** 精确 born tag 倒排索引；父子标签匹配必须另由版本化 GameplayTag 路径证明。 */
  readonly idsByExactBornTag: ReadonlyMap<number, readonly string[]>;
}

/**
 * 把解包模板目录编译为领域无关的公共目录。这里不解释阵营、寿命枚举或叠层淘汰规则，
 * 只建立已经由资产本身证明的身份和精确 born tag 关系。
 */
export function compileAbilityEntityTemplateCatalogSource(
  value: unknown,
  sourceName = 'AbilityEntityData',
): CompiledAbilityEntityTemplateCatalogSource {
  const table = requireRecord(value, sourceName);
  const templates = Object.keys(table)
    .sort((left, right) => left.localeCompare(right))
    .map(id => {
      const sourcePath = `${sourceName}.${id}`;
      const template = parseNativeAbilityEntityTemplateSource(table[id], sourcePath);
      if (template.gameId !== id) {
        throw new Error(
          `${sourcePath}.gameId: expected ${JSON.stringify(id)}, got ${JSON.stringify(template.gameId)}`,
        );
      }
      return template;
    });

  const byId = new Map<string, NativeAbilityEntityTemplateSource>();
  const mutableIdsByTag = new Map<number, string[]>();
  for (const template of templates) {
    if (byId.has(template.gameId)) {
      throw new Error(
        `${sourceName}: duplicate AbilityEntity identity ${JSON.stringify(template.gameId)}`,
      );
    }
    byId.set(template.gameId, template);
    for (const tagId of new Set(template.bornTagIds)) {
      const ids = mutableIdsByTag.get(tagId) ?? [];
      ids.push(template.gameId);
      mutableIdsByTag.set(tagId, ids);
    }
  }
  return {
    templates,
    byId,
    idsByExactBornTag: new Map(
      [...mutableIdsByTag.entries()]
        .sort(([left], [right]) => left - right)
        .map(([tagId, ids]) => [tagId, ids] as const),
    ),
  };
}

/**
 * 按运行时相同的 GameplayTag 层级语义，把 owner-spawned 查询降为明确模板 ID。
 * registry 必须由与模板同版本的路径目录创建；空目录只允许裸 ID 精确命中。
 */
export function resolveAbilityEntityTemplateIdsByTagQuery(
  catalog: CompiledAbilityEntityTemplateCatalogSource,
  query: TagQuerySource,
  registry: GameplayTagRegistry,
): string[] {
  const requiredTags = query.tagIds.map(gameplayTagId);
  return catalog.templates
    .filter(template =>
      registry.query(template.bornTagIds.map(gameplayTagId), requiredTags, query.queryType),
    )
    .map(template => template.gameId);
}
