import type {
  BuildModifierDefinitionMap,
  LevelValues,
} from '../../../../../packages/game-data-contract/src/index.ts';

/** 干员构筑来源无法直接进入正式定义时的统一诊断。 */
export interface BuildDefinitionDiagnosticSource {
  readonly status: 'scenario-omitted' | 'blocked';
  readonly sourcePath: string;
  readonly reason: string;
}

/**
 * 已有原生投影能够输出的契约子集，不再逐字段复制一份近似定义。
 * 类型可表示不等于已获准转换；具体目标与公式槽仍由公共投影严格判定。
 */
type BuildModifierContract =
  | BuildModifierDefinitionMap['attribute' | 'panelStat']
  | Required<BuildModifierDefinitionMap['damageScale']>
  | BuildModifierDefinitionMap['staticHealingIncrease' | 'skillCooldownMultiplier'];

/** 一份修正结构携带单值或等级列；泛型只保留调用方已知的数值形态。 */
export type CompiledBuildModifierDefinitionSource<Value extends LevelValues = LevelValues> =
  BuildModifierContract & { readonly value: Value };
