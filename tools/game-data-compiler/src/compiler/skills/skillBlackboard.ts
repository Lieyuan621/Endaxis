import type { BlackboardLevelValues } from '../../source/scalar.ts';
import {
  numericDeclaredBlackboard,
  type DeclaredBlackboardValueSource,
} from '../../source/blackboard.ts';
import type { SkillPatchSource } from '../../source/skillPatch.ts';

export interface ResolvedSkillBlackboardSource {
  readonly definitionLevel: number;
  readonly declaredDefaults: Readonly<Record<string, number>>;
  readonly levels: readonly number[];
  readonly values: BlackboardLevelValues;
}

export interface SelectedSkillBlackboardSource {
  readonly level: number;
  readonly patchApplied: boolean;
  readonly values: Readonly<Record<string, number>>;
}

/**
 * 合并 SkillData 静态默认值与 SkillPatch 逐等级值。动态声明是运行时输入，不能在导入时冻结；
 * Patch 可以合法提供 SkillData 未声明的键，因此这里不以声明集合限制补丁。
 */
export function resolveSkillBlackboardSource(
  declared: readonly DeclaredBlackboardValueSource[],
  definitionLevel: number,
  patch: SkillPatchSource | null,
): ResolvedSkillBlackboardSource {
  const levels = patch?.levels ?? [definitionLevel];
  const declaredDefaults = numericDeclaredBlackboard(declared);
  // 默认值不随等级变化；只有原生补丁贡献等级列，并保持其原引用与真实等级身份。
  const values: BlackboardLevelValues = { ...declaredDefaults, ...patch?.blackboard };
  return { definitionLevel, declaredDefaults, levels, values };
}

/**
 * 复现 SkillUtil.CreateSkillData 的等级边界：null 或不存在的等级补丁都保留 SkillData 默认值；
 * 只有精确命中补丁时才切换等级并合并该行。运行时额外黑板由安装请求在此步骤之后覆盖。
 */
export function selectSkillBlackboardLevel(
  source: ResolvedSkillBlackboardSource,
  requestedLevel: number | null,
): SelectedSkillBlackboardSource {
  if (requestedLevel === null) {
    return {
      level: source.definitionLevel,
      patchApplied: false,
      values: { ...source.declaredDefaults },
    };
  }
  const levelIndex = source.levels.indexOf(requestedLevel);
  if (levelIndex < 0) {
    return {
      level: source.definitionLevel,
      patchApplied: false,
      values: { ...source.declaredDefaults },
    };
  }
  return {
    level: requestedLevel,
    patchApplied: true,
    values: Object.fromEntries(
      Object.entries(source.values).map(([key, values]) => [
        key,
        typeof values === 'number' ? values : values[levelIndex]!,
      ]),
    ),
  };
}
