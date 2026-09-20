import { describe, it, expect } from 'vitest';
import { perlica } from '../../../../data/operators/perlica.generated';
import { listOperatorSkillDefinitionBindings } from '../../../../core/game-data/operatorSkillDefinitions';
import { operatorSkillBindingPath, operatorSkillIssueLocation } from './operatorSkillLocation';
import {
  resolveStructureValue,
  replaceStructureValueAtPath,
} from '../skillStructureEditorCommands';
describe('operator home skill locations', () => {
  it('reads and edits the addressed skill without changing its source definition', () => {
    for (const binding of listOperatorSkillDefinitionBindings(perlica)) {
      const path = operatorSkillBindingPath(binding, perlica.skillGroups.indexOf(binding.group));
      expect(resolveStructureValue(perlica, path)).toBe(binding.skill);
      const edited = { ...binding.skill, timelineBlockFrames: 999 };
      const next = replaceStructureValueAtPath(perlica, path, edited);
      expect(resolveStructureValue(next, path)).toEqual(edited);
      expect(resolveStructureValue(perlica, path)).toBe(binding.skill);
    }
  });
  it('distinguishes same-key definitions in every containment kind', () => {
    const skill = { key: 'same', scheduledSequences: [] };
    const group = {
      key: 'group',
      skills: [skill],
      variants: [{ key: 'variant', skills: [{ ...skill }] }],
      replacementSkills: [{ ...skill }],
      routedReplacementSkills: [{ skill: { ...skill } }],
    };
    const definition = { ...perlica, skillGroups: [group] } as unknown as typeof perlica;
    const bindings = listOperatorSkillDefinitionBindings(definition);
    const paths = bindings.map(binding => operatorSkillBindingPath(binding, 0));
    expect(new Set(paths).size).toBe(4);
    bindings.forEach((binding, index) =>
      expect(resolveStructureValue(definition, paths[index]!)).toBe(binding.skill),
    );
    for (const path of paths) {
      expect(operatorSkillIssueLocation(definition, `$.${path}.scheduledSequences[0]`)).toEqual({
        groupIndex: 0,
        skillPath: path,
      });
    }
    expect(
      operatorSkillIssueLocation(
        definition,
        '$.skillGroups[0].routedReplacementSkills[0].executionSkillKey',
      ),
    ).toEqual({ groupIndex: 0 });
    expect(operatorSkillIssueLocation(definition, '$.skillGroups[0].skills[10].key')).toEqual({
      groupIndex: 0,
    });
    expect(operatorSkillIssueLocation(definition, '$.skillGroups[9].skills[0]')).toBeUndefined();
  });
});
