import type {
  OperatorDefinition,
  SkillDefinition,
  SkillGroupDefinition,
  SkillGroupVariantDefinition,
} from './operatorDefinition';

export type OperatorSkillDefinitionOrigin = 'base' | 'variant';

/** 一个技能在干员定义中的位置；只保留来源关系，不解释技能库展示或运行时路由。 */
export interface OperatorSkillDefinitionBinding {
  readonly group: SkillGroupDefinition;
  readonly skill: SkillDefinition;
  readonly origin: OperatorSkillDefinitionOrigin;
  readonly variant?: SkillGroupVariantDefinition;
}

/** 只在当前宿主内解析执行技能；内部技能无需技能库入口。 */
export function requireOperatorSkill(
  operator: Pick<OperatorDefinition, 'slug' | 'skills'>,
  skillId: string,
): SkillDefinition {
  const skill = operator.skills.find(candidate => candidate.key === skillId);
  if (!skill) throw new Error(`operator '${operator.slug}' has no skill '${skillId}'`);
  return skill;
}

/** 枚举技能库入口的引用；执行编译直接枚举 operator.skills。 */
export function listSkillGroupDefinitionBindings(
  group: SkillGroupDefinition,
  operator: OperatorDefinition,
): readonly OperatorSkillDefinitionBinding[] {
  return [
    ...group.skillIds.map(skillId => ({
      group,
      skill: requireOperatorSkill(operator, skillId),
      origin: 'base' as const,
    })),
    ...(group.variants ?? []).flatMap(variant =>
      variant.skillIds.map(skillId => ({
        group,
        skill: requireOperatorSkill(operator, skillId),
        origin: 'variant' as const,
        variant,
      })),
    ),
  ];
}

export function listOperatorSkillDefinitionBindings(
  operator: OperatorDefinition,
): readonly OperatorSkillDefinitionBinding[] {
  return operator.skillGroups.flatMap(group => listSkillGroupDefinitionBindings(group, operator));
}
