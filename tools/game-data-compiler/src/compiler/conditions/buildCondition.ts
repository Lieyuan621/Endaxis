import {
  projectPrimaryAttributeKey,
  type ProjectedPrimaryAttributeSource,
} from '../build/attributeModifier.ts';
import type { CompareOperatorSource, SkillConditionSource } from '../../source/skillConditions.ts';

/** Endaxis 构筑期可执行的原生 CompareCharDeckAttr 条件。 */
export interface CompiledBuildConditionSource {
  readonly kind: 'deckAttributeCompare';
  readonly left: ProjectedPrimaryAttributeSource;
  readonly operator: CompareOperatorSource;
  readonly right: ProjectedPrimaryAttributeSource;
}

/** 原生 CheckSkillConditions 对非空条件 ID 按顺序执行短路 AND。 */
export interface CompiledBuildConditionGroupSource {
  readonly kind: 'all';
  readonly conditions: readonly CompiledBuildConditionSource[];
}

/** 14010 对应原生 CompareCharDeckAttr；其他 condType 不猜语义。 */
export function compileBuildConditionSource(
  source: SkillConditionSource,
): CompiledBuildConditionSource {
  if (source.conditionType !== 14010) {
    throw new Error(
      `${source.sourcePath}.condType: unsupported condition type ${source.conditionType}`,
    );
  }
  return {
    kind: 'deckAttributeCompare',
    left: requirePrimaryAttribute(source.leftAttribute, `${source.sourcePath}.leftAttrType`),
    operator: source.operator,
    right: requirePrimaryAttribute(source.rightAttribute, `${source.sourcePath}.rightAttrType`),
  };
}

/** 为已严格解析的条件建立唯一索引，供多个养成效果共享。 */
export function compileBuildConditionIndexSource(
  sources: readonly SkillConditionSource[],
): ReadonlyMap<string, CompiledBuildConditionSource> {
  return new Map(
    sources.map(source => [source.conditionId, compileBuildConditionSource(source)] as const),
  );
}

/**
 * 保留原生条件数组的 AND 语义。空字符串由原生逻辑跳过；多条件不会被偷换成单条件。
 */
export function compileBuildConditionGroupSource(
  conditionIds: readonly string[],
  conditionsById: ReadonlyMap<string, CompiledBuildConditionSource>,
  sourcePath: string,
): CompiledBuildConditionGroupSource | null {
  const activeIds = conditionIds.filter(conditionId => conditionId.length > 0);
  if (activeIds.length === 0) return null;
  return {
    kind: 'all',
    conditions: activeIds.map((conditionId, index) => {
      const condition = conditionsById.get(conditionId);
      if (condition === undefined) {
        throw new Error(
          `${sourcePath}[${index}]: missing SkillConditionTable entry ${JSON.stringify(conditionId)}`,
        );
      }
      return condition;
    }),
  };
}

/**
 * 当前 Next BuildCondition 只能表示一个比较。真实数据出现多条件时必须先扩展正式类型，不能截断。
 */
export function projectSingleBuildConditionSource(
  group: CompiledBuildConditionGroupSource | null,
  sourcePath: string,
): CompiledBuildConditionSource | null {
  if (group === null) return null;
  if (group.conditions.length !== 1) {
    throw new Error(
      `${sourcePath}: Next BuildCondition cannot represent native AND group with ${group.conditions.length} conditions`,
    );
  }
  return group.conditions[0]!;
}

function requirePrimaryAttribute(
  value: SkillConditionSource['leftAttribute'],
  path: string,
): ProjectedPrimaryAttributeSource {
  const result = projectPrimaryAttributeKey(value);
  if (result === null) throw new Error(`${path}: ${value} is not a deck primary attribute`);
  return result;
}
