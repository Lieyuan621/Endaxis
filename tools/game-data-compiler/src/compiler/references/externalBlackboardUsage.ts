import { parseBuffBlackboardReadActionSource } from '../../source/buffQueryActions.ts';
import type { DefinitionReferenceSource } from '../../source/referenceGraph.ts';

/** 接收黑板的资源。未完整解析时仍检查已知引用，但不能据此证明裁剪安全。 */
export interface BlackboardReceiverSource {
  readonly value: unknown;
  readonly references: readonly DefinitionReferenceSource[];
  /** 省略表示完整；false 表示还有未解析字段或组件。 */
  readonly complete?: boolean;
}

/**
 * 保守检查外部资源可能使用的键。写入和关闭分支里的字符串也计入，声明名称不算读取。
 * 只要接收者未知，就不能证明任何键不会传出；调用方不得将缺失资源替换成空对象。
 */
export function inspectExternalBlackboardUsage(
  roots: readonly DefinitionReferenceSource[],
  load: (reference: DefinitionReferenceSource) => BlackboardReceiverSource | undefined,
  resolveDynamic?: (
    reference: DefinitionReferenceSource,
  ) => readonly DefinitionReferenceSource[] | undefined,
  scope: 'action' | 'entity' = 'entity',
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
      // CastSkill 只转交目标和施法身份，不继承动作黑板；实体变量仍由后续技能共享。
      if (scope === 'action' && reference.kind === 'skill' && reference.usage === 'cast') continue;
      // 继承名单只匹配已发生的下一技能并转交 Buff 清理归属，不调用技能或传递黑板。
      if (reference.kind === 'skill' && reference.usage === 'buffInheritance') continue;
      // 结束已有实例会使用该实例原有环境，不把结束动作的黑板交给它。
      if (reference.kind === 'buff' && ['finish', 'finishQuery'].includes(reference.usage))
        continue;
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
          const record = value as Record<string, unknown>;
          // 原生 Blackboard.DataPair 只声明初值；字符串初值仍可能被间接用作键，继续检查。
          const declaration =
            Object.keys(record).length === 4 &&
            typeof record.key === 'string' &&
            typeof record.valueDouble === 'number' &&
            typeof record.valueStr === 'string' &&
            typeof record.isDynamic === 'boolean';
          for (const [key, child] of Object.entries(value)) {
            if (declaration && key === 'key') continue;
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

/** 外部 Buff 读取按变量键保守汇总；不以 ID/标签过滤排除潜在宿主。 */
export function collectExternalBuffBlackboardReads(
  resources: Iterable<{ readonly value: unknown; readonly sourcePath: string }>,
): ReadonlySet<string> {
  const keys = new Set<string>();
  const visit = (value: unknown, sourcePath: string): void => {
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, `${sourcePath}[${index}]`));
      return;
    }
    if (value === null || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const type = record.$type;
    if (
      typeof type === 'string' &&
      (type.startsWith('Beyond.Gameplay.Core.GetTargetBuffBBAction+') ||
        type.startsWith('Beyond.Gameplay.Core.GetTargetBuffBBAdvanced+'))
    ) {
      // 使用正式来源解析器，新增字段或动态键不能静默变成“没有读取”。
      keys.add(parseBuffBlackboardReadActionSource(record, sourcePath).desiredKey);
    }
    for (const [field, child] of Object.entries(record)) visit(child, `${sourcePath}.${field}`);
  };
  for (const resource of resources) visit(resource.value, resource.sourcePath);
  return keys;
}
