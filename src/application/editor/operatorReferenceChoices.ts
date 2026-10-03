/** Static candidates for a graph whose exact operator owner is known by its host.
 * Never search other operators or flatten entity child skills into the operator namespace.
 */
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { CommonDefinitionSource } from '../../core/game-data/gameDataRepository';
import type {
  ReferenceCandidate,
  ReferenceCatalog,
  ReferenceChoices,
  ReferenceNavigationTarget,
} from './referenceResolver';

export interface OperatorReferenceOptions {
  readonly assetId?: string;
  readonly assetName?: string;
  readonly writable?: boolean;
  readonly sourceKind?: 'builtin' | 'project';
  readonly sharedTarget?: (
    source: CommonDefinitionSource,
    family: 'buff' | 'abilityEntity',
    id: string,
  ) => ReferenceNavigationTarget | undefined;
}

export function operatorReferenceChoices(
  operator: OperatorDefinition,
  sharedSources: readonly CommonDefinitionSource[] = [],
  options: OperatorReferenceOptions = {},
): ReferenceChoices {
  const owner = options.assetId ?? operator.slug;
  const source = {
    id: options.assetId ?? owner,
    label: options.assetName ?? owner,
    kind: options.sourceKind ?? ('builtin' as const),
  };
  const catalogs: Record<string, ReferenceCatalog & { candidates: ReferenceCandidate[] }> = {};
  for (const family of ['skillGroup', 'skillSlot', 'skill', 'buff', 'abilityEntity'])
    catalogs[family] = { family, owner, complete: true, candidates: [] };
  const add = (
    family: string,
    value: string,
    path: readonly (string | number)[],
    rootPage?: string,
  ) => {
    catalogs[family]!.candidates.push({
      identity: JSON.stringify(['owner', source.id, owner, family, path]),
      value,
      label: value,
      family,
      owner,
      scope: 'owner',
      source,
      writable: options.writable ?? false,
      ...(options.assetId === undefined
        ? {}
        : {
            target: {
              assetId: options.assetId,
              resourcePath: rootPage ? [] : path,
              ...(rootPage ? { page: rootPage } : {}),
            },
          }),
    });
  };
  // Retain each actual declaration path: duplicate runtime keys must remain ambiguous.
  for (const [index, group] of operator.skillGroups.entries()) {
    const path = ['skillGroups', index] as const;
    add('skillGroup', group.key, path, 'skills');
    const skills = (
      value: SkillDefinition | readonly SkillDefinition[],
      prefix: readonly (string | number)[],
    ) => {
      if (Array.isArray(value))
        value.forEach((skill, i) => add('skill', skill.key, [...prefix, i]));
      else add('skill', (value as SkillDefinition).key, prefix);
    };
    skills(group.skills, [...path, 'skills']);
    group.variants?.forEach((variant, i) =>
      skills(variant.skills, [...path, 'variants', i, 'skills']),
    );
    group.replacementSkills?.forEach((skill, i) =>
      add('skill', skill.key, [...path, 'replacementSkills', i]),
    );
    group.routedReplacementSkills?.forEach((route, i) =>
      add('skill', route.skill.key, [...path, 'routedReplacementSkills', i, 'skill']),
    );
  }
  if (operator.dodgeSkill) add('skill', operator.dodgeSkill.key, ['dodgeSkill']);
  operator.skillSlots?.forEach((slot, i) =>
    add('skillSlot', slot.key, ['skillSlots', i], 'skills'),
  );
  for (const [family, directory] of [
    ['buff', 'buffDefinitions'],
    ['abilityEntity', 'abilityEntityDefinitions'],
  ] as const) {
    for (const id of Object.keys(operator[directory] ?? {})) add(family, id, [directory, id]);
    for (const shared of sharedSources) {
      for (const id of Object.keys(shared[directory] ?? {})) {
        const target = options.sharedTarget?.(shared, family, id);
        catalogs[family]!.candidates.push({
          identity: JSON.stringify(['shared', shared.id, family, id]),
          value: id,
          label: id,
          family,
          scope: 'shared',
          source: { id: shared.id, label: shared.id, kind: 'builtin' },
          writable: false,
          ...(target === undefined ? {} : { target }),
        });
      }
    }
  }
  return catalogs;
}
