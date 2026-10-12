import type { ActionGraphResourceDefinition } from '../intermediateDefinitions.ts';
import {
  COMPILED_BUFF_CAPTURED_TARGET_GROUPS,
  type CompiledBuffCapturedTargetGroupsSource,
} from '../buffs/compiledBuffMetadata.ts';

/** 当前图及其元数据中的目标组引用；数值变量键不属于目标上下文。 */
const TARGET_READ_FIELDS = new Set([
  'contextKey',
  'excludedContextKey',
  'ownerContextKey',
  'sourceContextKey',
  'targetContextKey',
]);

/** 投影后的用途可能少于原生用途。外部调用尚未闭合时不推断其目标组无人读取。 */
export function collectUnobservedGraphTargetGroups(
  metadata: object,
  resource: ActionGraphResourceDefinition,
): ReadonlySet<string> {
  const reads = new Set<string>();
  const writes = new Set<string>();
  let externalAccess = false;
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = value as Record<string, unknown>;
    if (record.kind === 'context' && typeof record.key === 'string') reads.add(record.key);
    // 内嵌资源一并扫描读取；未解析的资源调用仍阻止裁剪。
    if (
      record.kind === 'callResource' ||
      record.kind === 'callMacro' ||
      record.kind === 'launchProjectile' ||
      record.kind === 'startCurrentAbilityEntityChildSkillById'
    )
      externalAccess = true;
    // 能力实体只接收显式出生目标和变量，不继承父技能的目标组。
    // bornAt 等参数仍按普通读取扫描。
    const captured = (
      value as {
        readonly [COMPILED_BUFF_CAPTURED_TARGET_GROUPS]?: CompiledBuffCapturedTargetGroupsSource;
      }
    )[COMPILED_BUFF_CAPTURED_TARGET_GROUPS];
    captured?.enemyKeys.forEach(key => reads.add(key));
    captured?.zeroSpaceKeys.forEach(key => reads.add(key));
    for (const [field, child] of Object.entries(record)) {
      if (record.kind === 'spawnAbilityEntity' && field === 'parameters' && child) {
        const { definition: _definition, ...parameters } = child as Record<string, unknown>;
        // 子实体定义不消费父目标组，出生目标等调用参数仍会消费。
        visit(parameters);
      } else if (field === 'saveToContextKey' && typeof child === 'string') writes.add(child);
      else if (TARGET_READ_FIELDS.has(field) && typeof child === 'string') reads.add(child);
      else visit(child);
    }
  };
  visit(metadata);
  visit(resource);
  return externalAccess ? new Set() : new Set([...writes].filter(key => !reads.has(key)));
}
