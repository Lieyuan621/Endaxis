import type {
  OperatorDefinition,
  SkillDefinition,
  SkillGroupDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  asSkillDefinitions,
  listSkillGroupDefinitionBindings,
  type OperatorSkillDefinitionBinding,
} from '../../../../core/game-data/operatorSkillDefinitions';

/** Remove only the selected containment member; do not silently rewrite references or routing. */
export function removeOperatorLibrarySkill(
  group: SkillGroupDefinition,
  binding: OperatorSkillDefinitionBinding,
): SkillGroupDefinition {
  if (binding.group !== group) return group;
  switch (binding.origin) {
    case 'base':
      return {
        ...group,
        skills: asSkillDefinitions(group.skills).filter(skill => skill !== binding.skill),
      };
    case 'replacement':
      return {
        ...group,
        replacementSkills: group.replacementSkills?.filter(skill => skill !== binding.skill),
      };
    case 'variant':
      return {
        ...group,
        variants: group.variants?.map(variant =>
          variant === binding.variant
            ? {
                ...variant,
                skills: asSkillDefinitions(variant.skills).filter(skill => skill !== binding.skill),
              }
            : variant,
        ),
      };
    case 'routedReplacement':
      return {
        ...group,
        routedReplacementSkills: group.routedReplacementSkills?.filter(
          item => item !== binding.routedReplacement,
        ),
      };
  }
}

function unique(prefix: string, keys: readonly string[]) {
  let n = 1;
  const existing = new Set(keys);
  while (existing.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/** Only siblings in the same containment array may be reordered. */
export function operatorLibrarySkillSiblings(binding: OperatorSkillDefinitionBinding) {
  return listSkillGroupDefinitionBindings(binding.group).filter(
    item => item.origin === binding.origin && item.variant === binding.variant,
  );
}

export function editOperatorLibrarySkillMember(
  group: SkillGroupDefinition,
  binding: OperatorSkillDefinitionBinding,
  operation: 'copy' | 'up' | 'down',
): SkillGroupDefinition {
  if (binding.group !== group) return group;
  const siblings = operatorLibrarySkillSiblings(binding);
  const index = siblings.findIndex(item =>
    binding.routedReplacement
      ? item.routedReplacement === binding.routedReplacement
      : item.skill === binding.skill,
  );
  if (index < 0) return group;
  if (operation === 'copy') {
    // The draft is JSON game data. Clone nested behavior too, without rewriting its references.
    const skill = JSON.parse(JSON.stringify(binding.skill)) as SkillDefinition;
    const copy = {
      ...skill,
      key: unique(
        `${skill.key}-copy`,
        listSkillGroupDefinitionBindings(group).map(item => item.skill.key),
      ),
    };
    siblings.splice(index + 1, 0, {
      ...binding,
      skill: copy,
      ...(binding.routedReplacement
        ? {
            routedReplacement: { ...binding.routedReplacement, skill: copy },
          }
        : {}),
    });
  } else {
    const target = index + (operation === 'up' ? -1 : 1);
    if (target < 0 || target >= siblings.length) return group;
    [siblings[index], siblings[target]] = [siblings[target]!, siblings[index]!];
  }
  const skills = siblings.map(item => item.skill);
  switch (binding.origin) {
    case 'base':
      return { ...group, skills };
    case 'replacement':
      return { ...group, replacementSkills: skills };
    case 'variant':
      return {
        ...group,
        variants: group.variants?.map(variant =>
          variant === binding.variant ? { ...variant, skills } : variant,
        ),
      };
    case 'routedReplacement':
      return {
        ...group,
        routedReplacementSkills: siblings.map(item => item.routedReplacement!),
      };
  }
}

export function updateRoutedSkillOrigin(
  group: SkillGroupDefinition,
  binding: OperatorSkillDefinitionBinding,
  field: 'executionSkillGroupKey' | 'executionSkillKey',
  value: string,
): SkillGroupDefinition {
  if (binding.group !== group || !binding.routedReplacement) return group;
  return {
    ...group,
    routedReplacementSkills: group.routedReplacementSkills?.map(item =>
      item === binding.routedReplacement ? { ...item, [field]: value } : item,
    ),
  };
}
/** Empty authoring container. Compatibility presentation fields are not copied into new skills. */
export function createOperatorLibraryGroup(
  operator: Pick<OperatorDefinition, 'skillGroups'>,
): SkillGroupDefinition {
  return {
    key: unique(
      'custom-group',
      operator.skillGroups.map(x => x.key),
    ),
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    skills: [],
  };
}
export type OperatorSkillCreationDestination =
  'base' | 'replacement' | 'routedReplacement' | { variant: number };
export function appendEmptyOperatorVariant(group: SkillGroupDefinition): SkillGroupDefinition {
  return {
    ...group,
    variants: [
      ...(group.variants ?? []),
      {
        key: unique(
          'custom-variant',
          (group.variants ?? []).map(variant => variant.key),
        ),
        // Required legacy container metadata, never copied to a skill's level source.
        levelSource: 'basicAttack',
        skills: [],
      },
    ],
  };
}
/** No inferred game ID, timing evidence, operation type or level source. Fill those in the skill editor. */
export function appendEmptyOperatorSkill(
  group: SkillGroupDefinition,
  destination: OperatorSkillCreationDestination = 'base',
): {
  group: SkillGroupDefinition;
  index: number;
} {
  const skill: SkillDefinition = {
    key: unique(
      'custom-skill',
      listSkillGroupDefinitionBindings(group).map(x => x.skill.key),
    ),
    timelineBlockFrames: 0,
    scheduledSequences: [],
  };
  if (typeof destination === 'object') {
    const variant = group.variants?.[destination.variant];
    if (!variant) throw new Error('Skill variant no longer exists');
    const skills = [...asSkillDefinitions(variant.skills), skill];
    return {
      group: {
        ...group,
        variants: group.variants!.map((value, index) =>
          index === destination.variant ? { ...value, skills } : value,
        ),
      },
      index: skills.length - 1,
    };
  }
  if (destination === 'replacement') {
    const replacementSkills = [...(group.replacementSkills ?? []), skill];
    return { group: { ...group, replacementSkills }, index: replacementSkills.length - 1 };
  }
  if (destination === 'routedReplacement') {
    const routedReplacementSkills = [
      ...(group.routedReplacementSkills ?? []),
      {
        skill,
        executionSkillGroupKey: '',
        executionSkillKey: '',
        // Legacy container fields only; the new skill intentionally has neither value.
        skillType: 'basicAttack' as const,
        levelSource: 'basicAttack' as const,
      },
    ];
    return {
      group: { ...group, routedReplacementSkills },
      index: routedReplacementSkills.length - 1,
    };
  }
  const skills = [...asSkillDefinitions(group.skills), skill];
  return { group: { ...group, skills }, index: skills.length - 1 };
}
