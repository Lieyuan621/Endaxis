import type {
  OperatorDefinition,
  SkillDefinition,
  SkillGroupDefinition,
} from './operatorDefinition';

/** 按技能 ID 替换干员定义中的技能，且必须恰好命中一次。 */
export function installCompiledSkillDefinition(
  operator: OperatorDefinition,
  compiled: SkillDefinition,
  supplementalBuffDefinitions: NonNullable<OperatorDefinition['buffDefinitions']> = {},
): OperatorDefinition {
  let matches = 0;
  const replace = (skill: SkillDefinition): SkillDefinition => {
    if (skill.key !== compiled.key) return skill;
    matches += 1;
    return compiled;
  };
  const replaceSet = (
    skills: SkillDefinition | readonly SkillDefinition[],
  ): SkillDefinition | readonly SkillDefinition[] =>
    Array.isArray(skills) ? skills.map(replace) : replace(skills as SkillDefinition);
  const replaceGroup = (group: SkillGroupDefinition): SkillGroupDefinition => ({
    ...group,
    skills: replaceSet(group.skills),
    ...(group.variants === undefined
      ? {}
      : {
          variants: group.variants.map(variant => ({
            ...variant,
            skills: replaceSet(variant.skills),
          })),
        }),
    ...(group.replacementSkills === undefined
      ? {}
      : { replacementSkills: group.replacementSkills.map(replace) }),
    ...(group.routedReplacementSkills === undefined
      ? {}
      : {
          routedReplacementSkills: group.routedReplacementSkills.map(routed => ({
            ...routed,
            skill: replace(routed.skill),
          })),
        }),
  });
  const result = {
    ...operator,
    skillGroups: operator.skillGroups.map(replaceGroup),
    buffDefinitions: {
      ...supplementalBuffDefinitions,
      ...operator.buffDefinitions,
    },
  };
  if (matches !== 1)
    throw new Error(`compiled skill '${compiled.key}' must match exactly once; matched ${matches}`);
  return result;
}
