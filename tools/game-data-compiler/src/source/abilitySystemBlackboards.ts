import { parseBlackboardDataPairs, type DeclaredBlackboardValueSource } from './blackboard.ts';
import { requireBoolean, requireRecord } from './primitives.ts';

export interface AbilitySystemBlackboardsSource {
  readonly entity: {
    readonly sourcePath: string;
    readonly initialValues: readonly DeclaredBlackboardValueSource[];
  };
  readonly comboCondition: {
    readonly sourcePath: string;
    readonly enabled: boolean;
    readonly initialValues: readonly DeclaredBlackboardValueSource[];
  };
}

/**
 * 只读取 AbilitySystemData / SkillDataBundle 已证明的两层黑板，不声称整个组件转换完整。
 * entity 属于实例；comboCondition 属于每条条件注册，禁用时保留来源但不能安装初值。
 * 不去除 EntityBB_，不合并同名键，不把动态初值当作运行期常量。
 */
export function parseAbilitySystemBlackboardsSource(
  value: unknown,
  sourcePath: string,
): AbilitySystemBlackboardsSource {
  const root = requireRecord(value, sourcePath);
  const bundlePath = `${sourcePath}.skillDataBundle`;
  const bundle = requireRecord(root.skillDataBundle, bundlePath);
  const entityPath = `${sourcePath}.entityBlackboard`;
  const comboPath = `${bundlePath}.comboSkillBlackboard`;
  return {
    entity: {
      sourcePath: entityPath,
      initialValues: parseBlackboardDataPairs(root.entityBlackboard, entityPath),
    },
    comboCondition: {
      sourcePath: comboPath,
      enabled: requireBoolean(
        bundle.enableComboSkillBlackboard,
        `${bundlePath}.enableComboSkillBlackboard`,
      ),
      initialValues: parseBlackboardDataPairs(bundle.comboSkillBlackboard, comboPath),
    },
  };
}
