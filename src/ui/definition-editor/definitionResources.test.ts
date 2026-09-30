import { describe, expect, it } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import { commonBuffDefinitions } from '../../data/buffs/commonDefinitions';
import { fieldValueAt } from './definitionFieldRuntime';
import { listDefinitionResources, resourcePresentationKey } from './definitionResources';

describe('definition resource navigation', () => {
  it('lists a global effect buff as an owned resource addressed inside the definition', () => {
    const buff = Object.values(commonBuffDefinitions)[0]!;
    const effect = {
      id: 'project:globalEffect:test',

      buff,
    };
    const resources = listDefinitionResources('globalEffect', effect);
    expect(resources[0]).toEqual({
      kind: 'globalEffect',
      path: [],
      identity: 'project:globalEffect:test',
    });
    expect(resources[1]).toEqual({
      kind: 'buff',
      path: ['buff'],
      identity: 'project:globalEffect:test',
    });
    expect(fieldValueAt(effect, resources[1]!.path)).toBe(buff);
  });

  it('uses resource identity rather than a position for graph presentation', () => {
    const skill = listDefinitionResources('operator', perlica).find(item => item.kind === 'skill')!;
    const key = resourcePresentationKey(perlica, skill.path);
    expect(key).toContain(skill.identity);
    expect(key).not.toContain('/0/');
  });

  it('includes skill definitions inside named and routed replacements', () => {
    const group = perlica.skillGroups[0]!;
    const skill = Array.isArray(group.skills) ? group.skills[0]! : group.skills;
    const definition = {
      ...perlica,
      skillGroups: [
        {
          ...group,
          replacementSkills: [skill],
          routedReplacementSkills: [
            {
              skill,

              executionSkillKey: skill.key,
            },
          ],
          variants: [{ key: 'alternate', skills: skill }],
        },
      ],
    };
    const resources = listDefinitionResources('operator', definition);
    expect(resources.find(item => item.kind === 'skillGroupVariant')?.path).toEqual([
      'skillGroups',
      0,
      'variants',
      0,
    ]);
    expect(
      resources.some(item => item.path.join('/') === 'skillGroups/0/replacementSkills/0'),
    ).toBe(true);
    expect(
      resources.some(
        item => item.path.join('/') === 'skillGroups/0/routedReplacementSkills/0/skill',
      ),
    ).toBe(true);
  });
});
