import { skillFixture } from '../../test/skillFixture';
import { describe, expect, it } from 'vitest';

import { emptyActionGraph } from '../../test/compiledGraphEntry';
import { perlica } from '../../data/operators/perlica.generated';
import type { SkillDefinition, SkillGroupDefinition } from './operatorDefinition';
import { listSkillGroupDefinitionBindings } from './operatorSkillDefinitions';

function skill(key: string): SkillDefinition {
  return skillFixture({
    key,
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    timelineBlockFrames: 1,
    scheduledSequences: [],
    actionGraph: emptyActionGraph(),
  });
}

describe('operatorSkillDefinitions', () => {
  it('resolves library references within their owner and excludes internal skills', () => {
    const group: SkillGroupDefinition = {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['base1', 'base2'],
      variants: [{ key: 'variant', skillIds: ['variant'] }],
    };
    const owner = {
      ...perlica,
      skills: ['base1', 'base2', 'variant', 'internal'].map(skill),
      skillGroups: [group],
    };

    expect(
      listSkillGroupDefinitionBindings(group, owner).map(binding => ({
        key: binding.skill.key,
        origin: binding.origin,
        variant: binding.variant?.key,
      })),
    ).toEqual([
      { key: 'base1', origin: 'base', variant: undefined },
      { key: 'base2', origin: 'base', variant: undefined },
      { key: 'variant', origin: 'variant', variant: 'variant' },
    ]);
    expect(() => listSkillGroupDefinitionBindings(group, { ...owner, skills: [] })).toThrow(
      "has no skill 'base1'",
    );
  });
});
