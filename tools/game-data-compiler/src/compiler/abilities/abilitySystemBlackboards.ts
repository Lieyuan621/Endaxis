import type { AbilitySystemBlackboardsSource } from '../../source/abilitySystemBlackboards.ts';

export interface CompiledAbilitySystemBlackboardsSource {
  readonly source: AbilitySystemBlackboardsSource;
  readonly entityInitialValues: Readonly<Record<string, number | string>>;
  /** null 表示禁用，不等同启用的空板；每条注册须独立复制。 */
  readonly comboConditionInitialValues: Readonly<Record<string, number | string>> | null;
}

/**
 * 模板 Assign 的字面初值投影，不走 SkillPatch，也不把动态项过滤成编译期常量。
 * 每条连携条件独立复制黑板；实体黑板按实体生命周期维护。
 * 保留原 source 中的动态标记和精确字段路径。
 */
export function compileAbilitySystemBlackboardsSource(
  source: AbilitySystemBlackboardsSource,
): CompiledAbilitySystemBlackboardsSource {
  return {
    source,
    entityInitialValues: Object.fromEntries(source.entity.initialValues.map(v => [v.key, v.value])),
    comboConditionInitialValues: source.comboCondition.enabled
      ? Object.fromEntries(source.comboCondition.initialValues.map(v => [v.key, v.value]))
      : null,
  };
}
