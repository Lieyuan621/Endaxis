import type { DefinitionReferenceSource } from '../../source/referenceGraph.ts';

/** 接收黑板的资源。未完整解析时仍检查已知引用，但不能据此证明裁剪安全。 */
export interface BlackboardReceiverSource {
  readonly value: unknown;
  readonly references: readonly DefinitionReferenceSource[];
  /** 省略表示完整；false 表示还有未解析字段或组件。 */
  readonly complete?: boolean;
}

/**
 * 保守检查外部资源可能使用的键。声明、写入和关闭分支里的字符串也计入，宁可少裁剪。
 * 只要接收者未知，就不能证明任何键不会传出；调用方不得将缺失资源替换成空对象。
 */
export function inspectExternalBlackboardUsage(
  roots: readonly DefinitionReferenceSource[],
  load: (reference: DefinitionReferenceSource) => BlackboardReceiverSource | undefined,
  resolveDynamic?: (
    reference: DefinitionReferenceSource,
  ) => readonly DefinitionReferenceSource[] | undefined,
): {
  readonly mentionedKeys: ReadonlySet<string>;
  readonly unresolved: readonly DefinitionReferenceSource[];
} {
  const mentionedKeys = new Set<string>();
  const unresolved: DefinitionReferenceSource[] = [];
  const visited = new Set<string>();
  const pending = [...roots];
  const dynamic: DefinitionReferenceSource[] = [];
  let index = 0;
  while (true) {
    for (; index < pending.length; index += 1) {
      const reference = pending[index]!;
      if (reference.state === 'inactive' || reference.state === 'empty') continue;
      // 继承名单只匹配已发生的下一技能并转交 Buff 清理归属，不调用技能或传递黑板。
      if (reference.kind === 'skill' && reference.usage === 'buffInheritance') continue;
      if (reference.state === 'dynamic' || reference.id === null) {
        dynamic.push(reference);
        continue;
      }
      const identity = `${reference.kind}\0${reference.id}`;
      if (visited.has(identity)) continue;
      visited.add(identity);
      const receiver = load(reference);
      if (receiver === undefined) {
        unresolved.push(reference);
        continue;
      }
      if (receiver.complete === false) unresolved.push(reference);
      const values: unknown[] = [receiver.value];
      while (values.length > 0) {
        const value = values.pop();
        if (typeof value === 'string') mentionedKeys.add(value);
        else if (Array.isArray(value)) values.push(...value);
        else if (value !== null && typeof value === 'object') {
          for (const [key, child] of Object.entries(value)) {
            mentionedKeys.add(key);
            values.push(child);
          }
        }
      }
      pending.push(...receiver.references);
    }
    // 必须等静态来路收齐后才做证明；新候选带来新资源时，下一轮重验所有动态引用。
    const unproven: DefinitionReferenceSource[] = [];
    for (const reference of dynamic) {
      const candidates = resolveDynamic?.(reference);
      if (candidates === undefined) {
        unproven.push(reference);
        continue;
      }
      for (const candidate of candidates) {
        if (candidate.state !== 'active' || candidate.id === null)
          throw new Error('Dynamic reference resolution must return concrete active references');
        if (!visited.has(`${candidate.kind}\0${candidate.id}`)) pending.push(candidate);
      }
    }
    if (index === pending.length)
      return { mentionedKeys, unresolved: [...unresolved, ...unproven] };
  }
}
