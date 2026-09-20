import type {
  OperatorDefinition,
  RoutedSkillReplacementDefinition,
  SkillDefinition,
  SkillGroupDefinition,
  SkillGroupVariantDefinition,
} from './operatorDefinition';

export type OperatorSkillDefinitionOrigin =
  'base' | 'variant' | 'replacement' | 'routedReplacement';

/** 一个技能在干员定义树中的位置；只保留来源关系，不解释技能库展示或运行时路由。 */
export interface OperatorSkillDefinitionBinding {
  readonly group: SkillGroupDefinition;
  readonly skill: SkillDefinition;
  readonly origin: OperatorSkillDefinitionOrigin;
  readonly variant?: SkillGroupVariantDefinition;
  readonly routedReplacement?: RoutedSkillReplacementDefinition;
}

export function asSkillDefinitions(
  value: SkillDefinition | readonly SkillDefinition[],
): readonly SkillDefinition[] {
  return Array.isArray(value) ? value : [value as SkillDefinition];
}

/** 以契约声明顺序枚举技能组的全部执行定义，包括形态与两类换槽技能。 */
export function listSkillGroupDefinitionBindings(
  group: SkillGroupDefinition,
): readonly OperatorSkillDefinitionBinding[] {
  return [
    ...asSkillDefinitions(group.skills).map(skill => ({
      group,
      skill,
      origin: 'base' as const,
    })),
    ...(group.variants ?? []).flatMap(variant =>
      asSkillDefinitions(variant.skills).map(skill => ({
        group,
        skill,
        origin: 'variant' as const,
        variant,
      })),
    ),
    ...(group.replacementSkills ?? []).map(skill => ({
      group,
      skill,
      origin: 'replacement' as const,
    })),
    ...(group.routedReplacementSkills ?? []).map(routedReplacement => ({
      group,
      skill: routedReplacement.skill,
      origin: 'routedReplacement' as const,
      routedReplacement,
    })),
  ];
}

export function listOperatorSkillDefinitionBindings(
  operator: OperatorDefinition,
): readonly OperatorSkillDefinitionBinding[] {
  return operator.skillGroups.flatMap(listSkillGroupDefinitionBindings);
}
