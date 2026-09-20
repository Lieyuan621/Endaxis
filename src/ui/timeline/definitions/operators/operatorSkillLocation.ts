import {
  listSkillGroupDefinitionBindings,
  type OperatorSkillDefinitionBinding,
} from '../../../../core/game-data/operatorSkillDefinitions';
import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';

/** Match containment paths, not skill keys: several definitions may share a game identity. */
export function operatorSkillIssueLocation(
  definition: Pick<OperatorDefinition, 'skillGroups'>,
  issuePath: string,
): { groupIndex: number; skillPath?: string } | undefined {
  const path = issuePath.replace(/^\$\.?/, '');
  const match = /^skillGroups\[(\d+)\](?=\.|$)/.exec(path);
  if (!match) return undefined;
  const groupIndex = Number(match[1]);
  const group = definition.skillGroups[groupIndex];
  if (!group) return undefined;
  for (const binding of listSkillGroupDefinitionBindings(group)) {
    const skillPath = operatorSkillBindingPath(binding, groupIndex);
    if (
      path === skillPath ||
      path.startsWith(`${skillPath}.`) ||
      path.startsWith(`${skillPath}[`)
    ) {
      return { groupIndex, skillPath };
    }
  }
  return { groupIndex };
}
/** Exact containment address, never inferred from level-source or display category. */
export function operatorSkillBindingPath(
  binding: OperatorSkillDefinitionBinding,
  groupIndex: number,
): string {
  const base = `skillGroups[${groupIndex}]`;
  const { group, skill } = binding;
  const skillPath = (value: typeof group.skills) =>
    Array.isArray(value) ? `[${value.indexOf(skill)}]` : '';
  switch (binding.origin) {
    case 'base':
      return `${base}.skills${skillPath(group.skills)}`;
    case 'variant': {
      const index = group.variants!.indexOf(binding.variant!);
      return `${base}.variants[${index}].skills${skillPath(binding.variant!.skills)}`;
    }
    case 'replacement':
      return `${base}.replacementSkills[${group.replacementSkills!.indexOf(skill)}]`;
    case 'routedReplacement':
      return `${base}.routedReplacementSkills[${group.routedReplacementSkills!.indexOf(binding.routedReplacement!)}].skill`;
  }
}
