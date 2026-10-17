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

  it('lists owned skills once even when multiple library entries reference them', () => {
    const group = perlica.skillGroups[0]!;
    const definition = {
      ...perlica,
      skillGroups: [{ ...group, variants: [{ key: 'alternate', skillIds: group.skillIds }] }],
    };
    const resources = listDefinitionResources('operator', definition);
    expect(resources.find(item => item.kind === 'skillGroupVariant')?.path).toEqual([
      'skillGroups',
      0,
      'variants',
      0,
    ]);
    const skills = resources.filter(item => item.kind === 'skill');
    expect(skills.map(item => item.identity)).toEqual(perlica.skills.map(skill => skill.key));
    for (const resource of skills) {
      expect(resource.path[0]).toBe('skills');
      expect(fieldValueAt(definition, resource.path)).toBe(
        perlica.skills.find(skill => skill.key === resource.identity),
      );
    }
  });
});
