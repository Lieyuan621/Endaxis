import { GameplayTagRegistry } from '../source/nativeGameplayTags.ts';

/** 仅是来源盘点结果，不是可执行协议，也不证明该节点通过场景过滤后仍会运行。 */
export interface GameplayTagReferenceObservation {
  readonly sourcePath: string;
  readonly tag: string;
  readonly affectedTags: readonly string[];
  readonly role: 'entity-query' | 'other-reference';
  readonly nativeType?: string;
  readonly targetSource?: string;
  readonly queryType?: string;
  readonly disabled: boolean;
}

/**
 * 盘点原始 JSON 中可能观察指定标签的引用，含祖先标签，避免仅搜精确 ID 漏掉父级查询。
 * 不把 Buff 分类查询当实体查询，也不把 Owner/Source/Target 名称直接判定成敌人。
 * 未知 ID 单独报告；零匹配不能证明动态黑板、原生预定义查询或缺失资产没有依赖。
 */
export function auditGameplayTagReferences(
  value: unknown,
  sourcePath: string,
  registry: GameplayTagRegistry,
  watchedTags: readonly string[],
) {
  const references: GameplayTagReferenceObservation[] = [];
  const unresolved: { sourcePath: string; reason: string }[] = [];
  let tagReferenceCount = 0;
  function visit(
    value: unknown,
    path: string,
    disabled: boolean,
    action?: Record<string, unknown>,
  ) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`, disabled, action));
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const row = value as Record<string, unknown>;
    const owner = typeof row.$type === 'string' ? row : action;
    const isDisabled = disabled || row.isEnable === false;
    if ('tagId' in row) {
      tagReferenceCount++;
      if (row.tagId !== 0) {
        let tag: string | undefined;
        try {
          if (typeof row.tagId !== 'number') throw new Error('expected numeric native tagId');
          tag = registry.resolve(row.tagId, `${path}.tagId`);
        } catch (error) {
          unresolved.push({ sourcePath: `${path}.tagId`, reason: String(error) });
        }
        if (tag !== undefined) {
          const referencedTag = tag;
          const affectedTags = watchedTags.filter(
            watched => watched === referencedTag || watched.startsWith(`${referencedTag}/`),
          );
          if (affectedTags.length > 0) {
            const entityQuery =
              owner?.$type ===
              'Beyond.Gameplay.Core.Conditions.CheckTagMatch+Data, Gameplay.Beyond';
            const target = owner?.checkTarget as Record<string, unknown> | undefined;
            const query = owner?.query as Record<string, unknown> | undefined;
            references.push({
              sourcePath: path,
              tag,
              affectedTags,
              role: entityQuery ? 'entity-query' : 'other-reference',
              ...(typeof owner?.$type === 'string' ? { nativeType: owner.$type } : {}),
              ...(entityQuery && typeof target?.targetSource === 'string'
                ? { targetSource: target.targetSource }
                : {}),
              ...(entityQuery && typeof query?.queryType === 'string'
                ? { queryType: query.queryType }
                : {}),
              disabled: isDisabled,
            });
          }
        }
      }
    }
    for (const [key, child] of Object.entries(row))
      visit(child, `${path}.${key}`, isDisabled, owner);
  }
  visit(value, sourcePath, false);
  return { tagReferenceCount, references, unresolved };
}
